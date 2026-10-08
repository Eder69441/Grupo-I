import { useMemo, useState } from "react";

import { AlertTriangle, RotateCcw } from "lucide-react";

import useCurrency from "../../hooks/useCurrency";

export default function ReturnForm({
  sale,
  previousReturns = [],
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState(
    sale.paymentMethod || "cash",
  );

  const paymentMethodLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

const { formatCurrency } = useCurrency();

const refundMethodChanged =
  refundMethod !== sale.paymentMethod;

  const returnedByProduct = useMemo(() => {
    const result = {};

    for (const returnRecord of previousReturns) {
      for (const item of returnRecord.items) {
        const productId =
          typeof item.product === "object" ? item.product?._id : item.product;

        if (!productId) {
          continue;
        }

        result[productId] = (result[productId] || 0) + item.quantity;
      }
    }

    return result;
  }, [previousReturns]);

  const returnableItems = useMemo(
    () =>
      sale.items.map((item) => {
        const productId =
          typeof item.product === "object" ? item.product?._id : item.product;

        const previouslyReturned = returnedByProduct[productId] || 0;

        const available = Math.max(item.quantity - previouslyReturned, 0);

        return {
          ...item,
          productId,
          previouslyReturned,
          available,
        };
      }),
    [sale.items, returnedByProduct],
  );

  const selectedItems = returnableItems
    .map((item) => ({
      productId: item.productId,
      quantity: Number(quantities[item.productId]) || 0,
      unitPrice: item.unitPrice,
    }))
    .filter((item) => item.quantity > 0);

  const totalRefund = selectedItems.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

  const hasInvalidQuantity = returnableItems.some((item) => {
    const quantity = Number(quantities[item.productId]) || 0;

    return quantity > item.available;
  });

  const canSubmit =
    selectedItems.length > 0 &&
    reason.trim() &&
    !hasInvalidQuantity &&
    !loading;

  const handleQuantityChange = (productId, value) => {
    setQuantities((current) => ({
      ...current,
      [productId]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const success = await onSubmit({
      saleId: sale._id,

      items: selectedItems.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),

      reason: reason.trim(),

      refundMethod,
    });

    if (success) {
      setQuantities({});
      setReason("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <RotateCcw size={19} className="text-emerald-600" />

          <div>
            <h3 className="font-semibold text-gray-900">
              Registrar devolución
            </h3>

            <p className="text-sm text-gray-500">
              Selecciona las unidades que el cliente está devolviendo.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Producto</th>

                  <th className="px-4 py-3 text-center">Comprado</th>

                  <th className="px-4 py-3 text-center">Devuelto</th>

                  <th className="px-4 py-3 text-center">Disponible</th>

                  <th className="px-4 py-3 text-center">Devolver</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {returnableItems.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {item.productName}
                      </p>

                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.unitPrice)} c/u
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {item.previouslyReturned}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-semibold ${
                          item.available > 0
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        {item.available}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max={item.available}
                        step="1"
                        disabled={item.available === 0}
                        value={quantities[item.productId] || ""}
                        onChange={(event) =>
                          handleQuantityChange(
                            item.productId,
                            event.target.value,
                          )
                        }
                        className="
                            mx-auto block w-20
                            rounded-lg border
                            border-gray-300
                            px-2 py-2
                            text-center text-sm
                            outline-none
                            focus:border-emerald-500
                            focus:ring-2
                            focus:ring-emerald-100
                            disabled:bg-gray-100
                            disabled:text-gray-400
                          "
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {hasInvalidQuantity && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />

          <p className="text-sm text-red-700">
            Una de las cantidades supera las unidades disponibles para
            devolución.
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Motivo
        </label>

        <textarea
          rows="3"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ej. Producto equivocado, cliente cambió de opinión..."
          className="
            w-full rounded-lg
            border border-gray-300
            px-3 py-2.5 text-sm
            outline-none
            focus:border-emerald-500
            focus:ring-2
            focus:ring-emerald-100
          "
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Método de reembolso
        </label>

        <select
          value={refundMethod}
          onChange={(event) => setRefundMethod(event.target.value)}
          className="
            w-full rounded-lg
            border border-gray-300
            bg-white px-3 py-2.5
            text-sm outline-none
            focus:border-emerald-500
            focus:ring-2
            focus:ring-emerald-100
          "
        >
          <option value="cash">Efectivo</option>

          <option value="card">Tarjeta</option>

          <option value="transfer">Transferencia</option>
        </select>

        {refundMethodChanged && (
  <div className="mt-2 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
    <AlertTriangle
      size={17}
      className="mt-0.5 shrink-0 text-amber-600"
    />

    <p className="text-xs leading-5 text-amber-800">
      Esta venta fue pagada mediante{" "}
      <strong>
        {paymentMethodLabels[
          sale.paymentMethod
        ] || "otro método"}
      </strong>
      , pero el reembolso se realizará mediante{" "}
      <strong>
        {paymentMethodLabels[
          refundMethod
        ]}
      </strong>
      .
    </p>
  </div>
)}
      </div>

      <div className="rounded-xl bg-emerald-50 p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-emerald-800">
            Total a reembolsar
          </span>

          <span className="text-xl font-bold text-emerald-700">
            {formatCurrency(totalRefund)}
          </span>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="
            rounded-lg border border-gray-300
            bg-white px-4 py-2.5
            text-sm font-semibold text-gray-700
            transition hover:bg-gray-50
            disabled:opacity-50
          "
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-lg bg-emerald-600
            px-4 py-2.5
            text-sm font-semibold text-white
            transition hover:bg-emerald-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <RotateCcw size={17} />

          {loading ? "Registrando..." : "Confirmar devolución"}
        </button>
      </div>
    </form>
  );
}
