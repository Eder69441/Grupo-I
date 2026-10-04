import {
  Banknote,
  CheckCircle2,
  CircleMinus,
  CirclePlus,
  CreditCard,
  Printer,
  WalletCards,
  X,
} from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDateTime";

export default function CashClosingSummary({ session, onClose }) {
  if (!session) {
    return null;
  }

  const difference = session.difference || 0;

  const isBalanced = difference === 0;
  const isShortage = difference < 0;
  const isSurplus = difference > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-area rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Encabezado */}
      <div className="flex items-start justify-between border-b border-gray-100 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Cierre completado
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-900">
            Resumen de cierre de caja
          </h2>

          <p className="mt-1 text-sm text-gray-500">{session.sessionNumber}</p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="no-print rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar resumen"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Resultado */}
        <div
          className={`mb-6 rounded-xl border p-5 ${
            isBalanced
              ? "border-emerald-200 bg-emerald-50"
              : isShortage
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-3">
            {isBalanced && (
              <CheckCircle2 size={26} className="text-emerald-600" />
            )}

            {isShortage && <CircleMinus size={26} className="text-red-600" />}

            {isSurplus && <CirclePlus size={26} className="text-amber-600" />}

            <div>
              <p className="text-sm font-medium text-gray-600">
                Resultado del cierre
              </p>

              <p
                className={`text-lg font-bold ${
                  isBalanced
                    ? "text-emerald-700"
                    : isShortage
                      ? "text-red-700"
                      : "text-amber-700"
                }`}
              >
                {isBalanced && "Caja cuadrada"}

                {isShortage &&
                  `Faltante de ${formatCurrency(Math.abs(difference))}`}

                {isSurplus && `Sobrante de ${formatCurrency(difference)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Información de la sesión */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase text-gray-500">
              Abierta por
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {session.openedBy?.name ||
                session.openedBy?.username ||
                "Usuario"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatDateTime(session.openedAt)}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase text-gray-500">
              Cerrada por
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {session.closedBy?.name ||
                session.closedBy?.username ||
                "Usuario"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatDateTime(session.closedAt)}
            </p>
          </div>
        </div>

        {/* Ventas */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Ventas de la sesión
          </h3>

          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Banknote size={18} className="text-emerald-600" />

                <span className="text-sm text-gray-600">Efectivo</span>
              </div>

              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(session.cashSales)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-blue-600" />

                <span className="text-sm text-gray-600">Tarjeta</span>
              </div>

              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(session.cardSales)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <WalletCards size={18} className="text-violet-600" />

                <span className="text-sm text-gray-600">Transferencia</span>
              </div>

              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(session.transferSales)}
              </span>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4">
              <span className="text-sm font-semibold text-gray-900">
                Total ventas
              </span>

              <span className="font-bold text-emerald-700">
                {formatCurrency(session.totalSales)}
              </span>
            </div>
          </div>
        </div>

        {/* Cuadre */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Cuadre de efectivo
          </h3>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-500">Fondo inicial</span>

              <span className="font-semibold text-gray-900">
                {formatCurrency(session.openingAmount)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-500">Ventas en efectivo</span>

              <span className="font-semibold text-gray-900">
                {formatCurrency(session.cashSales)}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-t border-gray-100 pt-3 text-sm">
              <span className="font-medium text-gray-700">
                Efectivo esperado
              </span>

              <span className="font-bold text-gray-900">
                {formatCurrency(session.expectedCash)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="font-medium text-gray-700">
                Efectivo contado
              </span>

              <span className="font-bold text-gray-900">
                {formatCurrency(session.countedCash)}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-t border-gray-200 pt-3">
              <span className="font-semibold text-gray-900">Diferencia</span>

              <span
                className={`font-bold ${
                  isBalanced
                    ? "text-emerald-600"
                    : isShortage
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              >
                {difference > 0 && "+"}

                {formatCurrency(difference)}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="no-print mt-6 flex justify-end">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Printer size={17} />
            Imprimir cierre
          </button>
        </div>
      </div>
    </div>
  );
}
