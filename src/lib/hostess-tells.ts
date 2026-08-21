import type { EmotionalState } from "./hostess-emotion";

export type Tell =
  | "spark"
  | "glow"
  | "focus"
  | "veil"
  | "tilt"
  | "guard"
  | "flare"
  | "drift"
  | "tension"
  | "shield"
  | "still";

const MAP: Record<EmotionalState, Tell> = {
  neutral: "still",
  exalted: "spark",
  satisfied: "glow",
  playful: "spark",
  generous: "glow",
  focused: "focus",
  nostalgic: "veil",
  curious: "tilt",
  cautious: "guard",
  irritated: "flare",
  melancholic: "drift",
  tense: "tension",
  distant: "guard",
  protective: "shield",
};

export function tellFor(state: EmotionalState): Tell {
  return MAP[state] ?? "still";
}

export const TELL_LABEL: Record<Tell, string> = {
  spark: "chispa en la mirada",
  glow: "halo cálido",
  focus: "mirada cerrada",
  veil: "velo nostálgico",
  tilt: "curiosidad ladeada",
  guard: "sombra defensiva",
  flare: "destello iracundo",
  drift: "partículas de melancolía",
  tension: "tensión contenida",
  shield: "brillo protector",
  still: "quieta",
};
