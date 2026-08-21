import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
  seen: Record<string, boolean>;
  markSeen: (gameId: string) => void;
  reset: () => void;
}

/** Recuerda qué hojas de reglas ya vio el jugador para no repetir el onboarding. */
export const useRulesSeen = create<State>()(
  persist(
    (set) => ({
      seen: {},
      markSeen: (gameId) => set((s) => ({ seen: { ...s.seen, [gameId]: true } })),
      reset: () => set({ seen: {} }),
    }),
    { name: "cuervo:rules-seen", version: 1 },
  ),
);

export function hasSeenRules(gameId: string): boolean {
  return useRulesSeen.getState().seen[gameId] === true;
}
