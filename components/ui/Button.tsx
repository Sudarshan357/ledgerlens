import { cn } from "@/lib/cn";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ink-900 text-canvas hover:bg-white border-ink-900",
  secondary: "bg-surface text-ink-900 hover:bg-surface-raised border-border-default",
  ghost: "bg-transparent text-ink-700 hover:bg-surface border-transparent",
  danger: "bg-brand-red text-white hover:bg-brand-red-600 border-brand-red",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-9 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-5 text-sm rounded-lg gap-2",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center border font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
