import { useEffect, useState } from "react";

import { CheckCircle2, Settings as SettingsIcon } from "lucide-react";

import Spinner from "../components/common/Spinner";
import SettingsForm from "../components/settings/SettingsForm";

import { getSettings, updateSettings } from "../services/settingsService";

import useSettings from "../context/useSettings";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { updateLocalSettings } = useSettings();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getSettings();

        setSettings(response.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "No se pudo cargar la configuración.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (data) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

const response =
  await updateSettings(data);

setSettings(response.data);

updateLocalSettings(response.data);

setSuccess(
  "Configuración actualizada correctamente.",
);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo guardar la configuración.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <SettingsIcon size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Configuración
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Personaliza la información general de la farmacia.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={18} />

          {success}
        </div>
      )}

      {settings && (
        <SettingsForm
          key={settings._id}
          initialSettings={settings}
          onSubmit={handleSubmit}
          saving={saving}
        />
      )}
    </div>
  );
}
