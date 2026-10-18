const express = require("express");
const crypto = require("node:crypto");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");
const requireBranch = require("../middleware/branchMiddleware");

const PaymentTransaction = require("../models/PaymentTransaction");
const CashSession = require("../models/CashSession");
const Product = require("../models/Product");
const Batch = require("../models/Batch");

const { normalizeCart, getCartHash, toCents } = require("../utils/paymentCart");

const router = express.Router();

const validScenarios = ["approved", "declined", "connection_error"];

// SIMULAR PAGO POS
router.post("/simulate", protect, requireBranch, async (req, res) => {
  try {
    const { items, scenario } = req.body;

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

    // Buscar exclusivamente la caja de la sucursal.
    const cashSession = await CashSession.findOne({
      branch: req.branchId,
      status: "open",
    });

    if (!cashSession) {
      return res.status(400).json({
        message: "Debe existir una caja abierta en esta sucursal.",
      });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

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

      // Comprobar el stock consolidado.
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock global insuficiente para ${product.name}.`,
        });
      }

      // Comprobar el stock vendible de esta sucursal.
      const batches = await Batch.find({
        product: product._id,
        branch: req.branchId,
        active: true,
        stock: { $gt: 0 },
        expirationDate: { $gte: today },
      }).select("stock");

      const availableStock = batches.reduce(
        (sum, batch) => sum + batch.stock,
        0,
      );

      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente en esta sucursal para ${product.name}.`,
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
      branch: req.branchId,
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

// CONSULTAR TRANSACCIÓN
router.get("/:id", protect, requireBranch, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "El identificador de la transacción no es válido.",
      });
    }

    const transaction = await PaymentTransaction.findOne({
      _id: req.params.id,
      branch: req.branchId,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transacción no encontrada en esta sucursal.",
      });
    }

    return res.json(transaction);
  } catch (error) {
    console.error("Error al consultar pago:", error);

    return res.status(500).json({
      message: "No se pudo consultar la transacción.",
    });
  }
});

module.exports = router;
