import { registerRun, type RunStoreLike } from "@/lib/games/run-registry";
import { withRumorChips } from "@/lib/rumor-bonus";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCasino } from "@/store/casino";
import {
  SOLITARIO_LEVELS,
  computeSolitarioStars,
  findSolitarioLevel,
  solitarioLevelLabel,
  type SolitarioLevelDef,
  type SolitarioModifier,
} from "@/lib/games/solitario/solitario-levels";

export type EndReason = "won" | "lost-clock" | "lost-moves" | "abandoned";

export interface ClearedRecord {
  stars: 0 | 1 | 2 | 3;
  bestSeconds: number;
  clearedAt: string;
}

interface RunState {
  activeLevel: string | null;
  startedAt: number | null;
  movesUsed: number;
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
  trackMove: () => void;
  trackWon: (elapsedMs: number) => void;
  pollClock: () => void;
  totalStars: () => number;
  isUnlocked: (levelId: string) => boolean;
  clockRemaining: () => number | null;
  movesCap: () => number | null;
  noUndo: () => boolean;
  drawThree: () => boolean;
}

export type SolitarioRunStore = RunState & RunActions;

function findMod<T extends SolitarioModifier["kind"]>(
  mods: SolitarioModifier[],
  kind: T,
): Extract<SolitarioModifier, { kind: T }> | undefined {
  return mods.find((m) => m.kind === kind) as Extract<SolitarioModifier, { kind: T }> | undefined;
}

function rewardForStars(l: SolitarioLevelDef, stars: 0 | 1 | 2 | 3): number {
  if (stars <= 0) return 0;
  if (stars === 1) return l.reward.one;
  if (stars === 2) return l.reward.two;
  return l.reward.three;
}

function endRun(
  l: SolitarioLevelDef,
  reason: EndReason,
  seconds: number,
  set: (partial: Partial<RunState>) => void,
  getCleared: () => Record<string, ClearedRecord>,
) {
  const won = reason === "won";
  const stars: 0 | 1 | 2 | 3 = won ? computeSolitarioStars(l, seconds) : 0;
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
  if (reward > 0) {
    try {
      useCasino.getState().addChips?.(withRumorChips("solitario", reward));
    } catch {
      /* ignore */
    }
  }
  set({
    activeLevel: null,
    startedAt: null,
    lastEndReason: reason,
    lastResult: { levelId: l.id, stars, won, reward, seconds },
    cleared,
  });
}

export const useSolitarioRun = create<SolitarioRunStore>()(
  persist(
    (set, get) => ({
      activeLevel: null,
      startedAt: null,
      movesUsed: 0,
      lastEndReason: null,
      lastResult: null,
      cleared: {},

      startRun: (levelId) => {
        const l = findSolitarioLevel(levelId);
        if (!l) return;
        set({
          activeLevel: l.id,
          startedAt: Date.now(),
          movesUsed: 0,
          lastEndReason: null,
          lastResult: null,
        });
      },

      abandon: () => {
        const s = get();
        if (!s.activeLevel) return;
        set({ activeLevel: null, startedAt: null, lastEndReason: "abandoned", lastResult: null });
      },

      ackResult: () => set({ lastResult: null, lastEndReason: null }),

      trackMove: () => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findSolitarioLevel(s.activeLevel);
        if (!l) return;
        const movesUsed = s.movesUsed + 1;
        set({ movesUsed });
        const cap = get().movesCap();
        if (cap != null && movesUsed > cap) {
          const seconds = s.startedAt ? Math.floor((Date.now() - s.startedAt) / 1000) : 0;
          endRun(l, "lost-moves", seconds, set, () => get().cleared);
        }
      },

      trackWon: (elapsedMs) => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findSolitarioLevel(s.activeLevel);
        if (!l) return;
        const seconds = Math.max(1, Math.floor(elapsedMs / 1000));
        const cap = get().clockRemaining();
        if (cap != null && cap <= 0) {
          endRun(l, "lost-clock", seconds, set, () => get().cleared);
          return;
        }
        endRun(l, "won", seconds, set, () => get().cleared);
      },

      pollClock: () => {
        const s = get();
        if (!s.activeLevel) return;
        const l = findSolitarioLevel(s.activeLevel);
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
        const l = findSolitarioLevel(levelId);
        if (!l) return false;
        if (l.order === 1) return true;
        const prev = SOLITARIO_LEVELS[l.order - 2];
        return !!s.cleared[prev?.id ?? ""];
      },

      clockRemaining: () => {
        const s = get();
        if (!s.activeLevel || !s.startedAt) return null;
        const l = findSolitarioLevel(s.activeLevel);
        if (!l) return null;
        const tc = findMod(l.modifiers, "time-cap");
        if (!tc) return null;
        const elapsed = (Date.now() - s.startedAt) / 1000;
        return Math.max(0, tc.seconds - elapsed);
      },

      movesCap: () => {
        const s = get();
        if (!s.activeLevel) return null;
        const l = findSolitarioLevel(s.activeLevel);
        if (!l) return null;
        const mc = findMod(l.modifiers, "moves-cap");
        return mc ? mc.max : null;
      },

      noUndo: () => {
        const s = get();
        if (!s.activeLevel) return false;
        const l = findSolitarioLevel(s.activeLevel);
        if (!l) return false;
        return !!findMod(l.modifiers, "no-undo");
      },

      drawThree: () => {
        const s = get();
        if (!s.activeLevel) return false;
        const l = findSolitarioLevel(s.activeLevel);
        if (!l) return false;
        return !!findMod(l.modifiers, "draw-3");
      },
    }),
    {
      name: "cuervo:solitario-run:v1",
      version: 2,
      // El tablero no se guarda: si restauráramos el encargo activo, el HUD
      // quedaría colgado y el reloj contaría horas fuera de la app.
      partialize: (s) => ({ cleared: s.cleared }) as Partial<SolitarioRunStore>,
    },
  ),
);

// Anuncia esta mesa al registro compartido (HUD, encargos y avisos).
registerRun({
  id: "solitario",
  label: "La Mano Muerta",
  store: useSolitarioRun as unknown as RunStoreLike,
  findLevel: findSolitarioLevel,
  levelLabel: solitarioLevelLabel as (level: unknown) => string,
  route: "/solitario",
  hostess: "Nadia",
});
