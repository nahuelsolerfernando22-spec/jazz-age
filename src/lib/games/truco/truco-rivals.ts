import type { AiProfile } from "@/lib/games/truco/truco";
import type { LearnedWeights } from "@/store/ai/truco-weights";
import { DEFAULT_WEIGHTS } from "@/store/ai/truco-weights";

export type RivalId = "bellver" | "serafina" | "vasari";

export interface RivalInfo {
  id: RivalId;
  name: string;
  tagline: string;
  profile: AiProfile;
}

function mkWeights(overrides: Partial<LearnedWeights>): LearnedWeights {
  return { ...DEFAULT_WEIGHTS, ...overrides };
}

const BELLVER: RivalInfo = {
  id: "bellver",
  name: "Bellver el Relojero",
  tagline: "presiona · farolea · miente envido",
  profile: {
    skill: 0.72,
    aggression: 0.85,
    bluff: 0.65,
    patience: 0.35,
    memory: 0.55,
    depth: 2,
    weights: mkWeights({
      envidoAcceptOffset: -0.05,
      trucoAcceptOffset: -0.1,
      envidoCantoBias: 0.2,
      trucoValueOffset: -0.15,
      bluffCantoMult: 1.6,
      reraiseMult: 1.5,
      envidoLieRate: 0.55,
      envidoChallengeBias: 0.3,
      foldMazoThreshold: 0.1,
    }),
  },
};

const SERAFINA: RivalInfo = {
  id: "serafina",
  name: "Serafina la Contadora",
  tagline: "medida · honesta · memoria fina",
  profile: {
    skill: 0.8,
    aggression: 0.3,
    bluff: 0.15,
    patience: 0.75,
    memory: 0.85,
    depth: 3,
    weights: mkWeights({
      envidoAcceptOffset: 0.1,
      trucoAcceptOffset: 0.1,
      envidoCantoBias: -0.1,
      trucoValueOffset: 0.15,
      bluffCantoMult: 0.4,
      reraiseMult: 0.6,
      envidoLieRate: 0.05,
      envidoChallengeBias: 0.1,
      foldMazoThreshold: 0.24,
      foldMazoPatienceMult: 1.4,
      saveHighFor3rdMemory: 0.65,
    }),
  },
};

const VASARI: RivalInfo = {
  id: "vasari",
  name: "Comodoro Vasari",
  tagline: "escala · lee la mesa · balanceado",
  profile: {
    skill: 0.75,
    aggression: 0.55,
    bluff: 0.35,
    patience: 0.55,
    memory: 0.75,
    depth: 3,
    weights: mkWeights({
      envidoAcceptOffset: 0.0,
      trucoAcceptOffset: 0.0,
      envidoRealEscalationBase: 0.55,
      envidoRealEscalationAggr: 0.7,
      envidoLieRate: 0.25,
      envidoChallengeBias: 0.15,
      oppEnvidoPriorMax: 26,
      envidoWindowLow: 4,
      envidoWindowHigh: 7,
    }),
  },
};

const REGISTRY: Record<RivalId, RivalInfo> = {
  bellver: BELLVER,
  serafina: SERAFINA,
  vasari: VASARI,
};

export function getRival(id: RivalId): RivalInfo {
  return REGISTRY[id];
}
export function listRivals(): RivalInfo[] {
  return [BELLVER, SERAFINA, VASARI];
}
export function getRivalProfile(id: RivalId): AiProfile {
  return REGISTRY[id].profile;
}
