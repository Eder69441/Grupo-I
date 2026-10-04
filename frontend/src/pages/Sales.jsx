import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Plus, ReceiptText, Search } from "lucide-react";

import SaleHistoryTable from "../components/sales/SaleHistoryTable";
import SaleDetail from "../components/sales/SaleDetail";

import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";

import { cancelSale, getSales } from "../services/saleService";

export default function Sales() {
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getSales();

        setSales(response.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "No se pudo cargar el historial de ventas.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  // Cantidades para los filtros
  const completedCount = sales.filter(
    (sale) => sale.status !== "cancelled",
  ).length;

  const cancelledCount = sales.filter(
    (sale) => sale.status === "cancelled",
  ).length;

  // Aplicar búsqueda y filtro
  const filteredSales = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sales.filter((sale) => {
      // Filtro por estado
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && sale.status !== "cancelled") ||
        (statusFilter === "cancelled" && sale.status === "cancelled");

      // Si no hay búsqueda escrita, pasa el filtro
      if (!normalizedSearch) {
        return matchesStatus;
      }

      // Número de venta
      const saleNumber = sale.saleNumber?.toLowerCase() || "";

      // Usuario
      const userName = sale.user?.name?.toLowerCase() || "";

      const username = sale.user?.username?.toLowerCase() || "";

      // Productos
      const productMatch = sale.items.some((item) =>
        item.productName?.toLowerCase().includes(normalizedSearch),
      );

      const matchesSearch =
        saleNumber.includes(normalizedSearch) ||
        userName.includes(normalizedSearch) ||
        username.includes(normalizedSearch) ||
        productMatch;

      return matchesStatus && matchesSearch;
    });
  }, [sales, search, statusFilter]);

  const handleCancelSale = async (saleId) => {
    if (!saleId || cancelling) {
      return false;
    }

    try {
      setCancelling(true);
      setError("");
      setSuccess("");

      const response = await cancelSale(saleId);

      const cancelledSale = response.data;

      // Actualizar historial
      setSales((currentSales) =>
        currentSales.map((sale) =>
          sale._id === cancelledSale._id ? cancelledSale : sale,
        ),
      );

      // Actualizar venta abierta
      setSelectedSale(cancelledSale);

      setSuccess(
        `Venta ${cancelledSale.saleNumber} anulada correctamente. El inventario fue restaurado.`,
      );

      return true;
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "No se pudo anular la venta.");

      return false;
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ReceiptText size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Historial de ventas
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Consulta las ventas registradas en el sistema.
            </p>
          </div>
        </div>

        <Link
          to="/sales/new"
          className="
            inline-flex items-center justify-center gap-2
            rounded-lg bg-emerald-600
            px-4 py-2.5 text-sm font-semibold text-white
            transition hover:bg-emerald-700
          "
        >
          <Plus size={18} />
          Nueva venta
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Éxito */}
      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="text-sm font-medium">{success}</p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
          >
            ×
          </button>
        </div>
      )}

      {!loading && sales.length > 0 && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Buscador */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar venta, producto o usuario..."
                className="
                  w-full rounded-lg border border-gray-300
                  bg-white py-2.5 pl-10 pr-4
                  text-sm text-gray-700 outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-emerald-500
                  focus:ring-2 focus:ring-emerald-100
                "
              />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`
                  rounded-lg px-3.5 py-2
                  text-sm font-medium transition
                  ${
                    statusFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                Todas
                <span className="ml-2 opacity-70">{sales.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`
                  rounded-lg px-3.5 py-2
                  text-sm font-medium transition
                  ${
                    statusFilter === "completed"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }
                `}
              >
                Completadas
                <span className="ml-2 opacity-70">{completedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("cancelled")}
                className={`
                  rounded-lg px-3.5 py-2
                  text-sm font-medium transition
                  ${
                    statusFilter === "cancelled"
                      ? "bg-red-600 text-white"
                      : "bg-red-50 text-red-700 hover:bg-red-100"
                  }
                `}
              >
                Anuladas
                <span className="ml-2 opacity-70">{cancelledCount}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : sales.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <ReceiptText size={38} className="mx-auto mb-3 text-gray-300" />

          <p className="font-medium text-gray-700">No hay ventas registradas</p>

          <p className="mt-1 text-sm text-gray-500">
            Las ventas realizadas aparecerán aquí.
          </p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <Search size={36} className="mx-auto mb-3 text-gray-300" />

          <p className="font-medium text-gray-700">No se encontraron ventas</p>

          <p className="mt-1 text-sm text-gray-500">
            Intenta cambiar la búsqueda o el filtro seleccionado.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <SaleHistoryTable
          sales={filteredSales}
          onViewSale={(sale) => {
            setSelectedSale(sale);
            setError("");
          }}
        />
      )}

      {/* Detalle */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => {
          if (!cancelling) {
            setSelectedSale(null);
          }
        }}
        title="Detalle de venta"
        size="lg"
      >
        <SaleDetail
          sale={selectedSale}
          onCancelSale={handleCancelSale}
          cancelling={cancelling}
        />
      </Modal>
    </div>
  );
}
