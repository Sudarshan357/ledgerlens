"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import type { EvidenceFact } from "@/lib/data/evidence";
import type { InvestigatorNarrative } from "@/lib/ai/investigator";
import { ChevronDown, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const } }),
};

export function EvidencePanel({
  evidence,
  narrative,
}: {
  evidence: EvidenceFact[];
  narrative: InvestigatorNarrative;
}) {
  const [openId, setOpenId] = useState<string | null>(evidence[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-5">
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
        <Card className="p-5">
          <div className="label-mono text-[10px] text-ink-400">Verified Evidence</div>
          <div className="mt-3 flex flex-col divide-y divide-border-subtle">
            {evidence.map((fact, i) => {
              const open = openId === fact.id;
              return (
                <motion.div key={fact.id} variants={fadeUp} initial="hidden" animate="show" custom={i + 1}>
                  <button
                    id={`evidence-trigger-${fact.id}`}
                    aria-expanded={open}
                    aria-controls={`evidence-detail-${fact.id}`}
                    onClick={() => setOpenId(open ? null : fact.id)}
                    className="flex w-full items-center gap-2.5 py-3 text-left"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-green" strokeWidth={2.2} />
                    <span className="flex-1 text-sm font-medium text-ink-900">{fact.statement}</span>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform", open && "rotate-180")}
                    />
                  </button>
                  {open && (
                    <motion.div
                      id={`evidence-detail-${fact.id}`}
                      role="region"
                      aria-labelledby={`evidence-trigger-${fact.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-3.5 pl-6 pr-2 text-[13px] leading-relaxed text-ink-500">{fact.detail}</p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={evidence.length + 1}>
        <Card className="border-l-2 border-l-brand-red bg-surface-raised p-5">
          <div className="flex items-center gap-2 text-[10px] text-ink-500">
            <Sparkles className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.2} />
            <span className="label-mono">Investigation Summary</span>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-700">{narrative.summary}</p>
          <div className="mt-4 rounded-lg border border-border-subtle bg-canvas p-3 text-sm leading-relaxed text-ink-500">
            <span className="font-semibold text-ink-900">Recommendation — </span>
            {narrative.recommendation}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
