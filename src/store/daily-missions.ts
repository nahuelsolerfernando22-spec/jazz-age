import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey, dayIndex } from "@/lib/date-keys";
import { useFavors } from "@/store/favors";
import { useRewardsHistory } from "@/store/rewards-history";
import { useCasino } from "@/store/casino";
import { SINGLE_GAMES } from "@/lib/single-games";
import { track } from "@/lib/analytics";

export type MissionKind = "plays" | "wins";

export interface MissionTemplate {
  id: string;
  kind: MissionKind;
  target: number;
  label: string;
  favors: number;
}

const POOL: Record<string, MissionTemplate[]> = {
  __default__: [
    { id: "play-2", kind: "plays", target: 2, label: "Jugá 2 manos hoy", favors: 1 },
    { id: "win-1", kind: "wins", target: 1, label: "Ganá 1 partida", favors: 2 },
    { id: "play-4", kind: "plays", target: 4, label: "Jugá 4 manos", favors: 2 },
    { id: "win-2", kind: "wins", target: 2, label: "Ganá 2 partidas", favors: 3 },
  ],
  solitario: [
    { id: "win-1", kind: "wins", target: 1, label: "Cerrá 1 solitario", favors: 3 },
    { id: "play-3", kind: "plays", target: 3, label: "Jugá 3 manos", favors: 2 },
  ],
  ruleta: [
    { id: "play-3", kind: "plays", target: 3, label: "3 apuestas a la rueda", favors: 1 },
    { id: "win-1", kind: "wins", target: 1, label: "Cobrá una apuesta", favors: 2 },
  ],
  bagatelle: [{ id: "play-3", kind: "plays", target: 3, label: "3 bolas al tablero", favors: 1 }],
};

function poolFor(gameId: string): MissionTemplate[] {
  return POOL[gameId] ?? POOL.__default__;
}

export function missionOfTheDay(gameId: string, date: Date = new Date()): MissionTemplate {
  const pool = poolFor(gameId);

  let h = 2166136261 >>> 0;
  for (let i = 0; i < gameId.length; i++) {
    h ^= gameId.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const idx = (dayIndex(date) + h) % pool.length;
  return pool[idx];
}

export interface MissionProgress {
  date: string;
  missionId: string;
  count: number;
  claimed: boolean;
}

interface StreakState {
  lastClaimDay: string | null;
  count: number;
  lastBonusDay: string | null;
}

interface State {
  byGame: Record<string, MissionProgress>;
  streak: StreakState;
  get: (gameId: string) => { mission: MissionTemplate; progress: MissionProgress };
  tick: (gameId: string, delta: { plays?: number; wins?: number }) => void;
  claim: (gameId: string) => number;
  reset: () => void;
}

function ensureFresh(cur: MissionProgress | undefined, mission: MissionTemplate): MissionProgress {
  const today = todayKey();
  if (!cur || cur.date !== today || cur.missionId !== mission.id) {
    return { date: today, missionId: mission.id, count: 0, claimed: false };
  }
  return cur;
}

function prevDay(day: string): string {
  const [y, m, d] = day.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export const useDailyMissions = create<State>()(
  persist(
    (set, get) => ({
      byGame: {},
      streak: { lastClaimDay: null, count: 0, lastBonusDay: null },
      get: (gameId) => {
        const mission = missionOfTheDay(gameId);
        const progress = ensureFresh(get().byGame[gameId], mission);
        return { mission, progress };
      },
      tick: (gameId, delta) => {
        const mission = missionOfTheDay(gameId);
        set((s) => {
          const cur = ensureFresh(s.byGame[gameId], mission);
          if (cur.claimed) return s;
          const add = mission.kind === "plays" ? (delta.plays ?? 0) : (delta.wins ?? 0);
          if (add <= 0) return { byGame: { ...s.byGame, [gameId]: cur } };
          return {
            byGame: {
              ...s.byGame,
              [gameId]: { ...cur, count: Math.min(mission.target, cur.count + add) },
            },
          };
        });
      },
      claim: (gameId) => {
        const mission = missionOfTheDay(gameId);
        const cur = ensureFresh(get().byGame[gameId], mission);
        if (cur.claimed || cur.count < mission.target) return 0;
        const today = todayKey();

        const st = get().streak;
        let nextCount = st.count;
        if (st.lastClaimDay !== today) {
          nextCount = st.lastClaimDay && prevDay(today) === st.lastClaimDay ? st.count + 1 : 1;
        }

        let bonusFavors = 0;
        let bonusChips = 0;
        if (st.lastBonusDay !== today) {
          if (nextCount === 3) bonusFavors = 2;
          else if (nextCount === 7) {
            bonusFavors = 5;
            bonusChips = 50;
          }
        }
        const total = mission.favors + bonusFavors;
        useFavors.getState().add(total);
        if (bonusChips > 0) {
          useCasino.getState().addChips(bonusChips);
        }
        track("mission_completed", { gameId, favors: mission.favors, streak: nextCount });
        if (bonusFavors > 0)
          track("mission_streak_bonus", {
            gameId,
            streak: nextCount,
            favors: bonusFavors,
            chips: bonusChips,
          });
        useRewardsHistory.getState().add({
          source: "daily-mission",
          gameId,
          favors: total,
          chips: bonusChips,
          label:
            bonusFavors > 0
              ? `Misión: ${mission.label} (racha día ${nextCount} +${bonusFavors}🪶${bonusChips ? ` +${bonusChips}💰` : ""})`
              : `Misión: ${mission.label}`,
        });
        set((s) => ({
          byGame: { ...s.byGame, [gameId]: { ...cur, claimed: true } },
          streak: {
            lastClaimDay: today,
            count: nextCount,
            lastBonusDay: bonusFavors > 0 ? today : s.streak.lastBonusDay,
          },
        }));
        return total;
      },
      reset: () =>
        set({ byGame: {}, streak: { lastClaimDay: null, count: 0, lastBonusDay: null } }),
    }),
    { name: "cuervo:daily-missions:v1" },
  ),
);

export function allGameIds(): string[] {
  return SINGLE_GAMES.map((g) => g.id);
}
