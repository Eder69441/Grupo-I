const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");

const Sale = require("../models/Sale");
const CashSession = require("../models/CashSession");

const router = express.Router();

// OBTENER CAJA ABIERTA
router.get("/current", protect, async (req, res) => {
  try {
    const cashSession = await CashSession.findOne({
      status: "open",
    }).populate("openedBy", "name username");

    if (!cashSession) {
      return res.json(null);
    }

    // Obtener solamente ventas válidas de esta caja
    const sales = await Sale.find({
      cashSession: cashSession._id,
      status: "completed",
    });

    let cashSales = 0;
    let cardSales = 0;
    let transferSales = 0;
    let unitsSold = 0;

    for (const sale of sales) {
      if (sale.paymentMethod === "cash") {
        cashSales += sale.total;
      }

      if (sale.paymentMethod === "card") {
        cardSales += sale.total;
      }

      if (sale.paymentMethod === "transfer") {
        transferSales += sale.total;
      }

      unitsSold += sale.items.reduce((total, item) => total + item.quantity, 0);
    }

    // Manejo de decimales
    cashSales = Math.round(cashSales * 100) / 100;
    cardSales = Math.round(cardSales * 100) / 100;
    transferSales = Math.round(transferSales * 100) / 100;

    const totalSales =
      Math.round((cashSales + cardSales + transferSales) * 100) / 100;

    const expectedCash =
      Math.round((cashSession.openingAmount + cashSales) * 100) / 100;

    res.json({
      ...cashSession.toObject(),

      summary: {
        salesCount: sales.length,
        unitsSold,
        cashSales,
        cardSales,
        transferSales,
        totalSales,
        expectedCash,
      },
    });
  } catch (error) {
    console.error("Error al obtener caja abierta:", error);

    res.status(500).json({
      message: "No se pudo consultar la caja abierta.",
    });
  }
});

// HISTORIAL DE CAJAS
router.get("/", protect, async (req, res) => {
  try {
    const cashSessions = await CashSession.find()
      .populate("openedBy", "name username")
      .populate("closedBy", "name username")
      .sort({ openedAt: -1 });

    res.json(cashSessions);
  } catch (error) {
    console.error("Error al obtener historial de cajas:", error);

    res.status(500).json({
      message: "No se pudo cargar el historial de cajas.",
    });
  }
});

// ABRIR CAJA
router.post("/open", protect, async (req, res) => {
  try {
    const openingAmount = Number(req.body.openingAmount);

    if (!Number.isFinite(openingAmount) || openingAmount < 0) {
      return res.status(400).json({
        message: "El fondo inicial debe ser un monto válido.",
      });
    }

    // Comprobar si ya existe una caja abierta
    const existingSession = await CashSession.findOne({
      status: "open",
    });

    if (existingSession) {
      return res.status(400).json({
        message: "Ya existe una caja abierta.",
      });
    }

    const sessionNumber = `CAJA-${Date.now()}`;

    const cashSession = await CashSession.create({
      sessionNumber,
      openedBy: req.user.id,
      openedAt: new Date(),
      openingAmount: Math.round(openingAmount * 100) / 100,
    });

    const populatedSession = await CashSession.findById(
      cashSession._id,
    ).populate("openedBy", "name username");

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error("Error al abrir caja:", error);

    res.status(500).json({
      message: "No se pudo abrir la caja.",
    });
  }
});

// =====================================================
// CERRAR CAJA
// =====================================================

router.post("/close", protect, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const countedCash = Number(req.body.countedCash);

    if (!Number.isFinite(countedCash) || countedCash < 0) {
      return res.status(400).json({
        message: "El efectivo contado debe ser un monto válido.",
      });
    }

    session.startTransaction();

    // Buscar la caja abierta
    const cashSession = await CashSession.findOne({
      status: "open",
    }).session(session);

    if (!cashSession) {
      throw new Error("CASH_SESSION_NOT_FOUND");
    }

    // Obtener únicamente ventas completadas
    // pertenecientes a esta sesión de caja.
    const sales = await Sale.find({
      cashSession: cashSession._id,
      status: "completed",
    }).session(session);

    // =================================================
    // CALCULAR VENTAS POR MÉTODO DE PAGO
    // =================================================

    let cashSales = 0;
    let cardSales = 0;
    let transferSales = 0;

    for (const sale of sales) {
      if (sale.paymentMethod === "cash") {
        cashSales += sale.total;
      }

      if (sale.paymentMethod === "card") {
        cardSales += sale.total;
      }

      if (sale.paymentMethod === "transfer") {
        transferSales += sale.total;
      }
    }

    // Evitar problemas con decimales
    cashSales = Math.round(cashSales * 100) / 100;
    cardSales = Math.round(cardSales * 100) / 100;
    transferSales = Math.round(transferSales * 100) / 100;

    const totalSales =
      Math.round((cashSales + cardSales + transferSales) * 100) / 100;

    // =================================================
    // EFECTIVO ESPERADO
    // =================================================

    const expectedCash =
      Math.round((cashSession.openingAmount + cashSales) * 100) / 100;

    const finalCountedCash = Math.round(countedCash * 100) / 100;

    // Positivo = sobrante
    // Negativo = faltante
    const difference =
      Math.round((finalCountedCash - expectedCash) * 100) / 100;

    // =================================================
    // CERRAR SESIÓN
    // =================================================

    cashSession.cashSales = cashSales;
    cashSession.cardSales = cardSales;
    cashSession.transferSales = transferSales;

    cashSession.totalSales = totalSales;

    cashSession.expectedCash = expectedCash;

    cashSession.countedCash = finalCountedCash;

    cashSession.difference = difference;

    cashSession.closedBy = req.user.id;
    cashSession.closedAt = new Date();

    cashSession.status = "closed";

    await cashSession.save({
      session,
    });

    await session.commitTransaction();

    const closedSession = await CashSession.findById(cashSession._id)
      .populate("openedBy", "name username")
      .populate("closedBy", "name username");

    res.json(closedSession);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error al cerrar caja:", error);

    if (error.message === "CASH_SESSION_NOT_FOUND") {
      return res.status(400).json({
        message: "No existe una caja abierta para cerrar.",
      });
    }

    res.status(500).json({
      message: "No se pudo cerrar la caja.",
    });
  } finally {
    await session.endSession();
  }
});

module.exports = router;
