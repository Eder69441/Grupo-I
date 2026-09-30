import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import UserTable from "../components/users/UserTable";
import UserForm from "../components/users/UserForm";

import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";

import useAuth from "../context/useAuth";

import { getUsers, createUser, deleteUser } from "../services/userService";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  const { user: currentUser } = useAuth();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setError("");

        const response = await getUsers();

        setUsers(response.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "No se pudieron cargar los usuarios.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [success]);

  const handleCreate = async (formData) => {
    try {
      setCreating(true);
      setError("");

      const response = await createUser(formData);

      setUsers((prev) => [...prev, response.data]);

      setSuccess("Usuario creado correctamente.");

      setShowForm(false);

      return true;
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "No se pudo crear el usuario.");

      return false;
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
  };

  const confirmDelete = async () => {
    if (!selectedUser || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteUser(selectedUser.id);

      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

      setSuccess("Usuario eliminado correctamente.");

      setSelectedUser(null);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);

      setError(
        error.response?.data?.message || "No se pudo eliminar el usuario.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Usuarios
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Administra los usuarios y sus roles dentro del sistema.
          </p>
        </div>

        <Button
          variant={showForm ? "secondary" : "primary"}
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? (
            <>
              <X size={18} />
              Cerrar
            </>
          ) : (
            <>
              <Plus size={18} />
              Nuevo usuario
            </>
          )}
        </Button>
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

      {/* Formulario */}
      {showForm && (
        <div className="mt-6">
          <UserForm onSubmit={handleCreate} loading={creating} />
        </div>
      )}

      {/* Usuarios */}
      <div className="mt-6">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <UserTable
            users={users}
            onDelete={handleDelete}
            currentUserId={currentUser?.id}
          />
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => {
          if (!deleting) {
            setSelectedUser(null);
          }
        }}
        title="Eliminar usuario"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setSelectedUser(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>

            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-gray-500">
          ¿Seguro que deseas eliminar al usuario{" "}
          <span className="font-medium text-gray-800">
            {selectedUser?.name}
          </span>
          ?
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
