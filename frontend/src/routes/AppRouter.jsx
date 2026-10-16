import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import MainLayout from "../components/layout/MainLayout";
import Spinner from "../components/common/Spinner";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import PublicRoute from "./PublicRoute";

import { ROLES } from "../constants/roles";

// Páginas cargadas bajo demanda
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Products = lazy(() => import("../pages/Products"));
const AddProduct = lazy(() => import("../pages/AddProduct"));
const EditProduct = lazy(() => import("../pages/EditProduct"));
const Movements = lazy(() => import("../pages/Movements"));
const Users = lazy(() => import("../pages/Users"));
const Categories = lazy(() => import("../pages/Categories"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Locations = lazy(() => import("../pages/Locations"));
const NewSale = lazy(() => import("../pages/NewSale"));
const Sales = lazy(() => import("../pages/Sales"));
const Cash = lazy(() => import("../pages/Cash"));
const Returns = lazy(() => import("../pages/Returns"));
const Settings = lazy(() => import("../pages/Settings"));
const ProductBatches = lazy(() => import("../pages/ProductBatches"));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
              <Route path="returns" element={<Returns />} />
              <Route path="movements" element={<Movements />} />
              <Route path="cash" element={<Cash />} />

              {/* Rutas exclusivas del administrador */}
              <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
                <Route path="products/new" element={<AddProduct />} />
                <Route path="products/edit/:id" element={<EditProduct />} />
                <Route path="products/:id/batches" element={<ProductBatches />}/>
                <Route path="categories" element={<Categories />} />
                <Route path="locations" element={<Locations />} />
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>

          {/* Página no encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
