"use client";

import "reactflow/dist/style.css";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "reactflow";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flowNodeTypes } from "./FlowNodeCard";
import { flowEdgeTypes } from "./FlowEdge";
import { GraphNodeInfoPanel } from "./GraphNodeInfoPanel";
import { GraphFocusContext, type GraphFocusValue } from "./graphFocusContext";
import type { MoneyFlowGraph as MoneyFlowGraphData, FocusState } from "@/lib/data/graph";
import type { IncidentSummary } from "@/lib/data/incident";
import { Radar } from "lucide-react";
import { cn } from "@/lib/cn";

const PANEL_WIDTH = 256;
const PANEL_MAX_HEIGHT = 320;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 78;

/** 1-hop adjacency built once per graph — cheap to reuse for 2-hop BFS on hover. */
function buildAdjacency(graph: MoneyFlowGraphData) {
  const adjacency = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a)!.add(b);
  };
  for (const e of graph.edges) {
    add(e.source, e.target);
    add(e.target, e.source);
  }
  return adjacency;
}

function GraphInner({ graph, incident }: { graph: MoneyFlowGraphData; incident: IncidentSummary }) {
  const { fitView, fitBounds } = useReactFlow();
  const viewport = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 600 });
  const [cameraFocused, setCameraFocused] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [hopMode, setHopMode] = useState<1 | 2>(1);

  const activeId = pinnedId ?? hoveredId;
  const adjacency = useMemo(() => buildAdjacency(graph), [graph]);

  // Interaction only activates once the initial camera-focus reveal has
  // settled, so hover never fights the scripted autoplay/reveal sequence.
  const interactive = cameraFocused;

  const handleFocusChange = useCallback(
    (id: string, focused: boolean) => {
      if (!interactive) return;
      setHoveredId(focused ? id : null);
    },
    [interactive],
  );
  const handlePinToggle = useCallback(
    (id: string) => {
      if (!interactive) return;
      setPinnedId((prev) => (prev === id ? null : id));
    },
    [interactive],
  );

  const focusMap = useMemo(() => {
    const map = new Map<string, FocusState>();
    if (!activeId) return map;
    const hop1 = adjacency.get(activeId) ?? new Set<string>();
    const hop2 = new Set<string>();
    if (hopMode === 2) {
      for (const n of hop1) for (const n2 of adjacency.get(n) ?? []) if (n2 !== activeId && !hop1.has(n2)) hop2.add(n2);
    }
    for (const n of graph.nodes) {
      if (n.id === activeId) map.set(n.id, "focused");
      else if (hop1.has(n.id)) map.set(n.id, "hop1");
      else if (hop2.has(n.id)) map.set(n.id, "hop2");
      else map.set(n.id, "dim");
    }
    return map;
  }, [activeId, hopMode, adjacency, graph.nodes]);

  const focusContextValue: GraphFocusValue = useMemo(
    () => ({ activeId, focusMap, onFocusChange: handleFocusChange, onPinToggle: handlePinToggle }),
    [activeId, focusMap, handleFocusChange, handlePinToggle],
  );

  // Stable, independent of hover/pin — React Flow never sees these change on
  // focus, which is what avoids the mouseenter/mouseleave feedback loop.
  const nodes: Node[] = useMemo(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        draggable: false,
        data: n.data,
      })),
    [graph],
  );

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "money",
        data: { suspicious: e.suspicious, relationshipLabel: e.relationshipLabel },
      })),
    [graph],
  );

  const activeNode = activeId ? graph.nodes.find((n) => n.id === activeId) : undefined;

  // Screen-space position for the floating info panel, computed directly
  // from the node's flow-space position + current pan/zoom — recomputed
  // only when the active node or viewport actually changes (not
  // continuously), and clamped to stay fully inside the graph container.
  const panelStyle = useMemo(() => {
    if (!activeNode) return null;
    const containerW = containerSize.width;
    const containerH = containerSize.height;
    const nodeW = activeNode.data.kind === "exposure" ? 220 : NODE_WIDTH;

    const screenX = viewport.x + activeNode.position.x * viewport.zoom;
    const screenY = viewport.y + activeNode.position.y * viewport.zoom;
    const nodeScreenW = nodeW * viewport.zoom;
    const nodeScreenH = NODE_HEIGHT * viewport.zoom;

    const roomRight = containerW - (screenX + nodeScreenW);
    const placeRight = roomRight >= PANEL_WIDTH + 16 || screenX < PANEL_WIDTH + 16;

    let left = placeRight ? screenX + nodeScreenW + 14 : screenX - PANEL_WIDTH - 14;
    let top = screenY + nodeScreenH / 2 - PANEL_MAX_HEIGHT / 2;

    left = Math.max(8, Math.min(left, containerW - PANEL_WIDTH - 8));
    top = Math.max(8, Math.min(top, containerH - PANEL_MAX_HEIGHT - 8));

    return { left, top };
  }, [activeNode, viewport, containerSize]);

  const onNodeMouseEnter: NodeMouseHandler = useCallback(
    (_, node) => {
      if (!interactive) return;
      setHoveredId(node.id);
    },
    [interactive],
  );
  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => setHoveredId(null), []);
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (!interactive) return;
      setPinnedId((prev) => (prev === node.id ? null : node.id));
    },
    [interactive],
  );
  const onPaneClick = useCallback(() => setPinnedId(null), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets focus state when the (stable) graph prop identity changes; state already defaults to false on initial mount
    setCameraFocused(false);
    const t1 = setTimeout(() => fitView({ padding: 0.18, duration: 500 }), 60);
    const chainNodes = graph.nodes.filter((n) => graph.featuredChainNodeIds.includes(n.id));
    const t2 = setTimeout(() => {
      if (chainNodes.length) {
        const xs = chainNodes.map((n) => n.position.x);
        const ys = chainNodes.map((n) => n.position.y);
        const minX = Math.min(...xs) - 40;
        const maxX = Math.max(...xs) + 240;
        const minY = Math.min(...ys) - 70;
        const maxY = Math.max(...ys) + 110;
        fitBounds({ x: minX, y: minY, width: maxX - minX, height: maxY - minY }, { padding: 0.15, duration: 900 });
        setCameraFocused(true);
      }
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitView/fitBounds are not stable across renders; this one-time camera sequence must run only when `graph` identity actually changes, not on every hover/pin-driven re-render
  }, [graph]);

  return (
    <GraphFocusContext.Provider value={focusContextValue}>
      <div ref={containerRef} className="relative h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={flowNodeTypes}
          edgeTypes={flowEdgeTypes}
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable={false}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          proOptions={{ hideAttribution: true }}
          minZoom={0.35}
          maxZoom={1.6}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--border-subtle)" />
          <Controls
            showInteractive={false}
            className="!shadow-none [&>button]:!border-border-default [&>button]:!bg-surface [&_svg]:!fill-ink-500"
          />
        </ReactFlow>

        {activeNode && panelStyle && (
          <div
            className="pointer-events-none absolute z-20"
            style={{ left: panelStyle.left, top: panelStyle.top, width: PANEL_WIDTH }}
          >
            <GraphNodeInfoPanel node={activeNode} incident={incident} />
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-brand-red-200 bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-brand-red shadow-sm backdrop-blur">
          <Radar className="h-3 w-3" strokeWidth={2.3} />
          {cameraFocused ? "Suspicious path focused" : "Loading money-flow graph…"}
        </div>

        {interactive && (
          <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-1 rounded-full border border-border-default bg-surface/90 p-0.5 text-[10px] font-medium backdrop-blur">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                onClick={() => setHopMode(n)}
                className={cn(
                  "rounded-full px-2 py-1 transition-colors",
                  hopMode === n ? "bg-canvas text-ink-900" : "text-ink-400 hover:text-ink-700",
                )}
              >
                Expand {n} hop{n > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        )}
      </div>
    </GraphFocusContext.Provider>
  );
}

export function MoneyFlowGraph({ graph, incident }: { graph: MoneyFlowGraphData; incident: IncidentSummary }) {
  return (
    <ReactFlowProvider>
      <GraphInner graph={graph} incident={incident} />
    </ReactFlowProvider>
  );
}
