import { create } from "zustand";
import { persist } from "zustand/middleware";
import { creditAffinityForGame } from "@/store/single-affinity";

export type NemesisOutcome = "win" | "loss" | "draw" | "abandoned";

export interface NemesisRecord {
  name: string;
  level: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  lossStreak: number;
  mistakes: Record<string, number>;
  mistakesLifetime: Record<string, number>;
  learning: number;
  lastDelta: { level: number; learning: number; reason: NemesisOutcome | null };
}

const NEMESIS_NAMES = [
  "Silas «Cuchillas»",
  "Blackjack Pete",
  "La Serpiente",
  "Doc Marlow",
  "Kitty Nueve-Vidas",
  "El Húngaro",
  "Sombra Rojas",
  "Bones McCabe",
  "Vera «Guantes»",
  "El Barón",
  "Coyote Ives",
  "Lulú Cianuro",
  "Tres-Dedos Bello",
  "Ivo el Tuerto",
  "Miel Amarga",
] as const;

function pickName(gameId: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < gameId.length; i++) {
    h ^= gameId.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return NEMESIS_NAMES[h % NEMESIS_NAMES.length];
}

interface NemesisState {
  byGame: Record<string, NemesisRecord>;
  get: (gameId: string) => NemesisRecord;
  recordResult: (gameId: string, outcome: NemesisOutcome) => void;
  recordMistake: (gameId: string, tag: string, weight?: number) => void;
  reset: () => void;
}

function makeInitial(gameId: string): NemesisRecord {
  return {
    name: pickName(gameId),
    level: 1,
    wins: 0,
    losses: 0,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0,
    lossStreak: 0,
    mistakes: {},
    mistakesLifetime: {},
    learning: 0,
    lastDelta: { level: 0, learning: 0, reason: null },
  };
}

function normalize(r: Partial<NemesisRecord> | undefined, gameId: string): NemesisRecord {
  const base = makeInitial(gameId);
  if (!r) return base;
  return {
    name: r.name ?? base.name,
    level: r.level ?? base.level,
    wins: r.wins ?? 0,
    losses: r.losses ?? 0,
    draws: r.draws ?? 0,
    currentStreak: r.currentStreak ?? 0,
    bestStreak: r.bestStreak ?? 0,
    lossStreak: r.lossStreak ?? 0,
    mistakes: r.mistakes ?? {},
    mistakesLifetime: r.mistakesLifetime ?? {},
    learning: r.learning ?? 0,
    lastDelta: r.lastDelta ?? { level: 0, learning: 0, reason: null },
  };
}

export const useNemesis = create<NemesisState>()(
  persist(
    (set, get) => ({
      byGame: {},
      get: (gameId) => {
        const existing = get().byGame[gameId];
        if (existing && typeof existing.bestStreak === "number") return existing;
        return normalize(existing, gameId);
      },

      recordResult: (gameId, outcome) => {
        if (outcome === "win" || outcome === "loss" || outcome === "draw") {
          void creditAffinityForGame(gameId, outcome);
        } else if (outcome === "abandoned") {
          void creditAffinityForGame(gameId, "loss");
        }
        set((s) => {
          const cur = normalize(s.byGame[gameId], gameId);
          let next: NemesisRecord = cur;
          if (outcome === "win") {
            const streak = cur.currentStreak + 1;
            const uniqueTags = Object.keys(cur.mistakes).length;
            const weightSum = Object.values(cur.mistakes).reduce((a, b) => a + b, 0);
            const learnBump = Math.min(0.5 - cur.learning, uniqueTags * 0.02 + weightSum * 0.01);
            const learning = Math.min(0.5, cur.learning + Math.max(0, learnBump));
            // Rachas largas del jugador aceleran la escalada: el rival se pone serio.
            const step = streak >= 3 ? 2 : 1;
            next = {
              ...cur,
              wins: cur.wins + 1,
              level: Math.min(20, cur.level + step),
              currentStreak: streak,
              bestStreak: Math.max(cur.bestStreak, streak),
              lossStreak: 0,
              mistakes: {},
              learning,
              lastDelta: {
                level: step,
                learning: Math.max(0, learning - cur.learning),
                reason: "win",
              },
            };
          } else if (outcome === "loss") {
            // Antes el rival subía de nivel también cuando ganaba: castigaba doble
            // al jugador. Ahora se mantiene y afloja si te viene arrasando.
            const lossStreak = cur.lossStreak + 1;
            const drop = lossStreak >= 2 ? -1 : 0;
            const learning = Math.max(0, cur.learning - (lossStreak >= 2 ? 0.05 : 0));
            next = {
              ...cur,
              losses: cur.losses + 1,
              level: Math.max(1, cur.level + drop),
              currentStreak: 0,
              lossStreak,
              mistakes: {},
              learning,
              lastDelta: { level: drop, learning: learning - cur.learning, reason: "loss" },
            };
          } else if (outcome === "draw") {
            next = {
              ...cur,
              draws: cur.draws + 1,
              lastDelta: { level: 0, learning: 0, reason: "draw" },
            };
          } else if (outcome === "abandoned") {
            // Abandonar no debe escalar al rival (Android mata la app seguido);
            // solo corta la racha y limpia los errores de la mano en curso.
            next = {
              ...cur,
              currentStreak: 0,
              mistakes: {},
              lastDelta: { level: 0, learning: 0, reason: "abandoned" },
            };
          }
          return { byGame: { ...s.byGame, [gameId]: next } };
        });
      },
      recordMistake: (gameId, tag, weight = 1) => {
        set((s) => {
          const cur = normalize(s.byGame[gameId], gameId);
          const mistakes = { ...cur.mistakes, [tag]: (cur.mistakes[tag] ?? 0) + weight };
          const mistakesLifetime = {
            ...cur.mistakesLifetime,
            [tag]: (cur.mistakesLifetime[tag] ?? 0) + weight,
          };
          return {
            byGame: { ...s.byGame, [gameId]: { ...cur, mistakes, mistakesLifetime } },
          };
        });
      },
      reset: () => set({ byGame: {} }),
    }),
    { name: "cuervo:nemesis", version: 5 },
  ),
);
