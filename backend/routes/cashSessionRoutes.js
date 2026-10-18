const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/authMiddleware");
const requireBranch = require("../middleware/branchMiddleware");

const Sale = require("../models/Sale");
const CashSession = require("../models/CashSession");
const Return = require("../models/Return");

const router = express.Router();

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// CALCULAR RESUMEN DE UNA CAJA
const calculateSummary = async (cashSession, session = null) => {
  const salesQuery = Sale.find({
    cashSession: cashSession._id,
    status: "completed",
  });

  const returnsQuery = Return.find({
    cashSession: cashSession._id,
  });

  if (session) {
    salesQuery.session(session);
    returnsQuery.session(session);
  }

  const [sales, returns] = await Promise.all([salesQuery, returnsQuery]);

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

  let cashRefunds = 0;
  let cardRefunds = 0;
  let transferRefunds = 0;

  for (const returnRecord of returns) {
    if (returnRecord.refundMethod === "cash") {
      cashRefunds += returnRecord.total;
    }

    if (returnRecord.refundMethod === "card") {
      cardRefunds += returnRecord.total;
    }

    if (returnRecord.refundMethod === "transfer") {
      transferRefunds += returnRecord.total;
    }
  }

  cashSales = roundMoney(cashSales);
  cardSales = roundMoney(cardSales);
  transferSales = roundMoney(transferSales);

  cashRefunds = roundMoney(cashRefunds);
  cardRefunds = roundMoney(cardRefunds);
  transferRefunds = roundMoney(transferRefunds);

  const totalSales = roundMoney(cashSales + cardSales + transferSales);

  const totalRefunds = roundMoney(cashRefunds + cardRefunds + transferRefunds);

  const expectedCash = roundMoney(
    cashSession.openingAmount + cashSales - cashRefunds,
  );

  return {
    salesCount: sales.length,
    unitsSold,
    cashSales,
    cardSales,
    transferSales,
    totalSales,
    expectedCash,
    returnsCount: returns.length,
    cashRefunds,
    cardRefunds,
    transferRefunds,
    totalRefunds,
  };
};

// OBTENER CAJA ABIERTA DE LA SUCURSAL
router.get("/current", protect, requireBranch, async (req, res) => {
  try {
    const cashSession = await CashSession.findOne({
      branch: req.branchId,
      status: "open",
    })
      .populate("openedBy", "name username")
      .populate("branch", "code name");

    if (!cashSession) {
      return res.json(null);
    }

    const summary = await calculateSummary(cashSession);

    return res.json({
      ...cashSession.toObject(),
      summary,
    });
  } catch (error) {
    console.error("Error al obtener caja abierta:", error);

    return res.status(500).json({
      message: "No se pudo consultar la caja abierta.",
    });
  }
});

// HISTORIAL DE CAJAS DE LA SUCURSAL
router.get("/", protect, requireBranch, async (req, res) => {
  try {
    const cashSessions = await CashSession.find({
      branch: req.branchId,
    })
      .populate("openedBy", "name username")
      .populate("closedBy", "name username")
      .populate("branch", "code name")
      .sort({ openedAt: -1 });

    return res.json(cashSessions);
  } catch (error) {
    console.error("Error al obtener historial de cajas:", error);

    return res.status(500).json({
      message: "No se pudo cargar el historial de cajas.",
    });
  }
});

// ABRIR CAJA
router.post("/open", protect, requireBranch, async (req, res) => {
  try {
    const openingAmount = Number(req.body.openingAmount);

    if (
      req.body.openingAmount === undefined ||
      req.body.openingAmount === null ||
      req.body.openingAmount === "" ||
      !Number.isFinite(openingAmount) ||
      openingAmount < 0
    ) {
      return res.status(400).json({
        message: "El fondo inicial debe ser un monto válido.",
      });
    }

    const existingSession = await CashSession.findOne({
      branch: req.branchId,
      status: "open",
    });

    if (existingSession) {
      return res.status(409).json({
        message: "Ya existe una caja abierta en esta sucursal.",
      });
    }

    const sessionNumber = `CAJA-${new mongoose.Types.ObjectId().toString()}`;

    const cashSession = await CashSession.create({
      sessionNumber,
      branch: req.branchId,
      openedBy: req.user.id,
      openedAt: new Date(),
      openingAmount: roundMoney(openingAmount),
      status: "open",
    });

    const populatedSession = await CashSession.findById(cashSession._id)
      .populate("openedBy", "name username")
      .populate("branch", "code name");

    return res.status(201).json(populatedSession);
  } catch (error) {
    console.error("Error al abrir caja:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe una caja abierta en esta sucursal.",
      });
    }

    return res.status(500).json({
      message: "No se pudo abrir la caja.",
    });
  }
});

// CERRAR CAJA
router.post("/close", protect, requireBranch, async (req, res) => {
  const countedCash = Number(req.body.countedCash);

  if (
    req.body.countedCash === undefined ||
    req.body.countedCash === null ||
    req.body.countedCash === "" ||
    !Number.isFinite(countedCash) ||
    countedCash < 0
  ) {
    return res.status(400).json({
      message: "El efectivo contado debe ser un monto válido.",
    });
  }

  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const cashSession = await CashSession.findOne({
      branch: req.branchId,
      status: "open",
    }).session(session);

    if (!cashSession) {
      throw new Error("CASH_SESSION_NOT_FOUND");
    }

    const summary = await calculateSummary(cashSession, session);

    const finalCountedCash = roundMoney(countedCash);

    const difference = roundMoney(finalCountedCash - summary.expectedCash);

    cashSession.cashSales = summary.cashSales;
    cashSession.cardSales = summary.cardSales;
    cashSession.transferSales = summary.transferSales;
    cashSession.totalSales = summary.totalSales;

    cashSession.cashRefunds = summary.cashRefunds;
    cashSession.cardRefunds = summary.cardRefunds;
    cashSession.transferRefunds = summary.transferRefunds;
    cashSession.totalRefunds = summary.totalRefunds;

    cashSession.expectedCash = summary.expectedCash;
    cashSession.countedCash = finalCountedCash;
    cashSession.difference = difference;

    cashSession.closedBy = req.user.id;
    cashSession.closedAt = new Date();
    cashSession.status = "closed";

    await cashSession.save({ session });

    await session.commitTransaction();

    const closedSession = await CashSession.findById(cashSession._id)
      .populate("openedBy", "name username")
      .populate("closedBy", "name username")
      .populate("branch", "code name");

    return res.json(closedSession);
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error al cerrar caja:", error);

    if (error.message === "CASH_SESSION_NOT_FOUND") {
      return res.status(400).json({
        message: "No existe una caja abierta en esta sucursal.",
      });
    }

    return res.status(500).json({
      message: "No se pudo cerrar la caja.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

// OBTENER DETALLE DE UNA SESIÓN DE CAJA
router.get("/:id", protect, requireBranch, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "El identificador de la caja no es válido.",
      });
    }

    const cashSession = await CashSession.findOne({
      _id: req.params.id,
      branch: req.branchId,
    })
      .populate("openedBy", "name username")
      .populate("closedBy", "name username")
      .populate("branch", "code name");

    if (!cashSession) {
      return res.status(404).json({
        message: "La sesión de caja no fue encontrada.",
      });
    }

    return res.json(cashSession);
  } catch (error) {
    console.error("Error al consultar detalle de caja:", error);

    return res.status(500).json({
      message: "No se pudo consultar el detalle de la caja.",
    });
  }
});

module.exports = router;
