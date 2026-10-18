const mongoose = require("mongoose");
const User = require("../models/User");
const Branch = require("../models/Branch");

const requireBranch = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Debes iniciar sesión.",
      });
    }

    const user = await User.findById(req.user.id).select("role branch").lean();

    if (!user) {
      return res.status(401).json({
        message: "Usuario no encontrado.",
      });
    }

    // Por defecto, usar la sucursal asignada al usuario.
    let branchId = user.branch;

    // Solo el administrador puede seleccionar otra sucursal.
    if (user.role === "admin") {
      const requestedBranch = req.body?.branchId ?? req.query?.branchId;

      if (requestedBranch !== undefined) {
        branchId = requestedBranch;
      }
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
    req.branch = branch;

    next();
  } catch (error) {
    console.error("Error al validar sucursal:", error);

    return res.status(500).json({
      message: "No se pudo validar la sucursal.",
    });
  }
};

module.exports = requireBranch;
