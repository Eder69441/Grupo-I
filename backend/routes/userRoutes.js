const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const protect = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Obtener usuarios
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener los usuarios.",
    });
  }
});

// Crear usuario
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({
      username: normalizedUsername,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "El nombre de usuario ya existe.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username: normalizedUsername,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      message: "No se pudo crear el usuario.",
    });
  }
});
// Eliminar usuario
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        message: "No puedes eliminar tu propio usuario.",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado.",
      });
    }

    res.json({
      message: "Usuario eliminado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "No se pudo eliminar el usuario.",
    });
  }
});

module.exports = router;
