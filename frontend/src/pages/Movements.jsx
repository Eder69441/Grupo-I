import { useEffect, useState } from "react";

import useAuth from "../context/useAuth";

import {
  getMovements,
  getMovementsByProduct,
  createMovement,
} from "../services/movementService";

import { getProducts } from "../services/productService";

import MovementForm from "../components/movements/MovementForm";
import MovementTable from "../components/movements/MovementTable";

import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";

export default function Movements() {
  const { user } = useAuth();

  const canManage = user?.role === "admin";

  const [movements, setMovements] = useState([]);

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [currentStock, setCurrentStock] = useState(null);
  const [filtering, setFiltering] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [movementsResponse, productsResponse] = await Promise.all([
        getMovements(),
        getProducts(),
      ]);

      setMovements(movementsResponse.data);

      setProducts(productsResponse.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No se pudieron cargar los movimientos.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [movementsResponse, productsResponse] = await Promise.all([
          getMovements(),
          getProducts(),
        ]);

        setMovements(movementsResponse.data);
        setProducts(productsResponse.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "No se pudieron cargar los movimientos.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleCreateMovement = async (movement) => {
    try {
      setSaving(true);
      setError("");

      await createMovement(movement);

      if (selectedProduct) {
        const response = await getMovementsByProduct(selectedProduct);

        setMovements(response.data.movements);
        setCurrentStock(response.data.product.stock);

        const productsResponse = await getProducts();

        setProducts(productsResponse.data);
      } else {
        await loadData();
      }

      setSuccess("Movimiento registrado correctamente.");

      return true;
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo registrar el movimiento.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleProductFilter = async (productId) => {
    try {
      setSelectedProduct(productId);
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
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No se pudo cargar el Kardex del producto.",
      );
    } finally {
      setFiltering(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Movimientos de inventario
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Consulta las entradas y salidas de medicamentos.
        </p>
      </div>

      {success && (
        <div className="mt-6">
          <SuccessMessage message={success} onClose={() => setSuccess("")} />
        </div>
      )}

      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {!loading && canManage && (
        <div className="mt-6">
          <MovementForm
            products={products}
            onSubmit={handleCreateMovement}
            loading={saving}
          />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
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
              onChange={(event) => handleProductFilter(event.target.value)}
              disabled={filtering}
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
            <div>
              <p className="text-sm text-gray-500">Stock actual</p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {currentStock}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner />
          </div>
        )}

        {!loading && movements.length === 0 && (
          <EmptyState
            title="No hay movimientos"
            message="Todavía no se han registrado movimientos de inventario."
          />
        )}

        {filtering && (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        )}

        {!loading && !filtering && movements.length > 0 && (
          <MovementTable movements={movements} />
        )}
      </div>
    </div>
  );
}
