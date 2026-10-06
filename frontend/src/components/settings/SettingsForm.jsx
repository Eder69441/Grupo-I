import { useState } from "react";

import { Building2, FileText, Mail, MapPin, Phone, Save } from "lucide-react";

export default function SettingsForm({
  initialSettings,
  onSubmit,
  saving = false,
}) {
  const [form, setForm] = useState({
    pharmacyName: initialSettings?.pharmacyName || "",

    rnc: initialSettings?.rnc || "",
    phone: initialSettings?.phone || "",
    email: initialSettings?.email || "",
    address: initialSettings?.address || "",
    receiptMessage: initialSettings?.receiptMessage || "",
    currency: initialSettings?.currency || "DOP",
    currencySymbol: initialSettings?.currencySymbol || "RD$",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onSubmit(form);
  };

  const inputClass = `
    w-full rounded-lg border border-gray-300
    bg-white px-3 py-2.5
    text-sm text-gray-800
    outline-none transition
    focus:border-emerald-500
    focus:ring-2 focus:ring-emerald-100
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos de la farmacia */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Building2 size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Información de la farmacia
            </h2>

            <p className="text-sm text-gray-500">
              Datos generales del establecimiento.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nombre de la farmacia *
            </label>

            <input
              name="pharmacyName"
              value={form.pharmacyName}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="Farmacia Central"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              RNC
            </label>

            <div className="relative">
              <FileText
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                name="rnc"
                value={form.rnc}
                onChange={handleChange}
                className={`${inputClass} pl-10`}
                placeholder="000-00000-0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Teléfono
            </label>

            <div className="relative">
              <Phone
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`${inputClass} pl-10`}
                placeholder="809-000-0000"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>

            <div className="relative">
              <Mail
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`${inputClass} pl-10`}
                placeholder="farmacia@correo.com"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Dirección
            </label>

            <div className="relative">
              <MapPin
                size={17}
                className="absolute left-3 top-3 text-gray-400"
              />

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none pl-10`}
                placeholder="Dirección de la farmacia"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Comprobante */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Comprobante de venta</h2>

        <p className="mt-1 text-sm text-gray-500">
          Información utilizada en los recibos.
        </p>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Mensaje del comprobante
          </label>

          <textarea
            name="receiptMessage"
            value={form.receiptMessage}
            onChange={handleChange}
            rows={3}
            maxLength={200}
            className={`${inputClass} resize-none`}
            placeholder="¡Gracias por su compra!"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {form.receiptMessage.length}/200
          </p>
        </div>
      </section>

      {/* Moneda */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Moneda</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Moneda
            </label>

            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="DOP">Peso dominicano (DOP)</option>
              <option value="USD">Dólar estadounidense (USD)</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Símbolo
            </label>

            <input
              name="currencySymbol"
              value={form.currencySymbol}
              onChange={handleChange}
              maxLength={5}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="
            inline-flex items-center justify-center gap-2
            rounded-lg bg-emerald-600
            px-5 py-2.5
            text-sm font-semibold text-white
            transition
            hover:bg-emerald-700
            disabled:cursor-not-allowed
            disabled:bg-emerald-300
          "
        >
          <Save size={18} />

          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}
