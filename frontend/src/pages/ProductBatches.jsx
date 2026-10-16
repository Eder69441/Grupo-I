import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Boxes, Plus, Package, CalendarDays } from "lucide-react";

import { getProductById } from "../services/productService";
import { getProductBatches, createBatch, restockBatch } from "../services/batchService";

import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";

import useCurrency from "../hooks/useCurrency";

const initialForm = {
  batchNumber: "",
  expirationDate: "",
  stock: "",
  unitCost: "",
};

export default function ProductBatches() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const [product, setProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedBatch, setSelectedBatch] = useState(null);
const [restockQuantity, setRestockQuantity] = useState("");
const [restockReason, setRestockReason] = useState("");
const [restocking, setRestocking] = useState(false);

  const loadData = async () => {
    const [productResponse, batchesResponse] = await Promise.all([
      getProductById(id),
      getProductBatches(id),
    ]);

    setProduct(productResponse.data);
    setBatches(batchesResponse.data);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [productResponse, batchesResponse] = await Promise.all([
          getProductById(id),
          getProductBatches(id),
        ]);

        if (!cancelled) {
          setProduct(productResponse.data);
          setBatches(batchesResponse.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "No se pudieron cargar los lotes.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const quantity = Number(form.stock);
    const unitCost = Number(form.unitCost || 0);

    if (!form.batchNumber.trim()) {
      setError("Introduce el número de lote.");
      return;
    }

    if (!form.expirationDate) {
      setError("Selecciona la fecha de vencimiento.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiration = new Date(`${form.expirationDate}T00:00:00`);

    if (expiration <= today) {
      setError("El lote debe tener una fecha futura.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("La cantidad debe ser un entero mayor que cero.");
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setError("El costo unitario no es válido.");
      return;
    }

    try {
      setSaving(true);

      await createBatch({
        productId: id,
        batchNumber: form.batchNumber.trim().toUpperCase(),
        expirationDate: form.expirationDate,
        stock: quantity,
        unitCost,
      });

      setForm(initialForm);
      setShowForm(false);

      await loadData();

      setSuccess("Lote registrado correctamente.");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "No se pudo registrar el lote o actualizar la información.",
      );
    } finally {
      setSaving(false);
    }
  };

  const totalBatchStock = batches.reduce((sum, batch) => sum + batch.stock, 0);

  const stockMatches = product && totalBatchStock === product.stock;

  const formatExpiration = (value) => {
    if (!value) return "Sin fecha";

    return new Date(value).toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  
const handleRestock = async (e) => {
  e.preventDefault();

  if (!selectedBatch || restocking) return;

  const quantity = Number(restockQuantity);

  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    setError("Introduce una cantidad válida.");
    return;
  }

  if (!restockReason.trim()) {
    setError("El motivo de la reposición es obligatorio.");
    return;
  }

  try {
    setRestocking(true);
    setError("");
    setSuccess("");

    await restockBatch(selectedBatch._id, {
      quantity,
      reason: restockReason.trim(),
    });

    setSelectedBatch(null);
    setRestockQuantity("");
    setRestockReason("");

    await loadData();

    setSuccess("Reposición registrada correctamente.");
  } catch (error) {
    console.error(error);

    setError(
      error.response?.data?.message ||
        "No se pudo registrar la reposición.",
    );
  } finally {
    setRestocking(false);
  }
};


  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error || "Producto no encontrado."} />
        <Button variant="secondary" onClick={() => navigate("/products")}>
          Volver al inventario
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mb-3 flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600"
          >
            <ArrowLeft size={16} />
            Volver al inventario
          </button>

          <h1 className="text-2xl font-bold text-gray-900">Gestión de lotes</h1>

          <p className="mt-1 text-sm text-gray-500">{product.name}</p>
        </div>

        <Button
          onClick={() => {
            setShowForm((prev) => !prev);
            setError("");
          }}
        >
          <Plus size={18} />
          {showForm ? "Cerrar formulario" : "Registrar lote"}
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {success && (
        <SuccessMessage message={success} onClose={() => setSuccess("")} />
      )}

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <Package size={18} />
            <span className="text-sm">Stock general</span>
          </div>

          <p className="mt-3 text-2xl font-bold text-gray-900">
            {product.stock}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <Boxes size={18} />
            <span className="text-sm">Stock en lotes</span>
          </div>

          <p className="mt-3 text-2xl font-bold text-gray-900">
            {totalBatchStock}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <CalendarDays size={18} />
            <span className="text-sm">Lotes activos</span>
          </div>

          <p className="mt-3 text-2xl font-bold text-gray-900">
            {batches.length}
          </p>
        </div>
      </div>

      {!stockMatches && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Atención: el stock general no coincide con la suma de los lotes
          activos. Revisa el Kardex antes de registrar nuevas operaciones.
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Registrar nuevo lote
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Número de lote
              </label>
              <input
                name="batchNumber"
                value={form.batchNumber}
                onChange={handleChange}
                placeholder="Ej. ADV-001"
                required
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Fecha de vencimiento
              </label>
              <input
                type="date"
                name="expirationDate"
                value={form.expirationDate}
                onChange={handleChange}
                required
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cantidad recibida
              </label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                min="1"
                step="1"
                required
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Costo unitario
              </label>
              <input
                type="number"
                name="unitCost"
                value={form.unitCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Registrando..." : "Guardar lote"}
            </Button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Lotes registrados</h2>
        </div>

        {batches.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Este producto todavía no tiene lotes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Lote</th>
                  <th className="px-5 py-4">Vencimiento</th>
                  <th className="px-5 py-4">Stock</th>
                  <th className="px-5 py-4">Stock inicial</th>
                  <th className="px-5 py-4">Costo unitario</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>


<tbody className="divide-y divide-gray-100">
  {batches.map((batch) => (
    <tr key={batch._id}>
      <td className="px-5 py-4 font-medium text-gray-900">
        {batch.batchNumber}
      </td>

      <td className="px-5 py-4 text-gray-600">
        {formatExpiration(batch.expirationDate)}
      </td>

      <td className="px-5 py-4 font-semibold text-gray-800">
        {batch.stock}
      </td>

      <td className="px-5 py-4 text-gray-600">
        {batch.initialStock}
      </td>

      <td className="px-5 py-4 text-gray-600">
        {formatCurrency(batch.unitCost)}
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => {
            setSelectedBatch(batch);
            setRestockQuantity("");
            setRestockReason("");
            setError("");
          }}
          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Reponer
        </button>
      </td>
    </tr>
  ))}
</tbody>

            </table>
          </div>
        )}
      </div>
      
{selectedBatch && (
  <form
    onSubmit={handleRestock}
    className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm"
  >
    <h2 className="text-lg font-semibold text-gray-900">
      Reponer lote {selectedBatch.batchNumber}
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Existencia actual: {selectedBatch.stock} unidades
    </p>

    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Cantidad recibida
        </label>

        <input
          type="number"
          min="1"
          step="1"
          required
          disabled={restocking}
          value={restockQuantity}
          onChange={(e) => setRestockQuantity(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Motivo o referencia de recepción
        </label>

        <input
          type="text"
          required
          disabled={restocking}
          value={restockReason}
          onChange={(e) => setRestockReason(e.target.value)}
          placeholder="Ej. Factura F001-00001234"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
        />
      </div>
    </div>

    <div className="mt-5 flex justify-end gap-3">
      <Button
        type="button"
        variant="secondary"
        disabled={restocking}
        onClick={() => setSelectedBatch(null)}
      >
        Cancelar
      </Button>

      <Button type="submit" disabled={restocking}>
        {restocking ? "Guardando..." : "Confirmar reposición"}
      </Button>
    </div>
  </form>
)}

    </div>
  );
}
