export default function SuccessMessage({ message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-green-200
     bg-green-50 p-4 text-sm text-green-700">
      <div className="flex items-center gap-2">
        <span className="font-bold">✓</span>

        <span>{message}</span>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="font-bold text-green-600 hover:text-green-800"
          aria-label="Cerrar mensaje"
        >
          ✕
        </button>
      )}
    </div>
  );
}
