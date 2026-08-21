import { useCallback, useEffect, useState } from "react";
import { computeStars, getLevel, LEVELS } from "@/lib/games/mahjong/mahjong-levels";

const STORAGE_KEY = "cuervo-dorado:mahjong:progression:v1";

export interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  bestTime: number; // segundos; 0 = sin récord
  played: number;
  won: number;
}

export interface ProgressionState {
  xp: number;
  totalGames: number;
  totalWins: number;
  perLevel: Record<string, LevelProgress>;
}

const EMPTY: ProgressionState = {
  xp: 0,
  totalGames: 0,
  totalWins: 0,
  perLevel: {},
};

export interface RankDef {
  id: string;
  name: string;
  threshold: number;
  blurb: string;
}

export const RANKS: RankDef[] = [
  { id: "novato", name: "Recién Llegado", threshold: 0, blurb: "Tomá asiento, encanto." },
  { id: "regular", name: "Cliente Regular", threshold: 800, blurb: "Te empezamos a reconocer." },
  { id: "habitue", name: "Habitué", threshold: 2500, blurb: "El barman ya sabe lo tuyo." },
  { id: "socio", name: "Socio del Cuervo", threshold: 6000, blurb: "Mesa reservada permanente." },
  {
    id: "leyenda",
    name: "Leyenda del Salón",
    threshold: 14000,
    blurb: "Tu nombre está en la pared.",
  },
];

export function rankFor(xp: number): { current: RankDef; next: RankDef | null; progress: number } {
  let current = RANKS[0];
  let next: RankDef | null = RANKS[1] ?? null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].threshold) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }
  const progress = next
    ? Math.min(1, (xp - current.threshold) / (next.threshold - current.threshold))
    : 1;
  return { current, next, progress };
}

function load(): ProgressionState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ProgressionState;
    return { ...EMPTY, ...parsed, perLevel: { ...parsed.perLevel } };
  } catch {
    return EMPTY;
  }
}

function save(state: ProgressionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useMahjongProgression() {
  const [state, setState] = useState<ProgressionState>(EMPTY);

  useEffect(() => {
    setState(load());
  }, []);

  useEffect(() => {
    save(state);
  }, [state]);

  const getProgress = useCallback(
    (levelId: string): LevelProgress => {
      const p = state.perLevel[levelId];
      if (!p) return { stars: 0, bestScore: 0, bestTime: 0, played: 0, won: 0 };
      return { ...p, bestTime: p.bestTime ?? 0 };
    },
    [state],
  );

  const recordGame = useCallback(
    (levelId: string, score: number, won: boolean, timeSpentSec = 0) => {
      const level = getLevel(levelId);
      const stars = won ? computeStars(level, score) : 0;
      const xpGain = Math.round(score * (won ? 1 : 0.4));
      setState((s) => {
        const prev = s.perLevel[levelId] ?? {
          stars: 0,
          bestScore: 0,
          bestTime: 0,
          played: 0,
          won: 0,
        };
        const prevBestTime = prev.bestTime ?? 0;
        const nextBestTime =
          won && timeSpentSec > 0
            ? prevBestTime > 0
              ? Math.min(prevBestTime, timeSpentSec)
              : timeSpentSec
            : prevBestTime;
        return {
          ...s,
          xp: s.xp + xpGain,
          totalGames: s.totalGames + 1,
          totalWins: s.totalWins + (won ? 1 : 0),
          perLevel: {
            ...s.perLevel,
            [levelId]: {
              stars: Math.max(prev.stars, stars) as 0 | 1 | 2 | 3,
              bestScore: Math.max(prev.bestScore, score),
              bestTime: nextBestTime,
              played: prev.played + 1,
              won: prev.won + (won ? 1 : 0),
            },
          },
        };
      });
      return { stars, xpGain, newRecord: won && timeSpentSec > 0 };
    },
    [],
  );

  const isUnlocked = useCallback(
    (levelId: string): boolean => {
      const idx = LEVELS.findIndex((l) => l.id === levelId);
      if (idx >= 0 && LEVELS[idx].practice) return true;
      if (idx <= 0) return true;
      if (idx > 0) {
        const prev = LEVELS[idx - 1];
        return (state.perLevel[prev.id]?.stars ?? 0) >= 1;
      }

      const m = /^l(\d+)$/.exec(levelId);
      if (!m) return false;
      const order = Number(m[1]);
      if (order <= 1) return true;
      const prevId = `l${order - 1}`;
      return (state.perLevel[prevId]?.stars ?? 0) >= 1;
    },
    [state],
  );

  const reset = useCallback(() => setState(EMPTY), []);

  const totalStars = Object.values(state.perLevel).reduce((acc, p) => acc + p.stars, 0);
  const maxStars = LEVELS.length * 3;
  const rank = rankFor(state.xp);

  return {
    state,
    getProgress,
    recordGame,
    isUnlocked,
    reset,
    totalStars,
    maxStars,
    rank,
  };
}
