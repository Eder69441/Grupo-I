import { useState } from "react";

import AuthContext from "./AuthContext";

import { login as loginRequest } from "../services/authService";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("pharmacy_user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("pharmacy_user");

      localStorage.removeItem("pharmacy_token");

      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("pharmacy_token");
  });

  const loading = false;

  const login = async (username, password) => {
    try {
      const response = await loginRequest({
        username,
        password,
      });

      const { token: newToken, user: loggedUser } = response.data;

      localStorage.setItem("pharmacy_user", JSON.stringify(loggedUser));

      localStorage.setItem("pharmacy_token", newToken);

      setUser(loggedUser);
      setToken(newToken);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,

        message: error.response?.data?.message || "No se pudo iniciar sesión.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("pharmacy_user");

    localStorage.removeItem("pharmacy_token");

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
