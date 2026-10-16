
import { useEffect, useRef, useState } from "react";
import {
  ScanBarcode,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

export default function ProductCodeScanner({
  onScan,
  disabled = false,
}) {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const inputRef = useRef(null);
  const scanningRef = useRef(false);
  const feedbackTimerRef = useRef(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const showFeedback = (message, type) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setFeedback({ message, type });

    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 2200);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedCode = code.trim();

    if (!normalizedCode || disabled || scanningRef.current) {
      return;
    }

    scanningRef.current = true;
    setScanning(true);
    setFeedback(null);

    try {
      const result = await onScan(normalizedCode);

      if (result) {
        setCode("");

        showFeedback(
          "Producto agregado correctamente.",
          "success",
        );
      } else {
        showFeedback(
          "No se pudo agregar el producto. Revisa el mensaje de error.",
          "error",
        );
      }
    } catch (error) {
      console.error("Error al escanear:", error);

      showFeedback(
        "Ocurrió un error al procesar el código.",
        "error",
      );
    } finally {
      scanningRef.current = false;
      setScanning(false);

      if (!disabled) {
        inputRef.current?.focus();
      }
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
          <ScanBarcode size={22} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            Escáner de productos
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Escanea los medicamentos consecutivamente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanBarcode
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Escanea o escribe un código..."
              autoComplete="off"
              disabled={disabled || scanning}
              className="
                w-full rounded-lg border border-gray-300
                py-3 pl-10 pr-4 text-sm outline-none
                transition focus:border-emerald-500
                focus:ring-2 focus:ring-emerald-100
                disabled:bg-gray-100
              "
            />
          </div>

          <button
            type="submit"
            disabled={disabled || scanning || !code.trim()}
            className="
              flex items-center justify-center gap-2
              rounded-lg bg-emerald-600 px-5 py-3
              text-sm font-semibold text-white
              hover:bg-emerald-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {scanning ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <ScanBarcode size={18} />
            )}

            {scanning ? "Procesando..." : "Agregar"}
          </button>
        </div>
      </form>

      {feedback && (
        <div
          role="status"
          className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{feedback.message}</span>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Presiona Enter después de introducir el código.
        El lector debe estar configurado para enviar Enter
        automáticamente.
      </p>
    </div>
  );
}
