const mongoose = require("mongoose");

const inventoryMovementSchema = new mongoose.Schema(
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

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: ["entrada", "salida"],
      required: true,
    },

    // Proceso que generó el movimiento
    origin: {
      type: String,
      enum: [
        "lote_inicial",
        "reposicion",
        "venta",
        "anulacion",
        "devolucion",
        "ajuste",
      ],
      default: null,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },

    newStock: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("InventoryMovement", inventoryMovementSchema);
