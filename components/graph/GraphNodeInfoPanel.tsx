import { Badge } from "@/components/ui/Badge";
import { formatCompactINR, formatDateTime } from "@/lib/format";
import type { FlowNode } from "@/lib/data/graph";
import type { IncidentSummary } from "@/lib/data/incident";

type Row = { label: string; value: string };

function buildRows(node: FlowNode): Row[] {
  const { kind, meta = {}, amount, statusLine } = node.data;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  switch (kind) {
    case "order":
      return [
        { label: "Order ID", value: node.data.primaryLine },
        { label: "Amount", value: inr(amount ?? 0) },
        { label: "Currency", value: String(meta.currency ?? "INR") },
        { label: "Timestamp", value: formatDateTime(String(meta.createdAt ?? "")) },
      ];
    case "payment":
      return [
        { label: "Payment ID", value: node.data.primaryLine },
        { label: "Amount", value: inr(amount ?? 0) },
        { label: "Method", value: String(meta.method ?? "").toUpperCase() },
        { label: "Status", value: statusLine ?? "" },
        { label: "Timestamp", value: formatDateTime(String(meta.capturedAt ?? "")) },
      ];
    case "refund":
      return [
        { label: "Refund ID", value: node.data.primaryLine },
        { label: "Amount", value: inr(amount ?? 0) },
        { label: "Status", value: statusLine ?? "" },
        { label: "Original Payment", value: String(meta.originalPayment ?? "") },
      ];
    case "feeTax":
      return [
        { label: "Fee", value: node.data.primaryLine },
        { label: "Tax (GST)", value: node.data.secondaryLine ?? "" },
        { label: "Fee rate", value: String(meta.feeRate ?? "") },
        { label: "GST rate", value: String(meta.taxRate ?? "") },
        { label: "Related Payment", value: String(meta.relatedPayment ?? "") },
      ];
    case "adjustment":
      return [
        { label: "Adjustment ID", value: node.data.primaryLine },
        { label: "Amount", value: inr(amount ?? 0) },
        { label: "Status", value: node.data.confidence === "review" ? "REVIEW" : "DUPLICATE" },
        { label: "Related Refund", value: String(meta.relatedRefund ?? "") },
      ];
    case "batch":
      return [
        { label: "Settlement ID", value: String(meta.settlementId ?? "") },
        { label: "UTR", value: node.data.primaryLine },
        { label: "Status", value: statusLine ?? "" },
        { label: "Flagged records", value: String(meta.flagged ?? "") },
      ];
    case "merchant":
      return [
        { label: "Merchant", value: node.data.primaryLine },
        { label: "Category", value: String(meta.category ?? "") },
        { label: "Transactions affected", value: node.data.secondaryLine ?? "" },
        { label: "Status", value: "FLAGGED" },
      ];
    case "exposure":
      return [];
  }
}

export function GraphNodeInfoPanel({ node, incident }: { node: FlowNode; incident: IncidentSummary }) {
  const rows = buildRows(node);
  const isAdjustment = node.data.kind === "adjustment";
  const isExposure = node.data.kind === "exposure";
  const isMerchant = node.data.kind === "merchant";

  return (
    <div className="w-64 rounded-lg border border-border-default bg-surface p-3.5 shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between gap-2">
        <span className="label-mono text-[10px] text-ink-400">{node.data.label}</span>
        {node.data.suspicious && <Badge tone="red">Flagged</Badge>}
      </div>

      {isExposure ? (
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <div className="text-[10px] text-ink-500">Confirmed discrepancy</div>
            <div className="text-lg font-semibold text-brand-red tabular">{formatCompactINR(incident.confirmedDiscrepancy)}</div>
          </div>
          <div>
            <div className="text-[10px] text-ink-500">Potential exposure</div>
            <div className="text-lg font-semibold text-ink-900 tabular">{formatCompactINR(incident.potentialExposure)}</div>
          </div>
          <div className="text-[11px] text-ink-500">{incident.affectedTransactions} affected records</div>
        </div>
      ) : (
        <dl className="mt-2.5 flex flex-col gap-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 text-[11px]">
              <dt className="text-ink-500">{r.label}</dt>
              <dd className="truncate font-mono text-ink-900">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {isAdjustment && (
        <div className="mt-3 border-t border-border-subtle pt-2.5">
          <div className="label-mono text-[9px] text-ink-400">Why Flagged</div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-500">{String(node.data.meta?.reason ?? "")}</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div>
              <div className="label-mono text-[9px] text-ink-400">Affected</div>
              <div className="text-[12px] font-medium text-ink-900 tabular">{incident.confirmedTransactionCount} records</div>
            </div>
            <div>
              <div className="label-mono text-[9px] text-ink-400">Impact</div>
              <div className="text-[12px] font-medium text-ink-900 tabular">{incident.affectedBatches} batches</div>
            </div>
          </div>
        </div>
      )}

      {isMerchant && (
        <div className="mt-3 border-t border-border-subtle pt-2.5">
          <div className="label-mono text-[9px] text-ink-400">Exposure</div>
          <div className="text-[12px] font-medium text-brand-red tabular">{formatCompactINR(incident.potentialExposure)}</div>
        </div>
      )}
    </div>
  );
}
