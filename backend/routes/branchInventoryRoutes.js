const express = require("express");
const mongoose = require("mongoose");

const Batch = require("../models/Batch");
const protect = require("../middleware/authMiddleware");
const requireBranch = require("../middleware/branchMiddleware");

const router = express.Router();

// GET /api/branch-inventory?branchId=...
router.get("/", protect, requireBranch, async (req, res) => {
  try {
    const { productId } = req.query;

    if (productId && !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "El identificador del producto no es válido.",
      });
    }

    const match = {
      branch: new mongoose.Types.ObjectId(req.branchId),
      active: true,
      stock: { $gt: 0 },
      expirationDate: { $gte: new Date() },
    };

    if (productId) {
      match.product = new mongoose.Types.ObjectId(productId);
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
          batchCount: { $sum: 1 },
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
          branchId: "$branch._id",
          branchName: "$branch.name",
          stock: 1,
          batchCount: 1,
        },
      },
      { $sort: { productName: 1 } },
    ]);

    return res.json(inventory);
  } catch (error) {
    console.error("Error al consultar inventario:", error);

    return res.status(500).json({
      message: "No se pudo consultar el inventario por sucursal.",
    });
  }
});

module.exports = router;
