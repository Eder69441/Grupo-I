import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, LogIn, Pill, UserRound } from "lucide-react";

import useAuth from "../context/useAuth";
import useSettings from "../context/useSettings";
import ErrorMessage from "../components/common/ErrorMessage";

import pharmacyImage from "../assets/imagen-4.jpg";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { settings } = useSettings();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Panel izquierdo */}
        {/* Panel visual */}
        <div className="relative hidden overflow-hidden lg:flex lg:min-h-screen">
          {/* Imagen */}
          <img
            src={pharmacyImage}
            alt="Interior de una farmacia"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Capa oscura */}
          <div className="absolute inset-0 bg-emerald-950/75" />

          {/* Degradado */}
          <div className="absolute inset-0 bg-linear-to-t from-emerald-950/80 via-transparent to-emerald-900/20" />

          {/* Contenido */}
          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            {/* Logo */}
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Pill size={26} />
              </div>

              <div>
                <h1 className="text-xl font-bold">{settings.pharmacyName}</h1>

                <p className="text-sm text-emerald-100">Gestión farmacéutica</p>
              </div>
            </div>

            {/* Mensaje */}
            <div className="max-w-xl">
              <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-50 backdrop-blur-sm">
                Inventario · Ventas · Trazabilidad
              </div>

              <h2 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Gestiona tu farmacia desde un solo lugar.
              </h2>

              <p className="mt-5 max-w-lg text-base leading-7 text-emerald-50/90 xl:text-lg">
                Controla medicamentos, existencias, ubicaciones, vencimientos y
                ventas de manera simple y eficiente.
              </p>

              {/* Características */}
              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Inventario</p>

                  <p className="mt-1 text-xs text-emerald-100">
                    Stock y alertas
                  </p>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Ventas</p>

                  <p className="mt-1 text-xs text-emerald-100">
                    Control diario
                  </p>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Ubicaciones
                  </p>

                  <p className="mt-1 text-xs text-emerald-100">
                    Fácil localización
                  </p>
                </div>
              </div>
            </div>

            {/* Pie */}
            <p className="text-sm text-emerald-100/80">
              Sistema de gestión farmacéutica
            </p>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex items-center justify-center bg-white px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            {/* Logo móvil */}
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Pill size={24} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900">{settings.pharmacyName}</h1>

                <p className="text-xs text-gray-500">Gestión farmacéutica</p>
              </div>
            </div>

            {/* Encabezado */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Iniciar sesión
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5">
                <ErrorMessage message={error} />
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Usuario */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Usuario
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Ingresa tu usuario"
                    autoComplete="username"
                    disabled={loading}
                    required
                    className="
                      w-full rounded-lg
                      border border-gray-300
                      py-3 pl-10 pr-4
                      text-sm text-gray-700
                      outline-none transition
                      placeholder:text-gray-400
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-100
                      disabled:cursor-not-allowed
                      disabled:bg-gray-50
                    "
                  />
                </div>
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="
                      w-full rounded-lg
                      border border-gray-300
                      py-3 pl-10 pr-12
                      text-sm text-gray-700
                      outline-none transition
                      placeholder:text-gray-400
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-100
                      disabled:cursor-not-allowed
                      disabled:bg-gray-50
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    className="
                      absolute right-3 top-1/2
                      -translate-y-1/2
                      rounded-md p-1
                      text-gray-400
                      transition
                      hover:bg-gray-100
                      hover:text-gray-600
                      disabled:cursor-not-allowed
                    "
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    title={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="
                  inline-flex w-full
                  items-center justify-center
                  gap-2 rounded-lg
                  bg-emerald-600
                  px-4 py-3
                  text-sm font-semibold
                  text-white
                  transition
                  hover:bg-emerald-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-emerald-200
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {!loading && <LogIn size={18} />}

                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>

            {/* Pie */}
            <p className="mt-8 text-center text-xs text-gray-400">
               {settings.pharmacyName} · Sistema de gestión farmacéutica
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
