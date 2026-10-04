import { useEffect, useState } from "react";

import {
  Banknote,
  CalendarClock,
  CalendarX,
  CircleX,
  CreditCard,
  DollarSign,
  Package,
  PackageCheck,
  RefreshCcw,
  ShoppingCart,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import RecentProducts from "../components/dashboard/RecentProducts";
import ExpirationAlerts from "../components/dashboard/ExpirationAlerts";

import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";

import { getProducts } from "../services/productService";
import { getSales } from "../services/saleService";

import { getDaysUntilExpiration } from "../utils/expiration";
import { formatCurrency } from "../utils/formatCurrency";

import {
  LOW_STOCK_LIMIT,
  EXPIRATION_WARNING_DAYS,
} from "../constants/inventory";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

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

  // INVENTARIO
  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_LIMIT,
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.stock === 0,
  ).length;

  const expiredProducts = products.filter((product) => {
    const daysRemaining = getDaysUntilExpiration(product.expirationDate);

    return daysRemaining < 0;
  }).length;

  const expiringProducts = products.filter((product) => {
    const daysRemaining = getDaysUntilExpiration(product.expirationDate);

    return daysRemaining >= 0 && daysRemaining <= EXPIRATION_WARNING_DAYS;
  }).length;

  // VENTAS DE HOY
  const today = new Date();

  const isSaleFromToday = (sale) => {
    const saleDate = new Date(sale.createdAt);

    return (
      saleDate.getFullYear() === today.getFullYear() &&
      saleDate.getMonth() === today.getMonth() &&
      saleDate.getDate() === today.getDate()
    );
  };

  // Ventas del día.
  const allTodaySales = sales.filter(isSaleFromToday);

  // Ventas válidas.
  const todaySales = allTodaySales.filter(
    (sale) => sale.status !== "cancelled",
  );

  // Ventas anuladas.
  const cancelledSalesToday = allTodaySales.filter(
    (sale) => sale.status === "cancelled",
  );

  // MÉTRICAS GENERALES
  const totalSalesToday = todaySales.length;

  const revenueToday = todaySales.reduce(
    (total, sale) => total + sale.total,
    0,
  );

  const unitsSoldToday = todaySales.reduce(
    (total, sale) =>
      total +
      sale.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
    0,
  );

  // MÉTODOS DE PAGO
  const cashSalesToday = todaySales.filter(
    (sale) => sale.paymentMethod === "cash",
  );

  const cardSalesToday = todaySales.filter(
    (sale) => sale.paymentMethod === "card",
  );

  const transferSalesToday = todaySales.filter(
    (sale) => sale.paymentMethod === "transfer",
  );

  // Total vendido en efectivo.
  const cashRevenue = cashSalesToday.reduce(
    (total, sale) => total + sale.total,
    0,
  );

  // Total vendido con tarjeta.
  const cardRevenue = cardSalesToday.reduce(
    (total, sale) => total + sale.total,
    0,
  );

  // Total vendido por transferencia.
  const transferRevenue = transferSalesToday.reduce(
    (total, sale) => total + sale.total,
    0,
  );

  // Dinero entregado por clientes
  // antes de devolver cambio.
  const cashReceived = cashSalesToday.reduce(
    (total, sale) => total + (sale.amountReceived || 0),
    0,
  );

  // Cambio entregado.
  const changeGiven = cashSalesToday.reduce(
    (total, sale) => total + (sale.change || 0),
    0,
  );

  // ANULACIONES
  const cancelledCount = cancelledSalesToday.length;

  const cancelledAmount = cancelledSalesToday.reduce(
    (total, sale) => total + sale.total,
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

      {/* ACTIVIDAD COMERCIAL */}
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

      {/* RESUMEN DE COBROS */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Resumen de cobros de hoy
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Distribución de los ingresos según el método de pago.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {/* Métodos de pago */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <WalletCards size={20} className="text-emerald-600" />

              <h3 className="font-semibold text-gray-900">Métodos de pago</h3>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Efectivo */}
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Banknote size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Efectivo
                    </p>

                    <p className="text-xs text-gray-500">
                      {cashSalesToday.length} venta
                      {cashSalesToday.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <p className="font-bold text-gray-900">
                  {formatCurrency(cashRevenue)}
                </p>
              </div>

              {/* Tarjeta */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <CreditCard size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Tarjeta
                    </p>

                    <p className="text-xs text-gray-500">
                      {cardSalesToday.length} venta
                      {cardSalesToday.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <p className="font-bold text-gray-900">
                  {formatCurrency(cardRevenue)}
                </p>
              </div>

              {/* Transferencia */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <WalletCards size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Transferencia
                    </p>

                    <p className="text-xs text-gray-500">
                      {transferSalesToday.length} venta
                      {transferSalesToday.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <p className="font-bold text-gray-900">
                  {formatCurrency(transferRevenue)}
                </p>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4">
                <p className="font-semibold text-gray-900">Total vendido</p>

                <p className="text-lg font-bold text-emerald-700">
                  {formatCurrency(revenueToday)}
                </p>
              </div>
            </div>
          </div>

          {/* Control de efectivo */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Banknote size={20} className="text-emerald-600" />

              <h3 className="font-semibold text-gray-900">
                Control de efectivo
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Ventas en efectivo
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatCurrency(cashRevenue)}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Efectivo recibido
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {formatCurrency(cashReceived)}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Devuelta entregada
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {formatCurrency(changeGiven)}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-xs font-medium uppercase text-emerald-700">
                  Efectivo neto
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-700">
                  {formatCurrency(cashReceived - changeGiven)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Anulaciones */}
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <RefreshCcw size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Ventas anuladas hoy
                </p>

                <p className="text-xs text-gray-500">
                  No se incluyen en los ingresos del día.
                </p>
              </div>
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-xs uppercase text-gray-500">Cantidad</p>

                <p className="mt-1 font-bold text-red-700">{cancelledCount}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-500">Monto anulado</p>

                <p className="mt-1 font-bold text-red-700">
                  {formatCurrency(cancelledAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INVENTARIO */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Estado del inventario
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Existencias y alertas que requieren atención.
        </p>
      </div>

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
