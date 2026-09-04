"use client";

import { useMemo } from "react";

// A hand-authored, sparse payment-infrastructure topology: nodes are
// deliberately placed (not random) so edges look like a real mesh rather
// than decorative confetti. One chain (idx 2 -> 3 -> 4 -> 5 -> 6) is the
// "featured" Order -> Payment -> Refund -> Adjustment -> Settlement path and
// carries the periodic red pulse; everything else stays quiet and dim.
const NODES = [
  { x: 60, y: 90 }, { x: 160, y: 200 }, { x: 90, y: 320 },
  { x: 260, y: 260 }, { x: 400, y: 150 }, { x: 540, y: 260 },
  { x: 690, y: 200 }, { x: 640, y: 360 }, { x: 820, y: 300 },
  { x: 900, y: 140 }, { x: 1020, y: 240 }, { x: 1120, y: 120 },
  { x: 1150, y: 340 }, { x: 980, y: 400 },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [6, 9],
  [7, 8], [8, 9], [9, 10], [10, 11], [10, 12], [8, 13], [12, 13], [2, 3],
];

const CHAIN = [2, 3, 4, 5, 6];

export function NetworkBackground() {
  // Randomize per-node breathing delay once per mount so nodes don't pulse in lockstep.
  const delays = useMemo(() => NODES.map((_, i) => (i * 0.37) % 3), []);

  return (
    <svg
      viewBox="0 0 1200 460"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
      aria-hidden="true"
    >
      {EDGES.map(([a, b], i) => {
        const isChainEdge = CHAIN.includes(a) && CHAIN.includes(b) && Math.abs(CHAIN.indexOf(a) - CHAIN.indexOf(b)) === 1;
        return (
          <line
            key={i}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke={isChainEdge ? "var(--brand-red)" : "var(--border-default)"}
            strokeOpacity={isChainEdge ? 0.35 : 0.5}
            strokeWidth={1}
          />
        );
      })}

      {NODES.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={CHAIN.includes(i) ? 2.6 : 1.8}
          fill={CHAIN.includes(i) ? "var(--brand-red)" : "var(--ink-400)"}
          opacity={0.7}
        >
          <animate
            attributeName="opacity"
            values="0.25;0.75;0.25"
            dur={`${5 + (i % 4)}s`}
            begin={`${delays[i]}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* the anomaly pulse — one particle looping through the featured chain */}
      <circle r={3.2} fill="var(--brand-red)">
        <animateMotion
          dur="6s"
          repeatCount="indefinite"
          path={`M${CHAIN.map((i) => `${NODES[i].x},${NODES[i].y}`).join(" L")}`}
        />
        <animate attributeName="opacity" values="0;1;1;0" dur="6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
