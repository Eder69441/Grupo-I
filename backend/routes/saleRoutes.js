const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");

const Sale = require("../models/Sale");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");
const CashSession = require("../models/CashSession");
const Batch = require("../models/Batch");
const PaymentTransaction = require("../models/PaymentTransaction");
const Return = require("../models/Return");
const requireBranch = require("../middleware/branchMiddleware");

const { getCartHash, toCents } = require("../utils/paymentCart");

const router = express.Router();

async function allocateFEFO(productId, quantity, branchId, session) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const batches = await Batch.find({
    product: productId,
    branch: branchId,
    active: true,
    stock: { $gt: 0 },
    expirationDate: { $gte: today },
  })
    .sort({ expirationDate: 1, _id: 1 })
    .session(session);

  const availableStock = batches.reduce((sum, batch) => sum + batch.stock, 0);

  if (availableStock < quantity) {
    throw new Error("INSUFFICIENT_BATCH_STOCK");
  }

  let remaining = quantity;
  const allocations = [];

  for (const batch of batches) {
    if (remaining === 0) break;

    const used = Math.min(batch.stock, remaining);

    allocations.push({
      batch,
      quantity: used,
    });

    remaining -= used;
  }

  return allocations;
}

// HISTORIAL DE VENTAS
router.get("/", protect, async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("user", "name username")
      .populate("cashSession", "sessionNumber status openedAt closedAt")
      .populate("items.batches.batch", "batchNumber expirationDate active")
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    console.error("Error al obtener ventas:", error);

    res.status(500).json({
      message: "No se pudieron cargar las ventas.",
    });
  }
});

// REGISTRAR UNA VENTA
router.post("/", protect, requireBranch, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items, paymentMethod, amountReceived, paymentTransaction } =
      req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "La venta debe contener al menos un producto.",
      });
    }

    session.startTransaction();

    const cashSession = await CashSession.findOne({
  branch: req.branchId,
  status: "open",
}).session(session);

    if (!cashSession) {
      const error = new Error(
        "No existe una caja abierta. Debe abrir la caja antes de realizar ventas.",
      );

      error.code = "CASH_SESSION_NOT_FOUND";
      throw error;
    }

    const saleItems = [];

    let total = 0;

    // VALIDAR PRODUCTOS Y DESCONTAR STOCK MEDIANTE FEFO
    const movements = [];
    const seenProducts = new Set();

    for (const item of items) {
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("INVALID_QUANTITY");
      }

      if (!mongoose.isValidObjectId(item.product)) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const productId = String(item.product);

      // Evitar duplicar productos en una misma venta.
      if (seenProducts.has(productId)) {
        throw new Error("DUPLICATE_PRODUCT");
      }

      seenProducts.add(productId);

      const product = await Product.findOne({
        _id: productId,
        active: { $ne: false },
      }).session(session);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (product.stock < quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
      }

      // Asignar automáticamente los lotes.
      const allocations = await allocateFEFO(product._id, quantity, req.branchId, session,);
      const previousStock = product.stock;
      const subtotal = product.price * quantity;

      // Descontar cada lote seleccionado.
      let runningStock = previousStock;

      for (const allocation of allocations) {
        const batch = allocation.batch;

        batch.stock -= allocation.quantity;
        await batch.save({ session });

        const newRunningStock = runningStock - allocation.quantity;

        movements.push({
  product: product._id,
  branch: req.branchId,
  batch: batch._id,
  type: "salida",
  origin: "venta",
  quantity: allocation.quantity,
  previousStock: runningStock,
  newStock: newRunningStock,
  user: req.user.id,
});

        runningStock = newRunningStock;
      }

      product.stock = runningStock;
      await product.save({ session });

      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal,
        batches: allocations.map((allocation) => ({
          batch: allocation.batch._id,
          quantity: allocation.quantity,
        })),
      });

      total += subtotal;
    }

    // Manejo de decimales
    total = Math.round(total * 100) / 100;

    // VALIDAR MÉTODO DE PAGO
    const validPaymentMethods = ["cash", "card", "transfer"];

    if (!validPaymentMethods.includes(paymentMethod)) {
      throw new Error("INVALID_PAYMENT_METHOD");
    }

    let finalAmountReceived = total;
    let change = 0;

    // PAGO EN EFECTIVO
    if (paymentMethod === "cash") {
      const received = Number(amountReceived);

      if (!Number.isFinite(received) || received < total) {
        throw new Error("INSUFFICIENT_PAYMENT");
      }

      finalAmountReceived = received;
      change = Math.round((received - total) * 100) / 100;
    }

    let authorizedPayment = null;

    if (paymentMethod === "card") {
      if (!mongoose.isValidObjectId(paymentTransaction)) {
        throw new Error("PAYMENT_AUTHORIZATION_REQUIRED");
      }

      const payment = await PaymentTransaction.findOneAndUpdate(
        {
          _id: paymentTransaction,
          status: "approved",
          sale: null,
          user: req.user.id,
          cashSession: cashSession._id,
          cartHash: getCartHash(items),
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            status: "consumed",
          },
        },
        {
          session,
          returnDocument: "after",
        },
      );

      if (!payment) {
        throw new Error("INVALID_PAYMENT_AUTHORIZATION");
      }

      if (
        payment.currency !== "DOP" ||
        toCents(payment.amount) !== toCents(total)
      ) {
        throw new Error("PAYMENT_AMOUNT_MISMATCH");
      }

      authorizedPayment = payment;
    } else if (paymentTransaction) {
      throw new Error("UNEXPECTED_PAYMENT_AUTHORIZATION");
    }

    // CREAR VENTA
    const saleNumber = `V-${Date.now()}`;

const [sale] = await Sale.create(
  [
    {
      saleNumber,
      branch: req.branchId,
      items: saleItems,
      total,
      user: req.user.id,
      cashSession: cashSession._id,
      paymentMethod,
      amountReceived: finalAmountReceived,
      change,
      paymentTransaction: authorizedPayment?._id || null,
    },
  ],
  { session },
);

    // REGISTRAR SALIDAS POR LOTE EN KARDEX
    for (const movement of movements) {
      await InventoryMovement.create(
        [
          {
            ...movement,
            reason: `Venta ${sale.saleNumber}`,
          },
        ],
        { session },
      );
    }

    if (authorizedPayment) {
      authorizedPayment.sale = sale._id;

      await authorizedPayment.save({ session });
    }

    // CONFIRMAR TRANSACCIÓN
    await session.commitTransaction();

    const completedSale = await Sale.findById(sale._id)
      .populate("user", "name username")
      .populate("items.product", "name")
      .populate("cashSession", "sessionNumber status openedAt closedAt")
      .populate("items.batches.batch", "batchNumber expirationDate");

    res.status(201).json(completedSale);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error al registrar venta:", error);

    if (error.code === "CASH_SESSION_NOT_FOUND") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message === "INVALID_QUANTITY") {
      return res.status(400).json({
        message: "La cantidad de venta debe ser mayor que cero.",
      });
    }

    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "Uno de los productos no existe o está inactivo.",
      });
    }

    if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = error.message.split(":")[1];

      return res.status(400).json({
        message: `Stock insuficiente para ${productName}.`,
      });
    }

    if (error.message === "INVALID_PAYMENT_METHOD") {
      return res.status(400).json({
        message: "Método de pago no válido.",
      });
    }

    if (error.message === "INSUFFICIENT_PAYMENT") {
      return res.status(400).json({
        message:
          "El monto recibido no puede ser menor que el total de la venta.",
      });
    }

    if (error.message === "INSUFFICIENT_BATCH_STOCK") {
      return res.status(400).json({
        message: "No hay suficientes unidades disponibles en lotes vigentes.",
      });
    }

    if (error.message === "DUPLICATE_PRODUCT") {
      return res.status(400).json({
        message: "Un producto no puede aparecer dos veces en la misma venta.",
      });
    }

    if (
      [
        "PAYMENT_AUTHORIZATION_REQUIRED",
        "INVALID_PAYMENT_AUTHORIZATION",
        "PAYMENT_AMOUNT_MISMATCH",
        "UNEXPECTED_PAYMENT_AUTHORIZATION",
        "INVALID_CART",
      ].includes(error.message)
    ) {
      return res.status(400).json({
        message:
          "La autorización POS no es válida, está vencida, " +
          "ya fue utilizada o no coincide con la venta.",
      });
    }

    res.status(500).json({
      message: "No se pudo registrar la venta.",
    });
  } finally {
    await session.endSession();
  }
});

// ANULAR UNA VENTA
router.patch("/:id/cancel", protect, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // BUSCAR VENTA
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      throw new Error("SALE_NOT_FOUND");
    }

    // EVITAR DOBLE ANULACIÓN
    if (sale.status === "cancelled") {
      throw new Error("SALE_ALREADY_CANCELLED");
    }

    // Verificar si la venta pertenece a una caja cerrada
    if (sale.cashSession) {
      const saleCashSession = await CashSession.findById(
        sale.cashSession,
      ).session(session);

      if (saleCashSession && saleCashSession.status === "closed") {
        throw new Error("CASH_SESSION_CLOSED");
      }
    }

    const existingReturn = await Return.exists({
  sale: sale._id,
}).session(session);

if (existingReturn) {
  throw new Error("SALE_HAS_RETURNS");
}

    // DEVOLVER PRODUCTOS A SUS LOTES ORIGINALES
    for (const item of sale.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND_CANCEL:${item.productName}`);
      }

      // Validar que la venta tenga información de lotes.
      if (!item.batches || item.batches.length === 0) {
        throw new Error("SALE_WITHOUT_BATCHES");
      }

      const totalBatchQuantity = item.batches.reduce(
        (sum, allocation) => sum + allocation.quantity,
        0,
      );

      if (totalBatchQuantity !== item.quantity) {
        throw new Error("INVALID_BATCH_ALLOCATION");
      }

      let runningStock = product.stock;

      for (const allocation of item.batches) {
        const batch = await Batch.findOne({
          _id: allocation.batch,
          product: product._id,
        }).session(session);

        if (!batch) {
          throw new Error("BATCH_NOT_FOUND");
        }

        const previousStock = runningStock;

        // Restaurar stock del lote original.
        batch.stock += allocation.quantity;

        await batch.save({ session });

        // Actualizar stock general.
        runningStock += allocation.quantity;

        // Registrar entrada en Kardex.
        await InventoryMovement.create(
          [
            {
              product: product._id,
              batch: batch._id,
              type: "entrada",
              origin: "anulacion",
              quantity: allocation.quantity,
              previousStock,
              newStock: runningStock,
              reason: `Anulación venta ${sale.saleNumber}`,
              user: req.user.id,
            },
          ],
          { session },
        );
      }

      product.stock = runningStock;

      await product.save({ session });
    }

    // CAMBIAR ESTADO DE LA VENTA
    sale.status = "cancelled";

    await sale.save({
      session,
    });

    // CONFIRMAR TRANSACCIÓN
    await session.commitTransaction();

    const cancelledSale = await Sale.findById(sale._id)
      .populate("user", "name username")
      .populate("items.product", "name")
      .populate("cashSession", "sessionNumber status openedAt");

    res.json(cancelledSale);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();

      }
    
    }

    console.error("Error al anular venta:", error);

    if (error.message === "SALE_HAS_RETURNS") {
        return res.status(409).json({
          message:
            "Esta venta tiene devoluciones registradas y no puede anularse.",
        });

    if (error.message === "SALE_NOT_FOUND") {
      return res.status(404).json({
        message: "La venta no existe.",
      });
    }

    // Impedir anular ventas que ya tienen devoluciones.
    if (error.message === "SALE_ALREADY_CANCELLED") {
      return res.status(400).json({
        message: "La venta ya fue anulada.",
      });
    }

    if (error.message === "CASH_SESSION_CLOSED") {
      return res.status(400).json({
        message:
          "No se puede anular una venta perteneciente a una caja cerrada. Debe registrarse como devolución o reembolso.",
      });
    }

    if (error.message.startsWith("PRODUCT_NOT_FOUND_CANCEL:")) {
      const productName = error.message.split(":")[1];

      return res.status(404).json({
        message: `No se encontró el producto ${productName}.`,
      });
    }

    if (error.message === "SALE_WITHOUT_BATCHES") {
      return res.status(400).json({
        message:
          "Esta venta no tiene información de lotes. " +
          "Requiere revisión antes de anularse.",
      });
    }

    if (error.message === "INVALID_BATCH_ALLOCATION") {
      return res.status(400).json({
        message: "Las cantidades de los lotes no coinciden con la venta.",
      });
    }

    if (error.message === "BATCH_NOT_FOUND") {
      return res.status(404).json({
        message: "No se encontró uno de los lotes originales de la venta.",
      });
    }

    res.status(500).json({
      message: "No se pudo anular la venta.",
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
