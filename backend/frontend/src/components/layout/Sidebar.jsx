import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  LogOut,
  X,
  Pill,
} from "lucide-react";

import useAuth from "../../context/useAuth";
import { ROLES, ROLE_LABELS } from "../../constants/roles";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `
      flex items-center gap-3 rounded-lg px-3 py-2.5
      text-sm font-medium transition
      ${
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }
    `;

  return (
    <>
      {/* Fondo oscuro en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-64 flex-col
          border-r border-gray-200 bg-white
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Pill size={22} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">Tu Pharmacy</h1>

              <p className="text-xs text-gray-500">Gestión Farmacéutica</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            General
          </p>

          <div className="space-y-1">
            <NavLink to="/" end onClick={onClose} className={linkClass}>
              <LayoutDashboard size={19} />
              Dashboard
            </NavLink>

            <NavLink to="/products" onClick={onClose} className={linkClass}>
              <Package size={19} />
              Inventario
            </NavLink>
          </div>

          {/* Administración */}
          {user?.role === ROLES.ADMIN && (
            <div className="mt-8">
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Administración
              </p>

              <div className="space-y-1">
                <NavLink
                  to="/categories"
                  onClick={onClose}
                  className={linkClass}
                >
                  <Tags size={19} />
                  Categorías
                </NavLink>

                <NavLink to="/users" onClick={onClose} className={linkClass}>
                  <Users size={19} />
                  Usuarios
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        {/* Usuario */}
        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">
                {user?.name}
              </p>

              <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role]}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="
              flex w-full items-center gap-3
              rounded-lg px-3 py-2.5
              text-sm font-medium text-gray-600
              transition
              hover:bg-red-50 hover:text-red-600
            "
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
