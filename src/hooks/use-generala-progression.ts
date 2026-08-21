import { useCallback, useEffect, useState } from "react";
import { GENERALA_LEVELS, computeGeneralaStars, getGeneralaLevel } from "@/lib/generala-levels";

const STORAGE_KEY = "generala:progression:v1";
const HISTORY_KEY = "generala:history:v1";
const HISTORY_MAX = 24;

export interface GenLevelProgress {
  stars: 0 | 1 | 2 | 3;
  matchesWon: number;
  bestStreak: number;
  totalNet: number;
  played: number;
  bestScore: number;
}

export interface GenProgressionState {
  xp: number;
  totalMatches: number;
  currentStreak: number;
  perLevel: Record<string, GenLevelProgress>;
  claimed: Record<string, number>;
}

const EMPTY: GenProgressionState = {
  xp: 0,
  totalMatches: 0,
  currentStreak: 0,
  perLevel: {},
  claimed: {},
};

export interface GenRankDef {
  id: string;
  name: string;
  threshold: number;
  blurb: string;
}
export const GENERALA_RANKS: GenRankDef[] = [
  { id: "curioso", name: "Curioso del Cubilete", threshold: 0, blurb: "Tiraste, ahora aprendé." },
  {
    id: "leecard",
    name: "Lector de Cartón",
    threshold: 500,
    blurb: "Sabés dónde tachar sin sufrir.",
  },
  { id: "manodura", name: "Mano Dura", threshold: 1600, blurb: "Zelda te respeta — un poco." },
  {
    id: "vidente",
    name: "Vidente Aprendiz",
    threshold: 4000,
    blurb: "Calculás la servida antes del tiro.",
  },
  {
    id: "pitonisa",
    name: "Pitonisa del Sótano",
    threshold: 10000,
    blurb: "Los dados ya saben lo que vas a anotar.",
  },
];

export function genRankFor(xp: number) {
  let current = GENERALA_RANKS[0];
  let next: GenRankDef | null = GENERALA_RANKS[1] ?? null;
  for (let i = 0; i < GENERALA_RANKS.length; i++) {
    if (xp >= GENERALA_RANKS[i].threshold) {
      current = GENERALA_RANKS[i];
      next = GENERALA_RANKS[i + 1] ?? null;
    }
  }
  const progress = next
    ? Math.min(1, (xp - current.threshold) / (next.threshold - current.threshold))
    : 1;
  return { current, next, progress };
}

export type MatchResult = "W" | "L" | "T";
export interface MatchRecord {
  levelId: string;
  result: MatchResult;
  playerScore: number;
  zeldaScore: number;
  at: number;
}

function load(): GenProgressionState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as GenProgressionState;
    return {
      ...EMPTY,
      ...p,
      perLevel: { ...(p.perLevel ?? {}) },
      claimed: { ...(p.claimed ?? {}) },
    };
  } catch {
    return EMPTY;
  }
}
function save(s: GenProgressionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}
function loadHistory(): MatchRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchRecord[];
  } catch {
    return [];
  }
}
function saveHistory(h: MatchRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-HISTORY_MAX)));
  } catch {}
}

export function useGeneralaProgression() {
  const [state, setState] = useState<GenProgressionState>(EMPTY);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  useEffect(() => {
    setState(load());
    setHistory(loadHistory());
  }, []);
  useEffect(() => {
    save(state);
  }, [state]);
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const getProgress = useCallback(
    (id: string): GenLevelProgress =>
      state.perLevel[id] ?? {
        stars: 0,
        matchesWon: 0,
        bestStreak: 0,
        totalNet: 0,
        played: 0,
        bestScore: 0,
      },
    [state],
  );

  const recordMatch = useCallback(
    (
      levelId: string,
      result: MatchResult,
      playerScore: number,
      zeldaScore: number,
      net: number,
    ) => {
      const level = getGeneralaLevel(levelId);
      const xpGain =
        (result === "W" ? 25 : result === "T" ? 8 : 4) +
        Math.max(0, Math.round(playerScore / 25)) +
        Math.max(0, Math.round(net / 100));
      setState((s) => {
        const prev = s.perLevel[levelId] ?? {
          stars: 0,
          matchesWon: 0,
          bestStreak: 0,
          totalNet: 0,
          played: 0,
          bestScore: 0,
        };
        const matchesWon = prev.matchesWon + (result === "W" ? 1 : 0);
        const stars = computeGeneralaStars(level, matchesWon);
        const newStreak = result === "W" ? s.currentStreak + 1 : 0;
        return {
          ...s,
          xp: s.xp + Math.round(xpGain * level.xpMult),
          totalMatches: s.totalMatches + 1,
          currentStreak: newStreak,
          perLevel: {
            ...s.perLevel,
            [levelId]: {
              stars: Math.max(prev.stars, stars) as 0 | 1 | 2 | 3,
              matchesWon,
              bestStreak: Math.max(prev.bestStreak, newStreak),
              totalNet: prev.totalNet + net,
              played: prev.played + 1,
              bestScore: Math.max(prev.bestScore, playerScore),
            },
          },
        };
      });
      setHistory((h) =>
        [...h, { levelId, result, playerScore, zeldaScore, at: Date.now() }].slice(-HISTORY_MAX),
      );
    },
    [],
  );

  const isUnlocked = useCallback(
    (id: string): boolean => {
      const idx = GENERALA_LEVELS.findIndex((l) => l.id === id);
      if (idx <= 0) return true;
      const prev = GENERALA_LEVELS[idx - 1];
      return (state.perLevel[prev.id]?.stars ?? 0) >= 1;
    },
    [state],
  );

  const pendingReward = useCallback(
    (id: string): { amount: number; nextTier: number } => {
      const level = getGeneralaLevel(id);
      const stars = state.perLevel[id]?.stars ?? 0;
      const claimed = state.claimed[id] ?? 0;
      let amount = 0;
      for (let t = claimed + 1; t <= stars; t++) amount += level.rewards[t - 1] ?? 0;
      return { amount, nextTier: claimed + 1 };
    },
    [state],
  );

  const claimRewards = useCallback(
    (id: string): number => {
      const level = getGeneralaLevel(id);
      const stars = state.perLevel[id]?.stars ?? 0;
      const claimed = state.claimed[id] ?? 0;
      if (stars <= claimed) return 0;
      let payout = 0;
      for (let t = claimed + 1; t <= stars; t++) payout += level.rewards[t - 1] ?? 0;
      setState((s) => ({
        ...s,
        claimed: { ...s.claimed, [id]: Math.max(s.claimed[id] ?? 0, stars) },
      }));
      return payout;
    },
    [state],
  );

  const totalStars = Object.values(state.perLevel).reduce((a, p) => a + p.stars, 0);
  const maxStars = GENERALA_LEVELS.length * 3;
  const rank = genRankFor(state.xp);

  return {
    state,
    history,
    getProgress,
    recordMatch,
    isUnlocked,
    pendingReward,
    claimRewards,
    totalStars,
    maxStars,
    rank,
  };
}
