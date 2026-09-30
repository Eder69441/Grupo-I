import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductForm from "../components/products/ProductForm";
import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";

import { createProduct } from "../services/productService";
import { getCategories } from "../services/categoryService";

export default function AddProduct() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setError("");

        const response = await getCategories();

        setCategories(response.data);
      } catch (error) {
        console.error("Error al cargar las categorías:", error);

        setError(
          error.response?.data?.message ||
            "No se pudieron cargar las categorías.",
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError("");

      await createProduct({
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
      });

      navigate("/products", {
        state: {
          successMessage: "Producto creado correctamente.",
        },
      });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo crear el producto.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Agregar producto
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Registra un nuevo medicamento en el inventario.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Formulario */}
      <div className="mt-6">
        {loadingCategories ? (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <ProductForm
            categories={categories}
            onSubmit={handleSubmit}
            buttonText="Guardar producto"
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
