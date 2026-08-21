export interface DifficultyTier {
  id: string;
  name: string;
  hint: string;
  unlockAt: number;
  tuning: TierTuning;
  rules?: Partial<StrictRules>;
}

export interface TierTuning {
  accuracy: number;
  memory: number;
  bluff: number;
  depth: number;
}

export interface StrictRules {
  strictFlor: boolean;
  escobaDe15Double: boolean;
  chinchonSmartBlock: boolean;
  bjDealerHitsSoft17: boolean;
  generalaStrictScale: boolean;
  rulettaNoDoubleOutside: boolean;
  mahjongLimitUndo: boolean;
}

export interface PrestigeStep {
  level: number;
  bonusAccuracy: number;
  bonusMemory: number;
  bluffCut: number;
  bonusDepth: number;
}

export function prestigeStep(level: number): PrestigeStep {
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  return {
    level,

    bonusAccuracy: clamp01(0.08 * Math.log2(1 + level)),
    bonusMemory: clamp01(0.06 * Math.log2(1 + level)),
    bluffCut: clamp01(0.05 * Math.log2(1 + level)),
    bonusDepth: Math.min(10, Math.floor(level / 2)),
  };
}

export function applyPrestige(base: TierTuning, level: number): TierTuning {
  const p = prestigeStep(level);
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  return {
    accuracy: clamp01(base.accuracy + p.bonusAccuracy),
    memory: clamp01(base.memory + p.bonusMemory),
    bluff: clamp01(base.bluff - p.bluffCut),
    depth: base.depth + p.bonusDepth,
  };
}

export function difficultyLabel(tier: DifficultyTier, prestige: number): string {
  if (prestige <= 0) return tier.name;
  return `${tier.name} · P.${romanOr(prestige)}`;
}

function romanOr(n: number): string {
  if (n > 20) return String(n);
  const map: Array<[number, string]> = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let rest = n;
  for (const [v, s] of map) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
}

export const DEFAULT_TIERS: DifficultyTier[] = [
  {
    id: "aprendiz",
    name: "Aprendiz",
    hint: "El CPU juega abierto. Ideal para agarrar la mano.",
    unlockAt: 3,
    tuning: { accuracy: 0.35, memory: 0.1, bluff: 0.05, depth: 1 },
  },
  {
    id: "habitual",
    name: "Habitual",
    hint: "Empieza a cerrar jugadas. Farolea a veces.",
    unlockAt: 5,
    tuning: { accuracy: 0.55, memory: 0.3, bluff: 0.15, depth: 2 },
  },
  {
    id: "curtido",
    name: "Curtido",
    hint: "Lee tus patrones. Rara vez regala.",
    unlockAt: 7,
    tuning: { accuracy: 0.72, memory: 0.55, bluff: 0.25, depth: 3 },
  },
  {
    id: "cuervo",
    name: "Cuervo",
    hint: "Nivel del salón. Poco perdón, mucho oficio.",
    unlockAt: 10,
    tuning: { accuracy: 0.88, memory: 0.8, bluff: 0.18, depth: 5 },
    rules: {
      strictFlor: true,
      escobaDe15Double: true,
      chinchonSmartBlock: true,
      bjDealerHitsSoft17: true,
      generalaStrictScale: true,
      rulettaNoDoubleOutside: true,
      mahjongLimitUndo: true,
    },
  },
];

export function tierById(tiers: DifficultyTier[], id: string): DifficultyTier {
  return tiers.find((t) => t.id === id) ?? tiers[0]!;
}

export function nextTier(tiers: DifficultyTier[], id: string): DifficultyTier | null {
  const idx = tiers.findIndex((t) => t.id === id);
  if (idx < 0 || idx >= tiers.length - 1) return null;
  return tiers[idx + 1]!;
}

export function isTopTier(tiers: DifficultyTier[], id: string): boolean {
  return tiers.findIndex((t) => t.id === id) === tiers.length - 1;
}
