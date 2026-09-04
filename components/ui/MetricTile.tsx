import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function MetricTile({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "neutral" | "up" | "down";
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 px-5 py-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-ink-900 tabular">{value}</span>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium tabular",
              deltaTone === "up" && "text-accent-green",
              deltaTone === "down" && "text-brand-red",
              deltaTone === "neutral" && "text-ink-400",
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
