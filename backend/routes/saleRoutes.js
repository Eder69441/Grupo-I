const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");

const Sale = require("../models/Sale");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");
const CashSession = require("../models/CashSession");

const router = express.Router();

// HISTORIAL DE VENTAS
router.get("/", protect, async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("user", "name username")
      .populate("cashSession", "sessionNumber status openedAt closedAt")
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
router.post("/", protect, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items, paymentMethod, amountReceived } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "La venta debe contener al menos un producto.",
      });
    }

    session.startTransaction();

    const cashSession = await CashSession.findOne({
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

    // VALIDAR PRODUCTOS Y DESCONTAR STOCK
    for (const item of items) {
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("INVALID_QUANTITY");
      }

      const product = await Product.findOne({
        _id: item.product,
        active: { $ne: false },
      }).session(session);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (product.stock < quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
      }

      const previousStock = product.stock;

      const newStock = previousStock - quantity;

      const subtotal = product.price * quantity;

      product.stock = newStock;

      await product.save({ session });

      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal,
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

    // CREAR VENTA
    const saleNumber = `V-${Date.now()}`;

    const [sale] = await Sale.create(
      [
        {
          saleNumber,
          items: saleItems,
          total,
          user: req.user.id,

          cashSession: cashSession._id,

          paymentMethod,
          amountReceived: finalAmountReceived,
          change,
        },
      ],
      {
        session,
      },
    );

    // REGISTRAR SALIDAS EN KARDEX
    for (const item of saleItems) {
      const product = await Product.findById(item.product).session(session);

      await InventoryMovement.create(
        [
          {
            product: item.product,
            type: "salida",
            quantity: item.quantity,

            previousStock: product.stock + item.quantity,

            newStock: product.stock,

            reason: `Venta ${sale.saleNumber}`,

            user: req.user.id,
          },
        ],
        {
          session,
        },
      );
    }

    // CONFIRMAR TRANSACCIÓN
    await session.commitTransaction();

    const completedSale = await Sale.findById(sale._id)
      .populate("user", "name username")
      .populate("items.product", "name")
      .populate("cashSession", "sessionNumber status openedAt closedAt");

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

    // DEVOLVER PRODUCTOS AL INVENTARIO
    for (const item of sale.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND_CANCEL:${item.productName}`);
      }

      const previousStock = product.stock;

      const newStock = previousStock + item.quantity;

      product.stock = newStock;

      await product.save({
        session,
      });

      // MOVIMIENTO DE ENTRADA EN KARDEX
      await InventoryMovement.create(
        [
          {
            product: product._id,

            type: "entrada",

            quantity: item.quantity,

            previousStock,

            newStock,

            reason: `Anulación venta ${sale.saleNumber}`,

            user: req.user.id,
          },
        ],
        {
          session,
        },
      );
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
      .populate("cashSession", "sessionNumber status openedAt",)

    res.json(cancelledSale);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error al anular venta:", error);

    if (error.message === "SALE_NOT_FOUND") {
      return res.status(404).json({
        message: "La venta no existe.",
      });
    }

    if (error.message === "SALE_ALREADY_CANCELLED") {
      return res.status(400).json({
        message: "La venta ya fue anulada.",
      });
    }

    if (error.message.startsWith("PRODUCT_NOT_FOUND_CANCEL:")) {
      const productName = error.message.split(":")[1];

      return res.status(404).json({
        message: `No se encontró el producto ${productName}.`,
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
