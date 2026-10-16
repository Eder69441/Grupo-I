const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
      set: (value) => {
        const code = String(value ?? "")
          .trim()
          .toUpperCase();
        return code || undefined;
      },
    },

    barcode: {
      type: String,
      trim: true,
      default: undefined,
      set: (value) => {
        const barcode = String(value ?? "").trim();
        return barcode || undefined;
      },
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    expirationDate: {
      type: Date,
      required: false,
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
  },
);

// Códigos únicos cuando estén definidos
productSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: { code: { $type: "string" } },
  },
);

productSchema.index(
  { barcode: 1 },
  {
    unique: true,
    partialFilterExpression: { barcode: { $type: "string" } },
  },
);

module.exports = mongoose.model("Product", productSchema);
