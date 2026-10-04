import api from "./api";

export const getReturns = () => api.get("/returns");

export const getReturnsBySale = (saleId) => api.get(`/returns/sale/${saleId}`);

export const createReturn = (data) => api.post("/returns", data);
