import {
  Search,
  Filter,
  CalendarClock,
} from "lucide-react";

export default function ProductFilters({
  search,
  setSearch,
  category,
  setCategory,
  categories = [],
  expirationStatus,
  setExpirationStatus,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Buscar */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Buscar producto
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre del producto..."
              className="
                w-full rounded-lg border border-gray-300
                py-2.5 pl-10 pr-4
                text-sm text-gray-700
                outline-none transition
                placeholder:text-gray-400
                focus:border-emerald-500
                focus:ring-2 focus:ring-emerald-100
              "
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Categoría
          </label>

          <div className="relative">
            <Filter
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="
                w-full appearance-none rounded-lg
                border border-gray-300
                py-2.5 pl-10 pr-4
                text-sm text-gray-700
                outline-none transition
                focus:border-emerald-500
                focus:ring-2 focus:ring-emerald-100
              "
            >
              <option value="">
                Todas las categorías
              </option>

              {categories.map((item) => (
                <option
                  key={item._id || item.id}
                  value={item.name}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estado de vencimiento */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Estado de vencimiento
          </label>

          <div className="relative">
            <CalendarClock
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={expirationStatus}
              onChange={(e) =>
                setExpirationStatus(e.target.value)
              }
              className="
                w-full appearance-none rounded-lg
                border border-gray-300
                py-2.5 pl-10 pr-4
                text-sm text-gray-700
                outline-none transition
                focus:border-emerald-500
                focus:ring-2 focus:ring-emerald-100
              "
            >
              <option value="">
                Todos los estados
              </option>

              <option value="valid">
                Vigentes
              </option>

              <option value="expiring">
                Próximos a vencer
              </option>

              <option value="expired">
                Vencidos
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}