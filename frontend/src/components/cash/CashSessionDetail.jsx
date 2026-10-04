import { X } from "lucide-react";

import CashClosingSummary from "./CashClosingSummary";
import CashStatus from "./CashStatus";

export default function CashSessionDetail({ session, onClose }) {
  if (!session) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-start justify-center
        overflow-y-auto
        bg-black/50
        p-4 sm:p-8
      "
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="
            no-print
            absolute right-3 top-3 z-10
            flex h-9 w-9 items-center justify-center
            rounded-full
            bg-white text-gray-500 shadow
            transition
            hover:bg-gray-100 hover:text-gray-900
          "
          aria-label="Cerrar detalle"
        >
          <X size={18} />
        </button>

        {session.status === "closed" ? (
          <CashClosingSummary session={session} />
        ) : (
          <CashStatus cashSession={session} />
        )}
      </div>
    </div>
  );
}
