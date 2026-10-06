import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import SettingsProvider from "./context/SettingsProvider.jsx";
import AuthProvider from "./context/AuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <SettingsProvider>
    <StrictMode>
      <App />
    </StrictMode>
    </SettingsProvider>
  </AuthProvider>,
);
