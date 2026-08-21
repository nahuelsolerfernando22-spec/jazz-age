import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HandOutcome } from "@/lib/games/blackjack/blackjack";

export interface BJHandEntry {
  id: string;
  ts: number;
  bet: number;
  net: number;
  playerScore: number;
  dealerScore: number;
  outcomes: HandOutcome[];
  insuranceBet: number;
  insurancePayout: number;
  splits: number;
  doubled: boolean;
}

interface BJHistoryState {
  entries: BJHandEntry[];
  add: (entry: Omit<BJHandEntry, "id" | "ts">) => void;
  clear: () => void;
}

export const useBlackjackHistory = create<BJHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((s) => ({
          entries: [
            {
              ...entry,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              ts: Date.now(),
            },
            ...s.entries,
          ].slice(0, 500),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "cuervo-bj-history" },
  ),
);

export function summarizeHistory(entries: BJHandEntry[]) {
  const wins = entries.filter((e) => e.net > 0).length;
  const losses = entries.filter((e) => e.net < 0).length;
  const pushes = entries.filter((e) => e.net === 0).length;
  const netTotal = entries.reduce((s, e) => s + e.net, 0);
  return { wins, losses, pushes, netTotal, played: entries.length };
}
