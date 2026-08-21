export type EmotionalState =
  | "neutral"
  | "exalted"
  | "satisfied"
  | "playful"
  | "generous"
  | "focused"
  | "nostalgic"
  | "curious"
  | "cautious"
  | "irritated"
  | "melancholic"
  | "tense"
  | "distant"
  | "protective";

export type EmotionalFamily = "high" | "mid" | "low" | "mixed";

const HIGH: EmotionalState[] = ["exalted", "satisfied", "playful", "generous"];
const MID: EmotionalState[] = ["focused", "nostalgic", "curious", "cautious"];
const LOW: EmotionalState[] = ["irritated", "melancholic", "tense", "distant", "protective"];

const BASE_WEIGHT: Record<EmotionalState, number> = {
  neutral: 30,
  exalted: 5,
  satisfied: 15,
  playful: 12,
  generous: 10,
  focused: 15,
  nostalgic: 10,
  curious: 12,
  cautious: 12,
  irritated: 8,
  melancholic: 8,
  tense: 10,
  distant: 5,
  protective: 8,
};

const HOSTESS_CONFIG: Record<string, { family: EmotionalFamily; allowed: EmotionalState[] }> = {
  corvina: {
    family: "mixed",
    allowed: ["neutral", "focused", "cautious", "tense", "nostalgic", "distant"],
  },
  yolanda: { family: "mid", allowed: ["neutral", "focused", "nostalgic", "curious", "satisfied"] },
  mirla: { family: "mixed", allowed: ["neutral", "playful", "satisfied", "focused", "curious"] },
  opal: { family: "mid", allowed: ["neutral", "focused", "cautious", "satisfied"] },

  jade: { family: "mixed", allowed: ["neutral", "focused", "satisfied", "irritated", "cautious"] },
  anahit: { family: "mid", allowed: ["neutral", "focused", "curious", "cautious", "satisfied"] },
  eloise: {
    family: "mid",
    allowed: ["neutral", "nostalgic", "satisfied", "cautious", "melancholic"],
  },
  vita: { family: "low", allowed: ["neutral", "focused", "irritated", "tense", "satisfied"] },

  luciera: { family: "high", allowed: ["neutral", "playful", "exalted", "generous", "curious"] },
  madge: { family: "mid", allowed: ["neutral", "focused", "cautious", "satisfied", "distant"] },
  bettie: { family: "mixed", allowed: ["neutral", "irritated", "satisfied", "playful", "focused"] },
  celeste: {
    family: "mixed",
    allowed: ["neutral", "playful", "nostalgic", "melancholic", "generous"],
  },

  perla: {
    family: "high",
    allowed: ["neutral", "generous", "curious", "playful", "nostalgic", "protective"],
  },
  daphne: { family: "high", allowed: ["neutral", "playful", "satisfied", "generous", "curious"] },
  zulme: { family: "mixed", allowed: ["neutral", "cautious", "focused", "curious", "tense"] },
  lola: { family: "high", allowed: ["neutral", "playful", "generous", "satisfied", "exalted"] },

  zelda: { family: "mid", allowed: ["neutral", "curious", "focused", "nostalgic", "cautious"] },
  pilar: { family: "mid", allowed: ["neutral", "focused", "cautious", "satisfied", "distant"] },
  eulalia: { family: "mixed", allowed: ["neutral", "playful", "irritated", "tense", "satisfied"] },
  remedios: { family: "mixed", allowed: ["neutral", "playful", "irritated", "curious", "focused"] },
  crescencia: { family: "mid", allowed: ["neutral", "focused", "cautious", "satisfied"] },
  may: { family: "low", allowed: ["neutral", "distant", "cautious", "focused", "melancholic"] },
};

function fallbackFor(discDominant: string | undefined): {
  family: EmotionalFamily;
  allowed: EmotionalState[];
} {
  switch (discDominant) {
    case "D":
      return {
        family: "mixed",
        allowed: ["neutral", "focused", "irritated", "satisfied", "cautious"],
      };
    case "I":
      return {
        family: "high",
        allowed: ["neutral", "playful", "generous", "curious", "satisfied"],
      };
    case "S":
      return {
        family: "mid",
        allowed: ["neutral", "nostalgic", "curious", "protective", "satisfied"],
      };
    case "C":
      return { family: "mid", allowed: ["neutral", "focused", "cautious", "curious", "satisfied"] };
    default:
      return { family: "mid", allowed: ["neutral", "focused", "curious", "satisfied", "cautious"] };
  }
}

export function getEmotionalConfig(
  hostessId: string,
  discDominant?: string,
): { family: EmotionalFamily; allowed: EmotionalState[] } {
  return HOSTESS_CONFIG[hostessId] ?? fallbackFor(discDominant);
}

function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function isoDay(d: Date): string {
  return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}-${d.getUTCDate().toString().padStart(2, "0")}`;
}

export function getDailyEmotionalState(
  hostessId: string,
  opts: { discDominant?: string; date?: Date } = {},
): EmotionalState {
  const cfg = getEmotionalConfig(hostessId, opts.discDominant);
  const day = isoDay(opts.date ?? new Date());
  const seed = hash32(`emo:${hostessId}:${day}`);

  const allowed = cfg.allowed.length ? cfg.allowed : ["neutral" as EmotionalState];
  const weights = allowed.map((s) => BASE_WEIGHT[s] ?? 5);
  const total = weights.reduce((a, b) => a + b, 0);
  let pick = seed % total;
  for (let i = 0; i < allowed.length; i++) {
    if (pick < weights[i]) return allowed[i];
    pick -= weights[i];
  }
  return "neutral";
}

export function migrateLegacyState(
  legacy: "neutral" | "focused" | "irritated" | "satisfied" | "melancholic" | "energized",
): EmotionalState {
  return legacy === "energized" ? "playful" : legacy;
}

export function familyOf(state: EmotionalState): EmotionalFamily {
  if (state === "neutral") return "mid";
  if (HIGH.includes(state)) return "high";
  if (MID.includes(state)) return "mid";
  return "low";
}

export function stateChangedSinceYesterday(
  hostessId: string,
  opts: { discDominant?: string; today?: Date } = {},
): boolean {
  const today = opts.today ?? new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  return (
    getDailyEmotionalState(hostessId, { discDominant: opts.discDominant, date: today }) !==
    getDailyEmotionalState(hostessId, { discDominant: opts.discDominant, date: yesterday })
  );
}
