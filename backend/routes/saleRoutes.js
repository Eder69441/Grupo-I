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
router.get("/", protect, requireBranch, async (req, res) => {
  try {
    const sales = await Sale.find({
      branch: req.branchId,
    })
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
      const allocations = await allocateFEFO(
        product._id,
        quantity,
        req.branchId,
        session,
      );
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
          branch: req.branchId,
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

// ANULAR UNA VENTA POR SUCURSAL
router.patch("/:id/cancel", protect, requireBranch, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "El identificador de la venta no es válido.",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const sale = await Sale.findOne({
      _id: req.params.id,
      branch: req.branchId,
    }).session(session);

    if (!sale) {
      throw new Error("SALE_NOT_FOUND");
    }

    if (sale.status === "cancelled") {
      throw new Error("SALE_ALREADY_CANCELLED");
    }

    // No anular ventas con devoluciones registradas.
    const hasReturns = await Return.exists({
      sale: sale._id,
    }).session(session);

    if (hasReturns) {
      throw new Error("SALE_HAS_RETURNS");
    }

    // Impedir anular ventas de una caja cerrada.
    const cashSession = await CashSession.findOne({
      _id: sale.cashSession,
      branch: req.branchId,
      status: "open",
    }).session(session);

    if (!cashSession) {
      throw new Error("CASH_SESSION_NOT_OPEN");
    }

    for (const item of sale.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (!item.batches?.length) {
        throw new Error("SALE_BATCHES_MISSING");
      }

      const restoredQuantity = item.batches.reduce(
        (total, allocation) => total + allocation.quantity,
        0,
      );

      if (restoredQuantity !== item.quantity) {
        throw new Error("SALE_BATCHES_MISMATCH");
      }

      let runningStock = product.stock;

      for (const allocation of item.batches) {
        const batch = await Batch.findOne({
          _id: allocation.batch,
          product: product._id,
          branch: req.branchId,
        }).session(session);

        if (!batch) {
          throw new Error("BATCH_NOT_FOUND");
        }

        const previousStock = runningStock;

        batch.stock += allocation.quantity;
        runningStock += allocation.quantity;

        await batch.save({ session });

        await InventoryMovement.create(
          [
            {
              product: product._id,
              branch: req.branchId,
              batch: batch._id,
              type: "entrada",
              origin: "anulacion",
              quantity: allocation.quantity,
              previousStock,
              newStock: runningStock,
              reason: `Anulación de venta ${sale.saleNumber}`,
              user: req.user.id,
            },
          ],
          { session },
        );
      }

      product.stock = runningStock;
      await product.save({ session });
    }

    sale.status = "cancelled";
    await sale.save({ session });

    await session.commitTransaction();

    const cancelledSale = await Sale.findById(sale._id)
      .populate("user", "name username")
      .populate("branch", "code name")
      .populate("cashSession", "sessionNumber status")
      .populate("items.batches.batch", "batchNumber expirationDate");

    return res.json(cancelledSale);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error al anular venta:", error);

    const errors = {
      SALE_NOT_FOUND: [404, "La venta no existe en esta sucursal."],
      SALE_ALREADY_CANCELLED: [409, "Esta venta ya fue anulada."],
      SALE_HAS_RETURNS: [
        409,
        "La venta tiene devoluciones y no puede anularse.",
      ],
      CASH_SESSION_NOT_OPEN: [
        409,
        "No se puede anular una venta de una caja cerrada.",
      ],
      PRODUCT_NOT_FOUND: [404, "No se encontró un producto de la venta."],
      SALE_BATCHES_MISSING: [
        409,
        "La venta no tiene información de lotes para restaurar.",
      ],
      SALE_BATCHES_MISMATCH: [
        409,
        "Las cantidades de los lotes no coinciden con la venta.",
      ],
      BATCH_NOT_FOUND: [
        409,
        "No se encontró un lote original en esta sucursal.",
      ],
    };

    if (errors[error.message]) {
      const [status, message] = errors[error.message];

      return res.status(status).json({ message });
    }

    return res.status(500).json({
      message: "No se pudo anular la venta.",
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
