const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    expirationDate: {
      type: Date,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    initialStock: {
      type: Number,
      required: true,
      min: 0,
    },

    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índice único por sucursal, producto y lote
batchSchema.index({ branch: 1, product: 1, batchNumber: 1 }, { unique: true });

module.exports = mongoose.model("Batch", batchSchema);
