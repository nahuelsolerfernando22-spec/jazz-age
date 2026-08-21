import { create } from "zustand";
import { persist } from "zustand/middleware";
import CHAMPION_JSON from "./champion.json";

export interface ChinchonWeights {
  feedPenalty: number;
  chinchonHold: number;
  meldBonus: number;
  meldCountBonus: number;
  tiebreak: number;
  mcBlend: number;
  pickPilePref: number;
  closeMargin: number;
}

export const DEFAULT_WEIGHTS: ChinchonWeights = {
  feedPenalty: 4,
  chinchonHold: 0.07,
  meldBonus: 0.5,
  meldCountBonus: 0.3,
  tiebreak: 0.02,
  mcBlend: 0.55,
  pickPilePref: 0.5,
  closeMargin: 0,
};

interface Bound {
  lo: number;
  hi: number;
}
export const BOUNDS: Record<keyof ChinchonWeights, Bound> = {
  feedPenalty: { lo: 0, hi: 10 },
  chinchonHold: { lo: 0, hi: 0.35 },
  meldBonus: { lo: 0, hi: 1.5 },
  meldCountBonus: { lo: 0, hi: 1.0 },
  tiebreak: { lo: -0.05, hi: 0.15 },
  mcBlend: { lo: 0, hi: 1 },
  pickPilePref: { lo: 0, hi: 1 },
  closeMargin: { lo: -1, hi: 2 },
};

export function clampWeights(w: ChinchonWeights): ChinchonWeights {
  const out = { ...w };
  (Object.keys(BOUNDS) as (keyof ChinchonWeights)[]).forEach((k) => {
    const b = BOUNDS[k];
    out[k] = Math.max(b.lo, Math.min(b.hi, out[k]));
  });
  return out;
}

export function mutateWeights(
  w: ChinchonWeights,
  sigma = 0.3,
  rng: () => number = Math.random,
): ChinchonWeights {
  const keys = Object.keys(BOUNDS) as (keyof ChinchonWeights)[];
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

export const CHAMPION_WEIGHTS: ChinchonWeights = clampWeights({
  ...DEFAULT_WEIGHTS,
  ...(CHAMPION_JSON as Partial<ChinchonWeights>),
});

interface State {
  champion: ChinchonWeights;
  generation: number;
  totalMatches: number;
  championWins: number;
  challengerWins: number;
  setChampion: (w: ChinchonWeights, adopted: boolean) => void;
  bump: (cw: number, chw: number) => void;
  reset: () => void;
}

export const useChinchonWeights = create<State>()(
  persist(
    (set) => ({
      champion: CHAMPION_WEIGHTS,
      generation: 0,
      totalMatches: 0,
      championWins: 0,
      challengerWins: 0,
      setChampion: (w, adopted) =>
        set((s) => ({
          champion: clampWeights(w),
          generation: adopted ? s.generation + 1 : s.generation,
        })),
      bump: (cw, chw) =>
        set((s) => ({
          totalMatches: s.totalMatches + cw + chw,
          championWins: s.championWins + cw,
          challengerWins: s.challengerWins + chw,
        })),
      reset: () =>
        set({
          champion: CHAMPION_WEIGHTS,
          generation: 0,
          totalMatches: 0,
          championWins: 0,
          challengerWins: 0,
        }),
    }),
    { name: "cuervo:chinchon-learned:v1" },
  ),
);

export function currentChinchonWeights(): ChinchonWeights {
  try {
    return useChinchonWeights.getState().champion;
  } catch {
    return CHAMPION_WEIGHTS;
  }
}
