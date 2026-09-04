"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ScanSearch, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCompactINR } from "@/lib/format";
import type { IncidentSummary } from "@/lib/data/incident";
import { STAGES } from "./StagePipeline";

const STAGE_BLURB: Record<number, string> = {
  0: "Scanning settlement reconciliation for anomalies…",
  1: "Reconstructing the transaction chain from ledger records…",
  2: "Tracing the suspicious path through the money flow graph…",
  3: "Investigating verified evidence for the strongest-supported cause…",
  4: "Calculating financial blast radius across batches and merchants…",
  5: "Comparing current state against the prior baseline…",
  6: "Preparing a recovery recommendation for human review…",
};

export function FindingsPanel({
  incident,
  evidenceCount,
  progress,
  onOpenEvidence,
}: {
  incident: IncidentSummary;
  evidenceCount: number;
  progress: number;
  onOpenEvidence: () => void;
}) {
  const isIdle = progress < 0;
  const isFinal = progress >= 6;

  return (
    <div className="flex flex-col gap-5">
      <div className="label-mono text-[10px] text-ink-400">Findings</div>

      <AnimatePresence mode="wait">
        {isIdle && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-border-subtle bg-surface p-5 text-center"
          >
            <ScanSearch className="mx-auto h-5 w-5 text-ink-300" strokeWidth={1.8} />
            <p className="mt-3 text-[13px] text-ink-400">Select an incident to begin.</p>
          </motion.div>
        )}

        {!isIdle && !isFinal && (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-border-subtle bg-surface p-5"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="ll-pulse absolute inline-flex h-full w-full rounded-full bg-brand-red" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-red" />
              </span>
              <span className="label-mono text-[10px] text-brand-red">
                Stage {String(progress + 1).padStart(2, "0")} — {STAGES[progress]?.label}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-500">{STAGE_BLURB[progress]}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-[11px] text-ink-400">
              <span>Verified evidence</span>
              <span className="tabular text-ink-700">
                {Math.round((evidenceCount * (progress + 1)) / STAGES.length)} / {evidenceCount}
              </span>
            </div>
          </motion.div>
        )}

        {isFinal && (
          <motion.div
            key="final"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            <div className="rounded-lg border border-brand-red-200 bg-brand-red-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.2} />
                <span className="label-mono text-[10px] text-brand-red">Financial Incident Detected</span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-ink-500">Confirmed discrepancy</div>
                  <div className="mt-0.5 text-xl font-semibold tracking-tight text-brand-red tabular">
                    <AnimatedNumber value={incident.confirmedDiscrepancy} format={formatCompactINR} />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-ink-500">Potential exposure</div>
                  <div className="mt-0.5 text-xl font-semibold tracking-tight text-ink-900 tabular">
                    <AnimatedNumber value={incident.potentialExposure} format={formatCompactINR} />
                  </div>
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
                <span>
                  <span className="tabular text-ink-700">{incident.affectedTransactions}</span> transactions
                </span>
                <span>
                  <span className="tabular text-ink-700">{incident.affectedBatches}</span> settlement batches
                </span>
                <span>
                  <span className="tabular text-ink-700">{incident.affectedMerchants}</span> merchants
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="text-[10px] text-ink-500">Root cause</div>
              <div className="mt-1 text-sm font-medium text-ink-900">{incident.rootCauseShort}</div>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone="red">Confidence {incident.confidence}%</Badge>
                <button
                  onClick={onOpenEvidence}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-canvas px-2.5 py-1 text-[11px] font-medium text-ink-500 transition-colors hover:text-ink-900"
                >
                  <ScanSearch className="h-3 w-3" strokeWidth={2.2} />
                  Verified evidence
                  <span className="tabular text-ink-700">{evidenceCount}</span>
                </button>
              </div>

              {progress >= STAGES.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 border-t border-border-subtle pt-3"
                >
                  <div className="flex items-center gap-2 text-[10px] text-ink-500">
                    <Sparkles className="h-3 w-3" strokeWidth={2.2} />
                    Recommendation
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">
                    Human review required for {incident.reviewTransactionCount} records.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
