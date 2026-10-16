import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

import SaleProductSearch from "../components/sales/SaleProductSearch";
import SaleCart from "../components/sales/SaleCart";
import PaymentTerminal from "../components/sales/PaymentTerminal";
import ProductCodeScanner from "../components/sales/ProductCodeScanner";

import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";
import Spinner from "../components/common/Spinner";

import { getProducts } from "../services/productService";
import { createSale } from "../services/saleService";

export default function NewSale() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [showPaymentTerminal, setShowPaymentTerminal] = useState(false);
  const [approvedPayment, setApprovedPayment] = useState(null);

  const loadProducts = async () => {
    try {
      const response = await getProducts();

      setProducts(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "No se pudieron actualizar los medicamentos.",
      );
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();

        setProducts(response.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "No se pudieron cargar los medicamentos.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const invalidateApprovedPayment = () => {
    setApprovedPayment(null);
    setSuccess("");
  };

  const handleAddProduct = (product) => {
    if (saving || showPaymentTerminal) return;
    invalidateApprovedPayment();

    setError("");
    setSuccess("");

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product._id === product._id,
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ];
    });
  };

  const handleScanProduct = async (input) => {
    if (saving || showPaymentTerminal || loading) {
      return false;
    }

    const rawInput = String(input).trim();

    if (!rawInput) return false;

    let quantity = 1;
    let productCode = rawInput;

    // Formato opcional: cantidad*código
    if (rawInput.includes("*")) {
      const match = rawInput.match(/^(\d+)\*(.+)$/);

      if (!match) {
        setError("Formato inválido. Ejemplo: 3*MED-001");
        return false;
      }

      quantity = Number(match[1]);
      productCode = match[2].trim();

      if (!Number.isSafeInteger(quantity) || quantity <= 0 || !productCode) {
        setError("Introduce una cantidad válida mayor que cero.");
        return false;
      }
    }

    const normalizedCode = productCode.toLowerCase();

    const product = products.find((item) => {
      const internalCode = String(item.code ?? "")
        .trim()
        .toLowerCase();

      const barcode = String(item.barcode ?? "")
        .trim()
        .toLowerCase();

      return internalCode === normalizedCode || barcode === normalizedCode;
    });

    if (!product) {
      setError(`No existe un producto con el código "${productCode}".`);
      return false;
    }

    if (product.active === false) {
      setError(`El producto "${product.name}" está desactivado.`);
      return false;
    }

    const stock = Number(product.stock);

    if (!Number.isFinite(stock) || stock <= 0) {
      setError(`El producto "${product.name}" no tiene existencias.`);
      return false;
    }

    const existingItem = cart.find((item) => item.product._id === product._id);

    const currentQuantity = existingItem?.quantity || 0;
    const newQuantity = currentQuantity + quantity;

    if (newQuantity > stock) {
      setError(
        `Stock insuficiente para "${product.name}". ` +
          `Disponible: ${stock}. ` +
          `En carrito: ${currentQuantity}. ` +
          `Solicitado: ${quantity}.`,
      );

      return false;
    }

    // Actualizar carrito con la cantidad solicitada
    invalidateApprovedPayment();
    setError("");
    setSuccess("");

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product._id === product._id,
      );

      if (existing) {
        return currentCart.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity,
        },
      ];
    });

    return {
      name: product.name,
      quantity: newQuantity,
      added: quantity,
    };
  };

  const handleIncrease = (productId) => {
    if (saving || showPaymentTerminal) return;
    invalidateApprovedPayment();

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.product._id !== productId) {
          return item;
        }

        if (item.quantity >= item.product.stock) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }),
    );
  };

  const handleDecrease = (productId) => {
    if (saving || showPaymentTerminal) return;
    invalidateApprovedPayment();

    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product._id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleQuantityChange = (productId, value) => {
    if (saving || showPaymentTerminal) return;
    invalidateApprovedPayment();

    const quantity = Number(value);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.product._id !== productId) {
          return item;
        }
        const newQuantity = Math.min(quantity, item.product.stock);

        return {
          ...item,
          quantity: newQuantity,
        };
      }),
    );
  };

  const handleRemove = (productId) => {
    if (saving || showPaymentTerminal) return;

    invalidateApprovedPayment();

    setCart((currentCart) =>
      currentCart.filter((item) => item.product._id !== productId),
    );
  };

  const total = cart.reduce(
    (accumulator, item) => accumulator + item.product.price * item.quantity,
    0,
  );

  const numericAmountReceived = Number(amountReceived) || 0;
  const change =
    paymentMethod === "cash" ? Math.max(numericAmountReceived - total, 0) : 0;
  const insufficientCash =
    paymentMethod === "cash" && numericAmountReceived < total;

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    setAmountReceived("");
    setError("");

    setShowPaymentTerminal(false);
    setApprovedPayment(null);
  };

  const registerSale = async (payment = null) => {
    if (cart.length === 0 || saving) {
      return;
    }

    if (paymentMethod === "cash" && numericAmountReceived < total) {
      setError(
        "El monto recibido no puede ser menor que el total de la venta.",
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),

        paymentMethod,

        amountReceived:
          paymentMethod === "cash" ? numericAmountReceived : total,

        ...(paymentMethod === "card" && payment
          ? { paymentTransaction: payment.id }
          : {}),
      };

      const response = await createSale(payload);

      setCart([]);
      setPaymentMethod("cash");
      setAmountReceived("");
      setSearch("");
      setApprovedPayment(null);
      setShowPaymentTerminal(false);

      setSuccess(`Venta ${response.data.saleNumber} registrada correctamente.`);

      await loadProducts();
    } catch (error) {
      console.error(error);

      if (paymentMethod === "card" && !error.response) {
        setError(
          "No se pudo confirmar el resultado de la venta con tarjeta. " +
            "Consulta el historial de ventas antes de intentar nuevamente.",
        );
      } else {
        setError(
          error.response?.data?.message || "No se pudo completar la venta.",
        );
      }

      await loadProducts();
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentApproved = async (transaction) => {
    if (transaction.status !== "approved" || saving) {
      return;
    }

    setApprovedPayment(transaction);
    setShowPaymentTerminal(false);

    await registerSale(transaction);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0 || saving) {
      return;
    }

    if (paymentMethod === "card") {
      if (approvedPayment) {
        setError(
          "Existe una autorización POS anterior. " +
            "Verifica primero el historial de ventas antes de reintentar.",
        );

        return;
      }

      setShowPaymentTerminal(true);
      return;
    }

    registerSale();
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShoppingCart size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Nueva venta
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Busca medicamentos y agrégalos a la venta.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Mensaje de éxito */}
      {success && (
        <div className="mb-6">
          <SuccessMessage message={success} onClose={() => setSuccess("")} />
        </div>
      )}
      {/* Escáner de productos */}
      {!loading && (
        <div className="mb-6">
          <ProductCodeScanner
            onScan={handleScanProduct}
            disabled={saving || showPaymentTerminal}
          />
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Buscador */}
          <SaleProductSearch
            products={products}
            search={search}
            onSearchChange={setSearch}
            onAddProduct={handleAddProduct}
            disabled={saving || showPaymentTerminal}
          />

          {/* Carrito + pago */}
          <SaleCart
            items={cart}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
            total={total}
            onCompleteSale={handleCompleteSale}
            saving={saving}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={handlePaymentMethodChange}
            amountReceived={amountReceived}
            onAmountReceivedChange={setAmountReceived}
            change={change}
            insufficientCash={insufficientCash}
            approvedPayment={approvedPayment}
          />
        </div>
      )}
      {/* Terminal POS simulada */}
      {showPaymentTerminal && (
        <PaymentTerminal
          total={total}
          items={cart}
          onClose={() => setShowPaymentTerminal(false)}
          onApproved={handlePaymentApproved}
        />
      )}
    </div>
  );
}
