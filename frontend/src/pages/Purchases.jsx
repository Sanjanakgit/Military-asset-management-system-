import { useEffect, useState, useCallback } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import FilterBar from "../components/FilterBar";

const emptyForm = { baseId: "", equipmentTypeId: "", quantity: "", unitCost: "", date: "", vendor: "", notes: "" };

const fieldLabel = "flex flex-col gap-1.5 text-[11.5px] text-text-muted uppercase tracking-wide";
const fieldInput =
  "bg-panel-raised border border-border rounded-md px-2.5 py-2.5 text-text min-w-[160px] focus:outline-none focus:border-accent normal-case";

export default function Purchases() {
  const { user } = useAuth();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", baseId: "", equipmentTypeId: "" });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/bases").then((r) => setBases(r.data)).catch(() => {});
    client.get("/equipment-types").then((r) => setEquipmentTypes(r.data)).catch(() => {});
  }, []);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.baseId) params.baseId = filters.baseId;
      if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
      const res = await client.get("/purchases", { params });
      setPurchases(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load purchases.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload = {
        baseId: user.role === "base_commander" ? user.baseId : Number(form.baseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
        unitCost: form.unitCost ? Number(form.unitCost) : undefined,
        date: form.date,
        vendor: form.vendor || undefined,
        notes: form.notes || undefined,
      };
      await client.post("/purchases", payload);
      setForm(emptyForm);
      loadPurchases();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to record purchase.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-5.5">
        <h1 className="m-0 mb-1 text-[22px] font-semibold">Purchases</h1>
        <p className="m-0 text-text-muted text-[13.5px]">Record new asset purchases and review purchase history.</p>
      </div>

      <div className="bg-panel border border-border rounded-lg px-5.5 py-5 mb-5.5">
        <h3 className="m-0 mb-4 text-[15px] font-semibold">Record a purchase</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3.5 items-end">
          {user.role !== "base_commander" && (
            <label className={fieldLabel}>
              Base
              <select
                className={fieldInput}
                value={form.baseId}
                onChange={(e) => setForm({ ...form, baseId: e.target.value })}
                required
              >
                <option value="">Select base</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={fieldLabel}>
            Equipment type
            <select
              className={fieldInput}
              value={form.equipmentTypeId}
              onChange={(e) => setForm({ ...form, equipmentTypeId: e.target.value })}
              required
            >
              <option value="">Select equipment</option>
              {equipmentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldLabel}>
            Quantity
            <input
              type="number"
              min="1"
              className={fieldInput}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </label>
          <label className={fieldLabel}>
            Unit cost (optional)
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldInput}
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
            />
          </label>
          <label className={fieldLabel}>
            Date
            <input
              type="date"
              className={fieldInput}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </label>
          <label className={fieldLabel}>
            Vendor (optional)
            <input
              className={fieldInput}
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
          </label>
          <label className={`${fieldLabel} flex-1 min-w-[220px]`}>
            Notes (optional)
            <input
              className={`${fieldInput} w-full`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="flex items-end">
            <button
              className="bg-accent text-[#14150f] border-none px-4.5 py-2.5 rounded-md font-semibold cursor-pointer hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Record purchase"}
            </button>
          </div>
        </form>
        {formError && (
          <div className="mt-3.5 bg-danger/10 border border-danger/40 text-red-300 px-3.5 py-2.5 rounded-md text-sm">
            {formError}
          </div>
        )}
      </div>

      <div className="bg-panel border border-border rounded-lg px-5.5 py-5 mb-5.5">
        <h3 className="m-0 mb-4 text-[15px] font-semibold">Purchase history</h3>
        <FilterBar
          bases={bases}
          equipmentTypes={equipmentTypes}
          filters={filters}
          onChange={setFilters}
          showBaseFilter={user.role !== "base_commander"}
        />

        {error && (
          <div className="mb-3.5 bg-danger/10 border border-danger/40 text-red-300 px-3.5 py-2.5 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-text-muted">Loading…</div>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Date</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Base</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Equipment</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Quantity</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Unit cost</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Vendor</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-text-muted py-6">
                    No purchases match the current filters.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{p.date}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{p.base?.name}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{p.equipmentType?.name}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{p.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">
                      {p.unitCost ? `$${Number(p.unitCost).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{p.vendor || "—"}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{p.creator?.fullName || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
