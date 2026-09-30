import { useState } from "react";
import { ArrowDown, ArrowUp, Package } from "lucide-react";

import Button from "../common/Button";

export default function MovementForm({ products, onSubmit, loading = false }) {
  const [form, setForm] = useState({
    product: "",
    type: "entrada",
    quantity: "",
    reason: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.product) {
      setError("Selecciona un producto.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("La cantidad debe ser un número entero mayor que cero.");
      return;
    }

    if (!form.reason.trim()) {
      setError("El motivo es obligatorio.");
      return;
    }

    const success = await onSubmit({
      ...form,
      quantity,
      reason: form.reason.trim(),
    });

    if (success) {
      setForm({
        product: "",
        type: "entrada",
        quantity: "",
        reason: "",
      });
    }
  };

  const selectedProduct = products.find(
    (product) => String(product._id || product.id) === form.product,
  );

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Registrar movimiento
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Registra una entrada o salida de inventario.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Producto
          </label>

          <select
            name="product"
            value={form.product}
            onChange={handleChange}
            className={inputClass}
            disabled={loading}
          >
            <option value="">Selecciona un producto</option>

            {products.map((product) => (
              <option
                key={product._id || product.id}
                value={product._id || product.id}
              >
                {product.name} — Stock: {product.stock}
              </option>
            ))}
          </select>

          {selectedProduct && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <Package size={14} />
              Stock disponible:
              <span className="font-semibold text-gray-700">
                {selectedProduct.stock}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tipo
          </label>

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className={inputClass}
            disabled={loading}
          >
            <option value="entrada">Entrada</option>

            <option value="salida">Salida</option>
          </select>

          <div className="mt-2 flex items-center gap-2 text-xs">
            {form.type === "entrada" ? (
              <>
                <ArrowUp size={14} className="text-emerald-600" />

                <span className="text-emerald-700">Aumentará el stock</span>
              </>
            ) : (
              <>
                <ArrowDown size={14} className="text-red-600" />

                <span className="text-red-700">Disminuirá el stock</span>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Cantidad
          </label>

          <input
            type="number"
            name="quantity"
            min="1"
            step="1"
            value={form.quantity}
            onChange={handleChange}
            className={inputClass}
            placeholder="Ej. 10"
            disabled={loading}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Motivo
          </label>

          <input
            type="text"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            className={inputClass}
            placeholder="Ej. Compra a proveedor"
            disabled={loading}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrar movimiento"}
        </Button>
      </div>
    </form>
  );
}
