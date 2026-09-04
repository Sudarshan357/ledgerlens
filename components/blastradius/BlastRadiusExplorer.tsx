"use client";

import { useState } from "react";
import { Box, Radar } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BlastRadiusGraph } from "@/lib/data/blastRadiusGraph";
import { BlastRadius2D } from "./BlastRadius2D";
import { BlastRadius3D } from "./BlastRadius3D";

type View = "2d" | "3d";

/** The interactive financial impact explorer: same underlying graph, two
 * renderings. 2D is the default, immediately-readable information view; 3D
 * is an optional exploration view. Both share one BlastFocusProvider
 * (provided by the parent) so hover/pin state — and the affected-entities
 * table sync — survive a view switch. */
export function BlastRadiusExplorer({ graph }: { graph: BlastRadiusGraph }) {
  const [view, setView] = useState<View>("2d");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 label-mono text-[10px] text-ink-400">
          <Radar className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.2} />
          Impact explorer
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-border-default bg-canvas p-0.5">
          <ViewButton active={view === "2d"} onClick={() => setView("2d")} icon={<Radar className="h-3 w-3" />} label="2D view" />
          <ViewButton active={view === "3d"} onClick={() => setView("3d")} icon={<Box className="h-3 w-3" />} label="3D view" />
        </div>
      </div>

      <div className="mt-4">{view === "2d" ? <BlastRadius2D graph={graph} /> : <BlastRadius3D graph={graph} />}</div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-medium transition-colors",
        active ? "bg-surface-raised text-ink-900" : "text-ink-400 hover:text-ink-700",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
