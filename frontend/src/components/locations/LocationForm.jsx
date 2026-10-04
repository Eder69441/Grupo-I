import { useState } from "react";
import { MapPin, Save } from "lucide-react";

import Button from "../common/Button";

export default function LocationForm({
  initialData = null,
  onSubmit,
  loading = false,
  onCancel,
}) {
const [form, setForm] = useState(() => ({
  section: initialData?.section || "",
  shelf: initialData?.shelf || "",
  level: initialData?.level || "",
}));

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "section" ? value.toUpperCase() : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!form.section.trim()) {
      newErrors.section = "El tramo es obligatorio.";
    }

    if (!form.shelf.trim()) {
      newErrors.shelf = "El estante es obligatorio.";
    }

    if (!form.level.trim()) {
      newErrors.level = "El nivel es obligatorio.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    await onSubmit({
      section: form.section.trim().toUpperCase(),
      shelf: form.shelf.trim(),
      level: form.level.trim(),
    });
  };

  const inputClass = (hasError) => `
    w-full rounded-lg border px-4 py-2.5
    text-sm text-gray-700 outline-none transition
    ${
      hasError
        ? "border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    }
  `;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <MapPin size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            {initialData ? "Editar ubicación" : "Nueva ubicación"}
          </h2>

          <p className="text-sm text-gray-500">
            Define la ubicación física dentro de la farmacia.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tramo
          </label>

          <input
            type="text"
            name="section"
            value={form.section}
            onChange={handleChange}
            placeholder="Ej. A"
            disabled={loading}
            className={inputClass(errors.section)}
          />

          {errors.section && (
            <p className="mt-1 text-sm text-red-600">{errors.section}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Estante
          </label>

          <input
            type="text"
            name="shelf"
            value={form.shelf}
            onChange={handleChange}
            placeholder="Ej. 02"
            disabled={loading}
            className={inputClass(errors.shelf)}
          />

          {errors.shelf && (
            <p className="mt-1 text-sm text-red-600">{errors.shelf}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Nivel
          </label>

          <input
            type="text"
            name="level"
            value={form.level}
            onChange={handleChange}
            placeholder="Ej. 03"
            disabled={loading}
            className={inputClass(errors.level)}
          />

          {errors.level && (
            <p className="mt-1 text-sm text-red-600">{errors.level}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {initialData && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}

        <Button type="submit" disabled={loading}>
          {!loading && <Save size={18} />}

          {loading
            ? "Guardando..."
            : initialData
              ? "Actualizar ubicación"
              : "Guardar ubicación"}
        </Button>
      </div>
    </form>
  );
}
