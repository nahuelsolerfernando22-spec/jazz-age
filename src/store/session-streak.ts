import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionStreakState {
  currentSession: number;
  best: number;
  lastGameAt: number;
  bonusesGiven: number;
  registerGame: () => { streak: number; bonusChips: number };
  resetSession: () => void;
}

const SESSION_WINDOW_MS = 4 * 60 * 1000;
const BONUS_EVERY = 3;
const BONUS_CHIPS = 25;

export const useSessionStreak = create<SessionStreakState>()(
  persist(
    (set, get) => ({
      currentSession: 0,
      best: 0,
      lastGameAt: 0,
      bonusesGiven: 0,
      registerGame: () => {
        const now = Date.now();
        const prev = get();
        const cont = now - prev.lastGameAt < SESSION_WINDOW_MS;
        const nextStreak = cont ? prev.currentSession + 1 : 1;
        const bonus = nextStreak > 0 && nextStreak % BONUS_EVERY === 0 ? BONUS_CHIPS : 0;
        set({
          currentSession: nextStreak,
          best: Math.max(prev.best, nextStreak),
          lastGameAt: now,
          bonusesGiven: prev.bonusesGiven + (bonus > 0 ? 1 : 0),
        });
        return { streak: nextStreak, bonusChips: bonus };
      },
      resetSession: () => set({ currentSession: 0, lastGameAt: 0 }),
    }),
    { name: "cuervo-session-streak-v1" },
  ),
);
