const crypto = require("node:crypto");

function normalizeCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("INVALID_CART");
  }

  const seen = new Set();

  return items
    .map((item) => {
      const product = String(item.product || "");
      const quantity = Number(item.quantity);

      if (
        !/^[a-f\d]{24}$/i.test(product) ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        seen.has(product)
      ) {
        throw new Error("INVALID_CART");
      }

      seen.add(product);

      return { product, quantity };
    })
    .sort((a, b) => a.product.localeCompare(b.product));
}

function getCartHash(items) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalizeCart(items)))
    .digest("hex");
}

function toCents(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("INVALID_AMOUNT");
  }

  return Math.round(value * 100);
}

module.exports = {
  normalizeCart,
  getCartHash,
  toCents,
};
