import { Eye, RotateCcw } from "lucide-react";

import useCurrency from "../../hooks/useCurrency";
import { formatDateTime } from "../../utils/formatDateTime";

const refundMethodLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export default function ReturnHistoryTable({ returns, onView }) {
const { formatCurrency } = useCurrency();

  if (!returns.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
        <RotateCcw size={36} className="mx-auto mb-3 text-gray-300" />

        <p className="font-medium text-gray-700">
          No hay devoluciones registradas
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Las devoluciones aparecerán aquí cuando sean registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-xs font-semibold uppercase text-gray-500">
              <th className="px-4 py-3">Devolución</th>

              <th className="px-4 py-3">Venta</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Reembolso</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Detalle</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {returns.map((returnRecord) => {
              const units = returnRecord.items.reduce(
                (total, item) => total + item.quantity,
                0,
              );

              return (
                <tr
                  key={returnRecord._id}
                  onClick={() => onView?.(returnRecord)}
                  className="cursor-pointer transition hover:bg-emerald-50/50"
                >
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {returnRecord.returnNumber}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="text-sm font-medium text-emerald-700">
                      {returnRecord.sale?.saleNumber || "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {formatDateTime(returnRecord.createdAt)}
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">
                      {returnRecord.items.length} producto
                      {returnRecord.items.length !== 1 ? "s" : ""}
                    </p>

                    <p className="text-xs text-gray-500">
                      {units} unidad
                      {units !== 1 ? "es" : ""}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {refundMethodLabels[returnRecord.refundMethod] ||
                        returnRecord.refundMethod}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {returnRecord.user?.name ||
                      returnRecord.user?.username ||
                      "—"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-red-600">
                    -{formatCurrency(returnRecord.total)}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        onView?.(returnRecord);
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
