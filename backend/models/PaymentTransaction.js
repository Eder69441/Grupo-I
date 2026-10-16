const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    authorizationCode: {
      type: String,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["DOP", "USD"],
      default: "DOP",
    },

    paymentMethod: {
      type: String,
      enum: ["card"],
      default: "card",
    },

    status: {
      type: String,
      enum: ["approved", "declined", "connection_error", "consumed"],
      required: true,
    },

    scenario: {
      type: String,
      enum: ["approved", "declined", "connection_error"],
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
      required: true,
    },

    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      default: null,
    },

    cartHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
