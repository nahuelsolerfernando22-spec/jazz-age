import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RewardSource =
  "achievement" | "daily-mission" | "streak-daily" | "streak-weekly" | "login-streak";

export interface RewardEntry {
  id: string;
  ts: number;
  source: RewardSource;
  gameId?: string;
  label: string;
  favors: number;
  chips: number;
}

interface State {
  entries: RewardEntry[];
  totalFavors: number;
  totalChips: number;
  add: (e: Omit<RewardEntry, "id" | "ts">) => RewardEntry;
  clear: () => void;
}

const MAX_ENTRIES = 250;

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useRewardsHistory = create<State>()(
  persist(
    (set) => ({
      entries: [],
      totalFavors: 0,
      totalChips: 0,
      add: (e) => {
        const entry: RewardEntry = { ...e, id: makeId(), ts: Date.now() };
        set((s) => ({
          entries: [entry, ...s.entries].slice(0, MAX_ENTRIES),
          totalFavors: s.totalFavors + (entry.favors || 0),
          totalChips: s.totalChips + (entry.chips || 0),
        }));
        return entry;
      },
      clear: () => set({ entries: [], totalFavors: 0, totalChips: 0 }),
    }),
    { name: "cuervo:rewards-history:v1" },
  ),
);
