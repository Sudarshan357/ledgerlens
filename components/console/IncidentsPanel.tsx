import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCompactINR } from "@/lib/format";
import type { IncidentSummary } from "@/lib/data/incident";

const RECENT = [
  { label: "Fee anomaly", amount: 6800, resolved: true },
  { label: "Refund anomaly", amount: 12400, resolved: true },
  { label: "Settlement delay", amount: 41200, resolved: true },
];

export function IncidentsPanel({ incident }: { incident: IncidentSummary }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="label-mono text-[10px] text-ink-400">Incidents</div>
        <div className="mt-3 rounded-lg border border-brand-red-200 bg-brand-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.3} />
            <span className="label-mono text-[10px] text-brand-red">Active Incident</span>
          </div>
          <div className="mt-2.5 text-sm font-medium leading-snug text-ink-900">Settlement variance</div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-red tabular">
            {formatCompactINR(incident.confirmedDiscrepancy)}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Badge tone="red">Severity {incident.severity}</Badge>
          </div>
        </div>
      </div>

      <div>
        <div className="label-mono text-[10px] text-ink-400">Recent</div>
        <div className="mt-2.5 flex flex-col divide-y divide-border-subtle">
          {RECENT.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-ink-300" strokeWidth={2.2} />
                <span className="text-[12px] text-ink-500">{r.label}</span>
              </div>
              <span className="text-[11px] text-ink-400 tabular">{formatCompactINR(r.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
