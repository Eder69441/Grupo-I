const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const normalizedUsername = username?.trim().toLowerCase();

    const user = await User.findOne({
      username: normalizedUsername,
    });

    if (!user) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al iniciar sesión.",
    });
  }
});

module.exports = router;
