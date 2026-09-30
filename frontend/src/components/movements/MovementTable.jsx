import { ArrowDown, ArrowUp } from "lucide-react";

export default function MovementTable({ movements }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Producto
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tipo
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Cantidad
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Stock anterior
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Stock nuevo
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Motivo
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Usuario
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Fecha
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {movements.map((movement) => {
              const isEntry = movement.type === "entrada";

              return (
                <tr key={movement.id || movement._id} className="transition hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {movement.product?.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {movement.product?.category}
                      </p>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`
                        inline-flex items-center gap-1.5
                        rounded-full px-2.5 py-1
                        text-xs font-semibold
                        ${
                          isEntry
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }
                      `}
                    >
                      {isEntry ? (
                        <ArrowDown size={14} />
                      ) : (
                        <ArrowUp size={14} />
                      )}

                      {isEntry ? "Entrada" : "Salida"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                    {movement.quantity}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {movement.previousStock}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                    {movement.newStock}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {movement.reason}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="text-sm text-gray-700">
                      {movement.user?.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      @{movement.user?.username}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                    {new Intl.DateTimeFormat("es-DO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(movement.createdAt))}
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
