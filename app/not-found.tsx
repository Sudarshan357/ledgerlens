import Link from "next/link";
import { ArrowLeft, Radar } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface px-6 py-24 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red-50">
        <Radar className="h-5 w-5 text-brand-red" strokeWidth={2.2} />
      </span>
      <div className="mt-6 text-2xl font-semibold tracking-tight text-ink-900">
        LEDGER<span className="text-brand-red">LENS</span>
      </div>
      <div className="mt-4 text-lg font-medium text-ink-900">Route not found</div>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-400">
        This page doesn&apos;t exist in the investigation console.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.3} />
        Return to investigation console
      </Link>
    </div>
  );
}
