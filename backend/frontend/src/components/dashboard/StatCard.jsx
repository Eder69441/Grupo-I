export default function StatCard({
  title,
  value,
  icon: Icon,
  variant = "emerald",
}) {
  const variants = {
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
    },
    red: {
      icon: "bg-red-50 text-red-600",
    },
    blue: {
      icon: "bg-blue-50 text-blue-600",
    },
  };

  const selectedVariant =
    variants[variant] || variants.emerald;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedVariant.icon}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}