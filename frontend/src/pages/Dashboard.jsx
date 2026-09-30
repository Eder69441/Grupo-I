import { useEffect, useState } from "react";

import { Package, TriangleAlert, CircleX, CalendarClock } from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import RecentProducts from "../components/dashboard/RecentProducts";
import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";

import { getProducts } from "../services/productService";
import { getDaysUntilExpiration } from "../utils/expiration";

import {
  LOW_STOCK_LIMIT,
  EXPIRATION_WARNING_DAYS,
} from "../constants/inventory";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setError("");

        const response = await getProducts();

        setProducts(response.data);
      } catch (error) {
        console.error(error);

        setError("No se pudo cargar la información del dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Total de productos registrados
  const totalProducts = products.length;

  // Productos con existencia baja, pero no agotados
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_LIMIT,
  ).length;

  // Productos sin existencia
  const outOfStockProducts = products.filter(
    (product) => product.stock === 0,
  ).length;

  // Productos que vencen dentro del período de alerta
  const expiringProducts = products.filter((product) => {
    const daysRemaining = getDaysUntilExpiration(product.expirationDate);

    return daysRemaining >= 0 && daysRemaining <= EXPIRATION_WARNING_DAYS;
  }).length;

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Resumen general del inventario de la farmacia.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Productos"
          value={totalProducts}
          icon={Package}
          variant="emerald"
        />

        <StatCard
          title="Stock bajo"
          value={lowStockProducts}
          icon={TriangleAlert}
          variant="amber"
        />

        <StatCard
          title="Agotados"
          value={outOfStockProducts}
          icon={CircleX}
          variant="red"
        />

        <StatCard
          title="Próximos a vencer"
          value={expiringProducts}
          icon={CalendarClock}
          variant="blue"
        />
      </div>

      {/* Productos recientes */}
      <div className="mt-8">
        <RecentProducts products={products} />
      </div>
    </div>
  );
}
