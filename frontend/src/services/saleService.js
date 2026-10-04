import api from "./api";

export const getSales = () => api.get("/sales");

export const createSale = (data) => api.post("/sales", data);
