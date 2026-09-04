"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StagePipeline, STAGES } from "./StagePipeline";
import { IncidentsPanel } from "./IncidentsPanel";
import { FindingsPanel } from "./FindingsPanel";
import { MoneyFlowGraph } from "@/components/graph/MoneyFlowGraph";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { TimelinePanel } from "@/components/investigation/TimelinePanel";
import { EvidencePanel } from "@/components/investigation/EvidencePanel";
import { BlastRadiusPanel } from "@/components/investigation/BlastRadiusPanel";
import { ComparePanel } from "@/components/investigation/ComparePanel";
import { RecoveryPanel } from "@/components/investigation/RecoveryPanel";
import type { IncidentSummary } from "@/lib/data/incident";
import type { EvidenceFact } from "@/lib/data/evidence";
import type { InvestigatorNarrative, ComparisonNarrative } from "@/lib/ai/investigator";
import type { BlastRadius } from "@/lib/data/blastRadius";
import type { Comparison } from "@/lib/data/compare";
import type { TimelineEvent } from "@/lib/data/timeline";
import type { RecoveryPlan } from "@/lib/data/recovery";
import type { MoneyFlowGraph as MoneyFlowGraphData } from "@/lib/data/graph";

// Hold time (ms) each stage stays active before the next one starts.
const STAGE_HOLDS = [2000, 2800, 2600, 2600, 3000, 2800, 3400];

export function InvestigationConsole(props: {
  incident: IncidentSummary;
  evidence: EvidenceFact[];
  narrative: InvestigatorNarrative;
  comparisonNarrative: ComparisonNarrative;
  blast: BlastRadius;
  comparison: Comparison;
  timeline: TimelineEvent[];
  recovery: RecoveryPlan;
  graph: MoneyFlowGraphData;
}) {
  const searchParams = useSearchParams();
  const autoplay = searchParams.get("autoplay") === "1";

  // Default (direct visit): the incident is already investigated, so the
  // console opens fully resolved — nothing is gated behind a click. Autoplay
  // (or the in-console replay button) resets to -1 and plays the pipeline.
  const [progress, setProgress] = useState(autoplay ? -1 : STAGES.length);
  const [runToken, setRunToken] = useState(0);
  const evidenceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoplay && runToken === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- (re)starts the staged reveal whenever autoplay is requested or the in-console replay button is clicked
    setProgress(-1);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 700;
    STAGES.forEach((_, i) => {
      timers.push(setTimeout(() => setProgress(i), cumulative));
      cumulative += STAGE_HOLDS[i];
    });
    timers.push(setTimeout(() => setProgress(STAGES.length), cumulative));
    return () => timers.forEach(clearTimeout);
  }, [autoplay, runToken]);

  const isRunning = progress >= 0 && progress < STAGES.length;
  // Reveal order mirrors the pipeline stages and the intended narrative:
  // what happened (Detect) -> how it unfolded (Reconstruct/Trace) -> why
  // (Investigate/Evidence) -> how big (Measure/Blast Radius) -> what changed
  // (Explain/Before-After) -> what can we safely do (Recommend/Recovery).
  const showGraph = progress >= 0;
  const showTimeline = progress >= 1;
  const showEvidence = progress >= 3;
  const showBlast = progress >= 4;
  const showCompare = progress >= 5;
  const showRecovery = progress >= STAGES.length - 1;
  const hasRunOnce = autoplay || runToken > 0;

  function scrollToEvidence() {
    evidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[20%_58%_22%]">
        <div className="order-2 xl:order-1">
          <IncidentsPanel incident={props.incident} />
        </div>

        <div className="order-1 flex flex-col gap-8 xl:order-2">
          <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="label-mono text-[10px] text-ink-400">Investigation</div>
              <Button variant="danger" size="sm" onClick={() => setRunToken((t) => t + 1)} disabled={isRunning}>
                {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" strokeWidth={2.4} />}
                {isRunning ? "Investigating…" : "Run Incident Simulation"}
              </Button>
            </div>
            <StagePipeline progress={progress} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="label-mono text-[10px] text-ink-400">Money Flow</div>
              {showGraph && <Badge tone="red">{props.incident.id}</Badge>}
            </div>
            <GraphLegend />
            <div className="h-[520px] overflow-hidden rounded-lg border border-border-subtle bg-canvas">
              {showGraph ? (
                <MoneyFlowGraph graph={props.graph} incident={props.incident} />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-[13px] text-ink-400">
                  Run the investigation to reconstruct the money flow.
                </div>
              )}
            </div>
          </div>

          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="border-t border-border-subtle pt-8"
            >
              <TimelinePanel timeline={props.timeline} />
            </motion.div>
          )}

          {showEvidence && (
            <motion.div
              ref={evidenceRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="border-t border-border-subtle pt-8"
            >
              <div className="label-mono mb-3 text-[10px] text-ink-400">Evidence</div>
              <EvidencePanel evidence={props.evidence} narrative={props.narrative} />
            </motion.div>
          )}

          {showBlast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="border-t border-border-subtle pt-8"
            >
              <BlastRadiusPanel blast={props.blast} />
            </motion.div>
          )}

          {showCompare && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="border-t border-border-subtle pt-8"
            >
              <ComparePanel comparison={props.comparison} narrative={props.comparisonNarrative} />
            </motion.div>
          )}

          {showRecovery && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="border-t border-border-subtle pt-8"
            >
              <RecoveryPanel plan={props.recovery} autoRun={hasRunOnce} />
            </motion.div>
          )}
        </div>

        <div className="order-3">
          <div className="xl:sticky xl:top-[4.5rem]">
            <FindingsPanel
              incident={props.incident}
              evidenceCount={props.evidence.length}
              progress={progress}
              onOpenEvidence={scrollToEvidence}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
