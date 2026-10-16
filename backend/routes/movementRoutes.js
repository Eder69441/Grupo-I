const express = require("express");
const mongoose = require("mongoose");

const InventoryMovement = require("../models/InventoryMovement");
const Product = require("../models/Product");
const Batch = require("../models/Batch");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Obtener todos los movimientos
router.get("/", protect, async (req, res) => {
  try {
    const movements = await InventoryMovement.find()
      .populate("product", "name category")
      .populate("batch", "batchNumber expirationDate")
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

// Obtener Kardex de un producto
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
      .populate("batch", "batchNumber expirationDate")
      .populate("user", "name username")
      .sort({ createdAt: -1 });

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

// Registrar entrada o salida por lote
router.post("/", protect, authorize("admin"), (req, res) => {
  return res.status(403).json({
    message:
      "Los movimientos manuales están deshabilitados. " +
      "Registra las entradas desde Gestión de lotes. " +
      "Los ajustes de inventario tendrán un proceso independiente.",
  });
});

module.exports = router;
