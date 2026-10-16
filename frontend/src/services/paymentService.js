import api from "./api";

export const simulateCardPayment = (data) =>
  api.post("/payments/simulate", data);

export const getPaymentTransaction = (id) => api.get(`/payments/${id}`);
