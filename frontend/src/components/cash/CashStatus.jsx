import {
  Banknote,
  CalendarClock,
  CircleUserRound,
  LockKeyhole,
} from "lucide-react";

import useCurrency from "../../hooks/useCurrency";
import { formatDateTime } from "../../utils/formatDateTime";

export default function CashStatus({ cashSession }) {
  if (!cashSession) {
    return null;
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <LockKeyhole size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Caja abierta</h2>

            <p className="text-sm text-gray-500">{cashSession.sessionNumber}</p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          ABIERTA
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Banknote size={16} />

            <span className="text-xs font-medium uppercase">Fondo inicial</span>
          </div>

          <p className="font-bold text-gray-900">
            {formatCurrency(cashSession.openingAmount)}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <CircleUserRound size={16} />

            <span className="text-xs font-medium uppercase">Abierta por</span>
          </div>

          <p className="font-semibold text-gray-900">
            {cashSession.openedBy?.name ||
              cashSession.openedBy?.username ||
              "Usuario"}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <CalendarClock size={16} />

            <span className="text-xs font-medium uppercase">Apertura</span>
          </div>

          <p className="font-semibold text-gray-900">
            {formatDateTime(cashSession.openedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
