
const mongoose = require("mongoose");
const User = require("../models/User");
const Branch = require("../models/Branch");

const requireBranch = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("role branch")
      .lean();

    if (!user) {
      return res.status(401).json({
        message: "Usuario no encontrado.",
      });
    }

    let branchId = user.branch;

    // Administradores pueden seleccionar sucursal operativa
    if (user.role === "admin" && req.body.branchId) {
      branchId = req.body.branchId;
    }

    if (!branchId || !mongoose.isValidObjectId(branchId)) {
      return res.status(400).json({
        message: "Debes seleccionar una sucursal válida.",
      });
    }

    const branch = await Branch.findOne({
      _id: branchId,
      active: true,
    }).lean();

    if (!branch) {
      return res.status(400).json({
        message: "La sucursal no existe o está inactiva.",
      });
    }

    req.branchId = branch._id;
    next();
  } catch (error) {
    console.error("Error al validar sucursal:", error);

    res.status(500).json({
      message: "No se pudo validar la sucursal.",
    });
  }
};

module.exports = requireBranch;
