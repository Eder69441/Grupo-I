import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../context/useAuth";

export default function RoleRoute({ roles }) {
  const { user } = useAuth();

  if (!roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
