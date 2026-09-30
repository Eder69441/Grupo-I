import { useEffect, useState } from "react";

import {
  createCategory,
  deleteCategory,
  getCategories,
} from "../services/categoryService";

import CategoryForm from "../components/categories/CategoryForm";
import CategoryTable from "../components/categories/CategoryTable";

import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setError("");

        const response = await getCategories();

        setCategories(response.data);
      } catch (error) {
        console.error(error);

        setError("No se pudieron cargar las categorías.");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [success]);

  const handleCreate = async (category) => {
    try {
      setCreating(true);
      setError("");

      const response = await createCategory(category);

      setCategories((prev) =>
        [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)),
      );

      setSuccess("Categoría creada correctamente.");

      return true;
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo crear la categoría.",
      );

      return false;
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
  };

  const confirmDelete = async () => {
    if (!selectedCategory || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteCategory(selectedCategory.id);

      setCategories((prev) =>
        prev.filter((category) => category.id !== selectedCategory.id),
      );

      setSuccess("Categoría eliminada correctamente.");

      setSelectedCategory(null);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo eliminar la categoría.",
      );

      setSelectedCategory(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Categorías
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Administra las categorías utilizadas para clasificar los medicamentos.
        </p>
      </div>

      {/* Mensajes */}
      {success && (
        <div className="mt-6">
          <SuccessMessage message={success} onClose={() => setSuccess("")} />
        </div>
      )}

      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Contenido */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <CategoryForm onSubmit={handleCreate} loading={creating} />

        <div>
          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner />
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              title="No hay categorías"
              message="Crea la primera categoría del inventario."
            />
          ) : (
            <CategoryTable categories={categories} onDelete={handleDelete} />
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!selectedCategory}
        title="Eliminar categoría"
        onClose={() => {
          if (!deleting) {
            setSelectedCategory(null);
          }
        }}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={deleting}
              onClick={() => setSelectedCategory(null)}
            >
              Cancelar
            </Button>

            <Button
              variant="danger"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-gray-500">
          ¿Seguro que deseas eliminar la categoría{" "}
          <span className="font-medium text-gray-800">
            {selectedCategory?.name}
          </span>
          ?
        </p>

        <p className="mt-2 text-sm text-gray-500">
          No podrás eliminarla si existen productos asociados a esta categoría.
        </p>
      </Modal>
    </div>
  );
}
