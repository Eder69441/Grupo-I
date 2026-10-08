import { useEffect, useMemo, useState } from "react";

import { RotateCcw, Search, WalletCards } from "lucide-react";

import Modal from "../components/common/Modal";
import ReturnHistoryTable from "../components/returns/ReturnHistoryTable";
import ReturnDetail from "../components/returns/ReturnDetail";

import { getReturns } from "../services/returnService";
import useCurrency from "../hooks/useCurrency";

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [search, setSearch] = useState("");
  const [refundMethod, setRefundMethod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const loadReturns = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getReturns();

        setReturns(response.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "No se pudieron cargar las devoluciones.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadReturns();
  }, []);

  const filteredReturns = useMemo(() => {
    const term = search.trim().toLowerCase();

    return returns.filter((returnRecord) => {
      const matchesSearch =
        !term ||
        returnRecord.returnNumber?.toLowerCase().includes(term) ||
        returnRecord.sale?.saleNumber?.toLowerCase().includes(term) ||
        returnRecord.user?.name?.toLowerCase().includes(term) ||
        returnRecord.user?.username?.toLowerCase().includes(term) ||
        returnRecord.items.some((item) =>
          item.productName?.toLowerCase().includes(term),
        );

      const matchesMethod =
        refundMethod === "all" || returnRecord.refundMethod === refundMethod;

      return matchesSearch && matchesMethod;
    });
  }, [returns, search, refundMethod]);

  const totalRefunded = filteredReturns.reduce(
    (total, returnRecord) => total + returnRecord.total,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Devoluciones</h1>

        <p className="mt-1 text-sm text-gray-500">
          Consulta y audita las devoluciones y reembolsos registrados.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <RotateCcw size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Devoluciones</p>

              <p className="text-xl font-bold text-gray-900">
                {filteredReturns.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <WalletCards size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Total reembolsado</p>

              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalRefunded)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar devolución, venta, producto o usuario..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={refundMethod}
            onChange={(event) => setRefundMethod(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">Todos los métodos</option>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Cargando devoluciones...
        </div>
      ) : (
        <ReturnHistoryTable
          returns={filteredReturns}
          onView={setSelectedReturn}
        />
      )}

      <Modal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title="Detalle de devolución"
        size="lg"
      >
        <ReturnDetail returnRecord={selectedReturn} />
      </Modal>
    </div>
  );
}
