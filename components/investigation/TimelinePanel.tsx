"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { TimelineEvent } from "@/lib/data/timeline";
import { cn } from "@/lib/cn";

const KIND_DOT: Record<TimelineEvent["kind"], string> = {
  normal: "bg-ink-300",
  detection: "bg-brand-red",
  escalation: "bg-brand-red",
  confirmation: "bg-ink-900",
};

export function TimelinePanel({ timeline }: { timeline: TimelineEvent[] }) {
  const finalCount = timeline[timeline.length - 1]?.cumulativeAffected ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="label-mono text-[10px] text-ink-400">Incident Timeline</div>
          <div className="text-sm font-semibold text-brand-red tabular">
            <AnimatedNumber value={finalCount} format={(n) => `${Math.round(n)} affected`} duration={1400} />
          </div>
        </div>

        <div className="mt-5 flex flex-col">
          {timeline.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4, ease: "easeOut" }}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {i < timeline.length - 1 && (
                <span className="absolute left-[5px] top-4 h-full w-px bg-border-default" />
              )}
              <span className={cn("relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-surface", KIND_DOT[event.kind])} />
              <div className="flex-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-xs font-semibold text-ink-900">{event.time}</span>
                  <span className="text-sm font-semibold text-ink-900">{event.title}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{event.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
