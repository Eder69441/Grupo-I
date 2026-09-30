import { Menu, UserRound } from "lucide-react";

import useAuth from "../../context/useAuth";
import { ROLE_LABELS } from "../../constants/roles";

export default function Header({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Izquierda */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          <div>
            <p className="text-sm text-gray-500">Bienvenido</p>

            <h2 className="font-semibold text-gray-900">{user?.name}</h2>
          </div>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>

            <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role]}</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <UserRound size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
