export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  if (!isOpen) {
    return null;
  }

  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return (
    <div
      className="
        fixed inset-0 z-100
        flex items-center justify-center
        bg-black/40
        p-4
      "
      onClick={onClose}
    >
      <div
        className={`
          flex max-h-[90vh] w-full flex-col
          overflow-hidden rounded-2xl
          bg-white shadow-xl
          ${sizes[size] || sizes.md}
        `}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div
          className="
            flex shrink-0 items-center
            justify-between
            border-b border-gray-200
            px-6 py-4
          "
        >
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg p-2
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-gray-600
            "
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="
              flex shrink-0 justify-end gap-3
              border-t border-gray-200
              px-6 py-4
            "
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
