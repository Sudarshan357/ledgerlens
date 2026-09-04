const ITEMS = [
  { label: "Order / Payment / Refund / Fee / Tax", swatch: "bg-surface border border-border-default" },
  { label: "Flagged — adjustment, batch, merchant, exposure", swatch: "bg-brand-red-50 border border-brand-red-200" },
];

export function GraphLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500">
      {ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${item.swatch}`} />
          {item.label}
        </div>
      ))}
      <span className="label-mono text-[10px] text-ink-400">Hover to trace</span>
    </div>
  );
}
