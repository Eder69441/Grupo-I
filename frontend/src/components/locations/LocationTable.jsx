import { MapPin, Pencil, CircleOff } from "lucide-react";

export default function LocationTable({ locations, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-4">Código</th>
              <th className="px-5 py-4">Tramo</th>
              <th className="px-5 py-4">Estante</th>
              <th className="px-5 py-4">Nivel</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {locations.map((location) => {
              const code = `${location.section}-${location.shelf}-${location.level}`;

              return (
                <tr
                  key={location._id}
                  className="transition hover:bg-gray-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <MapPin size={17} />
                      </div>

                      <span className="font-semibold text-gray-900">
                        {code}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {location.section}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {location.shelf}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {location.level}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(location)}
                        title="Editar ubicación"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(location)}
                        title="Desactivar ubicación"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <CircleOff size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
