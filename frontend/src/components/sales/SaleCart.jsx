import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import useCurrency from "../../hooks/useCurrency";

export default function SaleCart({
  items,
  onIncrease,
  onDecrease,
  onQuantityChange,
  onRemove,
  total,
  onCompleteSale,
  saving,
  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,
  change,
  insufficientCash,
}) {
  const numericAmountReceived = Number(amountReceived) || 0;
  const { formatCurrency } = useCurrency();

  return (
    <div className="self-start rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Encabezado */}
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ShoppingCart size={18} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Venta actual</h2>

            <p className="text-sm text-gray-500">
              {items.length} producto
              {items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Productos */}
      {items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <ShoppingCart size={36} className="mx-auto mb-3 text-gray-300" />

          <p className="text-sm font-medium text-gray-600">
            La venta está vacía
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Agrega medicamentos para comenzar.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.product._id} className="p-4">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {item.product.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {formatCurrency(item.product.price)} c/u
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(item.product._id)}
                  disabled={saving}
                  className="
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-lg text-gray-400
                    transition
                    hover:bg-red-50
                    hover:text-red-600
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  title="Quitar producto"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                {/* Cantidad */}
                <div className="flex items-center rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => onDecrease(item.product._id)}
                    disabled={saving}
                    className="
                      p-2 text-gray-500
                      hover:text-gray-900
                      disabled:cursor-not-allowed
                      disabled:text-gray-300
                    "
                    title="Disminuir cantidad"
                  >
                    <Minus size={15} />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={(e) =>
                      onQuantityChange(item.product._id, e.target.value)
                    }
                    disabled={saving}
                    className="
    w-14 border-x border-gray-200
    bg-white px-1 py-2
    text-center text-sm font-semibold
    text-gray-700 outline-none
    focus:bg-emerald-50
    disabled:bg-gray-50
  "
                  />

                  <button
                    type="button"
                    onClick={() => onIncrease(item.product._id)}
                    disabled={saving || item.quantity >= item.product.stock}
                    className="
                      p-2 text-gray-500
                      hover:text-gray-900
                      disabled:cursor-not-allowed
                      disabled:text-gray-300
                    "
                    title="Aumentar cantidad"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Subtotal */}
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total y pago */}
      <div className="border-t border-gray-100 p-5">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-600">Total</span>

          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(total)}
          </span>
        </div>

        {/* Información de pago */}
        {items.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-600" />

              <h3 className="font-semibold text-gray-900">Pago</h3>
            </div>

            {/* Método de pago */}
            <div>
              <label
                htmlFor="paymentMethod"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Método de pago
              </label>

              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                disabled={saving}
                className="
                  w-full rounded-lg
                  border border-gray-300
                  bg-white px-3 py-2.5
                  text-sm text-gray-700
                  outline-none transition
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-100
                  disabled:cursor-not-allowed
                  disabled:bg-gray-50
                "
              >
                <option value="cash">Efectivo</option>

                <option value="card">Tarjeta</option>

                <option value="transfer">Transferencia</option>
              </select>
            </div>

            {/* Monto recibido */}
            {paymentMethod === "cash" && (
              <div className="mt-4">
                <label
                  htmlFor="amountReceived"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Monto recibido
                </label>

                <div className="relative">
                  <Banknote
                    size={18}
                    className="
                      absolute left-3 top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    id="amountReceived"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => onAmountReceivedChange(e.target.value)}
                    disabled={saving}
                    placeholder="0.00"
                    className="
                      w-full rounded-lg
                      border border-gray-300
                      py-2.5 pl-10 pr-3
                      text-sm text-gray-700
                      outline-none transition
                      placeholder:text-gray-400
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-100
                      disabled:cursor-not-allowed
                      disabled:bg-gray-50
                    "
                  />
                </div>

                {insufficientCash && amountReceived !== "" && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    El monto recibido es menor que el total de la venta.
                  </p>
                )}
              </div>
            )}

            {/* Resumen del pago en efectivo */}
            {paymentMethod === "cash" && (
              <div className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total a pagar</span>

                  <span className="font-semibold text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Recibido</span>

                  <span className="font-semibold text-gray-900">
                    {formatCurrency(numericAmountReceived)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="font-medium text-gray-700">Devuelta</span>

                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}

            {/* Información para pagos no efectivos */}
            {paymentMethod !== "cash" && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total a pagar</span>

                  <span className="font-semibold text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón completar venta */}
        <button
          type="button"
          onClick={onCompleteSale}
          disabled={items.length === 0 || saving || insufficientCash}
          className="
            mt-5 w-full rounded-lg
            bg-emerald-600 px-4 py-3
            text-sm font-semibold text-white
            transition
            hover:bg-emerald-700
            focus:outline-none
            focus:ring-2
            focus:ring-emerald-200
            disabled:cursor-not-allowed
            disabled:bg-gray-300
          "
        >
          {saving ? "Procesando venta..." : "Completar venta"}
        </button>
      </div>
    </div>
  );
}
