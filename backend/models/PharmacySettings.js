const mongoose = require("mongoose");

const pharmacySettingsSchema = new mongoose.Schema(
  {
    pharmacyName: {
      type: String,
      required: true,
      trim: true,
      default: "Tu Pharmacy",
    },

    rnc: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    receiptMessage: {
      type: String,
      trim: true,
      default: "¡Gracias por su compra!",
    },

    currency: {
      type: String,
      trim: true,
      default: "DOP",
    },

    currencySymbol: {
      type: String,
      trim: true,
      default: "RD$",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("PharmacySettings", pharmacySettingsSchema);
