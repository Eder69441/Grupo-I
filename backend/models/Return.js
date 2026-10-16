const mongoose = require("mongoose");

// Lotes a los que se reincorporan unidades devueltas
const returnBatchSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "La cantidad del lote debe ser un entero válido.",
      },
    },
  },
  {
    _id: false,
  },
);

const returnItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "La cantidad devuelta debe ser un entero válido.",
      },
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // Indica si las unidades regresan al inventario vendible.
    // false es la opción más segura por defecto.
    restock: {
      type: Boolean,
      default: false,
    },

    // Lotes originales que reciben unidades reincorporadas.
    batches: {
      type: [returnBatchSchema],
      default: [],
    },

    // En returnItemSchema
    returnedBatches: {
      type: [returnBatchSchema],
      default: undefined,
    },
  },
  {
    _id: false,
  },
);

const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
      index: true,
    },

    items: {
      type: [returnItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "La devolución debe contener al menos un producto.",
      },
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    refundMethod: {
      type: String,
      enum: ["cash", "card", "transfer"],
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cashSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashSession",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Return", returnSchema);
