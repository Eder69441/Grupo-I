import { CalendarClock, TriangleAlert } from "lucide-react";

import ExpirationBadge from "../products/ExpirationBadge";

import { formatDate } from "../../utils/formatDate";
import { getDaysUntilExpiration } from "../../utils/expiration";

import { EXPIRATION_WARNING_DAYS } from "../../constants/inventory";

export default function ExpirationAlerts({ products }) {
  const alertProducts = products
    .filter((product) => {
      const daysRemaining = getDaysUntilExpiration(product.expirationDate);

      return daysRemaining !== null && daysRemaining <= EXPIRATION_WARNING_DAYS;
    })
    .sort((a, b) => {
      return (
        getDaysUntilExpiration(a.expirationDate) -
        getDaysUntilExpiration(b.expirationDate)
      );
    });

  const getExpirationMessage = (expirationDate) => {
    const days = getDaysUntilExpiration(expirationDate);

    if (days < 0) {
      const expiredDays = Math.abs(days);

      return expiredDays === 1
        ? "Venció hace 1 día"
        : `Venció hace ${expiredDays} días`;
    }

    if (days === 0) {
      return "Vence hoy";
    }

    if (days === 1) {
      return "Vence mañana";
    }

    return `Vence en ${days} días`;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-100 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <TriangleAlert size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            Alertas de vencimiento
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Productos vencidos o próximos a vencer.
          </p>
        </div>
      </div>

      {alertProducts.length === 0 ? (
        <div className="p-8 text-center">
          <CalendarClock size={32} className="mx-auto text-gray-300" />

          <p className="mt-3 text-sm font-medium text-gray-700">
            No hay alertas de vencimiento
          </p>

          <p className="mt-1 text-sm text-gray-500">
            No existen productos vencidos ni próximos a vencer.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-500">
              <tr>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Categoría</th>
                <th className="px-5 py-3">Vencimiento</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Alerta</th>
              </tr>
            </thead>

            <tbody>
              {alertProducts.map((product) => (
                <tr
                  key={product._id || product.id}
                  className="border-t border-gray-100"
                >
                  <td className="px-5 py-4 font-medium text-gray-800">
                    {product.name}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {product.category}
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {formatDate(product.expirationDate)}
                  </td>

                  <td className="px-5 py-4">
                    <ExpirationBadge expirationDate={product.expirationDate} />
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-gray-600">
                    {getExpirationMessage(product.expirationDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
