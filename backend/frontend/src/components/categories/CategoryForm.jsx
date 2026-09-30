import { useState } from "react";
import { Plus, Tags } from "lucide-react";

import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage";

export default function CategoryForm({ onSubmit, loading = false }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }

    setError("");

    const success = await onSubmit({
      name: trimmedName,
    });

    if (success) {
      setName("");
    }
  };

  const handleChange = (e) => {
    setName(e.target.value);

    if (error) {
      setError("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        rounded-xl border border-gray-200
        bg-white p-6 shadow-sm
      "
      noValidate
    >
      {/* Encabezado */}
      <div className="mb-5 flex items-start gap-3">
        <div
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-lg bg-emerald-50
            text-emerald-600
          "
        >
          <Tags size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Nueva categoría</h2>

          <p className="mt-1 text-sm leading-5 text-gray-500">
            Agrega una categoría para clasificar los medicamentos.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Nombre */}
      <div>
        <label
          htmlFor="category-name"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Nombre de la categoría
        </label>

        <input
          id="category-name"
          type="text"
          value={name}
          onChange={handleChange}
          placeholder="Ej. Antihipertensivos"
          disabled={loading}
          className="
            w-full rounded-lg
            border border-gray-300
            px-3 py-2.5
            text-sm text-gray-700
            outline-none transition
            placeholder:text-gray-400
            focus:border-emerald-500
            focus:ring-2 focus:ring-emerald-100
            disabled:cursor-not-allowed
            disabled:bg-gray-50
            disabled:text-gray-500
          "
        />
      </div>

      {/* Botón */}
      <Button type="submit" disabled={loading} className="mt-5 w-full">
        {!loading && <Plus size={18} />}

        {loading ? "Guardando..." : "Crear categoría"}
      </Button>
    </form>
  );
}
