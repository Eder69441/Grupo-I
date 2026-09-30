export function formatDate(date) {
  if (!date) {
    return "";
  }

  const datePart = date.split("T")[0];

  const [year, month, day] = datePart.split("-").map(Number);

  const localDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(localDate);
}
