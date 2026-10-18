import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App.jsx";

import AuthProvider from "./context/AuthProvider.jsx";
import SettingsProvider from "./context/SettingsProvider.jsx";
import { BranchProvider } from "./context/BranchContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <BranchProvider>
          <App />
        </BranchProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>,
);
