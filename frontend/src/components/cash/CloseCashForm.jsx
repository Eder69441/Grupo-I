import { useState } from "react";

import { Banknote, LockKeyhole, TriangleAlert } from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";

export default function CloseCashForm({ onClose, loading = false }) {
  const [countedCash, setCountedCash] = useState("");

  const [showConfirmation, setShowConfirmation] = useState(false);

  const numericAmount = Number(countedCash);

  const validAmount =
    countedCash !== "" && Number.isFinite(numericAmount) && numericAmount >= 0;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validAmount) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    const success = await onClose(numericAmount);

    if (success) {
      setCountedCash("");
      setShowConfirmation(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-semibold text-gray-900">Cierre de caja</h2>

        <p className="mt-1 text-sm text-gray-500">
          Cuenta el efectivo físico disponible antes de cerrar la caja.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="countedCash"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Efectivo contado
          </label>

          <div className="relative">
            <Banknote
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="countedCash"
              type="number"
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(event) => setCountedCash(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {validAmount && (
            <p className="mt-2 text-sm text-gray-500">
              Efectivo contado:{" "}
              <span className="font-semibold text-gray-700">
                {formatCurrency(numericAmount)}
              </span>
            </p>
          )}
        </div>

        {!showConfirmation ? (
          <button
            type="submit"
            disabled={!validAmount || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LockKeyhole size={17} />
            Cerrar caja
          </button>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <TriangleAlert
                size={20}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  ¿Confirmar cierre?
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  Después del cierre será necesario abrir una nueva caja para
                  registrar ventas.
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmation(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Cerrando..." : "Confirmar cierre"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
