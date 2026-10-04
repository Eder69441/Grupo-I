const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");

const router = express.Router();

// Obtener todos los productos
router.get("/", protect, async (req, res) => {
  try {
    const products = await Product.find({
      active: { $ne: false },
    }).populate("location")
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
  const session = await mongoose.startSession();

  try {
    const { name, category, price, stock, expirationDate, location } = req.body;

    const numericStock = Number(stock);

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      return res.status(400).json({
        message: "El stock debe ser un número entero mayor o igual a cero.",
      });
    }

    session.startTransaction();

    const [product] = await Product.create(
      [
        {
          name,
          category,
          price,
          stock: numericStock,
          expirationDate,
          location,
        },
      ],
      {
        session,
      },
    );

    if (numericStock > 0) {
      await InventoryMovement.create(
        [
          {
            product: product._id,
            type: "entrada",
            quantity: numericStock,
            previousStock: 0,
            newStock: numericStock,
            reason: "Stock inicial",
            user: req.user.id,
          },
        ],
        {
          session,
        },
      );
    }

    await session.commitTransaction();

    res.status(201).json(product);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(error);

    res.status(400).json({
      message: "No se pudo crear el producto.",
    });
  } finally {
    await session.endSession();
  }
});

// Actualizar producto
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, category, price, expirationDate, location } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price,
        expirationDate,
        location,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado.",
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al actualizar el producto.",
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
