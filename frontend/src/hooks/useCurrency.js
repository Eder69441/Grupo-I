import useSettings from "../context/useSettings";

export default function useCurrency() {
  const { settings } = useSettings();

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;

    try {
      return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: settings.currency || "DOP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${settings.currencySymbol || "RD$"}${amount.toFixed(2)}`;
    }
  };

  return {
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    formatCurrency,
  };
}
