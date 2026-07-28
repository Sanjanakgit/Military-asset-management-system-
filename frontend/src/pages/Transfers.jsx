import { useEffect, useState, useCallback } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import FilterBar from "../components/FilterBar";

const emptyForm = { fromBaseId: "", toBaseId: "", equipmentTypeId: "", quantity: "", date: "", notes: "" };

const fieldLabel = "flex flex-col gap-1.5 text-[11.5px] text-text-muted uppercase tracking-wide";
const fieldInput =
  "bg-panel-raised border border-border rounded-md px-2.5 py-2.5 text-text min-w-[160px] focus:outline-none focus:border-accent normal-case disabled:opacity-60";

const statusClasses = {
  completed: "bg-info/15 text-info",
  assigned: "bg-info/15 text-info",
  returned: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
  in_transit: "bg-accent/15 text-accent",
};

function StatusBadge({ status }) {
  return (
    <span className={`font-mono text-[11px] px-2 py-1 rounded uppercase tracking-wide ${statusClasses[status] || ""}`}>
      {status}
    </span>
  );
}

export default function Transfers() {
  const { user } = useAuth();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", baseId: "", equipmentTypeId: "" });
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    fromBaseId: user.role === "base_commander" ? String(user.baseId) : "",
  }));
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/bases").then((r) => setBases(r.data)).catch(() => {});
    client.get("/equipment-types").then((r) => setEquipmentTypes(r.data)).catch(() => {});
  }, []);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.baseId) params.baseId = filters.baseId;
      if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
      const res = await client.get("/transfers", { params });
      setTransfers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transfers.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload = {
        fromBaseId: Number(form.fromBaseId),
        toBaseId: Number(form.toBaseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
        date: form.date,
        notes: form.notes || undefined,
      };
      await client.post("/transfers", payload);
      setForm({ ...emptyForm, fromBaseId: user.role === "base_commander" ? String(user.baseId) : "" });
      loadTransfers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to record transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-5.5">
        <h1 className="m-0 mb-1 text-[22px] font-semibold">Transfers</h1>
        <p className="m-0 text-text-muted text-[13.5px]">Move assets between bases with a full timestamped history.</p>
      </div>

      <div className="bg-panel border border-border rounded-lg px-5.5 py-5 mb-5.5">
        <h3 className="m-0 mb-4 text-[15px] font-semibold">Initiate a transfer</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3.5 items-end">
          <label className={fieldLabel}>
            From base
            <select
              className={fieldInput}
              value={form.fromBaseId}
              onChange={(e) => setForm({ ...form, fromBaseId: e.target.value })}
              disabled={user.role === "base_commander"}
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
          <label className={fieldLabel}>
            To base
            <select
              className={fieldInput}
              value={form.toBaseId}
              onChange={(e) => setForm({ ...form, toBaseId: e.target.value })}
              required
            >
              <option value="">Select base</option>
              {bases
                .filter((b) => String(b.id) !== String(form.fromBaseId))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </label>
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
            Date
            <input
              type="date"
              className={fieldInput}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
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
              {submitting ? "Saving…" : "Record transfer"}
            </button>
          </div>
        </form>
        {formError && (
          <div className="mt-3.5 bg-danger/10 border border-danger/40 text-red-300 px-3.5 py-2.5 rounded-md text-sm">
            {formError}
          </div>
        )}
        {user.role === "base_commander" && (
          <p className="mt-3 text-[12.5px] text-text-muted">
            As a base commander, transfers you initiate must originate from {user.base?.name}.
          </p>
        )}
      </div>

      <div className="bg-panel border border-border rounded-lg px-5.5 py-5 mb-5.5">
        <h3 className="m-0 mb-4 text-[15px] font-semibold">Transfer history</h3>
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
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">From</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">To</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Equipment</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Quantity</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Status</th>
                <th className="text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border">Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-text-muted py-6">
                    No transfers match the current filters.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{t.date}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{t.fromBase?.name}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{t.toBase?.name}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{t.equipmentType?.name}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{t.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-2.5 border-b border-white/[0.03]">{t.creator?.fullName || "—"}</td>
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
