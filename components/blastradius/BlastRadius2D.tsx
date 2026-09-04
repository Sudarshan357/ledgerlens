"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatCompactINR } from "@/lib/format";
import type { BlastNode, BlastRadiusGraph } from "@/lib/data/blastRadiusGraph";
import { useBlastFocus } from "./blastFocusContext";
import { BLAST_COLOR_VAR, BLAST_ICONS, BLAST_REVEAL_ORDER, BLAST_REVEAL_TOTAL_MS } from "./blastNodeStyle";
import { BlastRadiusDetailPanel } from "./BlastRadiusDetailPanel";

const WIDTH = 820;
const HEIGHT = 560;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
// Safety margins sized off the actual rendered card boxes (104x88 outer,
// 150x88 center) plus a gap — a smaller circular margin let two cards clear
// the "distance" check while still overlapping as axis-aligned rectangles.
const NODE_MIN_DIST = 150;
const CENTER_MIN_DIST = 165;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER.x + radius * Math.cos(rad), y: CENTER.y + radius * Math.sin(rad) };
}

function spread(count: number, startDeg: number, endDeg: number): number[] {
  if (count <= 1) return [(startDeg + endDeg) / 2];
  const step = (endDeg - startDeg) / (count - 1);
  return Array.from({ length: count }, (_, i) => startDeg + i * step);
}

function settle(pos: Map<string, { x: number; y: number }>, ids: string[], centerPos: { x: number; y: number }, iterations: number) {
  for (let iter = 0; iter < iterations; iter++) {
    for (const id of ids) {
      const p = pos.get(id)!;
      const dx = p.x - centerPos.x;
      const dy = p.y - centerPos.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
      if (dist < CENTER_MIN_DIST) {
        const push = CENTER_MIN_DIST - dist;
        p.x += (dx / dist) * push;
        p.y += (dy / dist) * push;
      }
    }
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos.get(ids[i])!;
        const b = pos.get(ids[j])!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
        if (dist < NODE_MIN_DIST) {
          const push = (NODE_MIN_DIST - dist) / 2 + 0.02;
          const ux = dx / dist;
          const uy = dy / dist;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
  }
}

function hasViolation(pos: Map<string, { x: number; y: number }>, ids: string[], centerPos: { x: number; y: number }) {
  for (let i = 0; i < ids.length; i++) {
    const a = pos.get(ids[i])!;
    if (Math.hypot(a.x - centerPos.x, a.y - centerPos.y) < CENTER_MIN_DIST) return true;
    for (let j = i + 1; j < ids.length; j++) {
      const b = pos.get(ids[j])!;
      if (Math.hypot(a.x - b.x, a.y - b.y) < NODE_MIN_DIST) return true;
    }
  }
  return false;
}

/** One-time collision resolution: iterative pairwise repulsion settles most
 * of the layout, then — if a tightly-packed cluster is still stuck against
 * its neighbors after that — the whole non-center layout is nudged radially
 * outward in small steps and re-settled until every pair clears its margin.
 * That radial nudge strictly increases every pairwise distance, so this is
 * guaranteed to terminate rather than oscillate. Runs once at layout time
 * (not on hover), so the graph itself stays spatially stable. */
function relax(home: Map<string, { x: number; y: number }>, centerId: string) {
  const ids = [...home.keys()].filter((id) => id !== centerId);
  const pos = new Map(ids.map((id) => [id, { ...home.get(id)! }]));
  const centerPos = home.get(centerId)!;

  settle(pos, ids, centerPos, 600);

  let rounds = 0;
  while (hasViolation(pos, ids, centerPos) && rounds < 20) {
    for (const id of ids) {
      const p = pos.get(id)!;
      p.x = centerPos.x + (p.x - centerPos.x) * 1.04;
      p.y = centerPos.y + (p.y - centerPos.y) * 1.04;
    }
    settle(pos, ids, centerPos, 600);
    rounds++;
  }

  pos.set(centerId, centerPos);
  return pos;
}

/** Fixed angle/radius per node id, category-clustered, then relaxed once to
 * remove overlap — spatially stable, never recomputed on hover. */
function useLayout(graph: BlastRadiusGraph) {
  return useMemo(() => {
    const home = new Map<string, { x: number; y: number }>();
    home.set(graph.centerNodeId, CENTER);

    const batches = graph.nodes.filter((n) => n.kind === "batch");
    const merchants = graph.nodes.filter((n) => n.kind === "merchant");

    const singleAngle: Record<string, number> = { "group:transactions": 180, "group:refunds": 145, "group:feesTaxes": 108 };
    for (const [id, angle] of Object.entries(singleAngle)) {
      if (graph.nodes.some((n) => n.id === id)) home.set(id, polar(angle, 215));
    }

    spread(batches.length, -152, -32).forEach((angle, i) => {
      home.set(batches[i].id, polar(angle, 172));
    });

    spread(merchants.length, -26, 26).forEach((angle, i) => {
      home.set(merchants[i].id, polar(angle, 178));
    });

    return relax(home, graph.centerNodeId);
  }, [graph]);
}

export function BlastRadius2D({ graph }: { graph: BlastRadiusGraph }) {
  const positions = useLayout(graph);
  const { activeId, getFocusState, clear } = useBlastFocus();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), BLAST_REVEAL_TOTAL_MS);
    return () => clearTimeout(t);
  }, []);

  const activeNode = activeId ? graph.nodes.find((n) => n.id === activeId) : undefined;
  const activePos = activeNode ? positions.get(activeNode.id) : undefined;

  const panelStyle = useMemo(() => {
    if (!activePos) return null;
    const xPct = (activePos.x / WIDTH) * 100;
    const yPct = (activePos.y / HEIGHT) * 100;
    const placeRight = xPct < 68;
    const left = placeRight ? `calc(${xPct}% + 18px)` : `calc(${xPct}% - 274px)`;
    const top = `calc(${yPct}% - 90px)`;
    return {
      left: `clamp(8px, ${left}, calc(100% - 264px))`,
      top: `clamp(8px, ${top}, calc(100% - 220px))`,
    };
  }, [activePos]);

  return (
    <div
      data-testid="blast-2d-canvas"
      className="relative mx-auto w-full max-w-[820px] select-none overflow-visible"
      style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      onClick={(e) => {
        if (e.target === e.currentTarget) clear();
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="absolute inset-0"
        onClick={() => clear()}
      >
        {graph.edges.map((e) => {
          const a = positions.get(e.source);
          const b = positions.get(e.target);
          if (!a || !b) return null;
          const other = e.source === graph.centerNodeId ? e.target : e.source;
          const otherKind = graph.nodes.find((n) => n.id === other)?.kind;
          const state = getFocusState(other);
          const isFocused = !activeId ? false : state === "focused" || state === "connected";
          const delay = revealed ? 0 : BLAST_REVEAL_ORDER[otherKind ?? "incident"] * 0.12;
          return (
            <motion.line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={isFocused ? "var(--brand-red)" : "var(--border-default)"}
              strokeWidth={isFocused ? 2 : 1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: !activeId ? 1 : isFocused ? 1 : 0.15,
              }}
              transition={{ duration: revealed ? 0.2 : 0.4, delay, ease: "easeOut" }}
            />
          );
        })}
      </svg>

      {graph.nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        return (
          <BlastNodeMarker
            key={node.id}
            node={node}
            xPct={(pos.x / WIDTH) * 100}
            yPct={(pos.y / HEIGHT) * 100}
            isCenter={node.id === graph.centerNodeId}
            revealed={revealed}
          />
        );
      })}

      {activeNode && panelStyle && (
        <div className="pointer-events-none absolute z-20" style={{ left: panelStyle.left, top: panelStyle.top, width: 256 }}>
          <BlastRadiusDetailPanel node={activeNode} />
        </div>
      )}
    </div>
  );
}

function BlastNodeMarker({
  node,
  xPct,
  yPct,
  isCenter,
  revealed,
}: {
  node: BlastNode;
  xPct: number;
  yPct: number;
  isCenter: boolean;
  revealed: boolean;
}) {
  const { getFocusState, hover, pin } = useBlastFocus();
  const focusState = getFocusState(node.id);
  const isFocused = focusState === "focused";
  const isDim = focusState === "dim";
  const Icon = BLAST_ICONS[node.kind];
  const color = BLAST_COLOR_VAR[node.kind];
  const delay = revealed ? 0 : BLAST_REVEAL_ORDER[node.kind] * 0.12;

  const ariaLabel = `${node.label}, ${node.primaryLine}${node.amount ? `, ${formatCompactINR(node.amount)}` : ""}`;

  return (
    <motion.div
      data-blast-node-id={node.id}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      onMouseEnter={() => hover(node.id)}
      onMouseLeave={() => hover(null)}
      onFocus={() => hover(node.id)}
      onBlur={() => hover(null)}
      onClick={(e) => {
        e.stopPropagation();
        pin(node.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pin(node.id);
        }
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: isDim ? 0.2 : 1, scale: isFocused ? 1.08 : 1 }}
      transition={{ duration: revealed ? 0.2 : 0.35, delay, ease: "easeOut" }}
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1 rounded-lg border bg-surface px-2 py-1.5 text-center transition-[border-color,box-shadow] duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
        isCenter ? "w-[150px] border-brand-red bg-brand-red-50" : "w-[104px] border-border-default",
        isFocused && "z-10 shadow-[0_0_0_1.5px_var(--brand-red),0_10px_24px_rgba(240,71,92,0.25)]",
      )}
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
      >
        <Icon className="h-3 w-3" strokeWidth={2.3} />
      </span>
      <span className={cn("label-mono text-[8px]", isCenter ? "text-brand-red" : "text-ink-400")}>{node.label}</span>
      <span className={cn("truncate text-[10px] font-medium", isCenter ? "text-ink-900" : "text-ink-700")}>
        {node.primaryLine}
      </span>
      {node.amount != null && (
        <span className="text-[10px] font-semibold tabular" style={{ color: isCenter ? "var(--brand-red)" : color }}>
          {formatCompactINR(node.amount)}
        </span>
      )}
    </motion.div>
  );
}
