import { ShieldCheck, Trash2, UserRound, Users } from "lucide-react";

export default function UserTable({ users, onDelete, currentUserId }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Users size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Usuarios</h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Usuarios registrados en el sistema
            </p>
          </div>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {users.length}
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-3.5">Nombre</th>

              <th className="px-6 py-3.5">Usuario</th>

              <th className="px-6 py-3.5">Rol</th>

              <th className="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isCurrentUser = user.id === currentUserId;

                const isAdmin = user.role === "admin";

                return (
                  <tr key={user.id} className="transition hover:bg-gray-50/70">
                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <UserRound size={17} />
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>

                          {isCurrentUser && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              Sesión actual
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        @{user.username}
                      </span>
                    </td>

                    {/* Rol */}
                    <td className="px-6 py-4">
                      <span
                        className={`
                          inline-flex items-center gap-1.5
                          rounded-full px-2.5 py-1
                          text-xs font-medium
                          ${
                            isAdmin
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        `}
                      >
                        {isAdmin && <ShieldCheck size={14} />}

                        {isAdmin ? "Administrador" : "Empleado"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        {!isCurrentUser ? (
                          <button
                            type="button"
                            onClick={() => onDelete(user)}
                            className="
                              inline-flex h-9 w-9
                              items-center justify-center
                              rounded-lg text-gray-500
                              transition
                              hover:bg-red-50
                              hover:text-red-600
                            "
                            title="Eliminar usuario"
                            aria-label={`Eliminar ${user.name}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                            Tú
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
