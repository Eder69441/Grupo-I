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

  const reloadSettings = useCallback(async () => {
    try {
      const response = await getSettings();

      setSettings({
        ...DEFAULT_SETTINGS,
        ...response.data,
      });

      return response.data;
    } catch (error) {
      console.error("No se pudo cargar la configuración:", error);

      throw error;
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // Carga inicial al montar el proveedor.
  useEffect(() => {
    let cancelled = false;

    async function fetchInitialSettings() {
      try {
        const response = await getSettings();

        if (!cancelled) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...response.data,
          });
        }
      } catch (error) {
        console.error("No se pudo cargar la configuración:", error);

      } finally {
        if (!cancelled) {
          setLoadingSettings(false);
        }
      }
    }

    fetchInitialSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Actualiza la configuración sin realizar otra petición.
  const updateLocalSettings = useCallback((newSettings) => {
    setSettings((current) => ({
      ...current,
      ...newSettings,
    }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loadingSettings,
        reloadSettings,
        updateLocalSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
