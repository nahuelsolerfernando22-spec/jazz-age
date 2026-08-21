import { registerRun, type RunStoreLike } from "@/lib/games/run-registry";
import { withRumorChips } from "@/lib/rumor-bonus";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hashSeed, mulberry32 } from "@/lib/rng";
import {
  RULETA_LEVELS,
  computeRuletaStars,
  findRuletaLevel,
  ruletaLevelLabel,
  type RuletaLevelDef,
  type RuletaModifier,
} from "@/lib/games/ruleta/ruleta-levels";

export type EndReason = "won" | "lost-spins" | "lost-budget" | "lost-clock" | "abandoned";

export interface ClearedRecord {
  stars: 0 | 1 | 2 | 3;
  bestSpins: number;
  clearedAt: string;
}

export interface SpinReport {
  n: number;
  staked: number;
  gross: number;
  straightHits: number;
  outsideHits: number;
}

interface RunState {
  activeLevel: string | null;
  startedAt: number | null;
  spinsUsed: number;
  chipsGained: number;
  budgetLeft: number;
  progress: number;
  outsideStreak: number;
  forbiddenNumber: number | null;
  lastEndReason: EndReason | null;
  lastResult: null | {
    levelId: string;
    stars: 0 | 1 | 2 | 3;
    won: boolean;
    reward: number;
    spinsUsed: number;
    chipsGained: number;
  };
  cleared: Record<string, ClearedRecord>;
}

interface RunActions {
  startRun: (levelId: string) => void;
  abandon: () => void;
  ackResult: () => void;
  trackSpin: (report: SpinReport) => void;
  pollClock: () => void;
  totalStars: () => number;
  isUnlocked: (levelId: string) => boolean;

  betCap: () => number | null;

  hotColdNumber: () => number | null;

  clockRemaining: () => number | null;
}

export type RuletaRunStore = RunState & RunActions;

function emptyState(): RunState {
  return {
    activeLevel: null,
    startedAt: null,
    spinsUsed: 0,
    chipsGained: 0,
    budgetLeft: 0,
    progress: 0,
    outsideStreak: 0,
    forbiddenNumber: null,
    lastEndReason: null,
    lastResult: null,
    cleared: {},
  };
}

function findMod<T extends RuletaModifier["kind"]>(
  mods: RuletaModifier[],
  kind: T,
): Extract<RuletaModifier, { kind: T }> | undefined {
  return mods.find((m) => m.kind === kind) as Extract<RuletaModifier, { kind: T }> | undefined;
}

function isMet(l: RuletaLevelDef, s: RunState): boolean {
  switch (l.objective.kind) {
    case "bankroll":
      return s.chipsGained >= l.objective.target;
    case "full-hits":
      return s.progress >= l.objective.count;
    case "outside-streak":
      return s.outsideStreak >= l.objective.count;
  }
}

function rewardForStars(l: RuletaLevelDef, stars: 0 | 1 | 2 | 3): number {
  if (stars <= 0) return 0;
  if (stars === 1) return l.reward.one;
  if (stars === 2) return l.reward.two;
  return l.reward.three;
}

function endRun(
  l: RuletaLevelDef,
  reason: EndReason,
  spinsUsed: number,
  chipsGained: number,
  set: (partial: Partial<RunState>) => void,
  getCleared: () => Record<string, ClearedRecord>,
) {
  const won = reason === "won";
  const stars: 0 | 1 | 2 | 3 = won ? computeRuletaStars(l, spinsUsed) : 0;
  const reward = rewardForStars(l, stars);
  const prev = getCleared()[l.id];
  const bestSpins = prev ? Math.min(prev.bestSpins, spinsUsed) : spinsUsed;
  const bestStars = (prev ? Math.max(prev.stars, stars) : stars) as 0 | 1 | 2 | 3;
  const cleared = won
    ? {
        ...getCleared(),
        [l.id]: { stars: bestStars, bestSpins, clearedAt: new Date().toISOString() },
      }
    : getCleared();

  set({
    activeLevel: null,
    startedAt: null,
    lastEndReason: reason,
    lastResult: { levelId: l.id, stars, won, reward, spinsUsed, chipsGained },
    cleared,
  });

  if (reward > 0) {
    void import("@/store/casino").then((m) => {
      try {
        m.useCasino.getState().addChips?.(withRumorChips("ruleta", reward));
      } catch {}
    });
  }
}

export const useRuletaRun = create<RuletaRunStore>()(
  persist(
    (set, get) => ({
      ...emptyState(),

      startRun: (levelId) => {
        const l = findRuletaLevel(levelId);
        if (!l) return;
        const hotCold = findMod(l.modifiers, "hot-cold");
        const forbidden = hotCold
          ? Math.floor(mulberry32(hashSeed(`ruleta:${l.id}:hot`))() * 37)
          : null;
        set({
          activeLevel: l.id,
          startedAt: Date.now(),
          spinsUsed: 0,
          chipsGained: 0,
          budgetLeft: l.budget,
          progress: 0,
          outsideStreak: 0,
          forbiddenNumber: forbidden,
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

      trackSpin: (report) => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findRuletaLevel(s.activeLevel);
        if (!l) return;

        const cap = get().clockRemaining();
        if (cap != null && cap <= 0) {
          endRun(l, "lost-clock", s.spinsUsed, s.chipsGained, set, () => get().cleared);
          return;
        }

        const betCap = findMod(l.modifiers, "bet-cap");
        const zeroPen = findMod(l.modifiers, "zero-penalty");

        let gross = report.gross;
        if (report.n === s.forbiddenNumber && report.straightHits > 0 && gross > report.staked) {
          gross = report.staked + Math.floor((gross - report.staked) / 2);
        }
        if (betCap && report.staked > betCap.max && gross > report.staked) {
          gross = 0;
        }
        let delta = gross - report.staked;
        if (zeroPen && report.n === 0) delta -= zeroPen.extra;

        const spinsUsed = s.spinsUsed + 1;
        const chipsGained = s.chipsGained + delta;
        const budgetLeft = s.budgetLeft + delta;

        let progress = s.progress;
        let outsideStreak = s.outsideStreak;
        switch (l.objective.kind) {
          case "bankroll":
            progress = Math.max(0, chipsGained);
            break;
          case "full-hits":
            if (
              report.straightHits > 0 &&
              (s.forbiddenNumber == null || report.n !== s.forbiddenNumber)
            ) {
              progress += report.straightHits;
            }
            break;
          case "outside-streak":
            if (report.outsideHits > 0 && report.gross > report.staked) {
              outsideStreak += 1;
              progress = Math.max(progress, outsideStreak);
            } else {
              outsideStreak = 0;
            }
            break;
        }

        set({ spinsUsed, chipsGained, budgetLeft, progress, outsideStreak });

        const next = get();
        if (isMet(l, next)) {
          endRun(l, "won", spinsUsed, chipsGained, set, () => get().cleared);
          return;
        }
        if (budgetLeft <= -l.budget) {
          endRun(l, "lost-budget", spinsUsed, chipsGained, set, () => get().cleared);
          return;
        }
        if (spinsUsed >= l.spinLimit) {
          endRun(l, "lost-spins", spinsUsed, chipsGained, set, () => get().cleared);
          return;
        }
      },

      pollClock: () => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findRuletaLevel(s.activeLevel);
        if (!l) return;
        const cap = get().clockRemaining();
        if (cap != null && cap <= 0) {
          endRun(l, "lost-clock", s.spinsUsed, s.chipsGained, set, () => get().cleared);
        }
      },

      totalStars: () => Object.values(get().cleared).reduce((acc, r) => acc + r.stars, 0),

      isUnlocked: (levelId) => {
        const s = get();
        const l = findRuletaLevel(levelId);
        if (!l) return false;
        if (l.order === 1) return true;
        const prev = RULETA_LEVELS[l.order - 2];
        return !!s.cleared[prev.id];
      },

      betCap: () => {
        const s = get();
        if (!s.activeLevel) return null;
        const l = findRuletaLevel(s.activeLevel);
        if (!l) return null;
        const cap = findMod(l.modifiers, "bet-cap");
        return cap ? cap.max : null;
      },

      hotColdNumber: () => get().forbiddenNumber,

      clockRemaining: () => {
        const s = get();
        if (!s.activeLevel || !s.startedAt) return null;
        const l = findRuletaLevel(s.activeLevel);
        if (!l) return null;
        const tc = findMod(l.modifiers, "time-cap");
        if (!tc) return null;
        const elapsed = (Date.now() - s.startedAt) / 1000;
        return Math.max(0, tc.seconds - elapsed);
      },
    }),
    { name: "cuervo:ruleta-run:v1" },
  ),
);

// Anuncia esta mesa al registro compartido (HUD, encargos y avisos).
registerRun({
  id: "ruleta",
  label: "La Rueda del Cuervo",
  store: useRuletaRun as unknown as RunStoreLike,
  findLevel: findRuletaLevel,
  levelLabel: ruletaLevelLabel as (level: unknown) => string,
});
