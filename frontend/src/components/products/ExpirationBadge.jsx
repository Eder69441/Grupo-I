import { getDaysUntilExpiration } from "../../utils/expiration";
import { EXPIRATION_WARNING_DAYS } from "../../constants/inventory";

export default function ExpirationBadge({ expirationDate }) {
  const daysRemaining = getDaysUntilExpiration(expirationDate);

  if (daysRemaining < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Vencido
      </span>
    );
  }

  if (daysRemaining <= EXPIRATION_WARNING_DAYS) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Próximo a vencer
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Vigente
    </span>
  );
}
