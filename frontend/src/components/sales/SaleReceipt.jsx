import { Banknote, CreditCard, Printer, WalletCards } from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDateTime";

import useSettings from "../../context/useSettings";

const paymentLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: WalletCards,
};

export default function SaleReceipt({ sale, onClose }) {
const { settings } = useSettings();

  if (!sale) {
    return null;
  }

  const PaymentIcon = paymentIcons[sale.paymentMethod] || Banknote;

  const handlePrint = () => {
    window.print();
  };

  const totalUnits = sale.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <div className="sale-receipt bg-white">
      {/* Encabezado */}
      <div className="text-center">
<h2 className="text-xl font-bold text-gray-900">
  {settings.pharmacyName}
</h2>

{settings.rnc && (
  <p className="mt-1 text-xs text-gray-500">
    RNC: {settings.rnc}
  </p>
)}

{settings.address && (
  <p className="mt-1 text-xs text-gray-500">
    {settings.address}
  </p>
)}

{settings.phone && (
  <p className="mt-1 text-xs text-gray-500">
    Tel: {settings.phone}
  </p>
)}

        <div className="my-4 border-t border-dashed border-gray-300" />
        <p className="text-sm font-semibold text-gray-900">
          COMPROBANTE DE VENTA
        </p>

        <p className="mt-1 text-xs text-gray-500">{sale.saleNumber}</p>
      </div>

      {/* Datos */}
      <div className="my-4 space-y-1.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Fecha:</span>

          <span className="text-right font-medium text-gray-800">
            {formatDateTime(sale.createdAt)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Atendido por:</span>

          <span className="text-right font-medium text-gray-800">
            {sale.user?.name || sale.user?.username || "Usuario"}
          </span>
        </div>

        {sale.cashSession?.sessionNumber && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Caja:</span>

            <span className="text-right font-medium text-gray-800">
              {sale.cashSession.sessionNumber}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-gray-300" />

      {/* Productos */}
      <div className="py-4">
        {sale.items.map((item, index) => (
          <div
            key={`${item.product?._id || item.product}-${index}`}
            className="mb-3 last:mb-0"
          >
            <p className="text-xs font-semibold text-gray-900">
              {item.productName}
            </p>

            <div className="mt-1 flex justify-between gap-4 text-xs">
              <span className="text-gray-500">
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </span>

              <span className="font-semibold text-gray-800">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-300" />

      {/* Totales */}
      <div className="space-y-2 py-4">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Productos</span>

          <span className="font-medium text-gray-800">{totalUnits}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">TOTAL</span>

          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(sale.total)}
          </span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-300" />

      {/* Pago */}
      <div className="space-y-2 py-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <PaymentIcon size={14} />

            <span>Método de pago</span>
          </div>

          <span className="font-semibold text-gray-800">
            {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
          </span>
        </div>

        {sale.paymentMethod === "cash" && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Recibido</span>

              <span className="font-medium text-gray-800">
                {formatCurrency(sale.amountReceived)}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Cambio</span>

              <span className="font-medium text-gray-800">
                {formatCurrency(sale.change)}
              </span>
            </div>
          </>
        )}
      </div>

      {sale.status === "cancelled" && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-sm font-bold uppercase text-red-700">
            Venta anulada
          </p>
        </div>
      )}

      <div className="border-t border-dashed border-gray-300" />

      {/* Pie */}
      <div className="py-4 text-center">
<p className="text-xs font-semibold text-gray-800">
  {settings.receiptMessage}
</p>

        <p className="mt-1 text-[11px] text-gray-500">
          Conserve este comprobante para cualquier devolución.
        </p>
      </div>

      {/* Acciones */}
      <div className="receipt-actions mt-3 flex gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cerrar
          </button>
        )}

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <Printer size={17} />
          Imprimir
        </button>
      </div>
    </div>
  );
}
