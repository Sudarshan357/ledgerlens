import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "red" | "green" | "amber" | "blue" | "ink";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-500 border-border-default",
  red: "bg-brand-red-50 text-brand-red border-brand-red-200",
  green: "bg-accent-green-50 text-accent-green border-accent-green/20",
  amber: "bg-accent-amber-50 text-accent-amber border-accent-amber/20",
  blue: "bg-accent-blue-50 text-accent-blue border-accent-blue/20",
  ink: "bg-ink-900 text-canvas border-ink-900",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-tight",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
