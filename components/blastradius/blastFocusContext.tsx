"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type BlastFocusState = "focused" | "connected" | "dim" | undefined;

interface BlastFocusValue {
  activeId: string | null;
  getFocusState: (id: string) => BlastFocusState;
  hover: (id: string | null) => void;
  pin: (id: string) => void;
  clear: () => void;
}

const BlastFocusContext = createContext<BlastFocusValue | null>(null);

export function useBlastFocus(): BlastFocusValue {
  const ctx = useContext(BlastFocusContext);
  if (!ctx) throw new Error("useBlastFocus must be used within BlastFocusProvider");
  return ctx;
}

/**
 * The blast-radius graph is a pure star: every outer node connects only to
 * the center ("incident"), never to each other. So focus math is simple —
 * no multi-hop BFS needed (unlike the Money Flow graph's adjacency model).
 */
export function BlastFocusProvider({ centerId, children }: { centerId: string; children: ReactNode }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const activeId = pinnedId ?? hoveredId;

  const value = useMemo<BlastFocusValue>(
    () => ({
      activeId,
      getFocusState: (id: string): BlastFocusState => {
        if (!activeId) return undefined;
        if (id === activeId) return "focused";
        if (id === centerId || activeId === centerId) return "connected";
        return "dim";
      },
      hover: (id) => setHoveredId(id),
      pin: (id) => setPinnedId((prev) => (prev === id ? null : id)),
      clear: () => setPinnedId(null),
    }),
    [activeId, centerId],
  );

  return <BlastFocusContext.Provider value={value}>{children}</BlastFocusContext.Provider>;
}
