import { Link } from "react-router-dom";
import { Pencil, CircleOff, MapPin } from "lucide-react";

import StockBadge from "./StockBadge";
import ExpirationBadge from "./ExpirationBadge";

import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function ProductTable({ products, onDelete, canManage }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          {/* Encabezado */}
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-4">Producto</th>

              <th className="px-5 py-4">Categoría</th>

              <th className="px-5 py-4">Precio</th>

              <th className="px-5 py-4">Stock</th>

              <th className="px-5 py-4">Ubicación</th>

              <th className="px-5 py-4">Vencimiento</th>

              {canManage && <th className="px-5 py-4 text-right">Acciones</th>}
            </tr>
          </thead>

          {/* Productos */}
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="transition hover:bg-gray-50/70">
                {/* Producto */}
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{product.name}</p>
                </td>

                {/* Categoría */}
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-600">
                    {product.category}
                  </span>
                </td>

                {/* Precio */}
                <td className="whitespace-nowrap px-5 py-4">
                  <span className="text-sm font-medium text-gray-800">
                    {formatCurrency(product.price)}
                  </span>
                </td>

                {/* Stock */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="min-w-6 text-sm font-medium text-gray-700">
                      {product.stock}
                    </span>

                    <StockBadge stock={product.stock} />
                  </div>
                </td>

                {/* Ubicación */}
                <td className="whitespace-nowrap px-5 py-4">
                  {product.location ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <MapPin size={16} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {`${product.location.section}-${product.location.shelf}-${product.location.level}`}
                        </p>

                        <p className="text-xs text-gray-500">
                          {`Tramo ${product.location.section} · Estante ${product.location.shelf} · Nivel ${product.location.level}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Sin ubicación</span>
                  )}
                </td>

                {/* Vencimiento */}
                <td className="whitespace-nowrap px-5 py-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="text-sm text-gray-600">
                      {formatDate(product.expirationDate)}
                    </span>

                    <ExpirationBadge expirationDate={product.expirationDate} />
                  </div>
                </td>

                {/* Acciones */}
                {canManage && (
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/products/edit/${product.id}`}
                        className="
                          inline-flex h-9 w-9
                          items-center justify-center
                          rounded-lg text-gray-500
                          transition
                          hover:bg-emerald-50
                          hover:text-emerald-600
                        "
                        title="Editar producto"
                        aria-label={`Editar ${product.name}`}
                      >
                        <Pencil size={17} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="
                          inline-flex h-9 w-9
                          items-center justify-center
                          rounded-lg text-gray-500
                          transition
                          hover:bg-red-50
                          hover:text-red-600
                        "
                        title="Desactivar producto"
                        aria-label={`Eliminar ${product.name}`}
                      >
                        <CircleOff size={17} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
