import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";

import useAuth from "../context/useAuth";
import { getProducts, deleteProduct } from "../services/productService";

import ProductFilters from "../components/products/ProductFilters";
import ProductTable from "../components/products/ProductTable";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";
import SuccessMessage from "../components/common/SuccessMessage";

import { getCategories } from "../services/categoryService";

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const canManage = user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.successMessage || "");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsResponse,
          categoriesResponse
        ] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "No se pudieron cargar los productos.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [success]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory = !category || product.category === category;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = (product) => {
    setSelectedProduct(product);
  };

  const confirmDelete = async () => {
    if (!selectedProduct || deleting) {
      return;
    }

    const productToDelete = selectedProduct;

    try {
      setDeleting(true);
      setError("");
      await deleteProduct(productToDelete.id);

      setProducts((prev) =>
        prev.filter((product) => product.id !== productToDelete.id),
      );

      setSuccess("Producto eliminado correctamente.");
      setSelectedProduct(null);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo eliminar el producto.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Inventario
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gestiona y consulta los medicamentos disponibles.
          </p>
        </div>

        {canManage && (
          <Button onClick={() => navigate("/products/new")}>
            <Plus size={18} />
            Agregar producto
          </Button>
        )}
      </div>

      {/* Mensaje de éxito */}
      {success && (
        <div className="mt-6">
          <SuccessMessage message={success} onClose={() => setSuccess("")} />
        </div>
      )}

      {/* Filtros */}
      <div className="mt-6">
        <ProductFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          categories={categories}
        />
      </div>

      {/* Resultados */}
      <div className="mt-6">
        {loading && (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorMessage message={error} />}

        {!loading && !error && filteredProducts.length === 0 && (
          <EmptyState
            title="No se encontraron productos"
            message="Prueba cambiando la búsqueda o el filtro."
          />
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <ProductTable
            products={filteredProducts}
            onDelete={handleDelete}
            canManage={canManage}
          />
        )}
      </div>

      {/* Modal de eliminación */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => {
          if (!deleting) {
            setSelectedProduct(null);
          }
        }}
        title="Eliminar producto"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setSelectedProduct(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>

            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-gray-500">
          ¿Seguro que deseas eliminar el producto{" "}
          <span className="font-medium text-gray-800">
            {selectedProduct?.name}
          </span>
          ?
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
