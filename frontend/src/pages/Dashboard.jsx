import { useEffect, useState } from "react";

import {
  Package,
  TriangleAlert,
  CircleX,
  CalendarClock,
  CalendarX,
  ShoppingCart,
  DollarSign,
  PackageCheck,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import RecentProducts from "../components/dashboard/RecentProducts";
import ExpirationAlerts from "../components/dashboard/ExpirationAlerts";

import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";

import { getProducts } from "../services/productService";
import { getDaysUntilExpiration } from "../utils/expiration";
import { getSales } from "../services/saleService";
import { formatCurrency } from "../utils/formatCurrency";

import {
  LOW_STOCK_LIMIT,
  EXPIRATION_WARNING_DAYS,
} from "../constants/inventory";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [productsResponse, salesResponse] = await Promise.all([
          getProducts(),
          getSales(),
        ]);

        setProducts(productsResponse.data);
        setSales(salesResponse.data);
      } catch (error) {
        console.error(error);

        setError("No se pudo cargar la información del dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
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

  // Productos vencidos
  const expiredProducts = products.filter((product) => {
    const daysRemaining = getDaysUntilExpiration(product.expirationDate);

    return daysRemaining < 0;
  }).length;

  // Productos próximos a vencer
  const expiringProducts = products.filter((product) => {
    const daysRemaining = getDaysUntilExpiration(product.expirationDate);

    return daysRemaining >= 0 && daysRemaining <= EXPIRATION_WARNING_DAYS;
  }).length;

  // Ventas realizadas hoy
  const today = new Date();

  const todaySales = sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt);

    return (
      saleDate.getFullYear() === today.getFullYear() &&
      saleDate.getMonth() === today.getMonth() &&
      saleDate.getDate() === today.getDate() &&
      sale.status !== "cancelled"
    );
  });

  // Cantidad de ventas realizadas hoy
  const totalSalesToday = todaySales.length;

  // Ingresos generados hoy
  const revenueToday = todaySales.reduce(
    (total, sale) => total + sale.total,
    0,
  );

  // Unidades vendidas hoy
  const unitsSoldToday = todaySales.reduce(
    (total, sale) =>
      total +
      sale.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
    0,
  );

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
          Resumen de ventas, inventario y alertas.
        </p>
      </div>

      {/* Actividad comercial */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Actividad de hoy
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Resumen de las operaciones comerciales del día.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Ventas de hoy"
            value={totalSalesToday}
            icon={ShoppingCart}
            variant="blue"
            to="/sales"
          />

          <StatCard
            title="Ingresos de hoy"
            value={formatCurrency(revenueToday)}
            icon={DollarSign}
            variant="emerald"
            to="/sales"
          />

          <StatCard
            title="Unidades vendidas"
            value={unitsSoldToday}
            icon={PackageCheck}
            variant="blue"
            to="/sales"
          />
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Estado del inventario
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Existencias y alertas que requieren atención.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          variant="amber"
          to="/products?expiration=expiring"
        />

        <StatCard
          title="Vencidos"
          value={expiredProducts}
          icon={CalendarX}
          variant="red"
          to="/products?expiration=expired"
        />
      </div>
      {/* Alertas de vencimiento */}
      <div className="mt-8">
        <ExpirationAlerts products={products} />
      </div>

      {/* Productos recientes */}
      <div className="mt-8">
        <RecentProducts products={products} />
      </div>
    </div>
  );
}
