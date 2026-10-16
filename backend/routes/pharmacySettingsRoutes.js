const express = require("express");

const PharmacySettings = require("../models/PharmacySettings");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

const DEFAULT_SETTINGS = {
  pharmacyName: "Tu Pharmacy",
  rnc: "",
  phone: "",
  email: "",
  address: "",
  receiptMessage: "¡Gracias por su compra!",
  currency: "DOP",
  currencySymbol: "RD$",
};

// Obtener configuración
router.get("/", async (req, res) => {
  try {
    let settings = await PharmacySettings.findOne();

    if (!settings) {
      settings = await PharmacySettings.create(DEFAULT_SETTINGS);
    }

    res.json(settings);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "No se pudo obtener la configuración de la farmacia.",
    });
  }
});

// Actualizar configuración
router.put("/", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      pharmacyName,
      rnc,
      phone,
      email,
      address,
      receiptMessage,
      currency,
    } = req.body;

    if (!pharmacyName?.trim()) {
      return res.status(400).json({
        message: "El nombre de la farmacia es obligatorio.",
      });
    }

    let settings = await PharmacySettings.findOne();

    const allowedCurrencies = ["DOP", "USD"];

    const selectedCurrency = currency || "DOP";

    if (!allowedCurrencies.includes(selectedCurrency)) {
      return res.status(400).json({
        message: "La moneda seleccionada no es válida.",
      });
    }

    const data = {
      pharmacyName: pharmacyName.trim(),
      rnc: rnc?.trim() || "",
      phone: phone?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      address: address?.trim() || "",
      receiptMessage: receiptMessage?.trim() || "¡Gracias por su compra!",
      currency: selectedCurrency,
      currencySymbol: selectedCurrency === "USD" ? "US$" : "RD$",
    };

    if (!settings) {
      settings = await PharmacySettings.create(data);
    } else {
      Object.assign(settings, data);

      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "No se pudo actualizar la configuración.",
    });
  }
});

module.exports = router;
