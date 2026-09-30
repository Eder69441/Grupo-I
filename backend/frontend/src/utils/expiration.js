export function getDaysUntilExpiration(expirationDate) {
  if (!expirationDate) {
    return null;
  }

  const datePart = expirationDate.split("T")[0];

  const [year, month, day] = datePart.split("-").map(Number);

  const expiration = new Date(year, month - 1, day);

  expiration.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const difference = expiration.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}
