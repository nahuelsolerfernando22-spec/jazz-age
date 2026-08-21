import { registerRun, type RunStoreLike } from "@/lib/games/run-registry";
import { withRumorChips } from "@/lib/rumor-bonus";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DADOS_LEVELS,
  computeDadosStars,
  findDadosLevel,
  dadosLevelLabel,
  type DadosLevelDef,
  type DadosModifier,
} from "@/lib/games/dados/dados-levels";

export type EndReason = "won" | "lost-matches" | "lost-budget" | "lost-clock" | "abandoned";

export interface ClearedRecord {
  stars: 0 | 1 | 2 | 3;
  bestMatches: number;
  clearedAt: string;
}

export type DadosEventReport =
  | {
      kind: "pick";
      cat: string;
      value: number;
      servida: boolean;
    }
  | {
      kind: "match-end";
      won: boolean;
      draw: boolean;
      playerScore: number;
      cpuScore: number;
      generalasScored: number;
      servidasScored: number;
    };

interface RunState {
  activeLevel: string | null;
  startedAt: number | null;
  matchesUsed: number;
  matchesWon: number;
  matchesLost: number;
  currentStreak: number;
  bestStreak: number;
  totalScore: number;
  generalaCount: number;
  servidaCount: number;
  margin: number;
  budgetLeft: number;
  progress: number;
  lastEndReason: EndReason | null;
  lastResult: null | {
    levelId: string;
    stars: 0 | 1 | 2 | 3;
    won: boolean;
    reward: number;
    matchesUsed: number;
    margin: number;
  };
  cleared: Record<string, ClearedRecord>;
}

interface RunActions {
  startRun: (levelId: string) => void;
  abandon: () => void;
  ackResult: () => void;
  trackEvent: (report: DadosEventReport) => void;
  pollClock: () => void;
  totalStars: () => number;
  isUnlocked: (levelId: string) => boolean;
  clockRemaining: () => number | null;
  restrictions: () => { weakHand: boolean; noServidaBonus: boolean };
}

export type DadosRunStore = RunState & RunActions;

function emptyState(): RunState {
  return {
    activeLevel: null,
    startedAt: null,
    matchesUsed: 0,
    matchesWon: 0,
    matchesLost: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalScore: 0,
    generalaCount: 0,
    servidaCount: 0,
    margin: 0,
    budgetLeft: 0,
    progress: 0,
    lastEndReason: null,
    lastResult: null,
    cleared: {},
  };
}

function findMod<T extends DadosModifier["kind"]>(
  mods: DadosModifier[],
  kind: T,
): Extract<DadosModifier, { kind: T }> | undefined {
  return mods.find((m) => m.kind === kind) as Extract<DadosModifier, { kind: T }> | undefined;
}

function isMet(l: DadosLevelDef, s: RunState): boolean {
  switch (l.objective.kind) {
    case "matches":
      return s.matchesWon >= l.objective.count;
    case "score":
      return s.totalScore >= l.objective.target;
    case "generala":
      return s.generalaCount >= l.objective.count;
    case "servida":
      return s.servidaCount >= l.objective.count;
    case "streak":
      return s.bestStreak >= l.objective.count;
    case "margin":
      return s.margin >= l.objective.target;
  }
}

function progressFor(l: DadosLevelDef, s: RunState): number {
  switch (l.objective.kind) {
    case "matches":
      return s.matchesWon;
    case "score":
      return s.totalScore;
    case "generala":
      return s.generalaCount;
    case "servida":
      return s.servidaCount;
    case "streak":
      return s.bestStreak;
    case "margin":
      return Math.max(0, s.margin);
  }
}

function rewardForStars(l: DadosLevelDef, stars: 0 | 1 | 2 | 3): number {
  if (stars <= 0) return 0;
  if (stars === 1) return l.reward.one;
  if (stars === 2) return l.reward.two;
  return l.reward.three;
}

function endRun(
  l: DadosLevelDef,
  reason: EndReason,
  matchesUsed: number,
  margin: number,
  set: (partial: Partial<RunState>) => void,
  getCleared: () => Record<string, ClearedRecord>,
) {
  const won = reason === "won";
  const stars: 0 | 1 | 2 | 3 = won ? computeDadosStars(l, matchesUsed) : 0;
  const reward = rewardForStars(l, stars);
  const prev = getCleared()[l.id];
  const bestMatches = prev ? Math.min(prev.bestMatches, matchesUsed) : matchesUsed;
  const bestStars = (prev ? Math.max(prev.stars, stars) : stars) as 0 | 1 | 2 | 3;
  const cleared = won
    ? {
        ...getCleared(),
        [l.id]: { stars: bestStars, bestMatches, clearedAt: new Date().toISOString() },
      }
    : getCleared();

  set({
    activeLevel: null,
    startedAt: null,
    lastEndReason: reason,
    lastResult: { levelId: l.id, stars, won, reward, matchesUsed, margin },
    cleared,
  });

  if (reward > 0) {
    void import("@/store/casino").then((m) => {
      try {
        m.useCasino.getState().addChips?.(withRumorChips("dados", reward));
      } catch {}
    });
  }
}

export const useDadosRun = create<DadosRunStore>()(
  persist(
    (set, get) => ({
      ...emptyState(),

      startRun: (levelId) => {
        const l = findDadosLevel(levelId);
        if (!l) return;
        set({
          activeLevel: l.id,
          startedAt: Date.now(),
          matchesUsed: 0,
          matchesWon: 0,
          matchesLost: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalScore: 0,
          generalaCount: 0,
          servidaCount: 0,
          margin: 0,
          budgetLeft: l.budget,
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
        const l = findDadosLevel(s.activeLevel);
        if (!l) return;

        const remaining = get().clockRemaining();
        if (remaining != null && remaining <= 0) {
          endRun(l, "lost-clock", s.matchesUsed, s.margin, set, () => get().cleared);
          return;
        }

        const patch: Partial<RunState> = {};

        if (report.kind === "pick") {
          if (report.value > 0 && report.cat === "generala") {
            patch.generalaCount = s.generalaCount + 1;
          }
          if (report.value > 0 && report.servida) {
            patch.servidaCount = s.servidaCount + 1;
          }
        } else if (report.kind === "match-end") {
          const headstart = findMod(l.modifiers, "cpu-headstart");
          const taxLoss = findMod(l.modifiers, "tax-loss");
          const minMargin = findMod(l.modifiers, "min-margin");
          const minScore = findMod(l.modifiers, "min-score");

          const cpuAdj = report.cpuScore + (headstart?.points ?? 0);
          const rawDelta = report.playerScore - cpuAdj;
          let delta = rawDelta;
          if (!report.won && taxLoss) delta -= taxLoss.extra;

          const winCounts =
            report.won &&
            !report.draw &&
            (!minMargin || rawDelta >= minMargin.min) &&
            (!minScore || report.playerScore >= minScore.min);

          const nextMargin = s.margin + delta;
          const nextBudget = s.budgetLeft + delta;
          const nextStreak = winCounts ? s.currentStreak + 1 : 0;

          patch.matchesUsed = s.matchesUsed + 1;
          patch.totalScore = s.totalScore + report.playerScore;
          patch.margin = nextMargin;
          patch.budgetLeft = nextBudget;
          patch.currentStreak = nextStreak;
          patch.bestStreak = Math.max(s.bestStreak, nextStreak);
          if (winCounts) patch.matchesWon = s.matchesWon + 1;
          else if (!report.draw) patch.matchesLost = s.matchesLost + 1;
        }

        set(patch);
        const next = get();
        set({ progress: progressFor(l, next) });
        const after = get();

        if (isMet(l, after)) {
          endRun(l, "won", after.matchesUsed, after.margin, set, () => get().cleared);
          return;
        }
        if (report.kind === "match-end") {
          if (after.budgetLeft <= -l.budget) {
            endRun(l, "lost-budget", after.matchesUsed, after.margin, set, () => get().cleared);
            return;
          }
          if (after.matchesUsed >= l.matchLimit) {
            endRun(l, "lost-matches", after.matchesUsed, after.margin, set, () => get().cleared);
            return;
          }
        }
      },

      pollClock: () => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findDadosLevel(s.activeLevel);
        if (!l) return;
        const remaining = get().clockRemaining();
        if (remaining != null && remaining <= 0) {
          endRun(l, "lost-clock", s.matchesUsed, s.margin, set, () => get().cleared);
        }
      },

      totalStars: () => Object.values(get().cleared).reduce((acc, r) => acc + r.stars, 0),

      isUnlocked: (levelId) => {
        const s = get();
        const l = findDadosLevel(levelId);
        if (!l) return false;
        if (l.order === 1) return true;
        const prev = DADOS_LEVELS[l.order - 2];
        return !!s.cleared[prev?.id ?? ""];
      },

      clockRemaining: () => {
        const s = get();
        if (!s.activeLevel || !s.startedAt) return null;
        const l = findDadosLevel(s.activeLevel);
        if (!l) return null;
        const tc = findMod(l.modifiers, "time-cap");
        if (!tc) return null;
        const elapsed = (Date.now() - s.startedAt) / 1000;
        return Math.max(0, tc.seconds - elapsed);
      },

      restrictions: () => {
        const s = get();
        if (!s.activeLevel) return { weakHand: false, noServidaBonus: false };
        const l = findDadosLevel(s.activeLevel);
        if (!l) return { weakHand: false, noServidaBonus: false };
        return {
          weakHand: !!findMod(l.modifiers, "weak-hand"),
          noServidaBonus: !!findMod(l.modifiers, "no-servida-bonus"),
        };
      },
    }),
    {
      name: "cuervo:dados-run:v1",
      version: 2,
      partialize: (s) => ({ cleared: s.cleared }) as Partial<DadosRunStore>,
    },
  ),
);

// Anuncia esta mesa al registro compartido (HUD, encargos y avisos).
registerRun({
  id: "dados",
  label: "Dados",
  store: useDadosRun as unknown as RunStoreLike,
  findLevel: findDadosLevel,
  levelLabel: dadosLevelLabel as (level: unknown) => string,
  route: "/dados",
  hostess: "Zelda",
});
