import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useGameMode } from "@/store/game-mode";
import { creditAffinityForGame } from "@/store/single-affinity";

export interface SingleScoreRecord {
  best: number;
  plays: number;
  lastAt: number;
}

interface SingleScoreState {
  byGame: Record<string, SingleScoreRecord>;
  get: (id: string) => SingleScoreRecord;
  submit: (id: string, score: number) => void;
  reset: () => void;
}

const EMPTY: SingleScoreRecord = { best: 0, plays: 0, lastAt: 0 };

export const useSingleScores = create<SingleScoreState>()(
  persist(
    (set, get) => ({
      byGame: {},
      get: (id) => get().byGame[id] ?? EMPTY,
      submit: (id, score) =>
        set((s) => {
          const cur = s.byGame[id] ?? EMPTY;
          return {
            byGame: {
              ...s.byGame,
              [id]: {
                best: Math.max(cur.best, Math.floor(score)),
                plays: cur.plays + 1,
                lastAt: Date.now(),
              },
            },
          };
        }),
      reset: () => set({ byGame: {} }),
    }),
    { name: "cuervo:single-scores", version: 1 },
  ),
);

export function reportSingleScore(id: string, score: number) {
  if (useGameMode.getState().mode !== "single") return;
  if (!Number.isFinite(score) || score < 0) return;
  useSingleScores.getState().submit(id, score);

  void creditAffinityForGame(id, score > 0 ? "win" : "draw");
}
