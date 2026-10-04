import {
  Banknote,
  CreditCard,
  PackageCheck,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";

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
    </div>
  );
}
