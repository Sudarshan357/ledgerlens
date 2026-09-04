import { createContext, useContext } from "react";
import type { FocusState } from "@/lib/data/graph";

export interface GraphFocusValue {
  activeId: string | null;
  focusMap: Map<string, FocusState>;
  onFocusChange: (id: string, focused: boolean) => void;
  onPinToggle: (id: string) => void;
}

const DEFAULT_VALUE: GraphFocusValue = {
  activeId: null,
  focusMap: new Map(),
  onFocusChange: () => {},
  onPinToggle: () => {},
};

// Hover/pin focus state is deliberately kept OUT of React Flow's own
// `nodes`/`edges` props — mutating those on every hover caused React Flow's
// internal pointer tracking to re-fire mouseenter/mouseleave in a feedback
// loop (nodes array changes -> RF re-derives hover -> state changes -> nodes
// array changes -> ...). Context lets node/edge components re-render on
// focus change without React Flow ever seeing a new nodes/edges reference.
export const GraphFocusContext = createContext<GraphFocusValue>(DEFAULT_VALUE);

export function useGraphFocus(id: string): FocusState {
  const { activeId, focusMap } = useContext(GraphFocusContext);
  return activeId ? focusMap.get(id) : undefined;
}
