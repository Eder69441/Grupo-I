const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const Branch = require("../models/Branch");

const router = express.Router();

// Consultar sucursales
router.get("/", protect, async (req, res) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar sucursales.",
    });
  }
});

// Crear sucursal
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { code, name, address, phone } = req.body;

    if (!String(code ?? "").trim() || !String(name ?? "").trim()) {
      return res.status(400).json({
        message: "El código y el nombre son obligatorios.",
      });
    }

    const branch = await Branch.create({
      code,
      name,
      address,
      phone,
    });

    res.status(201).json(branch);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      message:
        error.code === 11000
          ? "Ya existe una sucursal con ese código."
          : "No se pudo crear la sucursal.",
    });
  }
});

// Actualizar sucursal
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { code, name, address, phone, active } = req.body;

    const updates = {};

    if (code !== undefined) updates.code = code;
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (phone !== undefined) updates.phone = phone;
    if (typeof active === "boolean") updates.active = active;

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!branch) {
      return res.status(404).json({
        message: "Sucursal no encontrada.",
      });
    }

    res.json(branch);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      message:
        error.code === 11000
          ? "Ya existe una sucursal con ese código."
          : "No se pudo actualizar la sucursal.",
    });
  }
});

module.exports = router;
