const mongoose = require("mongoose");

const cashSessionSchema = new mongoose.Schema(
  {
    sessionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },


    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    openedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    openingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      required: true,
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    cashSales: {
      type: Number,
      min: 0,
      default: 0,
    },

    cardSales: {
      type: Number,
      min: 0,
      default: 0,
    },

    transferSales: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalSales: {
      type: Number,
      min: 0,
      default: 0,
    },
    cashRefunds: {
      type: Number,
      min: 0,
      default: 0,
    },

    cardRefunds: {
      type: Number,
      min: 0,
      default: 0,
    },

    transferRefunds: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalRefunds: {
      type: Number,
      min: 0,
      default: 0,
    },

    expectedCash: {
      type: Number,
      min: 0,
      default: 0,
    },

    countedCash: {
      type: Number,
      min: 0,
      default: 0,
    },

    difference: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


cashSessionSchema.index(
  { branch: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "open",
    },
    name: "unique_open_cash_session_per_branch",
  },
);


module.exports = mongoose.model("CashSession", cashSessionSchema);
