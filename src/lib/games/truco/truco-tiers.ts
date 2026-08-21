import type { DifficultyTier } from "@/lib/difficulty";

export const TRUCO_TIERS: DifficultyTier[] = [
  {
    id: "aprendiz",
    name: "Aprendiz",
    hint: "Farolera y despareja. Perfecto para agarrar la mano.",
    unlockAt: 3,
    tuning: { accuracy: 0.42, memory: 0.2, bluff: 0.3, depth: 0 },
  },
  {
    id: "habitual",
    name: "Habitual",
    hint: "Canta envido con criterio. Cae rara vez en la falta.",
    unlockAt: 4,
    tuning: { accuracy: 0.6, memory: 0.45, bluff: 0.22, depth: 1 },
  },
  {
    id: "curtida",
    name: "Curtida",
    hint: "Se guarda la alta para la 3ª. Farolea con timing.",
    unlockAt: 5,
    tuning: { accuracy: 0.75, memory: 0.65, bluff: 0.18, depth: 2 },
    rules: { strictFlor: false },
  },
  {
    id: "cuervo",
    name: "Cuervo",
    hint: "Simula tus tantos. Flor obligatoria. Vale 4 sin pestañear.",
    unlockAt: 6,
    tuning: { accuracy: 0.9, memory: 0.85, bluff: 0.12, depth: 3 },
    rules: { strictFlor: true },
  },
];
