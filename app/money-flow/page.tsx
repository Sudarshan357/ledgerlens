import { MoneyFlowGraph } from "@/components/graph/MoneyFlowGraph";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { WebhookSimulator } from "@/components/webhook/WebhookSimulator";
import { getMoneyFlowGraph } from "@/lib/data/graph";
import { getIncidentSummary } from "@/lib/data/incident";
import { Badge } from "@/components/ui/Badge";

export default function MoneyFlowPage() {
  const graph = getMoneyFlowGraph();
  const incident = getIncidentSummary();

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="label-mono text-[10px] text-ink-400">Money Flow</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink-900">
            Order → Payment → Refund / Adjustment → Settlement
          </h1>
        </div>
        <Badge tone="red">{incident.id}</Badge>
      </div>
      <GraphLegend />
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <MoneyFlowGraph graph={graph} incident={incident} />
      </div>
      <WebhookSimulator />
    </div>
  );
}
