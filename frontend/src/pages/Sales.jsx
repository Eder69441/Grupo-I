import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ReceiptText } from "lucide-react";

import SaleHistoryTable from "../components/sales/SaleHistoryTable";
import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";
import SaleDetail from "../components/sales/SaleDetail";
import Modal from "../components/common/Modal";

import { getSales } from "../services/saleService";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);

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

  return (
    <div>
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

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

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
      ) : (
        <SaleHistoryTable sales={sales} onViewSale={setSelectedSale} />
      )}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Detalle de venta"
      >
        <SaleDetail sale={selectedSale} />
      </Modal>
    </div>
  );
}
