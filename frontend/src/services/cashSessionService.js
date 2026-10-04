import api from "./api";

export const getCurrentCashSession = () => api.get("/cash-sessions/current");

export const getCashSessions = () => api.get("/cash-sessions");

export const openCashSession = (data) => api.post("/cash-sessions/open", data);

export const closeCashSession = (data) =>
  api.post("/cash-sessions/close", data);
