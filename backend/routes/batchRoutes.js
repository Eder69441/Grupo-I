const express = require("express");
const mongoose = require("mongoose");

const Batch = require("../models/Batch");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const requireBranch = require("../middleware/branchMiddleware");

const router = express.Router();

// OBTENER LOTES DE LA SUCURSAL
router.get("/", protect, requireBranch, async (req, res) => {
  try {
    const batches = await Batch.find({
      branch: req.branchId,
      active: true,
    })
      .populate("product", "name stock active")
      .populate("branch", "code name")
      .sort({ expirationDate: 1 });

    return res.json(batches);
  } catch (error) {
    console.error("Error al obtener lotes:", error);

    return res.status(500).json({
      message: "No se pudieron obtener los lotes.",
    });
  }
});

// OBTENER LOTES DE UN PRODUCTO EN LA SUCURSAL
router.get("/product/:productId", protect, requireBranch, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return res.status(400).json({
        message: "El identificador del producto no es válido.",
      });
    }

    const batches = await Batch.find({
      product: req.params.productId,
      branch: req.branchId,
      active: true,
    }).sort({ expirationDate: 1 });

    return res.json(batches);
  } catch (error) {
    console.error("Error al obtener lotes del producto:", error);

    return res.status(500).json({
      message: "No se pudieron obtener los lotes del producto.",
    });
  }
});

// CREAR LOTE
router.post(
  "/",
  protect,
  authorize("admin"),
  requireBranch,
  async (req, res) => {
    const { productId, batchNumber, expirationDate, stock, unitCost } =
      req.body;

    if (!mongoose.isValidObjectId(productId)) {
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

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
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
      let createdBatchId;

      await session.withTransaction(async () => {
        const product = await Product.findOne({
          _id: productId,
          active: { $ne: false },
        }).session(session);

        if (!product) {
          const error = new Error("El producto no existe o está inactivo.");
          error.status = 404;
          throw error;
        }

        const existingBatch = await Batch.findOne({
          branch: req.branchId,
          product: productId,
          batchNumber: normalizedBatchNumber,
        }).session(session);

        if (existingBatch) {
          const error = new Error(
            "Este número de lote ya existe para el producto en esta sucursal.",
          );
          error.status = 409;
          throw error;
        }

        const [batch] = await Batch.create(
          [
            {
              branch: req.branchId,
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

        await InventoryMovement.create(
          [
            {
              product: productId,
              branch: req.branchId,
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

        createdBatchId = batch._id;
      });

      const populatedBatch = await Batch.findById(createdBatchId)
        .populate("product", "name stock active")
        .populate("branch", "code name");

      return res.status(201).json(populatedBatch);
    } catch (error) {
      console.error("Error al registrar lote:", error);

      if (error.code === 11000 || error.status === 409) {
        return res.status(409).json({
          message:
            "Este número de lote ya existe para el producto en esta sucursal.",
        });
      }

      return res.status(error.status || 500).json({
        message: error.status ? error.message : "No se pudo registrar el lote.",
      });
    } finally {
      await session.endSession();
    }
  },
);

// RECIBIR MERCANCÍA ADICIONAL DE UN LOTE
router.post(
  "/:id/restock",
  protect,
  authorize("admin"),
  requireBranch,
  async (req, res) => {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
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
          branch: req.branchId,
          active: true,
        }).session(session);

        if (!batch) {
          const error = new Error(
            "Lote no encontrado o inactivo en esta sucursal.",
          );
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
              branch: req.branchId,
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
      console.error("Error al reponer lote:", error);

      return res.status(error.status || 500).json({
        message: error.status
          ? error.message
          : "No se pudo registrar la reposición.",
      });
    } finally {
      await session.endSession();
    }
  },
);

module.exports = router;
