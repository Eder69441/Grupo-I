import api from "./api";

export const getBatches = () => api.get("/batches");

export const getProductBatches = (productId) =>
  api.get(`/batches/product/${productId}`);

export const createBatch = (data) => api.post("/batches", data);
