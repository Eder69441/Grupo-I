import { CheckCircle2, ReceiptText, XCircle } from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDateTime";

export default function SaleHistoryTable({ sales, onViewSale }) {
  const paymentMethodLabels = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-4">Venta</th>

              <th className="px-5 py-4">Fecha</th>

              <th className="px-5 py-4">Productos</th>

              <th className="px-5 py-4">Usuario</th>

              <th className="px-4 py-3">Pago</th>

              <th className="px-5 py-4">Estado</th>

              <th className="px-5 py-4 text-right">Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {sales.map((sale) => {
              const totalUnits = sale.items.reduce(
                (total, item) => total + item.quantity,
                0,
              );

              const isCancelled = sale.status === "cancelled";

              return (
                <tr
                  key={sale._id}
                  onClick={() => onViewSale(sale)}
                  className={`
                    cursor-pointer transition
                    ${
                      isCancelled
                        ? "bg-gray-50/70 hover:bg-red-50/50"
                        : "hover:bg-emerald-50/50"
                    }
                  `}
                >
                  {/* Venta */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          flex h-9 w-9 items-center
                          justify-center rounded-lg
                          ${
                            isCancelled
                              ? "bg-red-50 text-red-500"
                              : "bg-emerald-50 text-emerald-600"
                          }
                        `}
                      >
                        <ReceiptText size={17} />
                      </div>

                      <span
                        className={`
                          text-sm font-semibold
                          ${isCancelled ? "text-gray-500" : "text-gray-900"}
                        `}
                      >
                        {sale.saleNumber}
                      </span>
                    </div>
                  </td>

                  {/* Fecha */}
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {formatDateTime(sale.createdAt)}
                  </td>

                  {/* Productos */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-700">
                      {sale.items.length} producto
                      {sale.items.length !== 1 ? "s" : ""}
                    </p>

                    <p className="text-xs text-gray-500">
                      {totalUnits} unidad
                      {totalUnits !== 1 ? "es" : ""}
                    </p>
                  </td>

                  {/* Usuario */}
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {sale.user?.name || sale.user?.username || "Usuario"}
                  </td>

                  {/* Método de pago */}
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {paymentMethodLabels[sale.paymentMethod] ||
                        "No especificado"}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="whitespace-nowrap px-5 py-4">
                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <XCircle size={14} />
                        Anulada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={14} />
                        Completada
                      </span>
                    )}
                  </td>

                  {/* Total */}
                  <td
                    className={`
                      whitespace-nowrap px-5 py-4
                      text-right text-sm font-bold
                      ${
                        isCancelled
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }
                    `}
                  >
                    {formatCurrency(sale.total)}
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
