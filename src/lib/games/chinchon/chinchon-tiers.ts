import type { DifficultyTier } from "@/lib/difficulty";

export const CHINCHON_TIERS: DifficultyTier[] = [
  {
    id: "aprendiz",
    name: "Aprendiz",
    hint: "Descarta obvio y rara vez se guarda cartas.",
    unlockAt: 3,
    tuning: { accuracy: 0.4, memory: 0.2, bluff: 0.2, depth: 0 },
  },
  {
    id: "habitual",
    name: "Habitual",
    hint: "Cierra a tiempo y evita alimentar tríos evidentes.",
    unlockAt: 4,
    tuning: { accuracy: 0.62, memory: 0.45, bluff: 0.15, depth: 1 },
  },
  {
    id: "curtida",
    name: "Curtida",
    hint: "Bloquea descartes que te arman juego y aguanta por chinchón.",
    unlockAt: 5,
    tuning: { accuracy: 0.78, memory: 0.68, bluff: 0.12, depth: 2 },
    rules: { chinchonSmartBlock: true },
  },
  {
    id: "mirla",
    name: "Mirla",
    hint: "Memoria fina, casi no regala. Se planta con 3 y va por chinchón.",
    unlockAt: 6,
    tuning: { accuracy: 0.9, memory: 0.86, bluff: 0.08, depth: 3 },
    rules: { chinchonSmartBlock: true },
  },
];
