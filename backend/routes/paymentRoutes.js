const express = require("express");
const crypto = require("node:crypto");

const protect = require("../middleware/authMiddleware");

const PaymentTransaction = require("../models/PaymentTransaction");
const CashSession = require("../models/CashSession");
const Product = require("../models/Product");

const { normalizeCart, getCartHash, toCents } = require("../utils/paymentCart");

const router = express.Router();

const validScenarios = ["approved", "declined", "connection_error"];

router.post("/simulate", protect, async (req, res) => {
  try {
    const { items, scenario } = req.body;

    const validScenarios = ["approved", "declined", "connection_error"];

    if (!validScenarios.includes(scenario)) {
      return res.status(400).json({
        message: "Escenario de pago no válido.",
      });
    }

    let normalizedItems;

    try {
      normalizedItems = normalizeCart(items);
    } catch {
      return res.status(400).json({
        message: "El carrito contiene productos o cantidades no válidos.",
      });
    }

    const cashSession = await CashSession.findOne({
      status: "open",
    });

    if (!cashSession) {
      return res.status(400).json({
        message: "Debe existir una caja abierta.",
      });
    }

    let totalCents = 0;

    for (const item of normalizedItems) {
      const product = await Product.findOne({
        _id: item.product,
        active: { $ne: false },
      });

      if (!product) {
        return res.status(404).json({
          message: "Uno de los productos no está disponible.",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name}.`,
        });
      }

      totalCents += toCents(product.price) * item.quantity;
    }

    if (totalCents <= 0) {
      return res.status(400).json({
        message: "El total del pago debe ser mayor que cero.",
      });
    }

    const reference = `POS-${crypto.randomUUID()}`;

    const authorizationCode =
      scenario === "approved"
        ? `AUTH-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
        : null;

    const transaction = await PaymentTransaction.create({
      reference,
      authorizationCode,
      amount: totalCents / 100,
      currency: "DOP",
      paymentMethod: "card",
      status: scenario,
      scenario,
      cartHash: getCartHash(normalizedItems),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      user: req.user.id,
      cashSession: cashSession._id,
    });

    return res.status(201).json({
      id: transaction._id,
      reference: transaction.reference,
      authorizationCode: transaction.authorizationCode,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      message:
        scenario === "approved"
          ? "Pago de prueba aprobado."
          : scenario === "declined"
            ? "Pago de prueba rechazado."
            : "Error de conexión simulado.",
    });
  } catch (error) {
    console.error("Error al simular pago:", error);

    return res.status(500).json({
      message: "No se pudo procesar el pago simulado.",
    });
  }
});

// Consultar transacción
router.get("/:id", protect, async (req, res) => {
  try {
    const transaction = await PaymentTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transacción no encontrada.",
      });
    }

    if (String(transaction.user) !== String(req.user.id)) {
      return res.status(403).json({
        message: "No tienes acceso a esta transacción.",
      });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error al consultar pago:", error);

    res.status(500).json({
      message: "No se pudo consultar la transacción.",
    });
  }
});

module.exports = router;
