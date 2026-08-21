import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AffinityRecord {
  affinity: number;
  plays: number;
  wins: number;
  losses: number;
  draws: number;
  lastAt: number;
}

const EMPTY: AffinityRecord = {
  affinity: 0,
  plays: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  lastAt: 0,
};

export type AffinityOutcome = "win" | "loss" | "draw";

interface State {
  byNpc: Record<string, AffinityRecord>;
  get: (npcId: string) => AffinityRecord;
  record: (npcId: string, outcome: AffinityOutcome) => void;
  reset: () => void;
}

function bump(cur: AffinityRecord, outcome: AffinityOutcome): AffinityRecord {
  const gain = outcome === "win" ? 3 : 1;
  const next: AffinityRecord = {
    ...cur,
    plays: cur.plays + 1,
    wins: cur.wins + (outcome === "win" ? 1 : 0),
    losses: cur.losses + (outcome === "loss" ? 1 : 0),
    draws: cur.draws + (outcome === "draw" ? 1 : 0),
    affinity: Math.min(100, cur.affinity + gain),
    lastAt: Date.now(),
  };
  return next;
}

export const useSingleAffinity = create<State>()(
  persist(
    (set, get) => ({
      byNpc: {},
      get: (npcId) => get().byNpc[npcId] ?? EMPTY,
      record: (npcId, outcome) =>
        set((s) => ({
          byNpc: {
            ...s.byNpc,
            [npcId]: bump(s.byNpc[npcId] ?? EMPTY, outcome),
          },
        })),
      reset: () => set({ byNpc: {} }),
    }),
    { name: "cuervo:single-affinity", version: 1 },
  ),
);

export function reportAffinity(npcId: string, outcome: AffinityOutcome) {
  useSingleAffinity.getState().record(npcId, outcome);
}

export async function creditAffinityForGame(gameId: string, outcome: AffinityOutcome) {
  try {
    const { hostessForGame } = await import("@/lib/single-hostess");
    const h = hostessForGame(gameId);
    if (h) useSingleAffinity.getState().record(h.npcId, outcome);
  } catch {}
}
