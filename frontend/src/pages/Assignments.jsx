import { useEffect, useState, useCallback } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import FilterBar from "../components/FilterBar";

const emptyAssignForm = {
  baseId: "",
  equipmentTypeId: "",
  personnelName: "",
  personnelServiceId: "",
  quantity: "",
  date: "",
  notes: "",
};

const emptyExpendForm = { baseId: "", equipmentTypeId: "", quantity: "", date: "", reason: "" };

const fieldLabel = "flex flex-col gap-1.5 text-[11.5px] text-text-muted uppercase tracking-wide";
const fieldInput =
  "bg-panel-raised border border-border rounded-md px-2.5 py-2.5 text-text min-w-[160px] focus:outline-none focus:border-accent normal-case";
const th = "text-left px-3 py-2.5 text-text-muted text-[11px] uppercase tracking-wide border-b border-border";
const td = "px-3 py-2.5 border-b border-white/[0.03]";

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

export default function Assignments() {
  const { user } = useAuth();
  const [tab, setTab] = useState("assignments");
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", baseId: "", equipmentTypeId: "" });

  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [assignError, setAssignError] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [expenditures, setExpenditures] = useState([]);
  const [expendForm, setExpendForm] = useState(emptyExpendForm);
  const [expendError, setExpendError] = useState("");
  const [expendSubmitting, setExpendSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/bases").then((r) => setBases(r.data)).catch(() => {});
    client.get("/equipment-types").then((r) => setEquipmentTypes(r.data)).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.baseId) params.baseId = filters.baseId;
      if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;

      const [aRes, eRes] = await Promise.all([
        client.get("/assignments", { params }),
        client.get("/expenditures", { params }),
      ]);
      setAssignments(aRes.data);
      setExpenditures(eRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function submitAssignment(e) {
    e.preventDefault();
    setAssignError("");
    setAssignSubmitting(true);
    try {
      const payload = {
        baseId: user.role === "base_commander" ? user.baseId : Number(assignForm.baseId),
        equipmentTypeId: Number(assignForm.equipmentTypeId),
        personnelName: assignForm.personnelName,
        personnelServiceId: assignForm.personnelServiceId || undefined,
        quantity: Number(assignForm.quantity),
        date: assignForm.date,
        notes: assignForm.notes || undefined,
      };
      await client.post("/assignments", payload);
      setAssignForm(emptyAssignForm);
      loadData();
    } catch (err) {
      setAssignError(err.response?.data?.message || "Failed to record assignment.");
    } finally {
      setAssignSubmitting(false);
    }
  }

  async function markReturned(id) {
    try {
      await client.patch(`/assignments/${id}/return`, {});
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update assignment.");
    }
  }

  async function submitExpenditure(e) {
    e.preventDefault();
    setExpendError("");
    setExpendSubmitting(true);
    try {
      const payload = {
        baseId: user.role === "base_commander" ? user.baseId : Number(expendForm.baseId),
        equipmentTypeId: Number(expendForm.equipmentTypeId),
        quantity: Number(expendForm.quantity),
        date: expendForm.date,
        reason: expendForm.reason || undefined,
      };
      await client.post("/expenditures", payload);
      setExpendForm(emptyExpendForm);
      loadData();
    } catch (err) {
      setExpendError(err.response?.data?.message || "Failed to record expenditure.");
    } finally {
      setExpendSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-5.5">
        <h1 className="m-0 mb-1 text-[22px] font-semibold">Assignments &amp; Expenditures</h1>
        <p className="m-0 text-text-muted text-[13.5px]">
          Assign assets to personnel and record expended assets (consumed or lost).
        </p>
      </div>

      <div className="flex gap-1.5 mb-4.5">
        <button
          className={`bg-panel border border-border text-text-muted px-4 py-2 rounded-md cursor-pointer font-medium ${
            tab === "assignments" ? "text-accent border-accent bg-accent/[0.08]" : ""
          }`}
          onClick={() => setTab("assignments")}
        >
          Assignments
        </button>
        <button
          className={`bg-panel border border-border text-text-muted px-4 py-2 rounded-md cursor-pointer font-medium ${
            tab === "expenditures" ? "text-accent border-accent bg-accent/[0.08]" : ""
          }`}
          onClick={() => setTab("expenditures")}
        >
          Expenditures
        </button>
      </div>

      {tab === "assignments" ? (
        <>
          <div className="bg-panel border border-border rounded-lg px-5.5 py-5 mb-5.5">
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Assign an asset</h3>
            <form onSubmit={submitAssignment} className="flex flex-wrap gap-3.5 items-end">
              {user.role !== "base_commander" && (
                <label className={fieldLabel}>
                  Base
                  <select
                    className={fieldInput}
                    value={assignForm.baseId}
                    onChange={(e) => setAssignForm({ ...assignForm, baseId: e.target.value })}
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
                  value={assignForm.equipmentTypeId}
                  onChange={(e) => setAssignForm({ ...assignForm, equipmentTypeId: e.target.value })}
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
                Personnel name
                <input
                  className={fieldInput}
                  value={assignForm.personnelName}
                  onChange={(e) => setAssignForm({ ...assignForm, personnelName: e.target.value })}
                  required
                />
              </label>
              <label className={fieldLabel}>
                Service ID (optional)
                <input
                  className={fieldInput}
                  value={assignForm.personnelServiceId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, personnelServiceId: e.target.value })
                  }
                />
              </label>
              <label className={fieldLabel}>
                Quantity
                <input
                  type="number"
                  min="1"
                  className={fieldInput}
                  value={assignForm.quantity}
                  onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })}
                  required
                />
              </label>
              <label className={fieldLabel}>
                Date
                <input
                  type="date"
                  className={fieldInput}
                  value={assignForm.date}
                  onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                  required
                />
              </label>
              <label className={`${fieldLabel} flex-1 min-w-[220px]`}>
                Notes (optional)
                <input
                  className={`${fieldInput} w-full`}
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                />
              </label>
              <div className="flex items-end">
                <button
                  className="bg-accent text-[#14150f] border-none px-4.5 py-2.5 rounded-md font-semibold cursor-pointer hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={assignSubmitting}
                >
                  {assignSubmitting ? "Saving…" : "Assign asset"}
                </button>
              </div>
            </form>
            {assignError && (
              <div className="mt-3.5 bg-danger/10 border border-danger/40 text-red-300 px-3.5 py-2.5 rounded-md text-sm">
                {assignError}
              </div>
            )}
          </div>

          <div className="bg-panel border border-border rounded-lg px-5.5 py-5 mb-5.5">
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Assignment history</h3>
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
                    <th className={th}>Date</th>
                    <th className={th}>Base</th>
                    <th className={th}>Equipment</th>
                    <th className={th}>Personnel</th>
                    <th className={th}>Quantity</th>
                    <th className={th}>Status</th>
                    <th className={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-text-muted py-6">
                        No assignments match the current filters.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.02]">
                        <td className={td}>{a.date}</td>
                        <td className={td}>{a.base?.name}</td>
                        <td className={td}>{a.equipmentType?.name}</td>
                        <td className={td}>
                          {a.personnelName}
                          {a.personnelServiceId ? ` (${a.personnelServiceId})` : ""}
                        </td>
                        <td className={td}>{a.quantity.toLocaleString()}</td>
                        <td className={td}>
                          <StatusBadge status={a.status} />
                        </td>
                        <td className={td}>
                          {a.status === "assigned" && (
                            <button
                              className="bg-transparent text-text-muted border border-border px-2.5 py-1 rounded-md text-xs cursor-pointer hover:border-accent hover:text-text"
                              onClick={() => markReturned(a.id)}
                            >
                              Mark returned
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="bg-panel border border-border rounded-lg px-5.5 py-5 mb-5.5">
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Record an expenditure</h3>
            <form onSubmit={submitExpenditure} className="flex flex-wrap gap-3.5 items-end">
              {user.role !== "base_commander" && (
                <label className={fieldLabel}>
                  Base
                  <select
                    className={fieldInput}
                    value={expendForm.baseId}
                    onChange={(e) => setExpendForm({ ...expendForm, baseId: e.target.value })}
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
                  value={expendForm.equipmentTypeId}
                  onChange={(e) => setExpendForm({ ...expendForm, equipmentTypeId: e.target.value })}
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
                  value={expendForm.quantity}
                  onChange={(e) => setExpendForm({ ...expendForm, quantity: e.target.value })}
                  required
                />
              </label>
              <label className={fieldLabel}>
                Date
                <input
                  type="date"
                  className={fieldInput}
                  value={expendForm.date}
                  onChange={(e) => setExpendForm({ ...expendForm, date: e.target.value })}
                  required
                />
              </label>
              <label className={`${fieldLabel} flex-1 min-w-[220px]`}>
                Reason (optional)
                <input
                  className={`${fieldInput} w-full`}
                  value={expendForm.reason}
                  onChange={(e) => setExpendForm({ ...expendForm, reason: e.target.value })}
                  placeholder="e.g. training exercise, combat loss"
                />
              </label>
              <div className="flex items-end">
                <button
                  className="bg-accent text-[#14150f] border-none px-4.5 py-2.5 rounded-md font-semibold cursor-pointer hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={expendSubmitting}
                >
                  {expendSubmitting ? "Saving…" : "Record expenditure"}
                </button>
              </div>
            </form>
            {expendError && (
              <div className="mt-3.5 bg-danger/10 border border-danger/40 text-red-300 px-3.5 py-2.5 rounded-md text-sm">
                {expendError}
              </div>
            )}
          </div>

          <div className="bg-panel border border-border rounded-lg px-5.5 py-5 mb-5.5">
            <h3 className="m-0 mb-4 text-[15px] font-semibold">Expenditure history</h3>
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
                    <th className={th}>Date</th>
                    <th className={th}>Base</th>
                    <th className={th}>Equipment</th>
                    <th className={th}>Quantity</th>
                    <th className={th}>Reason</th>
                    <th className={th}>Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {expenditures.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-text-muted py-6">
                        No expenditures match the current filters.
                      </td>
                    </tr>
                  ) : (
                    expenditures.map((ex) => (
                      <tr key={ex.id} className="hover:bg-white/[0.02]">
                        <td className={td}>{ex.date}</td>
                        <td className={td}>{ex.base?.name}</td>
                        <td className={td}>{ex.equipmentType?.name}</td>
                        <td className={td}>{ex.quantity.toLocaleString()}</td>
                        <td className={td}>{ex.reason || "—"}</td>
                        <td className={td}>{ex.creator?.fullName || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
