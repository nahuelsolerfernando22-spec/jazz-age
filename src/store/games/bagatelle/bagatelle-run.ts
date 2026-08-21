import { registerRun, type RunStoreLike } from "@/lib/games/run-registry";
import { withRumorChips } from "@/lib/rumor-bonus";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BAGATELLE_LEVELS,
  computeBagatelleStars,
  findBagatelleLevel,
  bagatelleLevelLabel,
  type BagatelleLevelDef,
  type BagatelleModifier,
} from "@/lib/games/bagatelle/bagatelle-levels";

export type EndReason = "won" | "lost-balls" | "lost-budget" | "lost-clock" | "abandoned";

export interface ClearedRecord {
  stars: 0 | 1 | 2 | 3;
  bestBalls: number;
  clearedAt: string;
}

export type BagatelleOutcome = "jackpot10" | "win" | "small" | "barely" | "miss" | "curse";

export interface LaunchReport {
  outcome: BagatelleOutcome;
  totalWin: number;
  stake: number;
}

interface RunState {
  activeLevel: string | null;
  startedAt: number | null;
  ballsUsed: number;
  chipsGained: number;
  budgetLeft: number;
  progress: number;
  comboStreak: number;
  jackpots: number;
  cleanStreakCount: number;
  lastEndReason: EndReason | null;
  lastResult: null | {
    levelId: string;
    stars: 0 | 1 | 2 | 3;
    won: boolean;
    reward: number;
    ballsUsed: number;
    chipsGained: number;
  };
  cleared: Record<string, ClearedRecord>;
}

interface RunActions {
  startRun: (levelId: string) => void;
  abandon: () => void;
  ackResult: () => void;
  trackLaunch: (report: LaunchReport) => void;
  pollClock: () => void;
  totalStars: () => number;
  isUnlocked: (levelId: string) => boolean;
  minStake: () => number | null;
  clockRemaining: () => number | null;
}

export type BagatelleRunStore = RunState & RunActions;

function emptyState(): RunState {
  return {
    activeLevel: null,
    startedAt: null,
    ballsUsed: 0,
    chipsGained: 0,
    budgetLeft: 0,
    progress: 0,
    comboStreak: 0,
    jackpots: 0,
    cleanStreakCount: 0,
    lastEndReason: null,
    lastResult: null,
    cleared: {},
  };
}

function findMod<T extends BagatelleModifier["kind"]>(
  mods: BagatelleModifier[],
  kind: T,
): Extract<BagatelleModifier, { kind: T }> | undefined {
  return mods.find((m) => m.kind === kind) as Extract<BagatelleModifier, { kind: T }> | undefined;
}

function isMet(l: BagatelleLevelDef, s: RunState): boolean {
  switch (l.objective.kind) {
    case "score":
      return s.chipsGained >= l.objective.target;
    case "jackpots":
      return s.jackpots >= l.objective.count;
    case "combo":
      return s.comboStreak >= l.objective.length;
    case "clean":
      return s.cleanStreakCount >= l.objective.count;
  }
}

function rewardForStars(l: BagatelleLevelDef, stars: 0 | 1 | 2 | 3): number {
  if (stars <= 0) return 0;
  if (stars === 1) return l.reward.one;
  if (stars === 2) return l.reward.two;
  return l.reward.three;
}

function endRun(
  l: BagatelleLevelDef,
  reason: EndReason,
  ballsUsed: number,
  chipsGained: number,
  set: (partial: Partial<RunState>) => void,
  getCleared: () => Record<string, ClearedRecord>,
) {
  const won = reason === "won";
  const stars: 0 | 1 | 2 | 3 = won ? computeBagatelleStars(l, ballsUsed) : 0;
  const reward = rewardForStars(l, stars);
  const prev = getCleared()[l.id];
  const bestBalls = prev ? Math.min(prev.bestBalls, ballsUsed) : ballsUsed;
  const bestStars = (prev ? Math.max(prev.stars, stars) : stars) as 0 | 1 | 2 | 3;
  const cleared = won
    ? {
        ...getCleared(),
        [l.id]: { stars: bestStars, bestBalls, clearedAt: new Date().toISOString() },
      }
    : getCleared();

  set({
    activeLevel: null,
    startedAt: null,
    lastEndReason: reason,
    lastResult: { levelId: l.id, stars, won, reward, ballsUsed, chipsGained },
    cleared,
  });

  if (reward > 0) {
    void import("@/store/casino").then((m) => {
      try {
        m.useCasino.getState().addChips?.(withRumorChips("bagatelle", reward));
      } catch {}
    });
  }
}

export const useBagatelleRun = create<BagatelleRunStore>()(
  persist(
    (set, get) => ({
      ...emptyState(),

      startRun: (levelId) => {
        const l = findBagatelleLevel(levelId);
        if (!l) return;
        set({
          activeLevel: l.id,
          startedAt: Date.now(),
          ballsUsed: 0,
          chipsGained: 0,
          budgetLeft: l.budget,
          progress: 0,
          comboStreak: 0,
          jackpots: 0,
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

      trackLaunch: (report) => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findBagatelleLevel(s.activeLevel);
        if (!l) return;

        const remaining = get().clockRemaining();
        if (remaining != null && remaining <= 0) {
          endRun(l, "lost-clock", s.ballsUsed, s.chipsGained, set, () => get().cleared);
          return;
        }

        const minStake = findMod(l.modifiers, "min-stake");
        const capJackpot = findMod(l.modifiers, "cap-jackpot");
        const cursePen = findMod(l.modifiers, "curse-penalty");
        const noSafety = findMod(l.modifiers, "no-safety");

        let gross = report.totalWin;
        if (capJackpot && report.outcome === "jackpot10") {
          gross = Math.min(gross, capJackpot.max);
        }
        if (minStake && report.stake < minStake.min && gross > report.stake) {
          gross = 0;
        }

        let delta = gross - report.stake;
        if (cursePen && report.outcome === "curse") delta -= cursePen.extra;
        if (noSafety && (report.outcome === "miss" || report.outcome === "barely")) {
          delta -= Math.max(20, Math.round(report.stake * 0.5));
        }

        const wonBall = gross > report.stake;
        const cleanWin = wonBall && report.outcome !== "curse";

        const ballsUsed = s.ballsUsed + 1;
        const chipsGained = s.chipsGained + delta;
        const budgetLeft = s.budgetLeft + delta;
        const comboStreak = wonBall ? s.comboStreak + 1 : 0;
        const cleanStreakCount = cleanWin ? s.cleanStreakCount + 1 : 0;
        const jackpots = s.jackpots + (report.outcome === "jackpot10" ? 1 : 0);

        let progress = s.progress;
        switch (l.objective.kind) {
          case "score":
            progress = Math.max(0, chipsGained);
            break;
          case "jackpots":
            progress = jackpots;
            break;
          case "combo":
            progress = Math.max(progress, comboStreak);
            break;
          case "clean":
            progress = Math.max(progress, cleanStreakCount);
            break;
        }

        set({
          ballsUsed,
          chipsGained,
          budgetLeft,
          comboStreak,
          cleanStreakCount,
          jackpots,
          progress,
        });

        const next = get();
        if (isMet(l, next)) {
          endRun(l, "won", ballsUsed, chipsGained, set, () => get().cleared);
          return;
        }
        if (budgetLeft <= -l.budget) {
          endRun(l, "lost-budget", ballsUsed, chipsGained, set, () => get().cleared);
          return;
        }
        if (ballsUsed >= l.ballLimit) {
          endRun(l, "lost-balls", ballsUsed, chipsGained, set, () => get().cleared);
          return;
        }
      },

      pollClock: () => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findBagatelleLevel(s.activeLevel);
        if (!l) return;
        const remaining = get().clockRemaining();
        if (remaining != null && remaining <= 0) {
          endRun(l, "lost-clock", s.ballsUsed, s.chipsGained, set, () => get().cleared);
        }
      },

      totalStars: () => Object.values(get().cleared).reduce((acc, r) => acc + r.stars, 0),

      isUnlocked: (levelId) => {
        const s = get();
        const l = findBagatelleLevel(levelId);
        if (!l) return false;
        if (l.order === 1) return true;
        const prev = BAGATELLE_LEVELS[l.order - 2];
        return !!s.cleared[prev?.id ?? ""];
      },

      minStake: () => {
        const s = get();
        if (!s.activeLevel) return null;
        const l = findBagatelleLevel(s.activeLevel);
        if (!l) return null;
        const m = findMod(l.modifiers, "min-stake");
        return m ? m.min : null;
      },

      clockRemaining: () => {
        const s = get();
        if (!s.activeLevel || !s.startedAt) return null;
        const l = findBagatelleLevel(s.activeLevel);
        if (!l) return null;
        const tc = findMod(l.modifiers, "time-cap");
        if (!tc) return null;
        const elapsed = (Date.now() - s.startedAt) / 1000;
        return Math.max(0, tc.seconds - elapsed);
      },
    }),
    {
      name: "cuervo:bagatelle-run:v1",
      version: 2,
      // Sólo el progreso duro sobrevive al reload: un encargo activo con su
      // reloj viejo dejaría el HUD colgado y falsearía el tiempo jugado.
      partialize: (s) => ({ cleared: s.cleared }) as Partial<BagatelleRunStore>,
    },
  ),
);

// Anuncia esta mesa al registro compartido (HUD, encargos y avisos).
registerRun({
  id: "bagatelle",
  label: "Clavo y Suerte",
  store: useBagatelleRun as unknown as RunStoreLike,
  findLevel: findBagatelleLevel,
  levelLabel: bagatelleLevelLabel as (level: unknown) => string,
  route: "/bagatelle",
  hostess: "Lulú",
});
