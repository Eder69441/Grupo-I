const mongoose = require("mongoose");

const saleBatchSchema = new mongoose.Schema(
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
    },
  },
  { _id: false },
);

const saleItemSchema = new mongoose.Schema(
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

    batches: {
      type: [saleBatchSchema],
      default: undefined,
    },

    returnRevision: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const saleSchema = new mongoose.Schema(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "La venta debe contener al menos un producto.",
      },
    },

    total: {
      type: Number,
      required: true,
      min: 0,
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

    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer"],
      required: true,
    },

    paymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      default: null,
    },

    amountReceived: {
      type: Number,
      min: 0,
      default: 0,
    },

    change: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Sale", saleSchema);
