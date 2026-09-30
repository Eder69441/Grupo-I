import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProductForm from "../components/products/ProductForm";
import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";

import { getProductById, updateProduct } from "../services/productService";

import { getCategories } from "../services/categoryService";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const [productResponse, categoriesResponse] = await Promise.all([
          getProductById(id),
          getCategories(),
        ]);

        const productData = productResponse.data;

        setProduct({
          ...productData,
          expirationDate: productData.expirationDate?.split("T")[0] || "",
        });

        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message || "No se pudieron cargar los datos.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError("");

await updateProduct(id, {
  name: formData.name,
  category: formData.category,
  price: Number(formData.price),
  expirationDate: formData.expirationDate,
});

      navigate("/products", {
        state: {
          successMessage: "Producto actualizado correctamente.",
        },
      });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "No se pudo actualizar el producto.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error && !product) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div>
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Editar producto
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Actualiza la información del medicamento.
        </p>
      </div>

      {/* Error al actualizar */}
      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Formulario */}
      <div className="mt-6">
        <ProductForm
          initialData={product}
          categories={categories}
          onSubmit={handleSubmit}
          buttonText="Actualizar producto"
          loadingText="Actualizando..."
          loading={saving}
          stockReadOnly
        />
      </div>
    </div>
  );
}
