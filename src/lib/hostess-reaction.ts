import { useEffect, useState } from "react";
import type { PortraitState } from "./npc-portrait-states";

type Listener = (state: PortraitState | null, durationMs: number) => void;

const listeners = new Map<string, Set<Listener>>();

export function emitHostessReaction(gameId: string, state: PortraitState, durationMs = 2200): void {
  const set = listeners.get(gameId);
  if (!set) return;
  for (const fn of set) fn(state, durationMs);
}

export function useHostessReaction(gameId: string | undefined): PortraitState | null {
  const [state, setState] = useState<PortraitState | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let clearTimer: number | null = null;
    const listener: Listener = (next, durationMs) => {
      setState(next);
      if (clearTimer) window.clearTimeout(clearTimer);
      if (next !== null) {
        clearTimer = window.setTimeout(() => setState(null), durationMs);
      }
    };
    let set = listeners.get(gameId);
    if (!set) {
      set = new Set();
      listeners.set(gameId, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
      if (set && set.size === 0) listeners.delete(gameId);
      if (clearTimer) window.clearTimeout(clearTimer);
    };
  }, [gameId]);

  return state;
}
