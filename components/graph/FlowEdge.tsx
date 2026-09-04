"use client";

import { useContext } from "react";
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from "reactflow";
import { motion } from "framer-motion";
import { GraphFocusContext } from "./graphFocusContext";

export function FlowEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) {
  const { activeId } = useContext(GraphFocusContext);
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const suspicious = Boolean(data?.suspicious);
  const touchesActive = activeId != null && (source === activeId || target === activeId);
  const isFocused = activeId != null && touchesActive;
  const isDim = activeId != null && !touchesActive;

  const baseColor = suspicious ? "var(--brand-red)" : "var(--border-default)";
  const strokeWidth = isFocused ? (suspicious ? 2.5 : 2) : suspicious ? 1.75 : 1.25;
  const opacity = isDim ? 0.18 : 1;

  return (
    <g style={{ opacity, transition: "opacity 200ms ease-out" }}>
      <motion.path
        id={id}
        d={path}
        fill="none"
        stroke={isFocused ? "var(--brand-red)" : baseColor}
        strokeWidth={strokeWidth}
        style={{ transition: "stroke 200ms ease-out, stroke-width 200ms ease-out" }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut", delay: 0.15 }}
      />
      {(suspicious || isFocused) && (
        <circle r={isFocused ? 3.6 : 3} fill="var(--brand-red)">
          <animateMotion dur={isFocused ? "1.1s" : "1.8s"} repeatCount="indefinite" path={path} />
        </circle>
      )}
      {!suspicious && !isFocused && (
        <circle r="2" fill="var(--ink-300)" opacity="0.8">
          <animateMotion dur="2.6s" repeatCount="indefinite" path={path} begin="0.4s" />
        </circle>
      )}
      {isFocused && data?.relationshipLabel ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="pointer-events-none rounded-full border border-brand-red-200 bg-surface px-2 py-0.5 text-[10px] font-medium text-brand-red shadow-[var(--shadow-card)]"
          >
            {data.relationshipLabel}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </g>
  );
}

export const flowEdgeTypes = { money: FlowEdge };
