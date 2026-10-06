import { useCallback, useEffect, useState } from "react";

import SettingsContext from "./SettingsContext";
import { getSettings } from "../services/settingsService";

const DEFAULT_SETTINGS = {
  pharmacyName: "Tu Pharmacy",
  rnc: "",
  phone: "",
  email: "",
  address: "",
  receiptMessage: "¡Gracias por su compra!",
  currency: "DOP",
  currencySymbol: "RD$",
};

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [loadingSettings, setLoadingSettings] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const response = await getSettings();

      setSettings({
        ...DEFAULT_SETTINGS,
        ...response.data,
      });
    } catch (error) {
      console.error("No se pudo cargar la configuración:", error);

      // La aplicación puede continuar usando
      // la configuración predeterminada.
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoadingSettings(false);
    }
  }, );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateLocalSettings = (newSettings) => {
    setSettings((current) => ({
      ...current,
      ...newSettings,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loadingSettings,
        reloadSettings: loadSettings,
        updateLocalSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
