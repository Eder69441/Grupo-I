import api from "./api";

export const getMovements = () => {
  return api.get("/movements");
};

export const getMovementsByProduct = (productId) => {
  return api.get(`/movements/product/${productId}`);
};

export const createMovement = (movement) => {
  return api.post("/movements", movement);
};
