const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee"
    }

    branch: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Branch",
  default: null,
  index: true,
},
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false
    }
  }
)

module.exports = mongoose.model("User", userSchema)
