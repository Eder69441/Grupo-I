import {
  Banknote,
  CreditCard,
  Landmark,
  RotateCcw,
  WalletCards,
} from "lucide-react";

import useCurrency from "../../hooks/useCurrency";
import { formatDateTime } from "../../utils/formatDateTime";

const refundMethodLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

const refundMethodIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: WalletCards,
};

export default function ReturnDetail({ returnRecord }) {
const { formatCurrency } = useCurrency();

  if (!returnRecord) {
    return null;
  }

  const RefundIcon = refundMethodIcons[returnRecord.refundMethod] || RotateCcw;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="rounded-xl border border-red-100 bg-red-50/50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <RotateCcw size={20} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Devolución registrada
            </p>

            <h3 className="mt-1 text-lg font-bold text-gray-900">
              {returnRecord.returnNumber}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {formatDateTime(returnRecord.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Datos generales */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Venta original
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {returnRecord.sale?.saleNumber || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Registrada por
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {returnRecord.user?.name || returnRecord.user?.username || "—"}
          </p>
        </div>
      </div>

      {/* Productos */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">
          Productos devueltos
        </h4>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Producto</th>

                  <th className="px-4 py-3 text-center">Cant.</th>

                  <th className="px-4 py-3 text-right">Precio</th>

                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {returnRecord.items.map((item, index) => (
                  <tr key={`${item.product}-${index}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.productName}
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Motivo */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-900">Motivo</p>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm leading-6 text-gray-700">
            {returnRecord.reason}
          </p>
        </div>
      </div>

      {/* Reembolso */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="mb-4 flex items-center gap-2">
          <RefundIcon size={18} className="text-emerald-600" />

          <h4 className="text-sm font-semibold text-gray-900">
            Información del reembolso
          </h4>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">
              Método
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {refundMethodLabels[returnRecord.refundMethod] ||
                returnRecord.refundMethod}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">
              Total reembolsado
            </p>

            <p className="mt-1 text-lg font-bold text-red-600">
              -{formatCurrency(returnRecord.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Caja */}
      {returnRecord.cashSession && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
          <Landmark size={19} className="text-gray-500" />

          <div>
            <p className="text-xs font-medium text-gray-500">Sesión de caja</p>

            <p className="text-sm font-semibold text-gray-900">
              {returnRecord.cashSession.sessionNumber}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
