import { registerRun, type RunStoreLike } from "@/lib/games/run-registry";
import { withRumorChips } from "@/lib/rumor-bonus";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCasino } from "@/store/casino";
import {
  ESCOBA_LEVELS,
  computeEscobaStars,
  findEscobaLevel,
  escobaLevelLabel,
  type EscobaLevelDef,
  type EscobaModifier,
} from "@/lib/games/escoba/escoba-levels";

export type EndReason = "won" | "lost-rounds" | "lost-budget" | "lost-clock" | "abandoned";

export interface ClearedRecord {
  stars: 0 | 1 | 2 | 3;
  bestRounds: number;
  clearedAt: string;
}

export type EscobaEventReport =
  | {
      kind: "capture";
      by: "player" | "cpu";
      cards: number;
      sweep: boolean;
      oros: number;
      siete: boolean;
    }
  | {
      kind: "round-end";
      playerPoints: number;
      cpuPoints: number;
      playerWonRound: boolean;
    }
  | { kind: "match-end"; won: boolean };

interface RunState {
  activeLevel: string | null;
  startedAt: number | null;
  roundsUsed: number;
  roundsWon: number;
  sweeps: number;
  captures: number;
  oros: number;
  siete: number;
  points: number;
  budgetLeft: number;
  progress: number;
  lastEndReason: EndReason | null;
  lastResult: null | {
    levelId: string;
    stars: 0 | 1 | 2 | 3;
    won: boolean;
    reward: number;
    roundsUsed: number;
    points: number;
  };
  cleared: Record<string, ClearedRecord>;
}

interface RunActions {
  startRun: (levelId: string) => void;
  abandon: () => void;
  ackResult: () => void;
  trackEvent: (report: EscobaEventReport) => void;
  pollClock: () => void;
  totalStars: () => number;
  isUnlocked: (levelId: string) => boolean;
  clockRemaining: () => number | null;
  restrictions: () => { weakHand: boolean; noSweepBonus: boolean };
}

export type EscobaRunStore = RunState & RunActions;

function emptyState(): RunState {
  return {
    activeLevel: null,
    startedAt: null,
    roundsUsed: 0,
    roundsWon: 0,
    sweeps: 0,
    captures: 0,
    oros: 0,
    siete: 0,
    points: 0,
    budgetLeft: 0,
    progress: 0,
    lastEndReason: null,
    lastResult: null,
    cleared: {},
  };
}

function findMod<T extends EscobaModifier["kind"]>(
  mods: EscobaModifier[],
  kind: T,
): Extract<EscobaModifier, { kind: T }> | undefined {
  return mods.find((m) => m.kind === kind) as Extract<EscobaModifier, { kind: T }> | undefined;
}

function isMet(l: EscobaLevelDef, s: RunState): boolean {
  switch (l.objective.kind) {
    case "rounds":
      return s.roundsWon >= l.objective.count;
    case "sweeps":
      return s.sweeps >= l.objective.count;
    case "captures":
      return s.captures >= l.objective.count;
    case "oros":
      return s.oros >= l.objective.count;
    case "siete":
      return s.siete >= l.objective.count;
    case "points":
      return s.points >= l.objective.target;
  }
}

function rewardForStars(l: EscobaLevelDef, stars: 0 | 1 | 2 | 3): number {
  if (stars <= 0) return 0;
  if (stars === 1) return l.reward.one;
  if (stars === 2) return l.reward.two;
  return l.reward.three;
}

function endRun(
  l: EscobaLevelDef,
  reason: EndReason,
  roundsUsed: number,
  points: number,
  set: (partial: Partial<RunState>) => void,
  getCleared: () => Record<string, ClearedRecord>,
) {
  const won = reason === "won";
  const stars: 0 | 1 | 2 | 3 = won ? computeEscobaStars(l, roundsUsed) : 0;
  const reward = rewardForStars(l, stars);
  const prev = getCleared()[l.id];
  const bestRounds = prev ? Math.min(prev.bestRounds, roundsUsed) : roundsUsed;
  const bestStars = (prev ? Math.max(prev.stars, stars) : stars) as 0 | 1 | 2 | 3;
  const cleared = won
    ? {
        ...getCleared(),
        [l.id]: { stars: bestStars, bestRounds, clearedAt: new Date().toISOString() },
      }
    : getCleared();

  // Otorgar chips ANTES de marcar el run como cerrado, con import estático.
  // Evita perder recompensa si el proceso Android muere entre el set() y un
  // import() dinámico no resuelto.
  if (reward > 0) {
    try {
      useCasino.getState().addChips?.(withRumorChips("escoba", reward));
    } catch {
      // ignore
    }
  }

  set({
    activeLevel: null,
    startedAt: null,
    lastEndReason: reason,
    lastResult: { levelId: l.id, stars, won, reward, roundsUsed, points },
    cleared,
  });
}

function progressFor(l: EscobaLevelDef, s: RunState): number {
  switch (l.objective.kind) {
    case "rounds":
      return s.roundsWon;
    case "sweeps":
      return s.sweeps;
    case "captures":
      return s.captures;
    case "oros":
      return s.oros;
    case "siete":
      return s.siete;
    case "points":
      return Math.max(0, s.points);
  }
}

export const useEscobaRun = create<EscobaRunStore>()(
  persist(
    (set, get) => ({
      ...emptyState(),

      startRun: (levelId) => {
        const l = findEscobaLevel(levelId);
        if (!l) return;
        const head = findMod(l.modifiers, "cpu-headstart");
        const headstart = head ? head.points : 0;
        set({
          activeLevel: l.id,
          startedAt: Date.now(),
          roundsUsed: 0,
          roundsWon: 0,
          sweeps: 0,
          captures: 0,
          oros: 0,
          siete: 0,
          points: -headstart,
          budgetLeft: l.budget - headstart,
          progress: 0,
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

      trackEvent: (report) => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findEscobaLevel(s.activeLevel);
        if (!l) return;

        const remaining = get().clockRemaining();
        if (remaining != null && remaining <= 0) {
          endRun(l, "lost-clock", s.roundsUsed, s.points, set, () => get().cleared);
          return;
        }

        const minCapture = findMod(l.modifiers, "min-capture");
        const taxCpu = findMod(l.modifiers, "tax-cpu-sweep");
        const minRoundPoints = findMod(l.modifiers, "min-round-points");
        const noSweepBonus = !!findMod(l.modifiers, "no-sweep-bonus");

        const patch: Partial<RunState> = {};

        if (report.kind === "capture") {
          const counts = !minCapture || report.cards >= minCapture.min ? true : false;
          if (report.by === "player" && counts) {
            patch.captures = s.captures + report.cards;
            patch.oros = s.oros + report.oros;
            if (report.siete) patch.siete = s.siete + 1;
            if (report.sweep && !noSweepBonus) patch.sweeps = s.sweeps + 1;
            // Si noSweepBonus está activo, la escoba NO suma al objetivo.
          } else if (report.by === "cpu") {
            if (report.sweep && taxCpu) {
              const nextPoints = s.points - taxCpu.extra;
              const nextBudget = s.budgetLeft - taxCpu.extra;
              patch.points = nextPoints;
              patch.budgetLeft = nextBudget;
            }
          }
        } else if (report.kind === "round-end") {
          const delta = report.playerPoints - report.cpuPoints;
          const nextPoints = s.points + delta;
          const nextBudget = s.budgetLeft + delta;
          const countsAsWin =
            report.playerWonRound && (!minRoundPoints || report.playerPoints >= minRoundPoints.min);
          patch.points = nextPoints;
          patch.budgetLeft = nextBudget;
          patch.roundsUsed = s.roundsUsed + 1;
          if (countsAsWin) patch.roundsWon = s.roundsWon + 1;
        }

        set(patch);
        const next = get();
        set({ progress: progressFor(l, next) });
        const after = get();

        if (isMet(l, after)) {
          endRun(l, "won", after.roundsUsed, after.points, set, () => get().cleared);
          return;
        }
        if (after.budgetLeft <= -l.budget) {
          endRun(l, "lost-budget", after.roundsUsed, after.points, set, () => get().cleared);
          return;
        }
        if (after.roundsUsed >= l.roundLimit) {
          endRun(l, "lost-rounds", after.roundsUsed, after.points, set, () => get().cleared);
          return;
        }
      },

      pollClock: () => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findEscobaLevel(s.activeLevel);
        if (!l) return;
        const remaining = get().clockRemaining();
        if (remaining != null && remaining <= 0) {
          endRun(l, "lost-clock", s.roundsUsed, s.points, set, () => get().cleared);
        }
      },

      totalStars: () => Object.values(get().cleared).reduce((acc, r) => acc + r.stars, 0),

      isUnlocked: (levelId) => {
        const s = get();
        const l = findEscobaLevel(levelId);
        if (!l) return false;
        if (l.order === 1) return true;
        const prev = ESCOBA_LEVELS[l.order - 2];
        return !!s.cleared[prev.id];
      },

      clockRemaining: () => {
        const s = get();
        if (!s.activeLevel || !s.startedAt) return null;
        const l = findEscobaLevel(s.activeLevel);
        if (!l) return null;
        const tc = findMod(l.modifiers, "time-cap");
        if (!tc) return null;
        const elapsed = (Date.now() - s.startedAt) / 1000;
        return Math.max(0, tc.seconds - elapsed);
      },

      restrictions: () => {
        const s = get();
        if (!s.activeLevel) return { weakHand: false, noSweepBonus: false };
        const l = findEscobaLevel(s.activeLevel);
        if (!l) return { weakHand: false, noSweepBonus: false };
        return {
          weakHand: !!findMod(l.modifiers, "weak-hand"),
          noSweepBonus: !!findMod(l.modifiers, "no-sweep-bonus"),
        };
      },
    }),
    { name: "cuervo:escoba-run:v1" },
  ),
);

// Anuncia esta mesa al registro compartido (HUD, encargos y avisos).
registerRun({
  id: "escoba",
  label: "Barrido de Quince",
  store: useEscobaRun as unknown as RunStoreLike,
  findLevel: findEscobaLevel,
  levelLabel: escobaLevelLabel as (level: unknown) => string,
  route: "/escoba",
  hostess: "La Beata",
});
