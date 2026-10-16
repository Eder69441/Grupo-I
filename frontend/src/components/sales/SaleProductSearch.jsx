import { Search, Plus, MapPin, ScanBarcode, Hash } from "lucide-react";

import useCurrency from "../../hooks/useCurrency";

export default function SaleProductSearch({
  products,
  search,
  onSearchChange,
  onAddProduct,
  disabled = false,
}) {
  const normalizedSearch = search.trim().toLowerCase();
  const { formatCurrency } = useCurrency();

  const filteredProducts = products
    .filter((product) => product.active !== false && product.stock > 0)
    .filter((product) => {
      if (!normalizedSearch) return true;

      const locationCode = product.location
        ? `${product.location.section}-${product.location.shelf}-${product.location.level}`.toLowerCase()
        : "";

      const name = String(product.name ?? "").toLowerCase();
      const code = String(product.code ?? "").toLowerCase();
      const barcode = String(product.barcode ?? "").toLowerCase();

      return (
        name.includes(normalizedSearch) ||
        code.includes(normalizedSearch) ||
        barcode.includes(normalizedSearch) ||
        locationCode.includes(normalizedSearch)
      );
    });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Encabezado */}
      <div className="mb-4">
        <h2 className="font-semibold text-gray-900">Buscar medicamentos</h2>

        <p className="mt-1 text-sm text-gray-500">
          Busca por nombre, código, código de barras o ubicación.
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Nombre, código, código de barras..."
          disabled={disabled}
          autoComplete="off"
          className="
            w-full rounded-lg border border-gray-300
            py-2.5 pl-10 pr-4 text-sm
            outline-none transition
            focus:border-emerald-500
            focus:ring-2 focus:ring-emerald-100
            disabled:cursor-not-allowed
            disabled:bg-gray-50
          "
        />
      </div>

      {/* Resultados */}
      <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No se encontraron medicamentos disponibles.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const locationCode = product.location
              ? `${product.location.section}-${product.location.shelf}-${product.location.level}`
              : "Sin ubicación";

            return (
              <div
                key={product._id}
                className="
                  flex items-center justify-between gap-4
                  rounded-lg border border-gray-100
                  p-3 transition hover:bg-gray-50
                "
              >
                {/* Información */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {product.name}
                  </p>

                  {/* Códigos */}
                  {(product.code || product.barcode) && (
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
                      {product.code && (
                        <span className="flex items-center gap-1">
                          <Hash size={13} />
                          {product.code}
                        </span>
                      )}

                      {product.barcode && (
                        <span className="flex items-center gap-1">
                          <ScanBarcode size={13} />
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Precio, stock y ubicación */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(product.price)}
                    </span>

                    <span>Stock: {product.stock}</span>

                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {locationCode}
                    </span>
                  </div>
                </div>

                {/* Agregar */}
                <button
                  type="button"
                  onClick={() => onAddProduct(product)}
                  disabled={disabled}
                  className="
                    inline-flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-lg bg-emerald-50
                    text-emerald-600 transition
                    hover:bg-emerald-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  title="Agregar a la venta"
                >
                  <Plus size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
