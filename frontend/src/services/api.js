import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Rutas que trabajan con una sucursal.
const branchScopedRoutes = [
  "/batches",
  "/sales",
  "/returns",
  "/cash-sessions",
  "/payments",
  "/inventory-movements",
  "/branch-inventory",
];

// La selección se mantiene en memoria, no en localStorage.
let activeBranchId = null;

export const setApiBranch = (branchId) => {
  activeBranchId = branchId || null;
};

export const clearApiBranch = () => {
  activeBranchId = null;
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pharmacy_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const requestPath = new URL(config.url || "", "http://localhost").pathname;

    const requiresBranch = branchScopedRoutes.some(
      (route) => requestPath === route || requestPath.startsWith(`${route}/`),
    );

    if (requiresBranch && activeBranchId) {
      // Los empleados no pueden cambiar su sucursal
      // en el backend. requireBranch la determina.
      config.params = {
        ...config.params,
        branchId: activeBranchId,
      };

      // Algunas rutas POST/PATCH obtienen branchId
      // desde req.body.
      const method = (config.method || "get").toLowerCase();

      if (
        ["post", "put", "patch"].includes(method) &&
        config.data &&
        typeof config.data === "object" &&
        !Array.isArray(config.data) &&
        !(config.data instanceof FormData)
      ) {
        config.data = {
          ...config.data,
          branchId: activeBranchId,
        };
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response?.status === 401;

    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (isUnauthorized && !isLoginRequest) {
      localStorage.removeItem("pharmacy_user");
      localStorage.removeItem("pharmacy_token");

      clearApiBranch();

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
