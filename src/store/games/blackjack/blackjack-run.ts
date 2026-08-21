import { registerRun, type RunStoreLike } from "@/lib/games/run-registry";
import { withRumorChips } from "@/lib/rumor-bonus";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BLACKJACK_LEVELS,
  computeBlackjackStars,
  findBlackjackLevel,
  blackjackLevelLabel,
  type BlackjackLevelDef,
  type BlackjackModifier,
} from "@/lib/games/blackjack/blackjack-levels";

export type EndReason = "won" | "lost-hands" | "lost-budget" | "lost-clock" | "abandoned";

export interface ClearedRecord {
  stars: 0 | 1 | 2 | 3;
  bestHands: number;
  clearedAt: string;
}

export type BJHandOutcome = "blackjack" | "win" | "push" | "loss";

export interface HandReport {
  outcome: BJHandOutcome;
  net: number;
  wager: number;
  doubled: boolean;
  split: boolean;
  hands: number;
}

export type BlackjackPowerUp = "bribe" | "double-face" | "second-chance";

interface RunState {
  activeLevel: string | null;
  startedAt: number | null;
  handsUsed: number;
  chipsGained: number;
  budgetLeft: number;
  progress: number;
  winStreak: number;
  blackjacks: number;
  cleanStreakCount: number;
  lastEndReason: EndReason | null;
  lastResult: null | {
    levelId: string;
    stars: 0 | 1 | 2 | 3;
    won: boolean;
    reward: number;
    handsUsed: number;
    chipsGained: number;
  };
  cleared: Record<string, ClearedRecord>;
  inventory: Record<BlackjackPowerUp, number>;
}

interface RunActions {
  startRun: (levelId: string) => void;
  abandon: () => void;
  ackResult: () => void;
  trackHand: (report: HandReport) => void;
  pollClock: () => void;
  totalStars: () => number;
  isUnlocked: (levelId: string) => boolean;
  minBet: () => number | null;
  clockRemaining: () => number | null;
  restrictions: () => { noSplit: boolean; noDouble: boolean; noInsurance: boolean };
  addPowerUp: (kind: BlackjackPowerUp) => void;
  usePowerUp: (kind: BlackjackPowerUp) => boolean;
}

export type BlackjackRunStore = RunState & RunActions;

function emptyState(): RunState {
  return {
    activeLevel: null,
    startedAt: null,
    handsUsed: 0,
    chipsGained: 0,
    budgetLeft: 0,
    progress: 0,
    winStreak: 0,
    blackjacks: 0,
    cleanStreakCount: 0,
    lastEndReason: null,
    lastResult: null,
    cleared: {},
    inventory: {
      bribe: 0,
      "double-face": 0,
      "second-chance": 0,
    },
  };
}

function findMod<T extends BlackjackModifier["kind"]>(
  mods: BlackjackModifier[],
  kind: T,
): Extract<BlackjackModifier, { kind: T }> | undefined {
  return mods.find((m) => m.kind === kind) as Extract<BlackjackModifier, { kind: T }> | undefined;
}

function isMet(l: BlackjackLevelDef, s: RunState): boolean {
  switch (l.objective.kind) {
    case "wins":
      return s.progress >= l.objective.count;
    case "profit":
      return s.chipsGained >= l.objective.target;
    case "blackjacks":
      return s.blackjacks >= l.objective.count;
    case "streak":
      return s.winStreak >= l.objective.length;
    case "clean":
      return s.cleanStreakCount >= l.objective.count;
  }
}

function rewardForStars(l: BlackjackLevelDef, stars: 0 | 1 | 2 | 3): number {
  if (stars <= 0) return 0;
  if (stars === 1) return l.reward.one;
  if (stars === 2) return l.reward.two;
  return l.reward.three;
}

function endRun(
  l: BlackjackLevelDef,
  reason: EndReason,
  handsUsed: number,
  chipsGained: number,
  set: (partial: Partial<RunState>) => void,
  getCleared: () => Record<string, ClearedRecord>,
) {
  const won = reason === "won";
  const stars: 0 | 1 | 2 | 3 = won ? computeBlackjackStars(l, handsUsed) : 0;
  const reward = rewardForStars(l, stars);
  const prev = getCleared()[l.id];
  const bestHands = prev ? Math.min(prev.bestHands, handsUsed) : handsUsed;
  const bestStars = (prev ? Math.max(prev.stars, stars) : stars) as 0 | 1 | 2 | 3;
  const cleared = won
    ? {
        ...getCleared(),
        [l.id]: { stars: bestStars, bestHands, clearedAt: new Date().toISOString() },
      }
    : getCleared();

  set({
    activeLevel: null,
    startedAt: null,
    lastEndReason: reason,
    lastResult: { levelId: l.id, stars, won, reward, handsUsed, chipsGained },
    cleared,
  });

  if (reward > 0) {
    void import("@/store/casino").then((m) => {
      try {
        m.useCasino.getState().addChips?.(withRumorChips("blackjack", reward));
      } catch {}
    });
  }
}

export const useBlackjackRun = create<BlackjackRunStore>()(
  persist(
    (set, get) => ({
      ...emptyState(),

      startRun: (levelId) => {
        const l = findBlackjackLevel(levelId);
        if (!l) return;
        set({
          activeLevel: l.id,
          startedAt: Date.now(),
          handsUsed: 0,
          chipsGained: 0,
          budgetLeft: l.budget,
          progress: 0,
          winStreak: 0,
          blackjacks: 0,
          cleanStreakCount: 0,
          lastEndReason: null,
          lastResult: null,
        });
      },

      abandon: () => {
        const s = get();
        if (!s.activeLevel) return;
        set({
          activeLevel: null,
          startedAt: null,
          lastEndReason: "abandoned",
          lastResult: null,
        });
      },

      ackResult: () => set({ lastResult: null, lastEndReason: null }),

      trackHand: (report) => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findBlackjackLevel(s.activeLevel);
        if (!l) return;

        const remaining = get().clockRemaining();
        if (remaining != null && remaining <= 0) {
          endRun(l, "lost-clock", s.handsUsed, s.chipsGained, set, () => get().cleared);
          return;
        }

        const minBet = findMod(l.modifiers, "min-bet");
        const capPayout = findMod(l.modifiers, "cap-payout");
        const houseEdge = findMod(l.modifiers, "house-edge");
        const lossTax = findMod(l.modifiers, "loss-tax");

        let delta = report.net;
        if (capPayout && delta > capPayout.max) delta = capPayout.max;
        if (minBet && report.wager < minBet.min && delta > 0) {
          delta = 0;
        }
        if (delta < 0 && lossTax) {
          delta = Math.round(delta * (1 + lossTax.percent));
        }
        if (delta < 0 && houseEdge) {
          delta -= houseEdge.extra;
        }

        const wonHand = report.outcome === "win" || report.outcome === "blackjack";
        const isBj = report.outcome === "blackjack";
        const clean = wonHand && !report.doubled && !report.split;

        const handsUsed = s.handsUsed + 1;
        const chipsGained = s.chipsGained + delta;
        const budgetLeft = s.budgetLeft + delta;
        const winStreak = wonHand ? s.winStreak + 1 : 0;
        const cleanStreakCount = clean ? s.cleanStreakCount + 1 : 0;
        const blackjacks = s.blackjacks + (isBj ? 1 : 0);

        if (isBj) {
          const kinds: BlackjackPowerUp[] = ["bribe", "double-face", "second-chance"];
          const kind = kinds[Math.floor(Math.random() * kinds.length)];
          get().addPowerUp(kind);
        } else if (winStreak > 0 && winStreak % 3 === 0 && wonHand) {
          get().addPowerUp("bribe");
        }

        let progress = s.progress;
        switch (l.objective.kind) {
          case "wins":
            progress = s.progress + (wonHand ? 1 : 0);
            break;
          case "profit":
            progress = Math.max(0, chipsGained);
            break;
          case "blackjacks":
            progress = blackjacks;
            break;
          case "streak":
            progress = Math.max(progress, winStreak);
            break;
          case "clean":
            progress = Math.max(progress, cleanStreakCount);
            break;
        }

        set({
          handsUsed,
          chipsGained,
          budgetLeft,
          winStreak,
          cleanStreakCount,
          blackjacks,
          progress,
        });

        const next = get();
        if (isMet(l, next)) {
          endRun(l, "won", handsUsed, chipsGained, set, () => get().cleared);
          return;
        }
        if (budgetLeft <= -l.budget) {
          endRun(l, "lost-budget", handsUsed, chipsGained, set, () => get().cleared);
          return;
        }
        if (handsUsed >= l.handLimit) {
          endRun(l, "lost-hands", handsUsed, chipsGained, set, () => get().cleared);
          return;
        }
      },

      pollClock: () => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findBlackjackLevel(s.activeLevel);
        if (!l) return;
        const remaining = get().clockRemaining();
        if (remaining != null && remaining <= 0) {
          endRun(l, "lost-clock", s.handsUsed, s.chipsGained, set, () => get().cleared);
        }
      },

      totalStars: () => Object.values(get().cleared).reduce((acc, r) => acc + r.stars, 0),

      isUnlocked: (levelId) => {
        const s = get();
        const l = findBlackjackLevel(levelId);
        if (!l) return false;
        if (l.order === 1) return true;
        const prev = BLACKJACK_LEVELS[l.order - 2];
        return !!s.cleared[prev?.id ?? ""];
      },

      minBet: () => {
        const s = get();
        if (!s.activeLevel) return null;
        const l = findBlackjackLevel(s.activeLevel);
        if (!l) return null;
        const m = findMod(l.modifiers, "min-bet");
        return m ? m.min : null;
      },

      clockRemaining: () => {
        const s = get();
        if (!s.activeLevel || !s.startedAt) return null;
        const l = findBlackjackLevel(s.activeLevel);
        if (!l) return null;
        const tc = findMod(l.modifiers, "time-cap");
        if (!tc) return null;
        const elapsed = (Date.now() - s.startedAt) / 1000;
        return Math.max(0, tc.seconds - elapsed);
      },

      restrictions: () => {
        const s = get();
        if (!s.activeLevel) return { noSplit: false, noDouble: false, noInsurance: false };
        const l = findBlackjackLevel(s.activeLevel);
        if (!l) return { noSplit: false, noDouble: false, noInsurance: false };
        return {
          noSplit: !!findMod(l.modifiers, "no-split"),
          noDouble: !!findMod(l.modifiers, "no-double"),
          noInsurance: !!findMod(l.modifiers, "no-insurance"),
        };
      },

      addPowerUp: (kind) => {
        set((s) => ({
          inventory: { ...s.inventory, [kind]: s.inventory[kind] + 1 },
        }));
      },

      usePowerUp: (kind) => {
        const s = get();
        if (s.inventory[kind] <= 0) return false;
        set((s) => ({
          inventory: { ...s.inventory, [kind]: s.inventory[kind] - 1 },
        }));
        return true;
      },
    }),
    {
      name: "cuervo:blackjack-run:v1",
      version: 2,
      // Sólo el progreso duro sobrevive al reload: un encargo activo con su
      // reloj viejo dejaría el HUD colgado y falsearía el tiempo jugado.
      partialize: (s) => ({ cleared: s.cleared }) as Partial<BlackjackRunStore>,
    },
  ),
);

// Anuncia esta mesa al registro compartido (HUD, encargos y avisos).
registerRun({
  id: "blackjack",
  label: "Filo de Veintiuno",
  store: useBlackjackRun as unknown as RunStoreLike,
  findLevel: findBlackjackLevel,
  levelLabel: blackjackLevelLabel as (level: unknown) => string,
});
