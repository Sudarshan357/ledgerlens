"use client";

import { motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import { Radar, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCompactINR, formatINR } from "@/lib/format";
import type { BlastRadius, MerchantImpact, BatchImpact } from "@/lib/data/blastRadius";
import { getBlastRadiusGraph } from "@/lib/data/blastRadiusGraph";
import { BlastFocusProvider, useBlastFocus } from "@/components/blastradius/blastFocusContext";
import { BlastRadiusExplorer } from "@/components/blastradius/BlastRadiusExplorer";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const } }),
};

export function BlastRadiusPanel({ blast }: { blast: BlastRadius }) {
  const graph = useMemo(() => getBlastRadiusGraph(), []);

  return (
    <BlastFocusProvider centerId={graph.centerNodeId}>
      <div className="flex flex-col gap-5">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <Card className="overflow-x-auto p-5">
            <div className="flex items-center gap-2 label-mono text-[10px] text-ink-400">
              <Radar className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.2} />
              Financial Blast Radius
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Metric label="Transactions" value={<AnimatedNumber value={blast.affectedTransactions} format={(n) => Math.round(n).toString()} />} />
              <Metric label="Settlement batches" value={<AnimatedNumber value={blast.affectedBatches} format={(n) => Math.round(n).toString()} />} />
              <Metric label="Merchants" value={<AnimatedNumber value={blast.affectedMerchants} format={(n) => Math.round(n).toString()} />} />
              <Metric
                label={`Confirmed discrepancy — ${blast.confirmedTransactionCount} records`}
                value={<AnimatedNumber value={blast.confirmedDiscrepancy} format={formatCompactINR} />}
                accent
              />
              <Metric
                label={`Potential exposure — all ${blast.affectedTransactions} records`}
                value={<AnimatedNumber value={blast.potentialExposure} format={formatCompactINR} />}
              />
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-border-subtle bg-canvas px-3 py-2.5 text-[12px] leading-relaxed text-ink-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2.2} />
              <span>
                <strong className="font-semibold text-ink-900">Confirmed discrepancy</strong> ({formatCompactINR(blast.confirmedDiscrepancy)}) totals
                only the {blast.confirmedTransactionCount} high-confidence records. <strong className="font-semibold text-ink-900">Potential exposure</strong> ({formatCompactINR(blast.potentialExposure)}) adds{" "}
                {formatCompactINR(blast.reviewExposure)} from {blast.reviewTransactionCount} additional records still under review — the two
                breakdown tables below total the combined ({formatCompactINR(blast.potentialExposure)}) figure, not the confirmed one.
              </span>
            </div>

            <div className="mt-5 border-t border-border-subtle pt-5">
              <BlastRadiusExplorer graph={graph} />
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
            <Card className="p-5">
              <div className="label-mono text-[10px] text-ink-400">Top affected merchants</div>
              <div className="mt-0.5 text-[11px] text-ink-400">Potential exposure — confirmed + review combined</div>
              <div className="mt-3 flex flex-col divide-y divide-border-subtle">
                {blast.topMerchants.map((m) => (
                  <MerchantRow key={m.merchantId} m={m} />
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
            <Card className="p-5">
              <div className="label-mono text-[10px] text-ink-400">Top affected settlement batches</div>
              <div className="mt-0.5 text-[11px] text-ink-400">Potential exposure — confirmed + review combined</div>
              <div className="mt-3 flex flex-col divide-y divide-border-subtle">
                {blast.topBatches.map((b) => (
                  <BatchRow key={b.batchId} b={b} />
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
          <Card className="overflow-x-auto p-5">
            <div className="label-mono text-[10px] text-ink-400">Largest transactions</div>
            <div className="mt-0.5 text-[11px] text-ink-400">Individual records — confirmed vs. review shown per row</div>
            <table className="mt-3 w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400">
                  <th className="pb-2 font-medium">Payment</th>
                  <th className="pb-2 font-medium">Merchant</th>
                  <th className="pb-2 font-medium">Confidence</th>
                  <th className="pb-2 text-right font-medium">Duplicate amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {blast.largestTransactions.map((t) => (
                  <tr key={t.paymentId}>
                    <td className="py-2.5 font-mono text-[12px] text-ink-700">{t.paymentId}</td>
                    <td className="py-2.5 text-ink-700">{t.merchantName}</td>
                    <td className="py-2.5">
                      <Badge tone={t.confidence === "confirmed" ? "green" : "amber"}>{t.confidence}</Badge>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-brand-red tabular">{formatINR(t.duplicateAdjustmentAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </motion.div>
      </div>
    </BlastFocusProvider>
  );
}

/** Two-way GRAPH ↔ TABLE sync: hovering/clicking a row drives the same
 * shared focus context the explorer graph reads from, and vice versa. */
function MerchantRow({ m }: { m: MerchantImpact }) {
  const { getFocusState, hover, pin } = useBlastFocus();
  const nodeId = `merchant:${m.merchantId}`;
  const state = getFocusState(nodeId);

  return (
    <div
      data-testid="merchant-row"
      role="button"
      tabIndex={0}
      onMouseEnter={() => hover(nodeId)}
      onMouseLeave={() => hover(null)}
      onFocus={() => hover(nodeId)}
      onBlur={() => hover(null)}
      onClick={() => pin(nodeId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pin(nodeId);
        }
      }}
      className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-2.5 -mx-2 transition-colors ${
        state === "focused" ? "bg-surface-raised" : "hover:bg-surface-raised/60"
      }`}
    >
      <div>
        <div className="text-sm font-medium text-ink-900">{m.name}</div>
        <div className="text-[11px] text-ink-400">
          {m.transactionCount} transactions · {m.batchCount} batch{m.batchCount !== 1 ? "es" : ""}
        </div>
      </div>
      <span className="text-sm font-semibold text-brand-red tabular">{formatINR(m.amount)}</span>
    </div>
  );
}

function BatchRow({ b }: { b: BatchImpact }) {
  const { getFocusState, hover, pin } = useBlastFocus();
  const nodeId = `batch:${b.batchId}`;
  const state = getFocusState(nodeId);

  return (
    <div
      data-testid="batch-row"
      role="button"
      tabIndex={0}
      onMouseEnter={() => hover(nodeId)}
      onMouseLeave={() => hover(null)}
      onFocus={() => hover(nodeId)}
      onBlur={() => hover(null)}
      onClick={() => pin(nodeId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pin(nodeId);
        }
      }}
      className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-2.5 -mx-2 transition-colors ${
        state === "focused" ? "bg-surface-raised" : "hover:bg-surface-raised/60"
      }`}
    >
      <div>
        <div className="font-mono text-[12px] text-ink-900">{b.utr}</div>
        <div className="text-[11px] text-ink-400">
          {b.merchantName} · {b.transactionCount} flagged
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={b.status === "processing" ? "amber" : "neutral"}>{b.status}</Badge>
        <span className="text-sm font-semibold text-brand-red tabular">{formatINR(b.amount)}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-ink-500">{label}</span>
      <span className={`text-xl font-semibold tabular ${accent ? "text-brand-red" : "text-ink-900"}`}>{value}</span>
    </div>
  );
}
