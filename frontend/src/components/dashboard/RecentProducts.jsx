import { Link } from "react-router-dom";

import useCurrency from "../../hooks/useCurrency";
import { formatDate } from "../../utils/formatDate";

export default function RecentProducts({ products }) {
const recentProducts = [...products].slice(0, 5);
const { formatCurrency } = useCurrency();

  return (
    <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="font-semibold text-gray-800">Productos recientes</h2>

          <p className="mt-1 text-sm text-gray-500">
            Últimos productos registrados.
          </p>
        </div>

        <Link
          to="/products"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Ver inventario
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-500">
            <tr>
              <th className="px-5 py-3">Producto</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Precio</th>
              <th className="px-5 py-3">Vencimiento</th>
            </tr>
          </thead>

          <tbody>
            {recentProducts.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-5 py-10 text-center text-gray-500"
                >
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              recentProducts.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="px-5 py-4 font-medium text-gray-800">
                    {product.name}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{product.stock}</td>
                  <td className="px-5 py-4 text-gray-500">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {formatDate(product.expirationDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
