require("dotenv").config();

const mongoose = require("mongoose");

const Product = require("../models/Product");
const Batch = require("../models/Batch");

async function checkBatchStock() {
  let correct = 0;
  let mismatches = 0;
  let withoutBatches = 0;

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const products = await Product.find({
      active: true,
    }).lean();

    for (const product of products) {
      const batches = await Batch.find({
        product: product._id,
      }).lean();

      if (batches.length === 0) {
        if (product.stock > 0) {
          console.log(`[SIN LOTES] ${product.name}: ${product.stock}`);
          withoutBatches++;
        }
        continue;
      }

      const batchStock = batches
        .filter((batch) => batch.active)
        .reduce((total, batch) => total + batch.stock, 0);

      if (batchStock !== product.stock) {
        console.log(
          `[DIFERENCIA] ${product.name}: ` +
            `Producto=${product.stock}, ` +
            `Lotes=${batchStock}`,
        );
        mismatches++;
        console.log("\nPRODUCTO CON DIFERENCIA");
console.log("ID:", product._id);
console.log("Nombre:", product.name);
console.log("Stock general:", product.stock);
console.log("Stock en lotes:", mismatches);
console.log("Diferencia:", product.stock - mismatches);
      } else {
        correct++;
      }
    }

    console.log("\nVERIFICACIÓN");
    console.log(`Correctos: ${correct}`);
    console.log(`Diferencias: ${mismatches}`);
    console.log(`Sin lotes: ${withoutBatches}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkBatchStock();
