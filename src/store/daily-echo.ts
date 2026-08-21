import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "@/lib/rng";
import { generateDailyEcho, DAILY_ECHO_BONUS, type EchoChallenge } from "@/lib/daily-echo";
import { useCasino } from "@/store/casino";
import { useFavors } from "@/store/favors";
import { useRewardsHistory } from "@/store/rewards-history";

interface DailyEchoState {
  date: string;
  challenges: EchoChallenge[];
  /** progreso por id de reto */
  progress: Record<string, number>;
  completed: string[];
  bonusClaimed: boolean;
  streak: number;
  lastCompleteDate: string | null;
  ensureFresh: () => void;
  /** Suma manos/victorias de una mesa a los retos del día. */
  tick: (gameId: string, delta: { plays?: number; wins?: number }) => void;
  /** Un legajo de encargos cerrado en esa mesa. */
  tickEncargo: (gameId: string) => void;
  claimBonus: () => number | null;
  reset: () => void;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

function payout(c: EchoChallenge) {
  useCasino.getState().addChips(c.reward);
  useFavors.getState().add(c.favors, "daily");
  useRewardsHistory.getState().add({
    source: "daily-mission",
    gameId: c.gameId,
    favors: c.favors,
    chips: c.reward,
    label: `Eco del día: ${c.title}`,
  });
}

export const useDailyEcho = create<DailyEchoState>()(
  persist(
    (set, get) => ({
      date: todayKey(),
      challenges: generateDailyEcho(),
      progress: {},
      completed: [],
      bonusClaimed: false,
      streak: 0,
      lastCompleteDate: null,

      ensureFresh: () => {
        const today = todayKey();
        const s = get();
        if (s.date === today && s.challenges.length > 0) return;

        const gap = s.lastCompleteDate ? daysBetween(s.lastCompleteDate, today) : 999;
        const streak = gap === 1 ? s.streak : 0;
        set({
          date: today,
          challenges: generateDailyEcho(today),
          progress: {},
          completed: [],
          bonusClaimed: false,
          streak,
        });
      },

      tick: (gameId, delta) => {
        get().ensureFresh();
        const s = get();
        const paid: EchoChallenge[] = [];
        const progress = { ...s.progress };
        const completed = [...s.completed];

        for (const c of s.challenges) {
          if (c.gameId !== gameId || c.kind === "encargo") continue;
          if (completed.includes(c.id)) continue;
          const add = c.kind === "plays" ? (delta.plays ?? 0) : (delta.wins ?? 0);
          if (add <= 0) continue;
          const next = Math.min(c.target, (progress[c.id] ?? 0) + add);
          progress[c.id] = next;
          if (next >= c.target) {
            completed.push(c.id);
            paid.push(c);
          }
        }
        if (paid.length === 0 && progress === s.progress) return;
        set({ progress, completed });
        paid.forEach(payout);
      },

      tickEncargo: (gameId) => {
        get().ensureFresh();
        const s = get();
        const c = s.challenges.find(
          (x) => x.kind === "encargo" && x.gameId === gameId && !s.completed.includes(x.id),
        );
        if (!c) return;
        set({
          progress: { ...s.progress, [c.id]: c.target },
          completed: [...s.completed, c.id],
        });
        payout(c);
      },

      claimBonus: () => {
        get().ensureFresh();
        const s = get();
        if (s.bonusClaimed) return null;
        if (s.challenges.length === 0) return null;
        if (s.completed.length < s.challenges.length) return null;
        const today = s.date;
        const gap = s.lastCompleteDate ? daysBetween(s.lastCompleteDate, today) : 999;
        const streak = gap === 1 ? s.streak + 1 : 1;
        set({ bonusClaimed: true, streak, lastCompleteDate: today });
        useCasino.getState().addChips(DAILY_ECHO_BONUS);
        useRewardsHistory.getState().add({
          source: "daily-mission",
          favors: 0,
          chips: DAILY_ECHO_BONUS,
          label: `Bono de los ecos del día (racha ${streak})`,
        });
        return DAILY_ECHO_BONUS;
      },

      reset: () =>
        set({
          date: todayKey(),
          challenges: generateDailyEcho(),
          progress: {},
          completed: [],
          bonusClaimed: false,
          streak: 0,
          lastCompleteDate: null,
        }),
    }),
    { name: "cuervo:daily-echo:v2" },
  ),
);
