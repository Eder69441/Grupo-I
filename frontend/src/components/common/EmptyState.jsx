export default function EmptyState({
  title = "No hay información",
  message = "No se encontraron datos.",
}) {
  return (
    <div className="rounded-xl border bg-white px-6 py-12 text-center shadow-sm">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>

      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  );
}
