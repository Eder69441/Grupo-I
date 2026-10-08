import { useState } from "react";

import { Banknote, LockOpen } from "lucide-react";

import useCurrency from "../../hooks/useCurrency";

export default function OpenCashForm({ onOpen, loading = false }) {
  const [openingAmount, setOpeningAmount] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(openingAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      return;
    }

    const success = await onOpen(amount);

    if (success) {
      setOpeningAmount("");
    }
  };

  const numericAmount = Number(openingAmount);

  const validAmount =
    openingAmount !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount >= 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <LockOpen size={22} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Apertura de caja</h2>

          <p className="mt-1 text-sm text-gray-500">
            Indica el efectivo disponible al comenzar las operaciones.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="openingAmount"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Fondo inicial
          </label>

          <div className="relative">
            <Banknote
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="openingAmount"
              type="number"
              min="0"
              step="0.01"
              value={openingAmount}
              onChange={(event) => setOpeningAmount(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {validAmount && (
            <p className="mt-2 text-sm text-gray-500">
              Fondo registrado:{" "}
              <span className="font-semibold text-gray-700">
                {formatCurrency(numericAmount)}
              </span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!validAmount || loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LockOpen size={17} />

          {loading ? "Abriendo..." : "Abrir caja"}
        </button>
      </form>
    </div>
  );
}
