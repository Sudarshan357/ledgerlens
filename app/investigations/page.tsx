import { Suspense } from "react";
import { InvestigationConsole } from "@/components/console/InvestigationConsole";
import { getIncidentSummary } from "@/lib/data/incident";
import { getEvidence } from "@/lib/data/evidence";
import { getBlastRadius } from "@/lib/data/blastRadius";
import { getComparison } from "@/lib/data/compare";
import { getTimeline } from "@/lib/data/timeline";
import { getRecoveryPlan } from "@/lib/data/recovery";
import { getMoneyFlowGraph } from "@/lib/data/graph";
import { generateInvestigationNarrative, generateComparisonNarrative } from "@/lib/ai/investigator";

export default async function InvestigationsPage() {
  const incident = getIncidentSummary();
  const evidence = getEvidence();
  const blast = getBlastRadius();
  const comparison = getComparison();
  const timeline = getTimeline();
  const recovery = getRecoveryPlan();
  const graph = getMoneyFlowGraph();
  const [narrative, comparisonNarrative] = await Promise.all([
    generateInvestigationNarrative({ incident, evidence }),
    generateComparisonNarrative(comparison),
  ]);

  return (
    <Suspense fallback={<div className="text-sm text-ink-400">Loading investigation…</div>}>
      <InvestigationConsole
        incident={incident}
        evidence={evidence}
        narrative={narrative}
        comparisonNarrative={comparisonNarrative}
        blast={blast}
        comparison={comparison}
        timeline={timeline}
        recovery={recovery}
        graph={graph}
      />
    </Suspense>
  );
}
