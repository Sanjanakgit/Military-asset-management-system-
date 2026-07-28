const toneBorder = {
  default: "border-l-border",
  neutral: "border-l-olive",
  accent: "border-l-accent",
  info: "border-l-info",
  warn: "border-l-warn",
};

export default function MetricCard({ label, value, tone = "default", onClick, hint }) {
  const clickable = typeof onClick === "function";
  return (
    <div
      className={`bg-panel border border-border ${toneBorder[tone] || toneBorder.default} border-l-[3px] rounded-lg px-5 py-4.5 flex flex-col gap-2 ${
        clickable ? "cursor-pointer transition-all hover:-translate-y-0.5 hover:border-accent" : ""
      }`}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <span className="text-[11.5px] text-text-muted uppercase tracking-wide">{label}</span>
      <span className="font-mono text-2xl font-semibold">{formatNumber(value)}</span>
      {hint && <span className="text-[11px] text-accent">{hint}</span>}
    </div>
  );
}

function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString();
}
