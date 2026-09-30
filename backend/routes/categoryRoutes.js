const express = require("express")

const Category = require("../models/Category")
const Product = require("../models/Product")

const protect = require("../middleware/authMiddleware")
const authorize = require("../middleware/roleMiddleware")

const router = express.Router()

// Obtener todas las categorías
router.get("/", protect, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 })

    res.json(categories)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "No se pudieron obtener las categorías."
    })
  }
})

// Crear categoría
router.post(
  "/",
  protect, authorize("admin"),
  async (req, res) => {
    try {
      const name = req.body.name?.trim()

      if (!name) {
        return res.status(400).json({
          message:
            "El nombre de la categoría es obligatorio."
        })
      }

      const existingCategory =
        await Category.findOne({
          name: {
            $regex: `^${name}$`,
            $options: "i"
          }
        })

      if (existingCategory) {
        return res.status(400).json({
          message: "La categoría ya existe."
        })
      }

      const category = await Category.create({
        name
      })

      res.status(201).json(category)
    } catch (error) {
      console.error(error)

      res.status(400).json({
        message: "No se pudo crear la categoría."
      })
    }
  }
)

// Eliminar categoría
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const category = await Category.findById(
        req.params.id
      )

      if (!category) {
        return res.status(404).json({
          message: "Categoría no encontrada."
        })
      }

      // Comprobar si algún producto usa la categoría
      const productExists = await Product.exists({
        category: category.name
      })

      if (productExists) {
        return res.status(400).json({
          message:
            "No puedes eliminar una categoría que tiene productos asociados."
        })
      }

      await category.deleteOne()

      res.json({
        message: "Categoría eliminada correctamente."
      })
    } catch (error) {
      console.error(error)

      res.status(500).json({
        message: "No se pudo eliminar la categoría."
      })
    }
  }
)

module.exports = router