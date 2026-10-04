import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import LocationForm from "../components/locations/LocationForm";
import LocationTable from "../components/locations/LocationTable";

import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";

import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../services/locationService";

export default function Locations() {
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

const loadLocations = async () => {
  try {
    const response = await getLocations();

    setLocations(response.data);
  } catch (error) {
    console.error(error);

    setError(
      error.response?.data?.message ||
        "No se pudieron cargar las ubicaciones.",
    );
  }
};

useEffect(() => {
  const fetchLocations = async () => {
    try {
      const response = await getLocations();

      setLocations(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No se pudieron cargar las ubicaciones.",
      );
    } finally {
      setLoading(false);
    }
  };

  fetchLocations();
}, []);

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingLocation) {
        await updateLocation(editingLocation._id, formData);

        setSuccess("Ubicación actualizada correctamente.");
        setEditingLocation(null);
      } else {
        await createLocation(formData);

        setSuccess("Ubicación creada correctamente.");
      }

      await loadLocations();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo guardar la ubicación.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedLocation || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await deleteLocation(selectedLocation._id);

      setSelectedLocation(null);
      setSuccess("Ubicación desactivada correctamente.");

      await loadLocations();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo desactivar la ubicación.",
      );

      setSelectedLocation(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Ubicaciones
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Administra los tramos, estantes y niveles de la farmacia.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {success && (
        <div className="mb-6">
          <SuccessMessage message={success} onClose={() => setSuccess("")} />
        </div>
      )}

      <LocationForm
        key={editingLocation?._id || "new-location"}
        initialData={editingLocation}
        onSubmit={handleSubmit}
        onCancel={() => setEditingLocation(null)}
        loading={saving}
      />

      <div className="mt-8">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : locations.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No hay ubicaciones registradas.
          </div>
        ) : (
          <LocationTable
            locations={locations}
            onEdit={setEditingLocation}
            onDelete={setSelectedLocation}
          />
        )}
      </div>

      <Modal
        isOpen={!!selectedLocation}
        onClose={() => {
          if (!deleting) {
            setSelectedLocation(null);
          }
        }}
        title="Desactivar ubicación"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setSelectedLocation(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>

            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Desactivando..." : "Desactivar"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-gray-500">
          ¿Seguro que deseas desactivar la ubicación{" "}
          <span className="font-semibold text-gray-800">
            {selectedLocation &&
              `${selectedLocation.section}-${selectedLocation.shelf}-${selectedLocation.level}`}
          </span>
          ?
        </p>

        <p className="mt-2 text-sm text-gray-500">
          No podrá desactivarse si tiene medicamentos activos asignados.
        </p>
      </Modal>
    </div>
  );
}
