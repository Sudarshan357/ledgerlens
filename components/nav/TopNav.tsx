"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/cn";
import { LogoMark, Wordmark } from "./Logo";
import { HowItWorksModal } from "@/components/console/HowItWorksModal";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/incidents", label: "Incidents" },
  { href: "/investigations", label: "Investigations" },
  { href: "/audit", label: "Audit" },
];

export function TopNav() {
  const pathname = usePathname();
  const [howOpen, setHowOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between gap-2 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <LogoMark />
            <Wordmark />
          </Link>
          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto lg:gap-1">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 text-[13px] font-medium transition-colors lg:px-2.5 lg:text-[13px]",
                    active ? "bg-surface text-ink-900" : "text-ink-400 hover:text-ink-700",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => setHowOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-ink-400 transition-colors hover:text-ink-900"
          >
            <CircleHelp className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span className="hidden sm:inline">How it works</span>
          </button>
          <span className="hidden items-center gap-1.5 text-[11px] font-medium text-ink-400 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-300" />
            Razorpay Test Environment
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-accent-green">
            <span className="relative flex h-1.5 w-1.5">
              <span className="ll-pulse absolute inline-flex h-full w-full rounded-full bg-accent-green" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-green" />
            </span>
            LIVE
          </div>
        </div>
      </div>
      <HowItWorksModal open={howOpen} onClose={() => setHowOpen(false)} />
    </header>
  );
}
