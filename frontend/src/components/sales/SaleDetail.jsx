import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CircleUserRound,
  CreditCard,
  Package,
  ReceiptText,
  XCircle,
} from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDateTime";

export default function SaleDetail({ sale, onCancelSale, cancelling = false }) {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  if (!sale) {
    return null;
  }

  const totalUnits = sale.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const paymentMethodLabels = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
  };

  const paymentLabel =
    paymentMethodLabels[sale.paymentMethod] || "No especificado";

  const isCancelled = sale.status === "cancelled";

  const handleConfirmCancellation = async () => {
    const success = await onCancelSale(sale._id);

    if (success) {
      setShowCancelConfirmation(false);
    }
  };

  return (
    <div>
      {/* Estado */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-600">
          Estado de la venta
        </span>

        {isCancelled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <XCircle size={14} />
            Anulada
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Completada
          </span>
        )}
      </div>

      {/* Aviso de venta anulada */}
      {isCancelled && (
        <div className="mb-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <XCircle size={20} className="mt-0.5 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-800">Venta anulada</p>

            <p className="mt-1 text-sm text-red-700">
              Los productos de esta venta fueron devueltos al inventario.
            </p>
          </div>
        </div>
      )}

      {/* Información general */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <ReceiptText size={16} />

            <span className="text-xs font-medium uppercase">Venta</span>
          </div>

          <p className="text-sm font-semibold text-gray-900">
            {sale.saleNumber}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <CalendarDays size={16} />

            <span className="text-xs font-medium uppercase">Fecha</span>
          </div>

          <p className="text-sm font-semibold text-gray-900">
            {formatDateTime(sale.createdAt)}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <CircleUserRound size={16} />

            <span className="text-xs font-medium uppercase">Atendido por</span>
          </div>

          <p className="text-sm font-semibold text-gray-900">
            {sale.user?.name || sale.user?.username || "Usuario"}
          </p>
        </div>
      </div>

      {/* Productos */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-emerald-600" />

            <h3 className="font-semibold text-gray-900">Productos vendidos</h3>
          </div>

          <span className="text-sm text-gray-500">
            {totalUnits} unidad
            {totalUnits !== 1 ? "es" : ""}
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
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
                {sale.items.map((item, index) => (
                  <tr key={`${item.product?._id || index}-${index}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {item.productName}
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {item.quantity}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-800">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Información del pago */}
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-emerald-600" />

          <h3 className="font-semibold text-gray-900">Información del pago</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Método de pago
            </p>

            <p className="mt-1 font-semibold text-gray-900">{paymentLabel}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Total</p>

            <p className="mt-1 font-semibold text-gray-900">
              {formatCurrency(sale.total)}
            </p>
          </div>

          {sale.paymentMethod === "cash" && (
            <>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Recibido
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <Banknote size={16} className="text-gray-400" />

                  <p className="font-semibold text-gray-900">
                    {formatCurrency(sale.amountReceived)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Devuelta
                </p>

                <p className="mt-1 font-bold text-emerald-600">
                  {formatCurrency(sale.change)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="mt-5 flex justify-end">
        <div
          className={`w-full rounded-lg p-4 sm:w-72 ${
            isCancelled ? "bg-red-50" : "bg-emerald-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-medium ${
                isCancelled ? "text-red-800" : "text-emerald-800"
              }`}
            >
              Total de la venta
            </span>

            <span
              className={`text-xl font-bold ${
                isCancelled ? "text-red-700 line-through" : "text-emerald-700"
              }`}
            >
              {formatCurrency(sale.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Anular venta */}
      {!isCancelled && (
        <div className="mt-6 border-t border-gray-200 pt-5">
          {!showCancelConfirmation ? (
            <button
              type="button"
              onClick={() => setShowCancelConfirmation(true)}
              disabled={cancelling}
              className="
                inline-flex w-full items-center
                justify-center gap-2 rounded-lg
                border border-red-200 bg-white
                px-4 py-2.5 text-sm
                font-semibold text-red-600
                transition
                hover:bg-red-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <XCircle size={18} />
              Anular venta
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    ¿Anular esta venta?
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    Los medicamentos serán devueltos al inventario y se
                    registrará una entrada en el Kardex.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirmation(false)}
                  disabled={cancelling}
                  className="
                    rounded-lg border border-gray-300
                    bg-white px-4 py-2
                    text-sm font-semibold text-gray-700
                    transition hover:bg-gray-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  No, mantener venta
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCancellation}
                  disabled={cancelling}
                  className="
                    inline-flex items-center justify-center
                    gap-2 rounded-lg bg-red-600
                    px-4 py-2 text-sm
                    font-semibold text-white
                    transition hover:bg-red-700
                    disabled:cursor-not-allowed
                    disabled:bg-red-300
                  "
                >
                  <XCircle size={17} />

                  {cancelling ? "Anulando..." : "Sí, anular venta"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
