import { useMemo, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import useCurrency from "../../hooks/useCurrency";
import useAuth from "../../context/useAuth"; 


const idOf = (value) => String(value?._id ?? value ?? "");

export default function ReturnForm({
  sale,
  previousReturns = [],
  onSubmit,
  onCancel,
  loading = false,
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { formatCurrency } = useCurrency();
  const [quantities, setQuantities] = useState({});
  const [allocations, setAllocations] = useState({});
  const [restock, setRestock] = useState({});
  const [approved, setApproved] = useState({});
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState(
    sale.paymentMethod || "cash",
  );

  const previous = useMemo(() => {
    const byProduct = {};
    const byBatch = {};
    const untraceable = new Set();
    for (const record of previousReturns) {
      for (const item of record.items || []) {
        const productId = idOf(item.product);
        byProduct[productId] =
          (byProduct[productId] || 0) + Number(item.quantity || 0);
        if (
          !Array.isArray(item.returnedBatches) ||
          item.returnedBatches.reduce(
            (s, a) => s + Number(a.quantity || 0),
            0,
          ) !== Number(item.quantity)
        ) {
          untraceable.add(productId);
          continue;
        }
        for (const a of item.returnedBatches) {
          const key = `${productId}:${idOf(a.batch)}`;
          byBatch[key] = (byBatch[key] || 0) + Number(a.quantity || 0);
        }
      }
    }
    return { byProduct, byBatch, untraceable };
  }, [previousReturns]);

  const products = useMemo(
    () =>
      (sale.items || []).map((item) => {
        const productId = idOf(item.product);
        const returned = previous.byProduct[productId] || 0;
        const batches = (item.batches || []).map((allocation) => {
          const batchId = idOf(allocation.batch);
          const alreadyReturned =
            previous.byBatch[`${productId}:${batchId}`] || 0;
          return {
            batchId,
            name:
              allocation.batch?.batchNumber ||
              allocation.batch?.lotNumber ||
              batchId.slice(-8),
            expirationDate: allocation.batch?.expirationDate,
            available: Math.max(
              0,
              Number(allocation.quantity) - alreadyReturned,
            ),
          };
        });
        return {
          ...item,
          productId,
          returned,
          available: Math.max(0, Number(item.quantity) - returned),
          batches,
          blocked:
            previous.untraceable.has(productId) ||
            batches.length === 0 ||
            batches.some((b) => !b.batchId),
        };
      }),
    [sale.items, previous],
  );

  const selected = products.filter((p) => Number(quantities[p.productId]) > 0);
  const validations = selected.map((p) => {
    const quantity = Number(quantities[p.productId]);
    const assigned = p.batches.reduce(
      (sum, b) => sum + Number(allocations[p.productId]?.[b.batchId] || 0),
      0,
    );
    const validAllocations = p.batches.every((b) => {
      const raw = allocations[p.productId]?.[b.batchId] ?? "";
      const value = Number(raw || 0);
      return raw !== ""
        ? Number.isSafeInteger(value) && value >= 0 && value <= b.available
        : true;
    });
    return {
      product: p,
      quantity,
      valid:
        !p.blocked &&
        Number.isSafeInteger(quantity) &&
        quantity > 0 &&
        quantity <= p.available &&
        assigned === quantity &&
        validAllocations &&
        (!restock[p.productId] || (isAdmin && approved[p.productId] === true)),
    };
  });
  const canSubmit =
    selected.length > 0 &&
    reason.trim().length > 0 &&
    validations.every((v) => v.valid) &&
    !loading;
  const totalRefund = selected.reduce(
    (sum, p) => sum + Number(quantities[p.productId]) * Number(p.unitPrice),
    0,
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    const items = selected.map((p) => ({
      productId: p.productId,
      quantity: Number(quantities[p.productId]),
      restock: Boolean(restock[p.productId]) && isAdmin,
      inspectionApproved: Boolean(
        restock[p.productId] && approved[p.productId] && isAdmin,
      ),
      returnedBatches: p.batches
        .map((b) => ({
          batch: b.batchId,
          quantity: Number(allocations[p.productId]?.[b.batchId] || 0),
        }))
        .filter((b) => b.quantity > 0),
    }));
    const success = await onSubmit({
      saleId: sale._id,
      items,
      reason: reason.trim(),
      refundMethod,
    });
    if (success) {
      setQuantities({});
      setAllocations({});
      setRestock({});
      setApproved({});
      setReason("");
    }
  };

  const fieldClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2">
        <RotateCcw size={19} className="text-emerald-600" />
        <div>
          <h3 className="font-semibold text-gray-900">Registrar devolución</h3>
          <p className="text-sm text-gray-500">
            Selecciona unidades y distribúyelas entre los lotes originales.
          </p>
        </div>
      </div>

      {products.map((p) => {
        const quantity = quantities[p.productId] ?? "";
        const active = Number(quantity) > 0;
        const assigned = p.batches.reduce(
          (sum, b) => sum + Number(allocations[p.productId]?.[b.batchId] || 0),
          0,
        );
        return (
          <div
            key={p.productId}
            className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{p.productName}</p>
                <p className="text-xs text-gray-500">
                  Comprado: {p.quantity} · Devuelto: {p.returned} · Disponible:{" "}
                  {p.available}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(p.unitPrice)} por unidad
                </p>
              </div>
              <label className="text-sm font-medium text-gray-700">
                Devolver
                <input
                  type="number"
                  min="0"
                  max={p.available}
                  step="1"
                  disabled={p.available === 0 || p.blocked || loading}
                  value={quantity}
                  onChange={(e) =>
                    setQuantities((s) => ({
                      ...s,
                      [p.productId]: e.target.value,
                    }))
                  }
                  className={`${fieldClass} ml-2 w-20 text-center`}
                />
              </label>
            </div>

            {p.blocked && p.available > 0 && (
              <p className="flex items-start gap-2 text-xs text-amber-700">
                <AlertTriangle size={15} className="shrink-0" />
                Faltan lotes de la venta o hay devoluciones históricas sin
                trazabilidad. Requiere revisión.
              </p>
            )}

            {active && !p.blocked && (
              <div className="space-y-3 border-t border-gray-100 pt-3">
                <p className="text-sm font-semibold text-gray-700">
                  Lotes originales
                </p>
                {p.batches.map((b) => (
                  <div
                    key={b.batchId}
                    className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {b.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pendientes de devolución: {b.available}
                      </p>
                      {b.expirationDate && (
                        <p className="text-xs text-gray-500">
                          Vence:{" "}
                          {new Date(b.expirationDate).toLocaleDateString(
                            "es-DO",
                            { timeZone: "UTC" },
                          )}
                        </p>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={b.available}
                      step="1"
                      value={allocations[p.productId]?.[b.batchId] ?? ""}
                      onChange={(e) =>
                        setAllocations((s) => ({
                          ...s,
                          [p.productId]: {
                            ...s[p.productId],
                            [b.batchId]: e.target.value,
                          },
                        }))
                      }
                      disabled={b.available === 0 || loading}
                      className={`${fieldClass} w-20 text-center`}
                      aria-label={`Cantidad del lote ${b.name}`}
                    />
                  </div>
                ))}
                <p
                  className={`text-sm font-medium ${assigned === Number(quantity) ? "text-emerald-700" : "text-amber-700"}`}
                >
                  Asignadas: {assigned} de {quantity}
                </p>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Modalidad
                  </label>
                  <select
                    value={restock[p.productId] ? "yes" : "no"}
                    disabled={loading}
                    onChange={(e) => {
                      const value = e.target.value === "yes";
                      setRestock((s) => ({ ...s, [p.productId]: value }));
                      setApproved((s) => ({ ...s, [p.productId]: false }));
                    }}
                    className={`${fieldClass} w-full`}
                  >
                    <option value="no">No reincorporar al inventario</option>
                    {isAdmin && (
                      <option value="yes">
                        Reincorporar al inventario (autorizado)
                      </option>
                    )}
                  </select>
                </div>
                {restock[p.productId] && isAdmin && (
                  <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <input
                      type="checkbox"
                      checked={Boolean(approved[p.productId])}
                      onChange={(e) =>
                        setApproved((s) => ({
                          ...s,
                          [p.productId]: e.target.checked,
                        }))
                      }
                      className="mt-1"
                    />
                    Confirmo que el medicamento fue inspeccionado y autorizado
                    para regresar al inventario vendible.
                  </label>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Motivo de devolución
        </label>
        <textarea
          rows={3}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`${fieldClass} w-full`}
          placeholder="Indica el motivo de la devolución"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Método de reembolso
        </label>
        <select
          value={refundMethod}
          onChange={(e) => setRefundMethod(e.target.value)}
          className={`${fieldClass} w-full`}
        >
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="transfer">Transferencia</option>
        </select>
        {refundMethod !== sale.paymentMethod && (
          <p className="mt-2 text-xs text-amber-700">
            El método de reembolso es distinto del método de pago original.
          </p>
        )}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
        <span className="font-medium text-emerald-800">Total a reembolsar</span>
        <span className="text-xl font-bold text-emerald-700">
          {formatCurrency(totalRefund)}
        </span>
      </div>
      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={17} />
          {loading ? "Registrando..." : "Confirmar devolución"}
        </button>
      </div>
    </form>
  );
}
