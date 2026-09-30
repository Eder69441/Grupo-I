import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pharmacy_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const isUnauthorized = error.response?.status === 401;

    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (isUnauthorized && !isLoginRequest) {
      localStorage.removeItem("pharmacy_user");
      localStorage.removeItem("pharmacy_token");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
