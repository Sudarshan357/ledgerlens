"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Play, ShieldCheck, TrendingDown, FolderSearch, Gauge } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricTile } from "@/components/ui/MetricTile";
import { NetworkBackground } from "./NetworkBackground";
import { formatCompactINR, formatPercent } from "@/lib/format";
import type { IncidentSummary } from "@/lib/data/incident";
import type { HealthMetrics } from "@/lib/data/health";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

export function OverviewHero({ incident, health }: { incident: IncidentSummary; health: HealthMetrics }) {
  return (
    <div className="flex flex-col">
      <section className="relative -mx-4 -mt-6 flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center overflow-hidden border-b border-border-subtle px-6 py-24 lg:-mx-6">
        <NetworkBackground />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex max-w-2xl flex-col items-center text-center"
        >
          <div className="label-mono text-[11px] text-ink-400">Financial Incident Investigation</div>
          <h1 className="mt-5 text-[36px] font-semibold leading-[1.12] tracking-tight text-ink-900 sm:text-[48px]">
            When money doesn&apos;t add up —
            <br />
            investigate why.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-500">
            LedgerLens reconstructs payment and settlement incidents, traces the money flow, identifies the strongest
            supported cause, and measures the financial blast radius.
          </p>

          <Link href="/investigations" className="mt-9">
            <button className="inline-flex items-center gap-2 rounded-sm border border-brand-red bg-brand-red px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-red-600">
              Enter the Investigation Console
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
          </Link>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-ink-400">
            <span>
              <span className="tabular text-ink-700">{incident.affectedTransactions}</span> records investigated
            </span>
            <span className="hidden h-3 w-px bg-border-default sm:block" />
            <span>
              <span className="tabular text-ink-700">{formatCompactINR(incident.potentialExposure)}</span> potential
              exposure
            </span>
            <span className="hidden h-3 w-px bg-border-default sm:block" />
            <span>
              <span className="tabular text-ink-700">{incident.affectedBatches}</span> settlement batches
            </span>
          </div>
        </motion.div>
      </section>

      <div className="flex flex-col gap-6 pt-8">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex items-end justify-between">
          <div className="label-mono text-[10px] text-ink-400">Active Incident</div>
          <Link href="/investigations?autoplay=1">
            <Button variant="danger" size="lg">
              <Play className="h-4 w-4" strokeWidth={2.5} />
              Run Incident Simulation
            </Button>
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-5 border-l-[3px] border-l-brand-red p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-red-50">
                    <AlertTriangle className="h-4 w-4 text-brand-red" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="label-mono text-[10px] text-brand-red">Financial Incident Detected</div>
                    <div className="text-sm text-ink-500">{incident.rootCauseShort}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="red">Severity {incident.severity}</Badge>
                  <Badge tone="ink">Confidence {incident.confidence}%</Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <div>
                  <div className="text-xs font-medium text-ink-500">Confirmed discrepancy</div>
                  <div className="mt-1 text-4xl font-semibold tracking-tight text-brand-red tabular">
                    {formatCompactINR(incident.confirmedDiscrepancy)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-3 pb-1.5">
                  <Stat label="Transactions" value={incident.affectedTransactions.toString()} />
                  <Stat label="Settlement batches" value={incident.affectedBatches.toString()} />
                  <Stat label="Merchants" value={incident.affectedMerchants.toString()} />
                  <Stat label="Potential exposure" value={formatCompactINR(incident.potentialExposure)} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Link href="/investigations">
                  <Button variant="primary">
                    Investigate Incident
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/incidents">
                  <Button variant="secondary">View all incidents</Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="grid grid-cols-2 gap-4 pb-8 lg:grid-cols-4"
        >
          <Card>
            <MetricTile
              label="Settlement Health"
              value={formatPercent(health.settlementHealthPct, 1)}
              delta="-3.1% vs last period"
              deltaTone="down"
              icon={<ShieldCheck className="h-4 w-4 text-ink-300" />}
            />
          </Card>
          <Card>
            <MetricTile
              label="Reconciliation Rate"
              value={formatPercent(health.reconciliationRatePct, 1)}
              delta="-14.8% vs last period"
              deltaTone="down"
              icon={<Gauge className="h-4 w-4 text-ink-300" />}
            />
          </Card>
          <Card>
            <MetricTile
              label="Open Investigations"
              value={health.openInvestigations.toString()}
              delta="1 high severity"
              deltaTone="neutral"
              icon={<FolderSearch className="h-4 w-4 text-ink-300" />}
            />
          </Card>
          <Card>
            <MetricTile
              label="Unexplained Exposure"
              value={formatCompactINR(health.unexplainedExposure)}
              delta="Pending review"
              deltaTone="down"
              icon={<TrendingDown className="h-4 w-4 text-ink-300" />}
            />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-ink-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-ink-900 tabular">{value}</div>
    </div>
  );
}
