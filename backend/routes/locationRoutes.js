const express = require("express");

const Location = require("../models/Location");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const Product = require("../models/Product");

const router = express.Router();

// Admin y empleado
router.get("/", protect, async (req, res) => {
  try {
    const locations = await Location.find({
      active: { $ne: false },
    }).sort({
      section: 1,
      shelf: 1,
      level: 1,
    });

    res.json(locations);
  } catch (error) {
    console.error("Error al obtener ubicaciones:", error);

    res.status(500).json({
      message: "No se pudieron obtener las ubicaciones.",
    });
  }
});

// Solo administrador
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { section, shelf, level } = req.body;

    if (!section?.trim() || !shelf?.trim() || !level?.trim()) {
      return res.status(400).json({
        message: "Tramo, estante y nivel son obligatorios.",
      });
    }

    const normalizedSection = section.trim().toUpperCase();
    const normalizedShelf = shelf.trim();
    const normalizedLevel = level.trim();

    const existingLocation = await Location.findOne({
      section: normalizedSection,
      shelf: normalizedShelf,
      level: normalizedLevel,
    });

    if (existingLocation) {
      return res.status(409).json({
        message: "Esta ubicación ya está registrada.",
      });
    }

    const location = await Location.create({
      section: normalizedSection,
      shelf: normalizedShelf,
      level: normalizedLevel,
    });

    res.status(201).json(location);
  } catch (error) {
    console.error("Error al crear ubicación:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Esta ubicación ya está registrada.",
      });
    }

    res.status(500).json({
      message: "No se pudo crear la ubicación.",
    });
  }
});

// Solo administrador
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { section, shelf, level } = req.body;

    if (!section?.trim() || !shelf?.trim() || !level?.trim()) {
      return res.status(400).json({
        message: "Tramo, estante y nivel son obligatorios.",
      });
    }

    const normalizedSection = section.trim().toUpperCase();
    const normalizedShelf = shelf.trim();
    const normalizedLevel = level.trim();

    const duplicateLocation = await Location.findOne({
      _id: { $ne: req.params.id },
      section: normalizedSection,
      shelf: normalizedShelf,
      level: normalizedLevel,
      active: { $ne: false },
    });

    if (duplicateLocation) {
      return res.status(409).json({
        message: "Esta ubicación ya está registrada.",
      });
    }

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      {
        section: normalizedSection,
        shelf: normalizedShelf,
        level: normalizedLevel,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!location) {
      return res.status(404).json({
        message: "Ubicación no encontrada.",
      });
    }

    res.json(location);
  } catch (error) {
    console.error("Error al actualizar ubicación:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Esta ubicación ya está registrada.",
      });
    }

    res.status(500).json({
      message: "No se pudo actualizar la ubicación.",
    });
  }
});

// Solo administrador
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { section, shelf, level } = req.body;

    if (!section?.trim() || !shelf?.trim() || !level?.trim()) {
      return res.status(400).json({
        message: "Tramo, estante y nivel son obligatorios.",
      });
    }

    const normalizedSection = section.trim().toUpperCase();
    const normalizedShelf = shelf.trim();
    const normalizedLevel = level.trim();

    const duplicateLocation = await Location.findOne({
      _id: { $ne: req.params.id },
      section: normalizedSection,
      shelf: normalizedShelf,
      level: normalizedLevel,
      active: { $ne: false },
    });

    if (duplicateLocation) {
      return res.status(409).json({
        message: "Esta ubicación ya está registrada.",
      });
    }

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      {
        section: normalizedSection,
        shelf: normalizedShelf,
        level: normalizedLevel,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!location) {
      return res.status(404).json({
        message: "Ubicación no encontrada.",
      });
    }

    res.json(location);
  } catch (error) {
    console.error("Error al actualizar ubicación:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Esta ubicación ya está registrada.",
      });
    }

    res.status(500).json({
      message: "No se pudo actualizar la ubicación.",
    });
  }
});

// Solo administrador
// Desactivación lógica
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        message: "Ubicación no encontrada.",
      });
    }

    if (location.active === false) {
      return res.status(400).json({
        message: "La ubicación ya está inactiva.",
      });
    }

    const productUsingLocation = await Product.findOne({
      location: location._id,
      active: { $ne: false },
    });

    if (productUsingLocation) {
      return res.status(400).json({
        message:
          "No puedes desactivar esta ubicación porque tiene productos asignados.",
      });
    }

    location.active = false;

    await location.save();

    res.json({
      message: "Ubicación desactivada correctamente.",
    });
  } catch (error) {
    console.error("Error al desactivar ubicación:", error);

    res.status(500).json({
      message: "No se pudo desactivar la ubicación.",
    });
  }
});
module.exports = router;
