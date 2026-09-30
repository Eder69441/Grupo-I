const express = require("express");
const mongoose = require("mongoose");

const InventoryMovement = require("../models/InventoryMovement");

const Product = require("../models/Product");

const protect = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Obtener todos los movimientos
router.get("/", protect, async (req, res) => {
  try {
    const movements = await InventoryMovement.find()
      .populate("product", "name category")
      .populate("user", "name username")
      .sort({ createdAt: -1 });

    res.json(movements);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener los movimientos.",
    });
  }
});

router.get("/product/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "El identificador del producto no es válido.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado.",
      });
    }

    const movements = await InventoryMovement.find({
      product: productId,
    })
      .populate("product", "name category")
      .populate("user", "name username")
      .sort({
        createdAt: -1,
      });

    res.json({
      product: {
        _id: product._id,
        name: product.name,
        category: product.category,
        stock: product.stock,
      },
      movements,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener el Kardex del producto.",
    });
  }
});

// Registrar entrada o salida
router.post("/", protect, authorize("admin"), async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { product, type, quantity, reason } = req.body;

    if (!product || !type || quantity === undefined || !reason?.trim()) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios.",
      });
    }

    if (type !== "entrada" && type !== "salida") {
      return res.status(400).json({
        message: "El tipo debe ser entrada o salida.",
      });
    }

    const numericQuantity = Number(quantity);

    if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({
        message: "La cantidad debe ser un número entero mayor que cero.",
      });
    }

    session.startTransaction();

    const existingProduct = await Product.findById(product).session(session);

    if (!existingProduct) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Producto no encontrado.",
      });
    }

    if (existingProduct.active === false) {
      await session.abortTransaction();

      return res.status(400).json({
        message: "No se pueden registrar movimientos en un producto inactivo.",
      });
    }

    const previousStock = existingProduct.stock;

    let newStock;

    if (type === "entrada") {
      newStock = previousStock + numericQuantity;
    } else {
      if (numericQuantity > previousStock) {
        await session.abortTransaction();

        return res.status(400).json({
          message: "Stock insuficiente para realizar la salida.",
        });
      }

      newStock = previousStock - numericQuantity;
    }

    existingProduct.stock = newStock;

    await existingProduct.save({
      session,
    });

    const [movement] = await InventoryMovement.create(
      [
        {
          product: existingProduct._id,
          type,
          quantity: numericQuantity,
          previousStock,
          newStock,
          reason: reason.trim(),
          user: req.user.id,
        },
      ],
      {
        session,
      },
    );

    await session.commitTransaction();

    const populatedMovement = await InventoryMovement.findById(movement._id)
      .populate("product", "name category")
      .populate("user", "name username");

    res.status(201).json(populatedMovement);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(error);

    res.status(500).json({
      message: "Error al registrar el movimiento.",
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
