import { useState } from "react";
import {
  Plus,
  UserRound,
  AtSign,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import Button from "../common/Button";

export default function UserForm({ onSubmit, loading = false }) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "employee",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }

    if (!form.username.trim()) {
      newErrors.username = "El usuario es obligatorio.";
    }

    if (!form.password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (form.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (!["admin", "employee"].includes(form.role)) {
      newErrors.role = "Selecciona un rol válido.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(form);

    if (success) {
      setForm({
        name: "",
        username: "",
        password: "",
        role: "employee",
      });

      setErrors({});
    }
  };

  const inputClass = `
    w-full rounded-lg
    border border-gray-300
    px-4 py-2.5
    text-sm text-gray-700
    outline-none transition
    placeholder:text-gray-400
    focus:border-emerald-500
    focus:ring-2 focus:ring-emerald-100
    disabled:cursor-not-allowed
    disabled:bg-gray-50
  `;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="
        rounded-xl border border-gray-200
        bg-white p-6 shadow-sm
      "
    >
      {/* Encabezado */}
      <div className="mb-6 flex items-start gap-3">
        <div
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-lg bg-emerald-50
            text-emerald-600
          "
        >
          <UserRound size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Nuevo usuario</h2>

          <p className="mt-1 text-sm text-gray-500">
            Registra un usuario y asigna su nivel de acceso.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Nombre */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Nombre
          </label>

          <div className="relative">
            <UserRound
              size={18}
              className="
                absolute left-3 top-1/2
                -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              placeholder="Nombre completo"
              className={`${inputClass} pl-10`}
            />
          </div>

          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Usuario */}
        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Usuario
          </label>

          <div className="relative">
            <AtSign
              size={18}
              className="
                absolute left-3 top-1/2
                -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
              placeholder="Nombre de usuario"
              autoComplete="off"
              className={`${inputClass} pl-10`}
            />
          </div>

          {errors.username && (
            <p className="mt-1.5 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="
                absolute left-3 top-1/2
                -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className={`${inputClass} pl-10`}
            />
          </div>

          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Rol */}
        <div>
          <label
            htmlFor="role"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Rol
          </label>

          <div className="relative">
            <ShieldCheck
              size={18}
              className="
                pointer-events-none
                absolute left-3 top-1/2
                -translate-y-1/2 text-gray-400
              "
            />

            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={loading}
              className={`${inputClass} pl-10`}
            >
              <option value="employee">Empleado</option>

              <option value="admin">Administrador</option>
            </select>
          </div>

          {errors.role && (
            <p className="mt-1.5 text-sm text-red-600">{errors.role}</p>
          )}
        </div>
      </div>

      {/* Acción */}
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={loading}>
          {!loading && <Plus size={18} />}

          {loading ? "Creando..." : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
