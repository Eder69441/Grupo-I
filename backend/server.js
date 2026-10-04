const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const movementRoutes = require("./routes/movementRoutes");
const locationRoutes = require("./routes/locationRoutes");
const saleRoutes = require("./routes/saleRoutes");
const cashSessionRoutes = require("./routes/cashSessionRoutes");
const returnRoutes = require("./routes/returnRoutes");

const app = express();

connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "https://grupo-i-1.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API Tu Pharmacy funcionando",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/movements", movementRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/cash-sessions", cashSessionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
