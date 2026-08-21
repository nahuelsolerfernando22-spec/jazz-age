import champion from "./mahjong-learned-champion.json";

export interface MahjongWeights {
  completeBonus: number;
  buildBonus: number;
  specialPref: number;
  overflowPenalty: number;
  orphanPenalty: number;
  unlockBonus: number;
}

export const DEFAULT_MAHJONG_WEIGHTS: MahjongWeights = {
  completeBonus: 100,
  buildBonus: 30,
  specialPref: 25,
  overflowPenalty: 200,
  orphanPenalty: 40,
  unlockBonus: 6,
};

let cache: MahjongWeights | null = null;

export function getLearnedMahjongWeights(): MahjongWeights {
  if (cache) return cache;
  cache = { ...DEFAULT_MAHJONG_WEIGHTS, ...(champion as Partial<MahjongWeights>) };
  return cache;
}

export function setLearnedMahjongWeights(w: Partial<MahjongWeights>): void {
  cache = { ...(cache ?? DEFAULT_MAHJONG_WEIGHTS), ...w };
}
