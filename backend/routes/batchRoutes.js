const express = require("express");
const mongoose = require("mongoose");

const Batch = require("../models/Batch");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Obtener todos los lotes
router.get("/", protect, async (req, res) => {
  try {
    const batches = await Batch.find({
      active: true,
    })
      .populate("product", "name stock active")
      .sort({
        expirationDate: 1,
      });

    res.json(batches);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "No se pudieron obtener los lotes.",
    });
  }
});

// Obtener lotes de un producto
router.get("/product/:productId", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        message: "El identificador del producto no es válido.",
      });
    }

    const batches = await Batch.find({
      product: req.params.productId,
      active: true,
    }).sort({
      expirationDate: 1,
    });

    res.json(batches);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "No se pudieron obtener los lotes del producto.",
    });
  }
});

router.post("/", protect, authorize("admin"), async (req, res) => {
  const { productId, batchNumber, expirationDate, stock, unitCost } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      message: "El producto no es válido.",
    });
  }

  const normalizedBatchNumber =
    typeof batchNumber === "string" ? batchNumber.trim().toUpperCase() : "";

  if (!normalizedBatchNumber) {
    return res.status(400).json({
      message: "El número de lote es obligatorio.",
    });
  }

  const expiration = new Date(expirationDate);

  if (!expirationDate || Number.isNaN(expiration.getTime())) {
    return res.status(400).json({
      message: "La fecha de vencimiento no es válida.",
    });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (expiration <= today) {
    return res.status(400).json({
      message: "El lote debe tener una fecha de vencimiento futura.",
    });
  }

  const quantity = Number(stock);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      message: "La cantidad debe ser un entero mayor que cero.",
    });
  }

  const cost = Number(unitCost ?? 0);

  if (!Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({
      message: "El costo unitario no es válido.",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const product = await Product.findOne({
      _id: productId,
      active: { $ne: false },
    }).session(session);

    if (!product) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "El producto no existe o está inactivo.",
      });
    }

    const existingBatch = await Batch.findOne({
      product: productId,
      batchNumber: normalizedBatchNumber,
    }).session(session);

    if (existingBatch) {
      await session.abortTransaction();

      return res.status(409).json({
        message: "Este número de lote ya existe para el producto.",
      });
    }

    // Crear el lote
    const [batch] = await Batch.create(
      [
        {
          product: productId,
          batchNumber: normalizedBatchNumber,
          expirationDate: expiration,
          stock: quantity,
          initialStock: quantity,
          unitCost: cost,
          active: true,
        },
      ],
      { session },
    );

    // Actualizar el stock general de forma atómica
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        active: { $ne: false },
      },
      {
        $inc: { stock: quantity },
      },
      {
        session,
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedProduct) {
      throw new Error("No se pudo actualizar el stock del producto.");
    }

    const previousStock = updatedProduct.stock - quantity;

    // Registrar la entrada en el Kardex
    await InventoryMovement.create(
      [
        {
          product: productId,
          batch: batch._id,
          type: "entrada",
          origin: "lote_inicial",
          quantity,
          previousStock,
          newStock: updatedProduct.stock,
          reason: `Entrada inicial de lote ${normalizedBatchNumber}`,
          user: req.user.id,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const populatedBatch = await Batch.findById(batch._id).populate(
      "product",
      "name stock active",
    );

    return res.status(201).json(populatedBatch);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error al registrar lote:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Este número de lote ya existe para el producto.",
      });
    }

    return res.status(500).json({
      message: "No se pudo registrar el lote.",
    });
  } finally {
    await session.endSession();
  }
});

//Recibir mercancía adicional de un lote existente.

router.post("/:id/restock", protect, authorize("admin"), async (req, res) => {
  const { id } = req.params;
  const { quantity, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "El identificador del lote no es válido.",
    });
  }

  const numericQuantity = Number(quantity);

  if (
    quantity === undefined ||
    quantity === null ||
    quantity === "" ||
    !Number.isSafeInteger(numericQuantity) ||
    numericQuantity <= 0
  ) {
    return res.status(400).json({
      message: "La cantidad debe ser un entero mayor que cero.",
    });
  }

  if (typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({
      message: "El motivo de la reposición es obligatorio.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const batch = await Batch.findOne({
        _id: id,
        active: true,
      }).session(session);

      if (!batch) {
        const error = new Error("Lote no encontrado o inactivo.");
        error.status = 404;
        throw error;
      }

      const product = await Product.findOne({
        _id: batch.product,
        active: { $ne: false },
      }).session(session);

      if (!product) {
        const error = new Error("El producto no existe o está inactivo.");
        error.status = 400;
        throw error;
      }

      // No recibir mercancía en lotes vencidos.
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (batch.expirationDate < today) {
        const error = new Error("No se puede reponer un lote vencido.");
        error.status = 400;
        throw error;
      }

      const previousStock = product.stock;

      batch.stock += numericQuantity;
      product.stock += numericQuantity;

      await batch.save({ session });
      await product.save({ session });

      const [movement] = await InventoryMovement.create(
        [
          {
            product: product._id,
            batch: batch._id,
            type: "entrada",
            origin: "reposicion",
            quantity: numericQuantity,
            previousStock,
            newStock: product.stock,
            reason: `Reposición de lote: ${reason.trim()}`,
            user: req.user.id,
          },
        ],
        { session },
      );

      result = {
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        batchStock: batch.stock,
        productStock: product.stock,
        movementId: movement._id,
      };
    });

    return res.status(200).json({
      message: "Reposición registrada correctamente.",
      ...result,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "No se pudo registrar la reposición.",
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
