"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCompactINR, formatINRDigits } from "@/lib/format";
import type { Comparison, StateSnapshot } from "@/lib/data/compare";
import type { ComparisonNarrative } from "@/lib/ai/investigator";
import { cn } from "@/lib/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const } }),
};

type MetricDef = {
  key: keyof Omit<StateSnapshot, "label">;
  label: string;
  isCurrency?: boolean;
  worseWhenHigher: boolean;
};

const METRICS: MetricDef[] = [
  { key: "transactions", label: "Transactions", worseWhenHigher: false },
  { key: "refunds", label: "Refunds", worseWhenHigher: false },
  { key: "failedPayments", label: "Failed payments", worseWhenHigher: true },
  { key: "variance", label: "Variance", isCurrency: true, worseWhenHigher: true },
  { key: "anomalies", label: "Anomalies", worseWhenHigher: true },
  { key: "exposure", label: "Exposure", isCurrency: true, worseWhenHigher: true },
];

export function ComparePanel({ comparison, narrative }: { comparison: Comparison; narrative: ComparisonNarrative }) {
  const { previous, current } = comparison;

  return (
    <div className="flex flex-col gap-5">
      <div className="label-mono text-[10px] text-ink-400">Before / After</div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <Card className="p-5">
            <div className="label-mono text-[10px] text-ink-400">Previous State</div>
            <div className="mt-4 flex flex-col divide-y divide-border-subtle">
              {METRICS.map((m) => (
                <MetricRow key={m.key} label={m.label} value={previous[m.key]} isCurrency={m.isCurrency} />
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
          <Card className="border-brand-red-200 bg-brand-red-50 p-5">
            <div className="label-mono text-[10px] text-brand-red">Current State</div>
            <div className="mt-4 flex flex-col divide-y divide-brand-red-200/60">
              {METRICS.map((m) => {
                const prevVal = previous[m.key];
                const curVal = current[m.key];
                const delta = curVal - prevVal;
                const worse = m.worseWhenHigher ? delta > 0 : delta < 0;
                return (
                  <div key={m.key} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-ink-500">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular text-ink-900">
                        {m.isCurrency ? formatCompactINR(curVal) : formatINRDigits(curVal)}
                      </span>
                      {delta !== 0 && (
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-[11px] font-medium tabular",
                            worse ? "text-brand-red" : "text-accent-green",
                          )}
                        >
                          {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {m.isCurrency ? formatCompactINR(Math.abs(delta)) : formatINRDigits(Math.abs(delta))}
                        </span>
                      )}
                      {delta === 0 && <Minus className="h-3 w-3 text-ink-300" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        <Card className="border-l-2 border-l-brand-red bg-surface-raised p-5">
          <div className="flex items-center gap-2 text-[10px] text-ink-500">
            <Sparkles className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.2} />
            <span className="label-mono">AI Explanation</span>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-700">{narrative.explanation}</p>
          <p className="mt-3 text-[11px] text-ink-400">
            Generated from the deterministic comparison figures above — code proves, AI explains.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

function MetricRow({ label, value, isCurrency }: { label: string; value: number; isCurrency?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm font-semibold tabular text-ink-900">
        {isCurrency ? formatCompactINR(value) : formatINRDigits(value)}
      </span>
    </div>
  );
}
