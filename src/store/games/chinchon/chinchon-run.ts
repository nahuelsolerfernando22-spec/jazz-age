import { registerRun, type RunStoreLike } from "@/lib/games/run-registry";
import { withRumorChips } from "@/lib/rumor-bonus";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CHINCHON_LEVELS,
  computeChinchonStars,
  findChinchonLevel,
  chinchonLevelLabel,
  type ChinchonLevelDef,
  type ChinchonModifier,
} from "@/lib/games/chinchon/chinchon-levels";

export type EndReason = "won" | "lost" | "lost-clock" | "abandoned";

export interface ClearedRecord {
  stars: 0 | 1 | 2 | 3;
  bestSeconds: number;
  clearedAt: string;
}

interface RunState {
  activeLevel: string | null;
  startedAt: number | null;
  lastEndReason: EndReason | null;
  lastResult: null | {
    levelId: string;
    stars: 0 | 1 | 2 | 3;
    won: boolean;
    reward: number;
    seconds: number;
  };
  cleared: Record<string, ClearedRecord>;
}

interface RunActions {
  startRun: (levelId: string) => void;
  abandon: () => void;
  ackResult: () => void;
  trackMatchEnd: (won: boolean) => void;
  pollClock: () => void;
  totalStars: () => number;
  isUnlocked: (levelId: string) => boolean;
  clockRemaining: () => number | null;
  pointGoal: () => number | null;
  cpuHeadstart: () => number;
  noSecondLife: () => boolean;
}

export type ChinchonRunStore = RunState & RunActions;

function findMod<T extends ChinchonModifier["kind"]>(
  mods: ChinchonModifier[],
  kind: T,
): Extract<ChinchonModifier, { kind: T }> | undefined {
  return mods.find((m) => m.kind === kind) as Extract<ChinchonModifier, { kind: T }> | undefined;
}

function rewardForStars(l: ChinchonLevelDef, stars: 0 | 1 | 2 | 3): number {
  if (stars <= 0) return 0;
  if (stars === 1) return l.reward.one;
  if (stars === 2) return l.reward.two;
  return l.reward.three;
}

function endRun(
  l: ChinchonLevelDef,
  reason: EndReason,
  seconds: number,
  set: (partial: Partial<RunState>) => void,
  getCleared: () => Record<string, ClearedRecord>,
) {
  const won = reason === "won";
  const stars: 0 | 1 | 2 | 3 = won ? computeChinchonStars(l, seconds) : 0;
  const reward = rewardForStars(l, stars);
  const prev = getCleared()[l.id];
  const bestSeconds = prev ? Math.min(prev.bestSeconds, seconds) : seconds;
  const bestStars = (prev ? Math.max(prev.stars, stars) : stars) as 0 | 1 | 2 | 3;
  const cleared = won
    ? {
        ...getCleared(),
        [l.id]: { stars: bestStars, bestSeconds, clearedAt: new Date().toISOString() },
      }
    : getCleared();
  set({
    activeLevel: null,
    startedAt: null,
    lastEndReason: reason,
    lastResult: { levelId: l.id, stars, won, reward, seconds },
    cleared,
  });
  if (reward > 0) {
    void import("@/store/casino").then((m) => {
      try {
        m.useCasino.getState().addChips?.(withRumorChips("chinchon", reward));
      } catch {}
    });
  }
}

export const useChinchonRun = create<ChinchonRunStore>()(
  persist(
    (set, get) => ({
      activeLevel: null,
      startedAt: null,
      lastEndReason: null,
      lastResult: null,
      cleared: {},

      startRun: (levelId) => {
        const l = findChinchonLevel(levelId);
        if (!l) return;
        set({ activeLevel: l.id, startedAt: Date.now(), lastEndReason: null, lastResult: null });
      },

      abandon: () => {
        const s = get();
        if (!s.activeLevel) return;
        set({ activeLevel: null, startedAt: null, lastEndReason: "abandoned", lastResult: null });
      },

      ackResult: () => set({ lastResult: null, lastEndReason: null }),

      trackMatchEnd: (won) => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findChinchonLevel(s.activeLevel);
        if (!l) return;
        const seconds = s.startedAt
          ? Math.max(1, Math.floor((Date.now() - s.startedAt) / 1000))
          : 0;
        endRun(l, won ? "won" : "lost", seconds, set, () => get().cleared);
      },

      pollClock: () => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findChinchonLevel(s.activeLevel);
        if (!l) return;
        const cap = get().clockRemaining();
        if (cap != null && cap <= 0) {
          const seconds = s.startedAt ? Math.floor((Date.now() - s.startedAt) / 1000) : 0;
          endRun(l, "lost-clock", seconds, set, () => get().cleared);
        }
      },

      totalStars: () => Object.values(get().cleared).reduce((n, r) => n + r.stars, 0),

      isUnlocked: (levelId) => {
        const s = get();
        const l = findChinchonLevel(levelId);
        if (!l) return false;
        if (l.order === 1) return true;
        const prev = CHINCHON_LEVELS[l.order - 2];
        return !!s.cleared[prev?.id ?? ""];
      },

      clockRemaining: () => {
        const s = get();
        if (!s.activeLevel || !s.startedAt) return null;
        const l = findChinchonLevel(s.activeLevel);
        if (!l) return null;
        const tc = findMod(l.modifiers, "time-cap");
        if (!tc) return null;
        const elapsed = (Date.now() - s.startedAt) / 1000;
        return Math.max(0, tc.seconds - elapsed);
      },

      pointGoal: () => {
        const s = get();
        if (!s.activeLevel) return null;
        const l = findChinchonLevel(s.activeLevel);
        if (!l) return null;
        const pg = findMod(l.modifiers, "point-goal");
        return pg ? pg.target : null;
      },

      cpuHeadstart: () => {
        const s = get();
        if (!s.activeLevel) return 0;
        const l = findChinchonLevel(s.activeLevel);
        if (!l) return 0;
        const ch = findMod(l.modifiers, "cpu-headstart");
        return ch ? ch.points : 0;
      },

      noSecondLife: () => {
        const s = get();
        if (!s.activeLevel) return false;
        const l = findChinchonLevel(s.activeLevel);
        if (!l) return false;
        return !!findMod(l.modifiers, "no-second-life");
      },
    }),
    {
      name: "cuervo:chinchon-run:v1",
      version: 2,
      partialize: (s) => ({ cleared: s.cleared }) as Partial<ChinchonRunStore>,
    },
  ),
);

// Anuncia esta mesa al registro compartido (HUD, encargos y avisos).
registerRun({
  id: "chinchon",
  label: "El Corte Sucio",
  store: useChinchonRun as unknown as RunStoreLike,
  findLevel: findChinchonLevel,
  levelLabel: chinchonLevelLabel as (level: unknown) => string,
  route: "/chinchon",
  hostess: "Ruth",
});
