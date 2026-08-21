import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCasino } from "@/store/casino";

export interface LoginStreakReward {
  chips: number;
  reputation: number;
  label: string;
}

export const STREAK_REWARDS: LoginStreakReward[] = [
  { chips: 50, reputation: 0, label: "Día 1" },
  { chips: 100, reputation: 0, label: "Día 2" },
  { chips: 175, reputation: 1, label: "Día 3" },
  { chips: 275, reputation: 1, label: "Día 4" },
  { chips: 400, reputation: 2, label: "Día 5" },
  { chips: 600, reputation: 2, label: "Día 6" },
  { chips: 1000, reputation: 5, label: "Día 7 · Cuervo" },
];

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function yesterdayKey(of: string): string {
  const [y, m, d] = of.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

interface LoginStreakState {
  lastVisitDay: string | null;
  lastClaimDay: string | null;
  streak: number;
  bestStreak: number;
  totalClaims: number;
  tick: () => void;
  claim: () => LoginStreakReward | null;
  canClaim: () => boolean;
  reset: () => void;
}

export const useLoginStreak = create<LoginStreakState>()(
  persist(
    (set, get) => ({
      lastVisitDay: null,
      lastClaimDay: null,
      streak: 0,
      bestStreak: 0,
      totalClaims: 0,
      tick: () => {
        const today = todayKey();
        const { lastVisitDay, streak } = get();
        if (lastVisitDay === today) return;
        let nextStreak: number;
        if (!lastVisitDay) {
          nextStreak = 1;
        } else if (lastVisitDay === yesterdayKey(today)) {
          nextStreak = streak >= 7 ? 1 : streak + 1;
        } else {
          nextStreak = 1;
        }
        set((s) => ({
          lastVisitDay: today,
          streak: nextStreak,
          bestStreak: Math.max(s.bestStreak, nextStreak),
        }));
      },
      canClaim: () => {
        const { lastClaimDay, streak } = get();
        return streak > 0 && lastClaimDay !== todayKey();
      },
      claim: () => {
        if (!get().canClaim()) return null;
        const reward = STREAK_REWARDS[get().streak - 1];
        if (!reward) return null;
        useCasino.getState().addChips(reward.chips);
        if (reward.reputation > 0) {
          useCasino.getState().bumpReputation(reward.reputation);
        }
        set((s) => ({
          lastClaimDay: todayKey(),
          totalClaims: s.totalClaims + 1,
        }));
        return reward;
      },
      reset: () =>
        set({
          lastVisitDay: null,
          lastClaimDay: null,
          streak: 0,
          bestStreak: 0,
          totalClaims: 0,
        }),
    }),
    { name: "login-streak:v1" },
  ),
);
