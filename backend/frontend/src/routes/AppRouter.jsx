import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";
import Users from "../pages/Users";
import NotFound from "../pages/NotFound";
import Categories from "../pages/Categories"

import MainLayout from "../components/layout/MainLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import PublicRoute from "./PublicRoute";

import { ROLES } from "../constants/roles";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />

            <Route path="products" element={<Products />} />

            {/* Ruta de administrador */}

            <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
              <Route path="products/new" element={<AddProduct />} />

              <Route path="products/edit/:id" element={<EditProduct />} />

                <Route path="categories" element={<Categories />}/>

              <Route path="users" element={<Users />} />
            </Route>
          </Route>
        </Route>
        {/* Error 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
