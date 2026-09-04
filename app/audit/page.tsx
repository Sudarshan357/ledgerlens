import { getAuditTrail } from "@/lib/data/audit";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import { ListChecks } from "lucide-react";

const ACTOR_TONE: Record<string, string> = {
  "Reconciliation Engine": "bg-accent-blue-50 text-accent-blue",
  "Anomaly Detection": "bg-accent-blue-50 text-accent-blue",
  "Relationship Engine": "bg-accent-blue-50 text-accent-blue",
  "Investigation Engine": "bg-brand-red-50 text-brand-red",
  "AI Investigator": "bg-ink-900 text-canvas",
  System: "bg-canvas text-ink-500",
};

export default function AuditPage() {
  const events = getAuditTrail();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="label-mono text-[10px] text-ink-400">Audit</div>
        <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-ink-900">Investigation Audit Trail</h1>
        <p className="mt-1 text-sm text-ink-500">
          Chronological, tamper-evident log of every automated and human action taken on this incident.
        </p>
      </div>

      <Card className="p-5">
        <div className="label-mono flex items-center gap-2 text-[10px] text-ink-400">
          <ListChecks className="h-3.5 w-3.5" strokeWidth={2.2} />
          INC-20260903-01
        </div>
        <div className="mt-4 flex flex-col divide-y divide-border-subtle">
          {events.map((e) => (
            <div key={e.id} className="flex items-start gap-4 py-3.5">
              <span className="w-14 shrink-0 font-mono text-[11px] text-ink-400">{e.time}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${ACTOR_TONE[e.actor] ?? "bg-canvas text-ink-500"}`}
              >
                {e.actor}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-900">{e.action}</div>
                <div className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{e.detail}</div>
              </div>
              <span className="hidden shrink-0 text-[11px] text-ink-300 sm:block">{formatDateTime(e.isoTime)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
