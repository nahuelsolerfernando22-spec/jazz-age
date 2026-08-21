import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LeagueGameId, LeagueTierId } from "@/lib/leagues-daily";

/**
 * Libro de auditoría del progreso: cada suma de puntos, cada cierre de jornada
 * y cada pago de torneo queda registrado con su cálculo. Sirve para comprobar
 * que el ranking y los premios salen de reglas y no de números sueltos.
 */
export type ProgressLogInput =
  | {
      kind: "league-points";
      game: LeagueGameId;
      dayKey: string;
      points: number;
      before: number;
      after: number;
      capped: boolean;
      source: string;
    }
  | {
      kind: "league-close";
      game: LeagueGameId;
      dayKey: string;
      score: number;
      rank: number;
      total: number;
      fromTier: LeagueTierId;
      toTier: LeagueTierId;
      outcome: "promo" | "stay" | "demote";
      favors: number;
    }
  | {
      kind: "tourney-score";
      game: string;
      week: number;
      round: number;
      score: number;
      total: number;
      rewardChips: number;
    }
  | {
      kind: "tourney-close";
      game: string;
      week: number;
      rank: number | null;
      total: number;
      best: number;
      prize: number;
      paid: boolean;
    };

export type ProgressLogEntry = ProgressLogInput & { id: string; at: number };

const MAX_ENTRIES = 400;

interface ProgressLogState {
  entries: ProgressLogEntry[];
  push: (entry: ProgressLogInput) => void;
  clear: () => void;
}

export const useProgressLog = create<ProgressLogState>()(
  persist(
    (set, get) => ({
      entries: [],
      push: (entry) => {
        const full: ProgressLogEntry = {
          ...entry,
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          at: Date.now(),
        };
        set({ entries: [full, ...get().entries].slice(0, MAX_ENTRIES) });
      },
      clear: () => set({ entries: [] }),
    }),
    { name: "speakeasy:progress-log:v1", partialize: (s) => ({ entries: s.entries }) },
  ),
);

export function logProgress(entry: ProgressLogInput): void {
  if (typeof window === "undefined") return;
  useProgressLog.getState().push(entry);
}
