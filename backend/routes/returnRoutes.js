const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");

const Return = require("../models/Return");
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");
const CashSession = require("../models/CashSession");

const router = express.Router();

// OBTENER DEVOLUCIONES
router.get("/", protect, async (req, res) => {
  try {
    const returns = await Return.find()
      .populate("sale", "saleNumber createdAt")
      .populate("user", "name username")
      .populate("cashSession", "sessionNumber status")
      .sort({
        createdAt: -1,
      });

    res.json(returns);
  } catch (error) {
    console.error("Error al consultar devoluciones:", error);

    res.status(500).json({
      message: "No se pudieron consultar las devoluciones.",
    });
  }
});

// CREAR DEVOLUCIÓN
router.post("/", protect, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { saleId, items, reason, refundMethod } = req.body;

    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({
        message: "La venta seleccionada no es válida.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Debe seleccionar al menos un producto para devolver.",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: "Debe indicar el motivo de la devolución.",
      });
    }

    const validRefundMethods = ["cash", "card", "transfer"];

    if (!validRefundMethods.includes(refundMethod)) {
      return res.status(400).json({
        message: "El método de reembolso no es válido.",
      });
    }

    session.startTransaction();

    const sale = await Sale.findById(saleId).session(session);

    if (!sale) {
      throw new Error("SALE_NOT_FOUND");
    }

    if (sale.status === "cancelled") {
      throw new Error("SALE_CANCELLED");
    }

    // Buscar devoluciones anteriores
    const previousReturns = await Return.find({
      sale: sale._id,
    }).session(session);

    const returnItems = [];

    let total = 0;

    for (const requestedItem of items) {
      const quantity = Number(requestedItem.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("INVALID_QUANTITY");
      }

      const saleItem = sale.items.find(
        (item) => item.product.toString() === requestedItem.productId,
      );

      if (!saleItem) {
        throw new Error("PRODUCT_NOT_IN_SALE");
      }

      // Cantidad devuelta anteriormente
      let previouslyReturned = 0;

      for (const previousReturn of previousReturns) {
        const previousItem = previousReturn.items.find(
          (item) => item.product.toString() === requestedItem.productId,
        );

        if (previousItem) {
          previouslyReturned += previousItem.quantity;
        }
      }

      const availableToReturn = saleItem.quantity - previouslyReturned;

      if (quantity > availableToReturn) {
        throw new Error("RETURN_QUANTITY_EXCEEDED");
      }

      const product = await Product.findById(saleItem.product).session(session);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const previousStock = product.stock;

      product.stock += quantity;

      await product.save({
        session,
      });

      const subtotal = Math.round(saleItem.unitPrice * quantity * 100) / 100;

      total += subtotal;

      returnItems.push({
        product: product._id,
        productName: saleItem.productName,
        quantity,
        unitPrice: saleItem.unitPrice,
        subtotal,
      });
    }

    total = Math.round(total * 100) / 100;

const cashSession =
  await CashSession.findOne({
    status: "open",
  }).session(session);

// Un reembolso en efectivo requiere una caja abierta.
if (
  refundMethod === "cash" &&
  !cashSession
) {
  throw new Error(
    "CASH_SESSION_REQUIRED",
  );
}

const returnNumber =
  `DEV-${Date.now()}`;

    const [newReturn] = await Return.create(
      [
        {
          returnNumber,
          sale: sale._id,
          items: returnItems,
          total,
          reason: reason.trim(),
          refundMethod,
          user: req.user.id,
          cashSession: cashSession?._id || null,
        },
      ],
      {
        session,
      },
    );

    // Crear Kardex
    for (const item of returnItems) {
      const product = await Product.findById(item.product).session(session);

      const newStock = product.stock;

      const previousStock = newStock - item.quantity;

      await InventoryMovement.create(
        [
          {
            product: item.product,
            type: "entrada",
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Devolución ${returnNumber}`,
            user: req.user.id,
          },
        ],
        {
          session,
        },
      );
    }

    await session.commitTransaction();

    const createdReturn = await Return.findById(newReturn._id)
      .populate("sale", "saleNumber createdAt")
      .populate("user", "name username")
      .populate("cashSession", "sessionNumber status");

    res.status(201).json(createdReturn);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error al crear devolución:", error);

    if (error.message === "SALE_NOT_FOUND") {
      return res.status(404).json({
        message: "La venta no fue encontrada.",
      });
    }

    if (error.message === "SALE_CANCELLED") {
      return res.status(400).json({
        message: "No se pueden devolver productos de una venta anulada.",
      });
    }

    if (error.message === "INVALID_QUANTITY") {
      return res.status(400).json({
        message: "La cantidad a devolver no es válida.",
      });
    }

    if (error.message === "PRODUCT_NOT_IN_SALE") {
      return res.status(400).json({
        message: "Uno de los productos no pertenece a la venta.",
      });
    }

    if (error.message === "RETURN_QUANTITY_EXCEEDED") {
      return res.status(400).json({
        message:
          "La cantidad solicitada supera las unidades disponibles para devolución.",
      });
    }

    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "Uno de los productos ya no existe.",
      });
    }

    res.status(500).json({
      message: "No se pudo registrar la devolución.",
    });

    if (
  error.message ===
  "CASH_SESSION_REQUIRED"
) {
  return res.status(400).json({
    message:
      "Debe existir una caja abierta para realizar un reembolso en efectivo.",
  });
}
  } finally {
    await session.endSession();
  }
});

// OBTENER DEVOLUCIONES DE UNA VENTA
router.get("/sale/:saleId", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.saleId)) {
      return res.status(400).json({
        message: "El identificador de la venta no es válido.",
      });
    }

    const returns = await Return.find({
      sale: req.params.saleId,
    })
      .populate("user", "name username")
      .populate("cashSession", "sessionNumber status")
      .sort({
        createdAt: -1,
      });

    res.json(returns);
  } catch (error) {
    console.error("Error al consultar devoluciones de la venta:", error);

    res.status(500).json({
      message: "No se pudieron consultar las devoluciones de la venta.",
    });
  }
});

module.exports = router;
