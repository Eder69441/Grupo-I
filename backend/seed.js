const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
require("dotenv").config()

const User = require("./models/User")
const Product = require("./models/Product")
const Category = require("./models/Category")

const seedDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI
    )

    console.log("MongoDB conectado")

    await User.deleteMany()
    await Product.deleteMany()
    await Category.deleteMany()

    const adminPassword = await bcrypt.hash(
      "123456",
      10
    )

    const employeePassword = await bcrypt.hash(
      "123456",
      10
    )

    await User.create([
      {
        name: "Administrador",
        username: "admin",
        password: adminPassword,
        role: "admin"
      },
      {
        name: "Empleado",
        username: "empleado",
        password: employeePassword,
        role: "employee"
      }
    ])

    await Product.create([
      {
        name: "Paracetamol 500mg",
        category: "Analgésico",
        price: 120,
        stock: 50,
        expirationDate: "2027-03-20"
      },
      {
        name: "Ibuprofeno 400mg",
        category: "Antiinflamatorio",
        price: 150,
        stock: 12,
        expirationDate: "2027-05-10"
      },
      {
        name: "Amoxicilina 500mg",
        category: "Antibiótico",
        price: 250,
        stock: 3,
        expirationDate: "2026-12-02"
      },
      {
        name: "Loratadina 10mg",
        category: "Antialérgico",
        price: 180,
        stock: 0,
        expirationDate: "2026-10-15"
      }
    ])

    await Category.create([
  {
    name: "Analgésico"
  },
  {
    name: "Antiinflamatorio"
  },
  {
    name: "Antibiótico"
  },
  {
    name: "Antialérgico"
  }
])

    console.log(
      "Datos de prueba creados correctamente"
    )
  } catch (error) {
    console.error(
      "Error al crear los datos:",
      error
    )
  } finally {
    await mongoose.connection.close()
    console.log("Conexión cerrada")
  }
}

seedDatabase()