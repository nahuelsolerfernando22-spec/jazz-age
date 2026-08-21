import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LearnedWeights {
  envidoAcceptOffset: number;
  trucoAcceptOffset: number;
  envidoCantoBias: number;
  trucoValueOffset: number;
  bluffCantoMult: number;
  reraiseMult: number;
  foldMazoThreshold: number;
  foldMazoPatienceMult: number;
  oppEnvidoPriorMax: number;
  envidoWindowLow: number;
  envidoWindowHigh: number;
  envidoRealEscalationBase: number;
  envidoRealEscalationAggr: number;
  chooseCardMedianBias: number;
  saveHighFor3rdMemory: number;
  envidoLieRate: number;
  envidoChallengeBias: number;
  cfrBlend: number;
}

export const DEFAULT_WEIGHTS: LearnedWeights = {
  envidoAcceptOffset: 0,
  trucoAcceptOffset: 0,
  envidoCantoBias: 0,
  trucoValueOffset: 0,
  bluffCantoMult: 1,
  reraiseMult: 1,
  foldMazoThreshold: 0.18,
  foldMazoPatienceMult: 1,
  oppEnvidoPriorMax: 27,
  envidoWindowLow: 3,
  envidoWindowHigh: 6,
  envidoRealEscalationBase: 0.35,
  envidoRealEscalationAggr: 0.5,
  chooseCardMedianBias: 0,
  saveHighFor3rdMemory: 0.4,
  envidoLieRate: 0.15,
  envidoChallengeBias: 0,
  cfrBlend: 0.6,
};

interface Bound {
  lo: number;
  hi: number;
}
export const BOUNDS: Record<keyof LearnedWeights, Bound> = {
  envidoAcceptOffset: { lo: -0.2, hi: 0.2 },
  trucoAcceptOffset: { lo: -0.2, hi: 0.2 },
  envidoCantoBias: { lo: -0.3, hi: 0.3 },
  trucoValueOffset: { lo: -0.25, hi: 0.25 },
  bluffCantoMult: { lo: 0.2, hi: 2.0 },
  reraiseMult: { lo: 0.2, hi: 2.0 },
  foldMazoThreshold: { lo: 0.06, hi: 0.34 },
  foldMazoPatienceMult: { lo: 0.3, hi: 2.0 },
  oppEnvidoPriorMax: { lo: 22, hi: 32 },
  envidoWindowLow: { lo: 1, hi: 8 },
  envidoWindowHigh: { lo: 2, hi: 12 },
  envidoRealEscalationBase: { lo: 0.1, hi: 0.7 },
  envidoRealEscalationAggr: { lo: 0.1, hi: 1.0 },
  chooseCardMedianBias: { lo: -0.35, hi: 0.35 },
  saveHighFor3rdMemory: { lo: 0.1, hi: 0.85 },
  envidoLieRate: { lo: 0.0, hi: 0.8 },
  envidoChallengeBias: { lo: -0.4, hi: 0.4 },
  cfrBlend: { lo: 0.0, hi: 1.0 },
};

export function clampWeights(w: LearnedWeights): LearnedWeights {
  const out = { ...w };
  (Object.keys(BOUNDS) as (keyof LearnedWeights)[]).forEach((k) => {
    const b = BOUNDS[k];
    out[k] = Math.max(b.lo, Math.min(b.hi, out[k]));
  });
  return out;
}

export function mutateWeights(
  w: LearnedWeights,
  sigma = 0.35,
  rng: () => number = Math.random,
): LearnedWeights {
  const keys = Object.keys(BOUNDS) as (keyof LearnedWeights)[];
  const nMut = rng() < 0.4 ? 2 : 1;
  const out = { ...w };
  for (let i = 0; i < nMut; i++) {
    const k = keys[Math.floor(rng() * keys.length)]!;
    const b = BOUNDS[k];
    const span = b.hi - b.lo;

    const g = rng() + rng() + rng() - 1.5;
    out[k] = out[k] + g * span * sigma;
  }
  return clampWeights(out);
}

export interface LearnedStats {
  generation: number;
  totalMatches: number;
  championWins: number;
  challengerWins: number;
  lastAdoptedAt: number;
  updatedAt: number;
}

const EMPTY_STATS: LearnedStats = {
  generation: 0,
  totalMatches: 0,
  championWins: 0,
  challengerWins: 0,
  lastAdoptedAt: 0,
  updatedAt: 0,
};

interface State {
  champion: LearnedWeights;
  stats: LearnedStats;
  snapshots: LearnedSnapshot[];
  setChampion: (w: LearnedWeights, adopted: boolean) => void;
  bump: (championWins: number, challengerWins: number) => void;
  reset: () => void;
  restoreSnapshot: (id: string) => boolean;
  deleteSnapshot: (id: string) => void;
  saveSnapshot: (label?: string) => LearnedSnapshot;
}

export interface LearnedSnapshot {
  id: string;
  at: number;
  generation: number;
  totalMatches: number;
  label?: string;
  weights: LearnedWeights;
}

const MAX_SNAPSHOTS = 20;

function snapshotId(): string {
  try {
    const c = typeof crypto !== "undefined" ? crypto : null;
    if (c && typeof (c as Crypto).randomUUID === "function") return (c as Crypto).randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useTrucoWeights = create<State>()(
  persist(
    (set) => ({
      champion: DEFAULT_WEIGHTS,
      stats: EMPTY_STATS,
      snapshots: [],
      setChampion: (w, adopted) =>
        set((s) => {
          const nextChamp = clampWeights(w);
          const nextGen = adopted ? s.stats.generation + 1 : s.stats.generation;
          const nextStats: LearnedStats = {
            ...s.stats,
            generation: nextGen,
            lastAdoptedAt: adopted ? Date.now() : s.stats.lastAdoptedAt,
            updatedAt: Date.now(),
          };

          let snapshots = s.snapshots;
          if (adopted) {
            const snap: LearnedSnapshot = {
              id: snapshotId(),
              at: Date.now(),
              generation: nextGen,
              totalMatches: nextStats.totalMatches,
              weights: nextChamp,
            };
            snapshots = [snap, ...s.snapshots].slice(0, MAX_SNAPSHOTS);
          }
          return { champion: nextChamp, stats: nextStats, snapshots };
        }),
      bump: (champWins, chalWins) =>
        set((s) => ({
          stats: {
            ...s.stats,
            totalMatches: s.stats.totalMatches + champWins + chalWins,
            championWins: s.stats.championWins + champWins,
            challengerWins: s.stats.challengerWins + chalWins,
            updatedAt: Date.now(),
          },
        })),
      reset: () => set({ champion: DEFAULT_WEIGHTS, stats: EMPTY_STATS, snapshots: [] }),
      restoreSnapshot: (id) => {
        let ok = false;
        set((s) => {
          const snap = s.snapshots.find((x) => x.id === id);
          if (!snap) return s;
          ok = true;
          return {
            champion: clampWeights(snap.weights),
            stats: { ...s.stats, updatedAt: Date.now() },
          };
        });
        return ok;
      },
      deleteSnapshot: (id) => set((s) => ({ snapshots: s.snapshots.filter((x) => x.id !== id) })),
      saveSnapshot: (label) => {
        const snap: LearnedSnapshot = {
          id: snapshotId(),
          at: Date.now(),
          generation: 0,
          totalMatches: 0,
          label,
          weights: DEFAULT_WEIGHTS,
        };
        set((s) => {
          const filled: LearnedSnapshot = {
            ...snap,
            generation: s.stats.generation,
            totalMatches: s.stats.totalMatches,
            weights: s.champion,
          };
          return { snapshots: [filled, ...s.snapshots].slice(0, MAX_SNAPSHOTS) };
        });
        return snap;
      },
    }),
    {
      name: "cuervo:truco-learned:v1",
      version: 2,
      migrate: (persisted: unknown, _version: number) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...p, snapshots: Array.isArray(p.snapshots) ? p.snapshots : [] } as State;
      },
    },
  ),
);
