import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GameMode = "story" | "single";

interface GameModeState {
  mode: GameMode;
  setMode: (m: GameMode) => void;
  singleTrophies: number;
  addSingleTrophies: (n: number) => void;
}

export const useGameMode = create<GameModeState>()(
  persist(
    (set) => ({
      mode: "story",
      setMode: (mode) => set({ mode }),
      singleTrophies: 0,
      addSingleTrophies: (n) => set((s) => ({ singleTrophies: Math.max(0, s.singleTrophies + n) })),
    }),
    {
      name: "cuervo:mode",
      version: 2,
      migrate: (persisted: unknown, _v) => {
        const p = (persisted ?? {}) as { mode?: string; singleTrophies?: number };
        const mode: GameMode = p.mode === "story" ? "story" : "single";
        return {
          mode: p.mode === "competitive" ? "single" : mode,
          singleTrophies: p.singleTrophies ?? 0,
        } as GameModeState;
      },
    },
  ),
);

export function currentMode(): GameMode {
  return useGameMode.getState().mode;
}
