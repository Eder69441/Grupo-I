import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Package,
  Save,
  Tags,
  ScanBarcode,
  Hash,
} from "lucide-react";

import { getLocations } from "../../services/locationService";

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
    code: initialData.code || "",
    barcode: initialData.barcode || "",
    name: initialData.name || "",
    category: initialData.category || "",
    price: initialData.price ?? "",
    stock: initialData.stock ?? 0,
    expirationDate: initialData.expirationDate || "",
    location:
      typeof initialData.location === "object"
        ? initialData.location?._id || ""
        : initialData.location || "",
  });

  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await getLocations();
        setLocations(response.data);
      } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
      } finally {
        setLocationsLoading(false);
      }
    };

    loadLocations();
  }, []);

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

    if (!form.location) {
      newErrors.location = "Selecciona una ubicación.";
    }

    if (form.price === "") {
      newErrors.price = "El precio es obligatorio.";
    } else if (Number(form.price) <= 0) {
      newErrors.price = "El precio debe ser mayor que 0.";
    }

    const code = form.code.trim().toUpperCase();
    const barcode = form.barcode.trim();

    if (code && barcode && code === barcode) {
      newErrors.barcode =
        "El código de barras debe ser diferente del código interno.";
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

    await onSubmit({
      code: form.code.trim().toUpperCase(),
      barcode: form.barcode.trim(),
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      location: form.location,
    });
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
        {/* Código interno */}
        <div>
          <label
            htmlFor="code"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Código interno
          </label>

          <div className="relative">
            <Hash
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="code"
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              disabled={loading}
              placeholder="Ej. MED-000125"
              autoComplete="off"
              className={`${getInputClass(errors.code)} pl-10`}
            />
          </div>

          {errors.code && (
            <p className="mt-1.5 text-sm text-red-600">{errors.code}</p>
          )}
        </div>

        {/* Código de barras */}
        <div>
          <label
            htmlFor="barcode"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Código de barras
          </label>

          <div className="relative">
            <ScanBarcode
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="barcode"
              type="text"
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
              disabled={loading}
              placeholder="Escanea o escribe el código"
              autoComplete="off"
              className={`${getInputClass(errors.barcode)} pl-10`}
            />
          </div>

          {errors.barcode && (
            <p className="mt-1.5 text-sm text-red-600">{errors.barcode}</p>
          )}
        </div>
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
        {/* Ubicación */}
        <div>
          <label
            htmlFor="location"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Ubicación física
          </label>

          <select
            id="location"
            name="location"
            value={form.location || ""}
            onChange={handleChange}
            disabled={locationsLoading}
            className={getInputClass(errors.location)}
          >
            <option value="">
              {locationsLoading
                ? "Cargando ubicaciones..."
                : "Seleccionar ubicación"}
            </option>

            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {`Tramo ${location.section} · Estante ${location.shelf} · Nivel ${location.level}`}
              </option>
            ))}
          </select>
          {errors.location && (
            <p className="mt-1.5 text-sm text-red-600">{errors.location}</p>
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
