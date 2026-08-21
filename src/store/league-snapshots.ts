import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LeagueRow } from "@/components/casino/leagues/LeagueTable";
import type { LeagueGameId, LeagueTierId } from "@/lib/leagues-daily";

export interface LeagueSnapshot {
  game: LeagueGameId;
  dayKey: string;
  tier: LeagueTierId;
  rows: LeagueRow[];
  savedAt: number;
}

interface SnapshotState {
  byKey: Record<string, LeagueSnapshot>;
  save: (snap: Omit<LeagueSnapshot, "savedAt">) => void;
  get: (game: LeagueGameId, dayKey: string) => LeagueSnapshot | undefined;
  listDays: (game: LeagueGameId) => string[];
}

const MAX_SNAPSHOTS = 200;
const k = (g: LeagueGameId, d: string) => `${g}|${d}`;

export const useLeagueSnapshots = create<SnapshotState>()(
  persist(
    (set, get) => ({
      byKey: {},
      save: (snap) => {
        const key = k(snap.game, snap.dayKey);
        if (get().byKey[key]) return;
        const next = { ...get().byKey, [key]: { ...snap, savedAt: Date.now() } };

        const entries = Object.entries(next);
        if (entries.length > MAX_SNAPSHOTS) {
          entries.sort((a, b) => b[1].savedAt - a[1].savedAt);
          const trimmed = Object.fromEntries(entries.slice(0, MAX_SNAPSHOTS));
          set({ byKey: trimmed });
        } else {
          set({ byKey: next });
        }
      },
      get: (game, dayKey) => get().byKey[k(game, dayKey)],
      listDays: (game) =>
        Object.values(get().byKey)
          .filter((s) => s.game === game)
          .map((s) => s.dayKey)
          .sort((a, b) => (a < b ? 1 : -1)),
    }),
    {
      name: "speakeasy:league-snapshots:v1",
      partialize: (s) => ({ byKey: s.byKey }),
    },
  ),
);
