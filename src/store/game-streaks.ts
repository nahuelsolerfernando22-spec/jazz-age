import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey, yesterdayKey, isoWeekKey, prevIsoWeekKey } from "@/lib/date-keys";
import { useFavors } from "@/store/favors";
import { useRewardsHistory } from "@/store/rewards-history";

export interface GameStreak {
  daily: { lastDay: string | null; current: number; best: number };
  weekly: { lastWeek: string | null; current: number; best: number };
  wins: number;
  plays: number;
  claimedDaily: number[];
  claimedWeekly: number[];
}

const EMPTY_STREAK: GameStreak = {
  daily: { lastDay: null, current: 0, best: 0 },
  weekly: { lastWeek: null, current: 0, best: 0 },
  wins: 0,
  plays: 0,
  claimedDaily: [],
  claimedWeekly: [],
};

export const DAILY_MILESTONES = [3, 7, 14, 30];
export const WEEKLY_MILESTONES = [2, 4, 8];

function dailyReward(days: number): number {
  if (days >= 30) return 12;
  if (days >= 14) return 6;
  if (days >= 7) return 3;
  if (days >= 3) return 1;
  return 0;
}
function weeklyReward(weeks: number): number {
  if (weeks >= 8) return 20;
  if (weeks >= 4) return 10;
  if (weeks >= 2) return 4;
  return 0;
}

interface State {
  byGame: Record<string, GameStreak>;
  get: (id: string) => GameStreak;
  trackPlay: (id: string, opts?: { won?: boolean }) => void;
  reset: () => void;
}

export const useGameStreaks = create<State>()(
  persist(
    (set, get) => ({
      byGame: {},
      get: (id) => get().byGame[id] ?? EMPTY_STREAK,
      trackPlay: (id, opts) => {
        if (!id) return;
        const today = todayKey();
        const week = isoWeekKey();
        set((s) => {
          const cur = s.byGame[id] ?? EMPTY_STREAK;

          let daily = cur.daily;
          let claimedDaily = cur.claimedDaily;
          // Si ya se jugó hoy la racha diaria queda igual.
          if (daily.lastDay !== today) {
            if (daily.lastDay === yesterdayKey(today)) {
              daily = {
                lastDay: today,
                current: daily.current + 1,
                best: Math.max(daily.best, daily.current + 1),
              };
            } else {
              daily = { lastDay: today, current: 1, best: Math.max(daily.best, 1) };
              claimedDaily = [];
            }
          }

          let weekly = cur.weekly;
          let claimedWeekly = cur.claimedWeekly;
          // Ídem para la racha semanal.
          if (weekly.lastWeek !== week) {
            if (weekly.lastWeek === prevIsoWeekKey(week)) {
              weekly = {
                lastWeek: week,
                current: weekly.current + 1,
                best: Math.max(weekly.best, weekly.current + 1),
              };
            } else {
              weekly = { lastWeek: week, current: 1, best: Math.max(weekly.best, 1) };
              claimedWeekly = [];
            }
          }

          return {
            byGame: {
              ...s.byGame,
              [id]: {
                daily,
                weekly,
                claimedDaily,
                claimedWeekly,
                plays: cur.plays + 1,
                wins: cur.wins + (opts?.won ? 1 : 0),
              },
            },
          };
        });

        const next = get().byGame[id];
        if (!next) return;
        for (const m of DAILY_MILESTONES) {
          if (next.daily.current >= m && !next.claimedDaily.includes(m)) {
            const favors = dailyReward(m);
            useFavors.getState().add(favors);
            useRewardsHistory.getState().add({
              source: "streak-daily",
              gameId: id,
              favors,
              chips: 0,
              label: `Racha ${m} días · ${id}`,
            });
            set((s) => ({
              byGame: {
                ...s.byGame,
                [id]: { ...s.byGame[id]!, claimedDaily: [...s.byGame[id]!.claimedDaily, m] },
              },
            }));
          }
        }
        for (const m of WEEKLY_MILESTONES) {
          if (next.weekly.current >= m && !next.claimedWeekly.includes(m)) {
            const favors = weeklyReward(m);
            useFavors.getState().add(favors);
            useRewardsHistory.getState().add({
              source: "streak-weekly",
              gameId: id,
              favors,
              chips: 0,
              label: `Racha ${m} semanas · ${id}`,
            });
            set((s) => ({
              byGame: {
                ...s.byGame,
                [id]: { ...s.byGame[id]!, claimedWeekly: [...s.byGame[id]!.claimedWeekly, m] },
              },
            }));
          }
        }
      },
      reset: () => set({ byGame: {} }),
    }),
    { name: "cuervo:game-streaks:v1" },
  ),
);
