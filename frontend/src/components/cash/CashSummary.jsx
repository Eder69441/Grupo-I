import {
  Banknote,
  CreditCard,
  PackageCheck,
  ReceiptText,
  WalletCards,
  RotateCcw,
} from "lucide-react";

import useCurrency from "../../hooks/useCurrency";

export default function CashSummary({ summary }) {
  if (!summary) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold text-gray-900">Operaciones de la caja</h2>

        <p className="mt-1 text-sm text-gray-500">
          Resumen de las ventas registradas durante esta sesión.
        </p>
      </div>

      {/* Resumen general */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <ReceiptText size={16} />

            <span className="text-xs font-medium uppercase">Ventas</span>
          </div>

          <p className="mt-2 text-xl font-bold text-gray-900">
            {summary.salesCount}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <PackageCheck size={16} />

            <span className="text-xs font-medium uppercase">Unidades</span>
          </div>

          <p className="mt-2 text-xl font-bold text-gray-900">
            {summary.unitsSold}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <Banknote size={16} />

            <span className="text-xs font-medium uppercase">Total vendido</span>
          </div>

          <p className="mt-2 text-xl font-bold text-emerald-700">
            {formatCurrency(summary.totalSales)}
          </p>
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="divide-y divide-gray-100">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Banknote size={18} className="text-emerald-600" />

            <span className="text-sm text-gray-600">Efectivo</span>
          </div>

          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(summary.cashSales)}
          </span>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <CreditCard size={18} className="text-blue-600" />

            <span className="text-sm text-gray-600">Tarjeta</span>
          </div>

          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(summary.cardSales)}
          </span>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <WalletCards size={18} className="text-violet-600" />

            <span className="text-sm text-gray-600">Transferencia</span>
          </div>

          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(summary.transferSales)}
          </span>
        </div>
      </div>

      {/* Devoluciones */}
      {summary.totalRefunds > 0 && (
        <div className="mt-6 rounded-xl border border-red-100 bg-red-50/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw size={18} className="text-red-600" />

              <h3 className="text-sm font-semibold text-gray-900">
                Devoluciones
              </h3>
            </div>

            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
              {summary.returnsCount} devolución
              {summary.returnsCount !== 1 ? "es" : ""}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reembolso en efectivo</span>

              <span className="font-semibold text-red-600">
                -{formatCurrency(summary.cashRefunds)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reembolso en tarjeta</span>

              <span className="font-semibold text-red-600">
                -{formatCurrency(summary.cardRefunds)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reembolso por transferencia</span>

              <span className="font-semibold text-red-600">
                -{formatCurrency(summary.transferRefunds)}
              </span>
            </div>

            <div className="flex justify-between border-t border-red-100 pt-3">
              <span className="text-sm font-semibold text-gray-900">
                Total reembolsado
              </span>

              <span className="font-bold text-red-600">
                -{formatCurrency(summary.totalRefunds)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
