"use client";

import { useContext, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  CreditCard,
  Undo2,
  AlertTriangle,
  Receipt,
  Layers,
  Store,
  Radar,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { FlowNodeData } from "@/lib/data/graph";
import { GraphFocusContext } from "./graphFocusContext";

const ICONS: Record<FlowNodeData["kind"], typeof ShoppingBag> = {
  order: ShoppingBag,
  payment: CreditCard,
  refund: Undo2,
  adjustment: AlertTriangle,
  feeTax: Receipt,
  batch: Layers,
  merchant: Store,
  exposure: Radar,
};

export function FlowNodeCard({ data, id }: NodeProps<FlowNodeData>) {
  const [mounted, setMounted] = useState(false);
  const { activeId, focusMap, onFocusChange, onPinToggle } = useContext(GraphFocusContext);
  const Icon = ICONS[data.kind];
  const isAdjustment = data.kind === "adjustment";
  const isExposure = data.kind === "exposure";
  const suspicious = Boolean(data.suspicious);
  const review = data.confidence === "review";
  const focusState = activeId ? focusMap.get(id) : undefined;
  const isFocused = focusState === "focused";

  const targetOpacity = focusState === "hop2" ? 0.6 : focusState === "dim" ? 0.22 : 1;
  const targetScale = isFocused ? 1.045 : 1;

  const ariaLabel = `${data.label}, ${data.primaryLine}${data.secondaryLine ? `, ${data.secondaryLine}` : ""}${data.statusLine ? `, ${data.statusLine}` : ""}`;

  return (
    <motion.div
      data-node-id={id}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      onFocus={() => onFocusChange(id, true)}
      onBlur={() => onFocusChange(id, false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPinToggle(id);
        }
      }}
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: targetOpacity, scale: targetScale, y: 0 }}
      transition={
        mounted
          ? { duration: 0.2, ease: "easeOut" }
          : { duration: 0.35, ease: "easeOut", delay: (data.revealIndex ?? 0) * 0.025 }
      }
      onAnimationComplete={() => setMounted(true)}
      className={cn(
        "w-[200px] cursor-pointer rounded-lg border bg-surface px-3 py-2.5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
        suspicious && "ll-pulse-once",
        suspicious && !isExposure && "border-brand-red-200 bg-brand-red-50",
        isExposure && "w-[220px] border-brand-red bg-brand-red-50",
        !suspicious && !isExposure && "border-border-default",
        isFocused && "z-10 shadow-[0_0_0_1.5px_var(--brand-red),0_10px_28px_rgba(240,71,92,0.28)]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-none !bg-ink-300" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-none !bg-ink-300" />

      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded",
            isExposure ? "bg-brand-red text-white" : suspicious ? "bg-brand-red-100 text-brand-red" : "bg-canvas text-ink-400",
          )}
        >
          <Icon className="h-3 w-3" strokeWidth={2.3} />
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
            isExposure ? "text-brand-red" : suspicious ? "text-brand-red" : "text-ink-400",
          )}
        >
          {data.label}
        </span>
        {isAdjustment && (
          <span className="ml-auto rounded-full bg-brand-red px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white">
            {review ? "REVIEW" : "DUPLICATE"}
          </span>
        )}
      </div>

      <div
        className={cn(
          "mt-1.5 truncate font-mono text-[11px] transition-colors duration-200",
          isExposure ? "text-ink-900" : isFocused ? "text-ink-900" : "text-ink-700",
        )}
      >
        {data.primaryLine}
      </div>
      {data.secondaryLine && (
        <div
          className={cn(
            "mt-0.5 text-[11px] font-medium tabular",
            isExposure ? "text-ink-900" : suspicious ? "text-brand-red" : "text-ink-500",
          )}
        >
          {data.secondaryLine}
        </div>
      )}
      {data.statusLine && (
        <div
          className={cn(
            "mt-1 label-mono text-[9px]",
            data.statusLine === "PROCESSING" ? "text-accent-amber" : "text-ink-400",
          )}
        >
          {data.statusLine}
        </div>
      )}
    </motion.div>
  );
}

export const flowNodeTypes = {
  order: FlowNodeCard,
  payment: FlowNodeCard,
  refund: FlowNodeCard,
  adjustment: FlowNodeCard,
  feeTax: FlowNodeCard,
  batch: FlowNodeCard,
  merchant: FlowNodeCard,
  exposure: FlowNodeCard,
};
