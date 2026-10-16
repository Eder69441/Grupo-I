import { useState } from "react";

import {
  CreditCard,
  CheckCircle2,
  XCircle,
  WifiOff,
  X,
  LoaderCircle,
  RotateCcw,
  ReceiptText,
} from "lucide-react";

import useCurrency from "../../hooks/useCurrency";

import { simulateCardPayment } from "../../services/paymentService";

export default function PaymentTerminal({ total, items, onClose, onApproved }) {
  const { formatCurrency } = useCurrency();

  const [scenario, setScenario] = useState("approved");
  const [status, setStatus] = useState("idle");
  const [processing, setProcessing] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState("");

  const handleSimulate = async () => {
    if (processing) return;

    try {
      setProcessing(true);
      setError("");
      setTransaction(null);
      setStatus("processing");

      const response = await simulateCardPayment({
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        scenario,
      });

      const payment = response.data;

      setTransaction(payment);
      setStatus(payment.status);
    } catch (error) {
      console.error("Error al procesar pago:", error);

      setError(
        error.response?.data?.message ||
          "No se pudo procesar el pago simulado.",
      );

      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setTransaction(null);
    setError("");
  };

  const handleApproved = () => {
    if (!transaction || transaction.status !== "approved") {
      return;
    }

    onApproved(transaction);
  };

  const getStatusContent = () => {
    switch (status) {
      case "approved":
        return {
          icon: CheckCircle2,
          title: "Pago aprobado",
          description: "La transacción simulada fue autorizada correctamente.",
          color: "text-emerald-600",
          background: "bg-emerald-50",
        };

      case "declined":
        return {
          icon: XCircle,
          title: "Pago rechazado",
          description: "La entidad emisora simulada rechazó la transacción.",
          color: "text-red-600",
          background: "bg-red-50",
        };

      case "connection_error":
        return {
          icon: WifiOff,
          title: "Error de conexión",
          description: "No fue posible completar la autorización simulada.",
          color: "text-amber-600",
          background: "bg-amber-50",
        };

      default:
        return null;
    }
  };

  const statusContent = getStatusContent();
  const StatusIcon = statusContent?.icon;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-slate-950/70 p-4
        backdrop-blur-sm
      "
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-terminal-title"
        className="
          w-full max-w-md overflow-hidden
          rounded-2xl bg-white
          shadow-2xl
        "
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard size={23} />
            </div>

            <div>
              <h2
                id="payment-terminal-title"
                className="text-lg font-bold text-gray-900"
              >
                Terminal POS
              </h2>

              <p className="text-xs text-gray-500">Entorno de simulación</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
            aria-label="Cerrar terminal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Pantalla de la terminal */}
          <div className="rounded-2xl bg-slate-900 p-5 text-white">
            <div className="mb-7 flex items-center justify-between">
              <CreditCard size={29} />

              <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-wider">
                DEMO
              </span>
            </div>

            <p className="text-sm text-slate-300">Importe de la operación</p>

            <p className="mt-1 text-3xl font-bold tracking-tight">
              {formatCurrency(total)}
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-slate-400">TU PHARMACY</span>
              <span className="text-xs text-slate-400">POS SIMULADO</span>
            </div>
          </div>

          {/* Estado inicial */}
          {status === "idle" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="payment-scenario"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Resultado de la simulación
                </label>

                <select
                  id="payment-scenario"
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value)}
                  className="
                    w-full rounded-xl
                    border border-gray-300
                    bg-white px-4 py-3
                    text-sm outline-none
                    focus:border-blue-500
                    focus:ring-2 focus:ring-blue-100
                  "
                >
                  <option value="approved">Pago aprobado</option>
                  <option value="declined">Pago rechazado</option>
                  <option value="connection_error">Error de conexión</option>
                </select>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs leading-relaxed text-blue-800">
                  Esta terminal utiliza escenarios de prueba. No solicita datos
                  bancarios ni procesa dinero real.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulate}
                disabled={processing}
                className="
                  flex w-full items-center
                  justify-center gap-2
                  rounded-xl bg-blue-600
                  px-4 py-3 font-semibold
                  text-white transition
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <CreditCard size={18} />
                Procesar pago
              </button>
            </div>
          )}

          {/* Procesando */}
          {status === "processing" && (
            <div className="py-7 text-center">
              <LoaderCircle
                size={42}
                className="mx-auto animate-spin text-blue-600"
              />

              <p className="mt-4 font-semibold text-gray-900">
                Procesando transacción...
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Consultando el simulador de pagos
              </p>
            </div>
          )}

          {/* Resultado */}
          {statusContent && (
            <div className="space-y-4">
              <div
                className={`rounded-xl p-5 text-center ${statusContent.background}`}
              >
                <StatusIcon
                  size={48}
                  className={`mx-auto ${statusContent.color}`}
                />

                <h3 className={`mt-3 text-lg font-bold ${statusContent.color}`}>
                  {statusContent.title}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {statusContent.description}
                </p>
              </div>

              {/* Comprobante */}
              {transaction && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <ReceiptText size={17} className="text-gray-500" />

                    <h4 className="text-sm font-semibold text-gray-800">
                      Comprobante de prueba
                    </h4>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Importe</span>

                      <span className="font-semibold">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Estado</span>

                      <span className="font-medium capitalize">
                        {transaction.status}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500">Referencia</p>

                      <p className="mt-1 break-all font-mono text-xs text-gray-800">
                        {transaction.reference}
                      </p>
                    </div>

                    {transaction.authorizationCode && (
                      <div>
                        <p className="text-xs text-gray-500">
                          Código de autorización
                        </p>

                        <p className="mt-1 font-mono text-sm font-semibold text-emerald-700">
                          {transaction.authorizationCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              {status === "approved" ? (
                <button
                  type="button"
                  onClick={handleApproved}
                  className="
                    flex w-full items-center
                    justify-center gap-2
                    rounded-xl bg-emerald-600
                    px-4 py-3 font-semibold
                    text-white transition
                    hover:bg-emerald-700
                  "
                >
                  <CheckCircle2 size={19} />
                  Continuar con la venta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="
                    flex w-full items-center
                    justify-center gap-2
                    rounded-xl border border-gray-300
                    px-4 py-3 font-semibold
                    text-gray-700 transition
                    hover:bg-gray-50
                  "
                >
                  <RotateCcw size={17} />
                  Intentar nuevamente
                </button>
              )}
            </div>
          )}

          {/* Error de comunicación */}
          {status === "error" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
