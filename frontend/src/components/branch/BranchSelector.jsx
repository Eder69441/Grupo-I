import { useEffect, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";

import { getBranches } from "../../services/branchService";
import { useBranch } from "../../context/useBranch"

export default function BranchSelector() {
  const { selectedBranchId, changeBranch, isAdmin } = useBranch();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const data = await getBranches();

        if (cancelled) return;

        setBranches(data.filter((branch) => branch.active !== false));
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar las sucursales.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedBranch = branches.find(
    (branch) => branch._id === selectedBranchId,
  );

  if (loading) {
    return (
      <span className="text-sm text-slate-500">Cargando sucursales...</span>
    );
  }

  if (error) {
    return <span className="text-sm text-red-500">{error}</span>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Building2 size={18} className="text-blue-600" />

        <div className="min-w-0">
          <p className="text-xs text-slate-500">Mi sucursal</p>

          <p className="truncate text-sm font-semibold text-slate-800">
            {selectedBranch?.name || "Sin sucursal asignada"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Building2 size={18} className="shrink-0 text-blue-600" />

        <div className="min-w-0 flex-1">
          <label
            htmlFor="active-branch"
            className="block text-xs text-slate-500"
          >
            Sucursal activa
          </label>

          <select
            id="active-branch"
            value={selectedBranchId || ""}
            onChange={(event) => changeBranch(event.target.value || null)}
            className="w-full appearance-none bg-transparent pr-6 text-sm font-semibold text-slate-800 outline-none"
          >
            <option value="" disabled>
              Seleccionar sucursal
            </option>

            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 text-slate-400"
        />
      </div>
    </div>
  );
}
