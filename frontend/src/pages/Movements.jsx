import { useEffect, useState } from "react";
import { RefreshCw, ClipboardList } from "lucide-react";

import {
  getMovements,
  getMovementsByProduct,
} from "../services/movementService";

import { getProducts } from "../services/productService";

import MovementTable from "../components/movements/MovementTable";

import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import Button from "../components/common/Button";

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [currentStock, setCurrentStock] = useState(null);

  const [movementType, setMovementType] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError("");

        const [movementsResponse, productsResponse] = await Promise.all([
          getMovements(),
          getProducts(),
        ]);

        if (cancelled) return;

        setMovements(movementsResponse.data);
        setProducts(productsResponse.data);
      } catch (err) {
        if (cancelled) return;

        console.error(err);
        setError(
          err.response?.data?.message ||
            "No se pudieron cargar los movimientos.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProductFilter = async (productId) => {
    try {
      setSelectedProduct(productId);
      setSelectedBatch("");
      setFiltering(true);
      setError("");

      if (!productId) {
        const response = await getMovements();

        setMovements(response.data);
        setCurrentStock(null);
        return;
      }

      const response = await getMovementsByProduct(productId);

      setMovements(response.data.movements);
      setCurrentStock(response.data.product.stock);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "No se pudo cargar el Kardex del producto.",
      );
    } finally {
      setFiltering(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setFiltering(true);
      setError("");

      const productsResponse = await getProducts();
      setProducts(productsResponse.data);

      if (selectedProduct) {
        const response = await getMovementsByProduct(selectedProduct);

        setMovements(response.data.movements);
        setCurrentStock(response.data.product.stock);
      } else {
        const response = await getMovements();

        setMovements(response.data);
        setCurrentStock(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "No se pudo actualizar el Kardex.",
      );
    } finally {
      setFiltering(false);
    }
  };

  const availableBatches = [
    ...new Map(
      movements
        .filter((movement) => movement.batch?._id)
        .map((movement) => [movement.batch._id, movement.batch]),
    ).values(),
  ];

  const filteredMovements = movements.filter((movement) => {
    // Filtrar por tipo
    if (movementType && movement.type !== movementType) {
      return false;
    }

    // Filtrar por lote
    if (selectedBatch && movement.batch?._id !== selectedBatch) {
      return false;
    }

    // Filtrar por fechas
    const movementDate = new Date(movement.createdAt);

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`);

      if (movementDate < from) return false;
    }

    if (dateTo) {
      const to = new Date(`${dateTo}T00:00:00`);
      to.setDate(to.getDate() + 1);

      if (movementDate >= to) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardList size={26} className="text-emerald-600" />

            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Kardex de inventario
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Consulta el historial de entradas, salidas, ventas, anulaciones y
            reposiciones de medicamentos.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleRefresh}
          disabled={loading || filtering}
        >
          <RefreshCw size={17} className={filtering ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>

      {/* Errores */}
      {error && <ErrorMessage message={error} />}

      {/* Filtro */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <label
              htmlFor="productFilter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Consultar Kardex
            </label>

            <select
              id="productFilter"
              value={selectedProduct}
              onChange={(e) => handleProductFilter(e.target.value)}
              disabled={loading || filtering}
              className="
                w-full rounded-lg border border-gray-300
                bg-white px-3 py-2.5 text-sm text-gray-900
                outline-none transition
                focus:border-emerald-500
                focus:ring-2 focus:ring-emerald-100
                disabled:cursor-not-allowed
                disabled:bg-gray-50
              "
            >
              <option value="">Todos los productos</option>

              {products.map((product) => (
                <option
                  key={product._id || product.id}
                  value={product._id || product.id}
                >
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && currentStock !== null && (
            <div className="rounded-lg bg-emerald-50 px-5 py-3">
              <p className="text-sm text-emerald-700">Stock actual</p>

              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {currentStock}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filtros avanzados */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Filtros avanzados
          </h2>

          <button
            type="button"
            onClick={() => {
              setMovementType("");
              setSelectedBatch("");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tipo de movimiento
            </label>

            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lote
            </label>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Todos los lotes</option>

              {availableBatches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Desde
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Hasta
            </label>

            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Mostrando {filteredMovements.length} de {movements.length}{" "}
          movimientos.
        </p>
      </div>

      {/* Resultados */}
      <div>
        {(loading || filtering) && (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner />
          </div>
        )}

        {!loading && !filtering && !error && filteredMovements.length === 0 && (
          <EmptyState
            title="No hay movimientos"
            message="No se encontraron movimientos con los filtros seleccionados."
          />
        )}

        {!loading && !filtering && !error && filteredMovements.length > 0 && (
          <MovementTable movements={filteredMovements} />
        )}
      </div>
    </div>
  );
}
