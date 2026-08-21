import { useMemo } from "react";
import lolaPortrait from "@/assets/lola-portrait.webp";
import { rotatedPortrait } from "@/lib/hostess-pose-rotation";
const idle = lolaPortrait;
const front = lolaPortrait;
const win = lolaPortrait;
const lose = lolaPortrait;
const angry = lolaPortrait;
const flirty = lolaPortrait;
const tense = lolaPortrait;
export type LolaPose = "front" | "back";
export type LolaMood =
  "coqueta" | "enfadada" | "triunfante" | "triste" | "sorprendida" | "seductora";

export type LolaCue = "idle" | "win" | "lose" | "angry" | "flirty" | "tense";

const CUE_BY_MOOD: Record<LolaMood, LolaCue> = {
  coqueta: "idle",
  triunfante: "win",
  triste: "lose",
  enfadada: "angry",
  seductora: "flirty",
  sorprendida: "tense",
};

const SRC_BY_CUE: Record<LolaCue, string> = {
  idle: idle,
  win: win,
  lose: lose,
  angry: angry,
  flirty: flirty,
  tense: tense,
};

const idleRotated = () => rotatedPortrait("lola") ?? idle;
void front;

export const LOLA_MOODS: LolaMood[] = [
  "coqueta",
  "triunfante",
  "seductora",
  "sorprendida",
  "enfadada",
  "triste",
];

export function lolaPortraitSrc(_pose: LolaPose, mood: LolaMood): string {
  return SRC_BY_CUE[CUE_BY_MOOD[mood]];
}

interface LolaPortraitProps {
  pose?: LolaPose;
  mood?: LolaMood;
  cue?: LolaCue;
  className?: string;
  alt?: string;
}

export function LolaPortrait({
  pose = "front",
  mood = "coqueta",
  cue,
  className,
  alt,
}: LolaPortraitProps) {
  const src = useMemo(
    () =>
      cue ? SRC_BY_CUE[cue] : mood === "coqueta" ? idleRotated() : lolaPortraitSrc(pose, mood),
    [pose, mood, cue],
  );
  return (
    <img
      src={src}
      alt={alt ?? `Lola «La Suerte» Vargas — ${cue ?? mood}`}
      className={className}
      width={512}
      height={640}
      loading="lazy"
      decoding="async"
    />
  );
}
