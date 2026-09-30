import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-blue-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          Página no encontrada
        </h1>
        <p className="mt-2 text-gray-500">La página que buscas no existe.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
