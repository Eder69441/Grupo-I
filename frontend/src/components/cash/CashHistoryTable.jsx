import { CheckCircle2, CircleMinus, CirclePlus, Eye } from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDateTime";

export default function CashHistoryTable({ sessions, onView }) {
  if (!sessions.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Todavía no existen sesiones de caja registradas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Caja
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Apertura
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Fondo inicial
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Ventas
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Diferencia
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Estado
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                Detalle
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {sessions.map((session) => {
              const difference = session.difference || 0;

              return (
                <tr
                  key={session._id}
                  onClick={() => onView?.(session)}
                  className="cursor-pointer transition hover:bg-emerald-50/50"
                >
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {session.sessionNumber}
                    </p>

                    <p className="text-xs text-gray-500">
                      {session.openedBy?.name ||
                        session.openedBy?.username ||
                        "Usuario"}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {formatDateTime(session.openedAt)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-700">
                    {formatCurrency(session.openingAmount)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(session.totalSales || 0)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    {session.status === "open" ? (
                      <span className="text-sm text-gray-400">—</span>
                    ) : difference < 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                        <CircleMinus size={15} />

                        {formatCurrency(difference)}
                      </span>
                    ) : difference > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                        <CirclePlus size={15} />+{formatCurrency(difference)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                        <CheckCircle2 size={15} />
                        Cuadrada
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {session.status === "open" ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Abierta
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        Cerrada
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onView?.(session);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <Eye size={16} />
                      Ver
                    </button>
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
