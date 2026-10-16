const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");

const Return = require("../models/Return");
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");
const CashSession = require("../models/CashSession");
const Batch = require("../models/Batch");

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
  const { saleId, items, reason, refundMethod } = req.body;

  const fail = (status, message) => {
    const error = new Error(message);
    error.status = status;
    throw error;
  };

  if (!mongoose.isValidObjectId(saleId)) {
    return res.status(400).json({
      message: "La venta seleccionada no es válida.",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Debe seleccionar al menos un producto.",
    });
  }

  if (typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({
      message: "Debe indicar el motivo de la devolución.",
    });
  }

  if (!["cash", "card", "transfer"].includes(refundMethod)) {
    return res.status(400).json({
      message: "El método de reembolso no es válido.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let createdReturnId;

    await session.withTransaction(async () => {
      // Esta escritura coordina las devoluciones concurrentes.
      const sale = await Sale.findOneAndUpdate(
        {
          _id: saleId,
          status: "completed",
        },
        {
          $inc: { returnRevision: 1 },
        },
        {
          session,
          returnDocument: "after",
        },
      );

      if (!sale) {
        fail(400, "La venta no existe, fue anulada o no admite devoluciones.");
      }

      // lean() permite detectar campos realmente ausentes
      // en devoluciones históricas.
      const previousReturns = await Return.find({
        sale: sale._id,
      })
        .session(session)
        .lean();

      // No asumir la procedencia de devoluciones antiguas.
      for (const previousReturn of previousReturns) {
        for (const previousItem of previousReturn.items) {
          if (!Array.isArray(previousItem.returnedBatches)) {
            fail(
              409,
              "Esta venta tiene devoluciones históricas sin desglose " +
                "por lote. Requiere revisión antes de continuar.",
            );
          }

          const assigned = previousItem.returnedBatches.reduce(
            (sum, allocation) => sum + allocation.quantity,
            0,
          );

          if (assigned !== previousItem.quantity) {
            fail(
              409,
              "El historial de devoluciones presenta cantidades " +
                "por lote incompletas. Requiere revisión.",
            );
          }
        }
      }

      const cashSession = await CashSession.findOne({
        status: "open",
      }).session(session);

      if (refundMethod === "cash" && !cashSession) {
        fail(400, "Debe existir una caja abierta para reembolsar en efectivo.");
      }

      const seenProducts = new Set();
      const returnItems = [];
      let total = 0;

      for (const requestedItem of items) {
        const productId = String(requestedItem.productId ?? "");
        const quantity = Number(requestedItem.quantity);

        if (!mongoose.isValidObjectId(productId)) {
          fail(400, "El producto no es válido.");
        }

        if (seenProducts.has(productId)) {
          fail(
            400,
            "Un producto no puede aparecer dos veces en la devolución.",
          );
        }

        seenProducts.add(productId);

        if (
          requestedItem.quantity === undefined ||
          requestedItem.quantity === null ||
          requestedItem.quantity === "" ||
          !Number.isSafeInteger(quantity) ||
          quantity <= 0
        ) {
          fail(400, "La cantidad devuelta no es válida.");
        }

        if (typeof requestedItem.restock !== "boolean") {
          fail(
            400,
            "Debe indicar si el producto se reincorpora al inventario.",
          );
        }

        const restock = requestedItem.restock;

        // Solo administradores pueden reincorporar inventario.
        if (restock && req.user.role !== "admin") {
          fail(
            403,
            "Solo un administrador puede autorizar la reincorporación.",
          );
        }

        // Confirmación administrativa de inspección.
        if (restock && requestedItem.inspectionApproved !== true) {
          fail(
            400,
            "Debe confirmarse la inspección y autorización " +
              "del medicamento antes de reincorporarlo.",
          );
        }

        const saleItem = sale.items.find(
          (item) => String(item.product) === productId,
        );

        if (!saleItem) {
          fail(400, "El producto no pertenece a la venta.");
        }

        if (!Array.isArray(saleItem.batches) || saleItem.batches.length === 0) {
          fail(
            409,
            "La venta no tiene información de lotes. " + "Requiere revisión.",
          );
        }

        const previouslyReturned = previousReturns.reduce(
          (sum, previousReturn) => {
            const matchingItems = previousReturn.items.filter(
              (item) => String(item.product) === productId,
            );

            return (
              sum +
              matchingItems.reduce(
                (subtotal, item) => subtotal + item.quantity,
                0,
              )
            );
          },
          0,
        );

        if (quantity > saleItem.quantity - previouslyReturned) {
          fail(
            400,
            "La cantidad supera las unidades pendientes de devolución.",
          );
        }

        const product = await Product.findById(productId).session(session);

        if (!product) {
          fail(404, "El producto no existe.");
        }

        if (restock && product.active === false) {
          fail(400, "No se puede reincorporar un producto inactivo.");
        }

        const requestedBatches = requestedItem.returnedBatches;

        if (!Array.isArray(requestedBatches) || requestedBatches.length === 0) {
          fail(400, "Debe identificar los lotes originales de la devolución.");
        }

        const seenBatches = new Set();
        const validatedBatches = [];
        let allocatedQuantity = 0;

        for (const allocation of requestedBatches) {
          const batchId = String(allocation?.batch ?? "");
          const batchQuantity = Number(allocation?.quantity);

          if (
            !mongoose.isValidObjectId(batchId) ||
            seenBatches.has(batchId) ||
            allocation?.quantity === undefined ||
            allocation?.quantity === null ||
            allocation?.quantity === "" ||
            !Number.isSafeInteger(batchQuantity) ||
            batchQuantity <= 0
          ) {
            fail(400, "La distribución de cantidades por lote no es válida.");
          }

          seenBatches.add(batchId);

          const soldAllocation = saleItem.batches.find(
            (entry) => String(entry.batch) === batchId,
          );

          if (!soldAllocation) {
            fail(400, "Uno de los lotes no pertenece a la venta original.");
          }

          let returnedFromBatch = 0;

          for (const previousReturn of previousReturns) {
            for (const previousItem of previousReturn.items) {
              if (String(previousItem.product) !== productId) {
                continue;
              }

              for (const previousAllocation of previousItem.returnedBatches) {
                if (String(previousAllocation.batch) === batchId) {
                  returnedFromBatch += previousAllocation.quantity;
                }
              }
            }
          }

          const available = soldAllocation.quantity - returnedFromBatch;

          if (batchQuantity > available) {
            fail(
              400,
              "La cantidad solicitada supera las unidades " +
                "pendientes de devolución del lote.",
            );
          }

          allocatedQuantity += batchQuantity;

          validatedBatches.push({
            batch: batchId,
            quantity: batchQuantity,
          });
        }

        if (allocatedQuantity !== quantity) {
          fail(
            400,
            "La suma de los lotes debe coincidir " +
              "con la cantidad devuelta.",
          );
        }

        const restoredBatches = [];

        if (restock) {
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);

          for (const allocation of validatedBatches) {
            const batch = await Batch.findOne({
              _id: allocation.batch,
              product: product._id,
              active: true,
              expirationDate: { $gt: today },
            }).session(session);

            if (!batch) {
              fail(
                400,
                "Uno de los lotes está vencido, inactivo " +
                  "o no pertenece al producto.",
              );
            }

            const previousStock = product.stock;

            batch.stock += allocation.quantity;
            product.stock += allocation.quantity;

            await batch.save({ session });
            await product.save({ session });

            await InventoryMovement.create(
              [
                {
                  product: product._id,
                  batch: batch._id,
                  type: "entrada",
                  origin: "devolucion",
                  quantity: allocation.quantity,
                  previousStock,
                  newStock: product.stock,
                  reason: `Devolución de venta ${sale.saleNumber}`,
                  user: req.user.id,
                },
              ],
              { session },
            );

            restoredBatches.push({
              batch: batch._id,
              quantity: allocation.quantity,
            });
          }
        }

        const subtotal = Math.round(saleItem.unitPrice * quantity * 100) / 100;

        total += subtotal;

        returnItems.push({
          product: product._id,
          productName: saleItem.productName,
          quantity,
          unitPrice: saleItem.unitPrice,
          subtotal,
          restock,
          returnedBatches: validatedBatches,
          batches: restoredBatches,
        });
      }

      total = Math.round(total * 100) / 100;

      const returnNumber = `DEV-${new mongoose.Types.ObjectId().toString()}`;

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
        { session },
      );

      createdReturnId = newReturn._id;
    });

    const createdReturn = await Return.findById(createdReturnId)
      .populate("sale", "saleNumber createdAt")
      .populate("user", "name username")
      .populate("cashSession", "sessionNumber status")
      .populate("items.returnedBatches.batch", "batchNumber expirationDate")
      .populate("items.batches.batch", "batchNumber expirationDate");

    return res.status(201).json(createdReturn);
  } catch (error) {
    console.error("Error al crear devolución:", error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "No se pudo registrar la devolución.",
    });
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
    if (error.message === "DUPLICATE_RETURN_PRODUCT") {
      return res.status(400).json({
        message:
          "Un producto no puede aparecer dos veces en la misma devolución.",
      });
    }

    console.error("Error al consultar devoluciones de la venta:", error);

    res.status(500).json({
      message: "No se pudieron consultar las devoluciones de la venta.",
    });
  }
});

module.exports = router;
