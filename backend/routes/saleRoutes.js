const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");

const Sale = require("../models/Sale");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");

const router = express.Router();

// Historial de ventas
router.get("/", protect, async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("user", "name username")
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    console.error("Error al obtener ventas:", error);

    res.status(500).json({
      message: "No se pudieron cargar las ventas.",
    });
  }
});

// Registrar una venta
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

    const saleItems = [];
    let total = 0;

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

    const validPaymentMethods = [
  "cash",
  "card",
  "transfer",
];

if (!validPaymentMethods.includes(paymentMethod)) {
  await session.abortTransaction();

  return res.status(400).json({
    message: "Método de pago no válido.",
  });
}

let finalAmountReceived = total;
let change = 0;

if (paymentMethod === "cash") {
  const received = Number(amountReceived);

  if (!Number.isFinite(received) || received < total) {
    await session.abortTransaction();

    return res.status(400).json({
      message: "El monto recibido no puede ser menor que el total de la venta.",
    });
  }

  finalAmountReceived = received;
  change = received - total;
}

    const saleNumber = `V-${Date.now()}`;

    const [sale] = await Sale.create(
      [
        {
          saleNumber,
          items: saleItems,
          total,
           paymentMethod,
           amountReceived: finalAmountReceived,
           change,
          
          user: req.user.id,
        },
      ],
      { session },
    );

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
        { session },
      );
    }

    await session.commitTransaction();

    const completedSale = await Sale.findById(sale._id)
      .populate("user", "name username")
      .populate("items.product", "name");

    res.status(201).json(completedSale);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error al registrar venta:", error);

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

    res.status(500).json({
      message: "No se pudo registrar la venta.",
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
