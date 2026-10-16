const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
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
      index: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    initialStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    unitCost: {
      type: Number,
      min: 0,
      default: 0,
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

batchSchema.index(
  {
    branch: 1,
    product: 1,
    batchNumber: 1,
  },
  {
    unique: true,
  },
);
);

module.exports = mongoose.model("Batch", batchSchema);
