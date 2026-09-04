"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Play, Pause } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCompactINR } from "@/lib/format";
import type { BlastNode, BlastRadiusGraph } from "@/lib/data/blastRadiusGraph";
import { useBlastFocus } from "./blastFocusContext";
import { BLAST_COLOR_VAR, BLAST_ICONS } from "./blastNodeStyle";
import { BlastRadiusDetailPanel } from "./BlastRadiusDetailPanel";

type Vec3 = { x: number; y: number; z: number };

const DEFAULT_ROTATE = { rx: -18, ry: -28 };
const DEFAULT_ZOOM = 1;

/** Fixed 3D positions per node id — spatial clusters with real depth (z),
 * matching the categories described in the brief. Computed once per graph. */
function useLayout3D(graph: BlastRadiusGraph) {
  return useMemo(() => {
    const positions = new Map<string, Vec3>();
    positions.set(graph.centerNodeId, { x: 0, y: 0, z: 0 });

    const batches = graph.nodes.filter((n) => n.kind === "batch");
    const merchants = graph.nodes.filter((n) => n.kind === "merchant");

    if (graph.nodes.some((n) => n.id === "group:transactions")) {
      positions.set("group:transactions", { x: -230, y: -10, z: -50 });
    }
    if (graph.nodes.some((n) => n.id === "group:refunds")) {
      positions.set("group:refunds", { x: -70, y: 150, z: 60 });
    }
    if (graph.nodes.some((n) => n.id === "group:feesTaxes")) {
      positions.set("group:feesTaxes", { x: 80, y: 195, z: -60 });
    }

    batches.forEach((n, i) => {
      const t = batches.length > 1 ? i / (batches.length - 1) : 0.5;
      const zigzag = i % 2 === 0 ? -22 : 22;
      positions.set(n.id, { x: -260 + t * 520, y: -170 + zigzag, z: 110 - Math.abs(t - 0.5) * 80 });
    });

    merchants.forEach((n, i) => {
      const t = merchants.length > 1 ? i / (merchants.length - 1) : 0.5;
      positions.set(n.id, { x: 200 + Math.abs(t - 0.5) * 40, y: -90 + t * 200, z: -40 });
    });

    return positions;
  }, [graph]);
}

/** Standard CSS-3D edge technique: place a 1px-thick div at the source
 * point, sized to the segment length, then rotate it to point at the
 * target. rotateY aligns the XZ-projection, rotateZ then tilts for Y. */
function edgeTransform(a: Vec3, b: Vec3) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const yaw = Math.atan2(dz, dx);
  const planar = Math.sqrt(dx * dx + dz * dz);
  const pitch = Math.atan2(dy, planar);
  return {
    length,
    transform: `translate3d(${a.x}px, ${a.y}px, ${a.z}px) rotateY(${-yaw}rad) rotateZ(${pitch}rad)`,
  };
}

export function BlastRadius3D({ graph }: { graph: BlastRadiusGraph }) {
  const positions = useLayout3D(graph);
  const { activeId, getFocusState, clear } = useBlastFocus();
  const [rotate, setRotate] = useState(DEFAULT_ROTATE);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [autoRotate, setAutoRotate] = useState(true);
  const [entered, setEntered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    // React's onWheel is passive by default, so preventDefault() (needed to
    // stop page scroll while zooming) throws — attach natively instead.
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0.6, Math.min(1.8, z - e.deltaY * 0.001)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    let raf: number;
    const tick = () => {
      setRotate((r) => ({ ...r, ry: r.ry + 0.15 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate]);

  function onPointerDown(e: React.PointerEvent) {
    setAutoRotate(false);
    setIsDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setRotate((r) => ({ rx: Math.max(-70, Math.min(70, r.rx - dy * 0.4)), ry: r.ry + dx * 0.4 }));
  }
  function onPointerUp() {
    dragRef.current = null;
    setIsDragging(false);
  }
  function reset() {
    setRotate(DEFAULT_ROTATE);
    setZoom(DEFAULT_ZOOM);
  }

  const activeNode = activeId ? graph.nodes.find((n) => n.id === activeId) : undefined;

  return (
    <div className="relative">
      <div
        ref={canvasRef}
        data-testid="blast-3d-canvas"
        className="relative h-[440px] w-full touch-none overflow-hidden rounded-lg border border-border-subtle bg-canvas"
        style={{ perspective: 1100 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) clear();
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotate.rx}deg) rotateY(${rotate.ry}deg) scale(${entered ? zoom : zoom * 0.9})`,
            opacity: entered ? 1 : 0,
            transition: isDragging ? "none" : "transform 450ms ease-out, opacity 450ms ease-out",
          }}
        >
          {graph.edges.map((e) => {
            const a = positions.get(e.source);
            const b = positions.get(e.target);
            if (!a || !b) return null;
            const other = e.source === graph.centerNodeId ? e.target : e.source;
            const state = getFocusState(other);
            const isFocused = !activeId ? false : state === "focused" || state === "connected";
            const { length, transform } = edgeTransform(a, b);
            return (
              <div
                key={e.id}
                className="absolute origin-left"
                style={{
                  width: length,
                  height: isFocused ? 2 : 1,
                  background: isFocused ? "var(--brand-red)" : "var(--border-default)",
                  opacity: !activeId ? 0.9 : isFocused ? 1 : 0.12,
                  transform,
                  transition: "opacity 200ms ease-out, height 200ms ease-out",
                }}
              />
            );
          })}

          {graph.nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            return (
              <BlastNode3DMarker
                key={node.id}
                node={node}
                pos={pos}
                rotate={rotate}
                isCenter={node.id === graph.centerNodeId}
              />
            );
          })}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-ink-400">
          Drag to rotate · Scroll to zoom · Hover nodes for details
        </div>

        <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-1">
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default bg-surface/90 text-ink-400 backdrop-blur transition-colors hover:text-ink-900"
            aria-label={autoRotate ? "Pause auto-rotate" : "Auto-rotate"}
          >
            {autoRotate ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button
            onClick={reset}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default bg-surface/90 text-ink-400 backdrop-blur transition-colors hover:text-ink-900"
            aria-label="Reset view"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-[132px]">
        {activeNode ? (
          <BlastRadiusDetailPanel node={activeNode} />
        ) : (
          <div className="flex h-[132px] items-center justify-center rounded-lg border border-border-subtle bg-surface text-[12px] text-ink-400">
            Hover or select a node to see its details.
          </div>
        )}
      </div>
    </div>
  );
}

function BlastNode3DMarker({
  node,
  pos,
  rotate,
  isCenter,
}: {
  node: BlastNode;
  pos: Vec3;
  rotate: { rx: number; ry: number };
  isCenter: boolean;
}) {
  const { getFocusState, hover, pin } = useBlastFocus();
  const focusState = getFocusState(node.id);
  const isFocused = focusState === "focused";
  const isDim = focusState === "dim";
  const Icon = BLAST_ICONS[node.kind];
  const color = BLAST_COLOR_VAR[node.kind];

  const ariaLabel = `${node.label}, ${node.primaryLine}${node.amount ? `, ${formatCompactINR(node.amount)}` : ""}`;

  return (
    <div
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
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1 rounded-lg border bg-surface px-2 py-1.5 text-center",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
        isCenter ? "w-[150px] border-brand-red bg-brand-red-50" : "w-[110px] border-border-default",
        isFocused && "z-10 shadow-[0_0_0_1.5px_var(--brand-red),0_10px_24px_rgba(240,71,92,0.25)]",
      )}
      style={{
        transformStyle: "preserve-3d",
        transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) rotateY(${-rotate.ry}deg) rotateX(${-rotate.rx}deg) scale(${isFocused ? 1.1 : 1})`,
        opacity: isDim ? 0.2 : 1,
        transition: "opacity 200ms ease-out, transform 200ms ease-out, box-shadow 200ms ease-out",
      }}
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
    </div>
  );
}
