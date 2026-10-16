
const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");
const Batch = require("../models/Batch");

const router = express.Router();

// GET /api/branch-inventory
// GET /api/branch-inventory?productId=...
// GET /api/branch-inventory?branchId=...
router.get("/", protect, async (req, res) => {
  try {
    const { productId, branchId } = req.query;

    if (
      (productId && !mongoose.isValidObjectId(productId)) ||
      (branchId && !mongoose.isValidObjectId(branchId))
    ) {
      return res.status(400).json({
        message: "Identificador de producto o sucursal inválido.",
      });
    }

    const match = {
      active: true,
      stock: { $gt: 0 },
    };

    if (productId) {
      match.product = new mongoose.Types.ObjectId(productId);
    }

    if (branchId) {
      match.branch = new mongoose.Types.ObjectId(branchId);
    }

    const inventory = await Batch.aggregate([
      { $match: match },

      {
        $group: {
          _id: {
            product: "$product",
            branch: "$branch",
          },
          stock: { $sum: "$stock" },
          batches: { $sum: 1 },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "_id.product",
          foreignField: "_id",
          as: "product",
        },
      },

      {
        $lookup: {
          from: "branches",
          localField: "_id.branch",
          foreignField: "_id",
          as: "branch",
        },
      },

      { $unwind: "$product" },
      { $unwind: "$branch" },

      {
        $project: {
          _id: 0,
          productId: "$product._id",
          productName: "$product.name",
          code: "$product.code",
          barcode: "$product.barcode",
          branchId: "$branch._id",
          branchName: "$branch.name",
          stock: 1,
          batches: 1,
        },
      },

      {
        $sort: {
          productName: 1,
          branchName: 1,
        },
      },
    ]);

    res.json(inventory);
  } catch (error) {
    console.error("Error al consultar inventario:", error);

    res.status(500).json({
      message: "No se pudo consultar el inventario por sucursal.",
    });
  }
});

module.exports = router;

