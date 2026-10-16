require("dotenv").config();

const mongoose = require("mongoose");

const Product = require("../models/Product");
const Batch = require("../models/Batch");

const APPLY = process.argv.includes("--apply");

async function migrateProductBatches() {
  let created = 0;
  let skipped = 0;
  let needsReview = 0;

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB conectado.");
    console.log(APPLY ? "MODO EJECUCIÓN" : "MODO SIMULACIÓN");

    const products = await Product.find({
      active: true,
    }).lean();

    for (const product of products) {
      const existingBatches = await Batch.find({
        product: product._id,
      }).lean();

      if (existingBatches.length > 0) {
        console.log(`[REVISAR] ${product.name}: ya tiene lotes.`);
        needsReview++;
        continue;
      }

      const stock = Number(product.stock);

      if (!Number.isInteger(stock) || stock < 0) {
        console.log(`[REVISAR] ${product.name}: stock inválido.`);
        needsReview++;
        continue;
      }

      if (stock === 0) {
        console.log(`[OMITIDO] ${product.name}: sin existencias.`);
        skipped++;
        continue;
      }

      const expirationDate = product.expirationDate;

      if (!expirationDate || Number.isNaN(new Date(expirationDate).getTime())) {
        console.log(`[REVISAR] ${product.name}: vencimiento inválido.`);
        needsReview++;
        continue;
      }

      const batchNumber = `MIG-${product._id.toString().toUpperCase()}`;

      console.log(
        `[${APPLY ? "CREAR" : "SIMULAR"}] ` +
          `${product.name} | ` +
          `Lote: ${batchNumber} | ` +
          `Stock: ${stock}`,
      );

      if (APPLY) {
        await Batch.create({
          product: product._id,
          batchNumber,
          expirationDate,
          stock,
          initialStock: stock,
          unitCost: 0,
          active: true,
        });
      }

      created++;
    }

    console.log("\nRESUMEN");
    console.log(`Procesados: ${products.length}`);
    console.log(`${APPLY ? "Creados" : "Por crear"}: ${created}`);
    console.log(`Omitidos: ${skipped}`);
    console.log(`Para revisión: ${needsReview}`);
  } catch (error) {
    console.error("Error en migración:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

migrateProductBatches();
