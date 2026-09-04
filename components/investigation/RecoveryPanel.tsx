"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCompactINR } from "@/lib/format";
import type { RecoveryPlan } from "@/lib/data/recovery";
import { PlayCircle, ShieldAlert, CheckCircle2, UserCheck, FlaskConical } from "lucide-react";

export function RecoveryPanel({ plan, autoRun }: { plan: RecoveryPlan; autoRun?: boolean }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function runSimulation() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setStageIndex(0);
    plan.stages.forEach((_, i) => {
      setTimeout(() => {
        setStageIndex(i);
        if (i === plan.stages.length - 1) {
          setRunning(false);
          setDone(true);
        }
      }, i * 900);
    });
  }

  useEffect(() => {
    if (!autoRun) return;
    const t = setTimeout(runSimulation, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const currentStage = plan.stages[stageIndex];

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="label-mono text-[10px] text-ink-400">Recovery Simulation</div>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
            <FlaskConical className="h-3 w-3" strokeWidth={2.2} />
            Simulation only — no funds moved
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] text-ink-500">{running || done ? currentStage.label : "Current variance"}</div>
            <div className="mt-1 flex items-baseline gap-3">
              <div className="text-5xl font-semibold tracking-tight text-brand-red tabular">
                <AnimatedNumber value={currentStage.variance} format={formatCompactINR} duration={800} />
              </div>
              <Badge tone={currentStage.percentCorrected === 100 ? "green" : "neutral"}>
                {currentStage.percentCorrected}% corrected
              </Badge>
            </div>
          </div>
          <Button variant="danger" size="lg" onClick={runSimulation} disabled={running}>
            <PlayCircle className="h-4 w-4" strokeWidth={2.3} />
            {running ? "Simulating…" : "Simulate Correction"}
          </Button>
        </div>

        <div className="mt-6 flex items-center gap-2">
          {plan.stages.map((s, i) => (
            <div key={`${s.label}-${i}`} className="flex flex-1 flex-col gap-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                <motion.div
                  className="h-full rounded-full bg-brand-red"
                  initial={{ width: "0%" }}
                  animate={{ width: stageIndex >= i ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[10px] text-ink-400 tabular">{s.percentCorrected}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
          Each step corrects one real settlement batch&apos;s confirmed-confidence total — traceable to the settlement
          batches shown in Blast Radius and Money Flow. The batch still processing is excluded and stays in human
          review below.
        </p>
      </Card>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-green-50">
                  <CheckCircle2 className="h-4 w-4 text-accent-green" strokeWidth={2.2} />
                </span>
                <div>
                  <div className="text-lg font-semibold text-ink-900 tabular">{plan.autoCorrectable}</div>
                  <div className="text-xs text-ink-500">high-confidence records — auto-correctable</div>
                </div>
              </Card>
              <Card className="flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-amber-50">
                  <ShieldAlert className="h-4 w-4 text-accent-amber" strokeWidth={2.2} />
                </span>
                <div>
                  <div className="text-lg font-semibold text-ink-900 tabular">{plan.requiresReview}</div>
                  <div className="text-xs text-ink-500">records require human review</div>
                </div>
              </Card>
            </div>

            <Card className="flex items-center gap-3 border-brand-red-200 bg-brand-red-50/60 p-4">
              <UserCheck className="h-5 w-5 shrink-0 text-brand-red" strokeWidth={2.2} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-brand-red">Human approval required</div>
                <div className="text-[12px] text-ink-500">
                  This is a simulation only — no funds have moved. A reviewer must approve before any correction is executed.
                </div>
              </div>
              <Badge tone="red">Awaiting approval</Badge>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
