import { useState } from "react";
import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import useCurrency from "../../hooks/useCurrency";

export default function CashCloseForm({
  cashSession,
  onClose,
  loading = false,
}) {
  const [countedCash, setCountedCash] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  const { formatCurrency } = useCurrency();

  const expectedCash = Number(
    cashSession?.summary?.expectedCash ?? cashSession?.expectedCash ?? 0,
  );

  const openingAmount = Number(cashSession?.openingAmount ?? 0);

  const cashSales = Number(
    cashSession?.summary?.cashSales ?? cashSession?.cashSales ?? 0,
  );

  const cashRefunds = Number(
    cashSession?.summary?.cashRefunds ?? cashSession?.cashRefunds ?? 0,
  );

  const amount = Number(countedCash);

  const validAmount =
    countedCash.trim() !== "" && Number.isFinite(amount) && amount >= 0;

  const difference = validAmount
    ? Math.round((amount - expectedCash) * 100) / 100
    : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validAmount || !confirmClose || loading) return;

    await onClose({
      countedCash: Math.round(amount * 100) / 100,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-4 font-semibold text-gray-900">
          Conciliación de efectivo
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Fondo inicial</span>
            <strong>{formatCurrency(openingAmount)}</strong>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Ventas en efectivo</span>
            <strong className="text-emerald-700">
              +{formatCurrency(cashSales)}
            </strong>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Reembolsos en efectivo</span>
            <strong className="text-red-600">
              -{formatCurrency(cashRefunds)}
            </strong>
          </div>

          <div className="flex justify-between border-t pt-3">
            <span className="font-semibold">Efectivo esperado</span>
            <strong className="text-lg text-emerald-700">
              {formatCurrency(expectedCash)}
            </strong>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="countedCash"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Efectivo contado físicamente
        </label>

        <input
          id="countedCash"
          type="number"
          min="0"
          step="0.01"
          value={countedCash}
          onChange={(event) => {
            setCountedCash(event.target.value);
            setConfirmClose(false);
          }}
          placeholder="0.00"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {validAmount && (
        <div
          className={`rounded-xl border p-4 ${
            difference === 0
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {difference === 0 ? (
              <CheckCircle2 size={20} className="text-emerald-600" />
            ) : (
              <AlertTriangle size={20} className="text-amber-600" />
            )}

            <span className="font-semibold">
              {difference === 0
                ? "Caja cuadrada"
                : difference > 0
                  ? "Sobrante de caja"
                  : "Faltante de caja"}
            </span>
          </div>

          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(Math.abs(difference))}
          </p>
        </div>
      )}

      <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
        <input
          type="checkbox"
          checked={confirmClose}
          onChange={(event) => setConfirmClose(event.target.checked)}
          disabled={!validAmount || loading}
          className="mt-1"
        />

        <span className="text-sm text-gray-700">
          Confirmo que conté el efectivo y revisé la diferencia antes de cerrar
          la caja.
        </span>
      </label>

      <button
        type="submit"
        disabled={!validAmount || !confirmClose || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LockKeyhole size={18} />
        {loading ? "Cerrando caja..." : "Confirmar cierre de caja"}
      </button>
    </form>
  );
}
