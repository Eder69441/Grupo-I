import { ReceiptText } from "lucide-react";

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
              <th className="px-5 py-4 text-right">Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {sales.map((sale) => {
              const totalUnits = sale.items.reduce(
                (total, item) => total + item.quantity,
                0,
              );

              return (
                <tr
                  key={sale._id}
                  onClick={() => onViewSale(sale)}
                  className="cursor-pointer transition hover:bg-emerald-50/50"
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <ReceiptText size={17} />
                      </div>

                      <span className="text-sm font-semibold text-gray-900">
                        {sale.saleNumber}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {formatDateTime(sale.createdAt)}
                  </td>

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

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {sale.user?.name || sale.user?.username || "Usuario"}
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {paymentMethodLabels[sale.paymentMethod] ||
                        "No especificado"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-gray-900">
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
