const fieldLabel = "text-[11px] text-text-muted uppercase tracking-wide";
const fieldInput =
  "bg-panel-raised border border-border rounded-md px-2.5 py-2 text-text min-w-[150px] focus:outline-none focus:border-accent";

export default function FilterBar({
  bases,
  equipmentTypes,
  filters,
  onChange,
  showBaseFilter = true,
}) {
  function set(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="flex flex-wrap gap-3.5 items-end mb-5 pb-4.5 border-b border-border">
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>From</label>
        <input
          type="date"
          className={fieldInput}
          value={filters.startDate || ""}
          onChange={(e) => set("startDate", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>To</label>
        <input
          type="date"
          className={fieldInput}
          value={filters.endDate || ""}
          onChange={(e) => set("endDate", e.target.value)}
        />
      </div>

      {showBaseFilter && (
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel}>Base</label>
          <select
            className={fieldInput}
            value={filters.baseId || ""}
            onChange={(e) => set("baseId", e.target.value)}
          >
            <option value="">All bases</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>Equipment type</label>
        <select
          className={fieldInput}
          value={filters.equipmentTypeId || ""}
          onChange={(e) => set("equipmentTypeId", e.target.value)}
        >
          <option value="">All equipment</option>
          {equipmentTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="bg-transparent text-text-muted border border-border px-3.5 py-2 rounded-md cursor-pointer hover:border-accent hover:text-text"
        onClick={() => onChange({ startDate: "", endDate: "", baseId: "", equipmentTypeId: "" })}
      >
        Clear filters
      </button>
    </div>
  );
}
