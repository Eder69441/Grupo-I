const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");

const normalizeCodes = (body) => ({
  code: String(body.code ?? "")
    .trim()
    .toUpperCase(),
  barcode: String(body.barcode ?? "").trim(),
});

const validateProductCodes = async (body, excludeId = null) => {
  const { code, barcode } = normalizeCodes(body);

  if (code && barcode && code === barcode) {
    return "El código interno y el código de barras deben ser diferentes.";
  }

  const values = [code, barcode].filter(Boolean);

  if (!values.length) return null;

  const query = {
    $or: [{ code: { $in: values } }, { barcode: { $in: values } }],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const duplicate = await Product.findOne(query);

  if (duplicate) {
    return `El código ya está asignado al producto "${duplicate.name}".`;
  }

  return null;
};

const router = express.Router();

// Obtener todos los productos
router.get("/", protect, async (req, res) => {
  try {
    const products = await Product.find({
      active: { $ne: false },
    })
      .populate("location")
      .sort({
        createdAt: -1,
      });

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener los productos.",
    });
  }
});

// Obtener un producto
router.get("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("location");

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado.",
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener el producto.",
    });
  }
});

// Crear producto
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, category, price, location } = req.body;

    const { code, barcode } = normalizeCodes(req.body);

    const codeError = await validateProductCodes(req.body);

    if (codeError) {
      return res.status(409).json({ message: codeError });
    }

    const product = await Product.create({
      code: code || undefined,
      barcode: barcode || undefined,
      name,
      category,
      price,
      stock: 0,
      location: location || undefined,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error al crear producto:", error);

    res.status(error.code === 11000 ? 409 : 400).json({
      message:
        error.code === 11000
          ? "Ya existe un producto con ese código."
          : "No se pudo crear el producto.",
    });
  }
});

// Actualizar producto
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Identificador de producto inválido.",
      });
    }

    const { name, category, price, location } = req.body;

    const { code, barcode } = normalizeCodes(req.body);

    const codeError = await validateProductCodes(req.body, req.params.id);

    if (codeError) {
      return res.status(409).json({ message: codeError });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado.",
      });
    }

    product.code = code || undefined;
    product.barcode = barcode || undefined;
    product.name = name;
    product.category = category;
    product.price = price;
    product.location = location || undefined;

    await product.save();

    res.json(product);
  } catch (error) {
    console.error("Error al actualizar producto:", error);

    res.status(error.code === 11000 ? 409 : 400).json({
      message:
        error.code === 11000
          ? "Ya existe un producto con ese código."
          : "No se pudo actualizar el producto.",
    });
  }
});

// Eliminar producto
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado.",
      });
    }

    if (product.active === false) {
      return res.status(400).json({
        message: "El producto ya está inactivo.",
      });
    }

    product.active = false;

    await product.save();

    res.json({
      message: "Producto desactivado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "No se pudo desactivar el producto.",
    });
  }
});

module.exports = router;
