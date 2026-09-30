import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  DollarSign,
  Package,
  Save,
  Tags,
  Boxes,
} from "lucide-react";

import Button from "../common/Button";

export default function ProductForm({
  initialData = {},
  onSubmit,
  buttonText = "Guardar producto",
  loadingText = "Guardando...",
  loading = false,
  categories = [],
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: initialData.name || "",
    category: initialData.category || "",
    price: initialData.price || "",
    stock: initialData.stock ?? "",
    expirationDate: initialData.expirationDate || "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }

    if (!form.category) {
      newErrors.category = "Selecciona una categoría.";
    }

    if (form.price === "") {
      newErrors.price = "El precio es obligatorio.";
    } else if (Number(form.price) <= 0) {
      newErrors.price = "El precio debe ser mayor que 0.";
    }

    if (form.stock === "") {
      newErrors.stock = "El stock es obligatorio.";
    } else if (Number(form.stock) < 0) {
      newErrors.stock = "El stock no puede ser negativo.";
    } else if (!Number.isInteger(Number(form.stock))) {
      newErrors.stock = "El stock debe ser un número entero.";
    }

    if (!form.expirationDate) {
      newErrors.expirationDate = "La fecha de vencimiento es obligatoria.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiration = new Date(`${form.expirationDate}T00:00:00`);

      if (expiration <= today) {
        newErrors.expirationDate = "La fecha debe ser posterior a hoy.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    await onSubmit(form);
  };

  const getInputClass = (hasError) => `
    w-full rounded-lg
    border
    px-4 py-2.5
    text-sm text-gray-700
    outline-none transition
    placeholder:text-gray-400
    disabled:cursor-not-allowed
    disabled:bg-gray-50
    ${
      hasError
        ? "border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    }
  `;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {/* Encabezado */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Package size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            Información del producto
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Completa los datos del medicamento.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Nombre */}
        <div className="md:col-span-2">
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Nombre del producto
          </label>

          <div className="relative">
            <Package
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              placeholder="Ej. Paracetamol 500mg"
              className={`${getInputClass(errors.name)} pl-10`}
            />
          </div>

          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Categoría
          </label>

          <div className="relative">
            <Tags
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              disabled={loading}
              className={`${getInputClass(errors.category)} pl-10`}
            >
              <option value="">Seleccione una categoría</option>

              {categories.map((category) => (
                <option key={category._id || category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {errors.category && (
            <p className="mt-1.5 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Precio */}
        <div>
          <label
            htmlFor="price"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Precio
          </label>

          <div className="relative">
            <DollarSign
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="price"
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              disabled={loading}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`${getInputClass(errors.price)} pl-10`}
            />
          </div>

          {errors.price && (
            <p className="mt-1.5 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label
            htmlFor="stock"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Stock
          </label>

          <div className="relative">
            <Boxes
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="stock"
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              disabled={loading}
              placeholder="0"
              min="0"
              step="1"
              className={`${getInputClass(errors.stock)} pl-10`}
            />
          </div>

          {errors.stock && (
            <p className="mt-1.5 text-sm text-red-600">{errors.stock}</p>
          )}
        </div>

        {/* Vencimiento */}
        <div>
          <label
            htmlFor="expirationDate"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Fecha de vencimiento
          </label>

          <div className="relative">
            <CalendarDays
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="expirationDate"
              type="date"
              name="expirationDate"
              value={form.expirationDate}
              onChange={handleChange}
              disabled={loading}
              className={`${getInputClass(errors.expirationDate)} pl-10`}
            />
          </div>

          {errors.expirationDate && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.expirationDate}
            </p>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={() => navigate("/products")}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button type="submit" disabled={loading}>
          {!loading && <Save size={18} />}

          {loading ? loadingText : buttonText}
        </Button>
      </div>
    </form>
  );
}
