"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Cpu, Waypoints, Sparkles } from "lucide-react";
import { STAGES } from "./StagePipeline";

const LAYERS = [
  {
    icon: Cpu,
    title: "Deterministic Finance Engine",
    detail: "Calculates every number and verified fact from the ledger — settlement math, discrepancies, counts.",
  },
  {
    icon: Waypoints,
    title: "Relationship / Investigation Engine",
    detail: "Traces connected financial entities — orders, payments, refunds, adjustments, settlements.",
  },
  {
    icon: Sparkles,
    title: "AI Investigator",
    detail: "Interprets the verified evidence and produces a plain-language explanation and recommendation.",
  },
];

export function HowItWorksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70"
          />
          <motion.div
            role="dialog"
            aria-label="How LedgerLens works"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-surface shadow-[var(--shadow-raised)]"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div>
                <div className="label-mono text-[10px] text-ink-400">How It Works</div>
                <div className="mt-0.5 text-sm font-medium text-ink-900">Code proves. AI explains.</div>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default text-ink-400 transition-colors hover:text-ink-900"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5 scrollbar-thin">
              <p className="text-[13px] leading-relaxed text-ink-500">
                Every monetary figure, count, and evidence fact in LedgerLens is computed by deterministic code from the
                underlying ledger. The AI Investigator never invents a number — it only interprets verified evidence
                and drafts an explanation or recommendation for human review.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                {LAYERS.map((layer) => (
                  <div key={layer.title} className="flex items-start gap-3 rounded-lg border border-border-subtle bg-canvas p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-raised text-brand-red">
                      <layer.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                    <div>
                      <div className="text-[13px] font-medium text-ink-900">{layer.title}</div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{layer.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="label-mono mt-6 mb-3 text-[10px] text-ink-400">Investigation Pipeline</div>
              <div className="flex flex-col divide-y divide-border-subtle">
                {STAGES.map((stage, i) => (
                  <div key={stage.key} className="flex items-start gap-3 py-2.5">
                    <span className="label-mono w-6 shrink-0 text-[10px] text-brand-red">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="text-[13px] font-medium text-ink-900">{stage.label}</div>
                      <div className="text-[12px] text-ink-500">{stage.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
