import { useEffect, useState, useCallback } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import FilterBar from "../components/FilterBar";
import MetricCard from "../components/MetricCard";
import Modal from "../components/Modal";

export default function Dashboard() {
  const { user } = useAuth();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", baseId: "", equipmentTypeId: "" });
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    client.get("/bases").then((r) => setBases(r.data)).catch(() => {});
    client.get("/equipment-types").then((r) => setEquipmentTypes(r.data)).catch(() => {});
  }, []);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.baseId) params.baseId = filters.baseId;
      if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
      const res = await client.get("/dashboard/metrics", { params });
      setMetrics(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  async function openNetMovementDetail() {
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.baseId) params.baseId = filters.baseId;
      if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
      const res = await client.get("/dashboard/net-movement-detail", { params });
      setDetail(res.data);
    } catch (err) {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-5.5">
        <h1 className="m-0 mb-1 text-[22px] font-semibold">Dashboard</h1>
        {user.role === "base_commander" && (
          <p className="m-0 text-text-muted text-[13.5px]">
            Showing data scoped to {user.base ? user.base.name : "your base"}.
          </p>
        )}
      </div>

      <FilterBar
        bases={bases}
        equipmentTypes={equipmentTypes}
        filters={filters}
        onChange={setFilters}
        showBaseFilter={user.role !== "base_commander"}
      />

      {error && (
        <div className="mt-3.5 bg-danger/10 border border-danger/40 text-red-300 px-3.5 py-2.5 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading || !metrics ? (
        <div className="p-10 text-center text-text-muted">Loading metrics…</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5 mb-4">
          <MetricCard label="Opening Balance" value={metrics.openingBalance} tone="neutral" />
          <MetricCard
            label="Net Movement"
            value={metrics.netMovement}
            tone="accent"
            onClick={openNetMovementDetail}
            hint="Click for breakdown"
          />
          <MetricCard label="Closing Balance" value={metrics.closingBalance} tone="neutral" />
          <MetricCard label="Assigned" value={metrics.assigned} tone="info" />
          <MetricCard label="Expended" value={metrics.expended} tone="warn" />
        </div>
      )}

      {!loading && metrics && (
        <div className="flex gap-6 mb-6.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-text-muted uppercase tracking-wide">Purchases</span>
            <strong className="font-mono text-base">{metrics.purchases.toLocaleString()}</strong>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-text-muted uppercase tracking-wide">Transfers In</span>
            <strong className="font-mono text-base">{metrics.transfersIn.toLocaleString()}</strong>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-text-muted uppercase tracking-wide">Transfers Out</span>
            <strong className="font-mono text-base">{metrics.transfersOut.toLocaleString()}</strong>
          </div>
        </div>
      )}

      {showDetail && (
        <Modal title="Net Movement Breakdown" onClose={() => setShowDetail(false)}>
          {detailLoading ? (
            <div className="p-10 text-center text-text-muted">Loading breakdown…</div>
          ) : !detail ? (
            <p>Could not load breakdown.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
              <DetailColumn
                title="Purchases"
                rows={detail.purchases}
                renderRow={(p) => (
                  <li key={p.id} className="text-[12.5px] border-b border-dashed border-border pb-2">
                    <strong>{p.quantity.toLocaleString()}</strong> {p.equipmentType?.name} →{" "}
                    {p.base?.name} <span className="text-text-muted text-[11px] ml-1.5">{p.date}</span>
                  </li>
                )}
              />
              <DetailColumn
                title="Transfers In"
                rows={detail.transfersIn}
                renderRow={(t) => (
                  <li key={t.id} className="text-[12.5px] border-b border-dashed border-border pb-2">
                    <strong>{t.quantity.toLocaleString()}</strong> {t.equipmentType?.name}{" "}
                    {t.fromBase?.name} → {t.toBase?.name}{" "}
                    <span className="text-text-muted text-[11px] ml-1.5">{t.date}</span>
                  </li>
                )}
              />
              <DetailColumn
                title="Transfers Out"
                rows={detail.transfersOut}
                renderRow={(t) => (
                  <li key={t.id} className="text-[12.5px] border-b border-dashed border-border pb-2">
                    <strong>{t.quantity.toLocaleString()}</strong> {t.equipmentType?.name}{" "}
                    {t.fromBase?.name} → {t.toBase?.name}{" "}
                    <span className="text-text-muted text-[11px] ml-1.5">{t.date}</span>
                  </li>
                )}
              />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function DetailColumn({ title, rows, renderRow }) {
  return (
    <div>
      <h4 className="m-0 mb-2.5 text-[13px] text-accent">
        {title} <span className="text-text-muted font-normal">({rows.length})</span>
      </h4>
      {rows.length === 0 ? (
        <p className="text-center text-text-muted py-6">No records in this period.</p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">{rows.map(renderRow)}</ul>
      )}
    </div>
  );
}
