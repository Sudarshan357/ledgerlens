"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const STAGES = [
  { key: "detect", label: "Detect", detail: "Find financial inconsistencies." },
  { key: "reconstruct", label: "Reconstruct", detail: "Rebuild the relevant money flow." },
  { key: "trace", label: "Trace", detail: "Follow connected payment entities." },
  { key: "investigate", label: "Investigate", detail: "Find the strongest supported cause." },
  { key: "measure", label: "Measure", detail: "Calculate financial blast radius." },
  { key: "explain", label: "Explain", detail: "Show the evidence." },
  { key: "recommend", label: "Recommend", detail: "Suggest a safe next action." },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

/**
 * `progress` drives every stage's visual state: stage i is complete when
 * progress > i, active when progress === i, otherwise inactive. -1 means
 * nothing has started; STAGES.length means the investigation is fully
 * resolved. The same number gates which sections are revealed elsewhere in
 * the console, so the pipeline is always an honest readout of what's
 * actually rendered, not a decorative loader.
 */
export function StagePipeline({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {STAGES.map((stage, i) => {
        const complete = progress > i;
        const active = progress === i;
        return (
          <div key={stage.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className={cn(
                "label-mono w-6 shrink-0 text-[10px]",
                active ? "text-brand-red" : complete ? "text-ink-500" : "text-ink-300",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className={cn("text-[13px] font-medium", active ? "text-ink-900" : complete ? "text-ink-700" : "text-ink-400")}>
                {stage.label}
              </div>
              <div className="truncate text-[11px] text-ink-500">{stage.detail}</div>
            </div>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {complete && <Check className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.5} />}
              {active && (
                <span className="relative flex h-2 w-2">
                  <span className="ll-pulse absolute inline-flex h-full w-full rounded-full bg-brand-red" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-red" />
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
