import { Tags, Trash2 } from "lucide-react";

export default function CategoryTable({ categories, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Encabezado de la tarjeta */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Tags size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Categorías</h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Categorías registradas en el sistema
            </p>
          </div>
        </div>

        {/* Contador */}
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {categories.length}
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Categoría
              </th>

              <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Acción
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {categories.map((category) => (
              <tr key={category.id} className="transition hover:bg-gray-50/70">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">
                    {category.name}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onDelete(category)}
                      className="
                        inline-flex h-9 w-9
                        items-center justify-center
                        rounded-lg text-gray-500
                        transition
                        hover:bg-red-50
                        hover:text-red-600
                      "
                      title="Eliminar categoría"
                      aria-label={`Eliminar ${category.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
