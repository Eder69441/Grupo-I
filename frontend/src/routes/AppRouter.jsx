import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";
import Movements from "../pages/Movements";
import Users from "../pages/Users";
import Categories from "../pages/Categories";
import NotFound from "../pages/NotFound";
import Locations from "../pages/Locations";
import NewSale from "../pages/NewSale";
import Sales from "../pages/Sales";
import Cash from "../pages/Cash";

import MainLayout from "../components/layout/MainLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import PublicRoute from "./PublicRoute";

import { ROLES } from "../constants/roles";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />

            <Route path="products" element={<Products />} />

            <Route path="sales" element={<Sales />} />

            <Route path="sales/new" element={<NewSale />} />

            <Route path="movements" element={<Movements />} />

            <Route path="/cash" element={<Cash />}/>

            {/* Rutas de administrador */}
            <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
              <Route path="products/new" element={<AddProduct />} />

              <Route path="products/edit/:id" element={<EditProduct />} />

              <Route path="categories" element={<Categories />} />

              <Route path="locations" element={<Locations />} />

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
