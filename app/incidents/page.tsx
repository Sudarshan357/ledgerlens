import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getIncidentSummary } from "@/lib/data/incident";
import { formatCompactINR, formatDateTime } from "@/lib/format";

const RESOLVED_INCIDENTS = [
  {
    id: "INC-20260819-04",
    title: "Delayed settlement batch — netbanking gateway timeout",
    resolvedAt: "2026-08-19T18:42:00+05:30",
    impact: 41200,
    merchants: 1,
  },
  {
    id: "INC-20260803-02",
    title: "Tax rounding mismatch on partial refunds",
    resolvedAt: "2026-08-03T11:05:00+05:30",
    impact: 6800,
    merchants: 2,
  },
];

export default function IncidentsPage() {
  const incident = getIncidentSummary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="label-mono text-[10px] text-ink-400">Incidents</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink-900">All Incidents</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-l-[3px] border-l-brand-red p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red-50">
                <AlertTriangle className="h-4 w-4 text-brand-red" strokeWidth={2.2} />
              </span>
              <div>
                <div className="font-mono text-[11px] text-ink-400">{incident.id}</div>
                <div className="text-sm font-semibold text-ink-900">{incident.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="red">Severity {incident.severity}</Badge>
              <Badge tone="ink">Open</Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <span className="font-semibold text-brand-red tabular">{formatCompactINR(incident.confirmedDiscrepancy)} confirmed</span>
            <span className="text-ink-500 tabular">{incident.affectedTransactions} transactions</span>
            <span className="text-ink-500 tabular">{incident.affectedBatches} settlement batches</span>
            <span className="text-ink-500 tabular">{incident.affectedMerchants} merchants</span>
            <span className="text-ink-400">Detected {formatDateTime(incident.firstOccurrenceAt)}</span>
          </div>
          <div>
            <Link href="/investigations">
              <Button variant="primary">
                Investigate
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="label-mono text-[10px] text-ink-400">Resolved</div>
      <div className="flex flex-col gap-3">
        {RESOLVED_INCIDENTS.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-green-50">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" strokeWidth={2.2} />
              </span>
              <div>
                <div className="font-mono text-[11px] text-ink-400">{r.id}</div>
                <div className="text-sm font-medium text-ink-900">{r.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs text-ink-500">
              <span className="tabular">{formatCompactINR(r.impact)} impact</span>
              <span className="tabular">{r.merchants} merchant{r.merchants > 1 ? "s" : ""}</span>
              <span>Resolved {formatDateTime(r.resolvedAt)}</span>
              <Badge tone="green">Resolved</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
