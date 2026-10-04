const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    shelf: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      required: true,
      trim: true,
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

// Evita registrar dos veces la misma ubicación física
locationSchema.index(
  {
    section: 1,
    shelf: 1,
    level: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Location", locationSchema);
