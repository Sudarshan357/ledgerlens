import { Badge } from "@/components/ui/Badge";
import { formatCompactINR, formatINR } from "@/lib/format";
import type { BlastNode } from "@/lib/data/blastRadiusGraph";

type Row = { label: string; value: string };

function buildRows(node: BlastNode): Row[] {
  const { kind, meta, amount, count } = node;
  switch (kind) {
    case "incident":
      return [
        { label: "Pattern", value: node.primaryLine },
        { label: "Confidence", value: `${meta.confidence}%` },
        { label: "First occurrence", value: String(meta.firstOccurrence) },
        { label: "Confirmed impact", value: formatCompactINR(amount ?? 0) },
      ];
    case "transactions":
      return [
        { label: "Affected", value: String(count) },
        { label: "Confirmed", value: String(meta.confirmed) },
        { label: "Under review", value: String(meta.review) },
        { label: "Potential exposure", value: formatCompactINR(amount ?? 0) },
      ];
    case "refunds":
      return [
        { label: "Duplicated refunds", value: String(count) },
        { label: "Total refunded", value: formatCompactINR(amount ?? 0) },
      ];
    case "feesTaxes":
      return [
        { label: "Related records", value: String(count) },
        { label: "Total fees + tax", value: formatINR(amount ?? 0) },
      ];
    case "batch":
      return [
        { label: "Settlement ID", value: String(meta.batchId) },
        { label: "UTR", value: node.primaryLine },
        { label: "Status", value: String(meta.status).toUpperCase() },
        { label: "Records", value: String(count) },
        { label: "Exposure", value: formatINR(amount ?? 0) },
        { label: "Related merchant", value: String(meta.merchant) },
      ];
    case "merchant":
      return [
        { label: "Merchant", value: node.primaryLine },
        { label: "Category", value: String(meta.category) },
        { label: "Affected records", value: String(count) },
        { label: "Settlement batches", value: String(meta.batches) },
        { label: "Exposure", value: formatINR(amount ?? 0) },
      ];
  }
}

export function BlastRadiusDetailPanel({ node }: { node: BlastNode }) {
  const rows = buildRows(node);
  const isIncident = node.kind === "incident";

  return (
    <div className="w-64 rounded-lg border border-border-default bg-surface p-3.5 shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between gap-2">
        <span className="label-mono text-[10px] text-ink-400">{node.label}</span>
        {isIncident && <Badge tone="red">Flagged</Badge>}
      </div>
      <dl className="mt-2.5 flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 text-[11px]">
            <dt className="text-ink-500">{r.label}</dt>
            <dd className="truncate font-mono text-ink-900">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
