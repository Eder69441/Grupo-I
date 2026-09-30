import { LOW_STOCK_LIMIT } from "../../constants/inventory";

export default function StockBadge({ stock }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Agotado
      </span>
    );
  }

  if (stock <= LOW_STOCK_LIMIT) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Stock bajo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Disponible
    </span>
  );
}
