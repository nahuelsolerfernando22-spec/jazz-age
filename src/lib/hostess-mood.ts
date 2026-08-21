import type { HostessAiProfile } from "./hostess-ai";

export type Mood = "neutral" | "confiada" | "nerviosa" | "furiosa" | "aburrida";

interface MoodState {
  mood: Mood;
  streak: number;
  lastEventAt: number;
  wins: number;
  losses: number;
  insults: number;
  longTurns: number;
}

const state = new Map<string, MoodState>();

function ensure(id: string): MoodState {
  let s = state.get(id);
  if (!s) {
    s = {
      mood: "neutral",
      streak: 0,
      lastEventAt: 0,
      wins: 0,
      losses: 0,
      insults: 0,
      longTurns: 0,
    };
    state.set(id, s);
  }
  return s;
}

export function resetMood(hostessId: string): void {
  state.set(hostessId, {
    mood: "neutral",
    streak: 0,
    lastEventAt: Date.now(),
    wins: 0,
    losses: 0,
    insults: 0,
    longTurns: 0,
  });
}

export function noteEvent(
  hostessId: string,
  event: "won" | "lost" | "tied" | "long-turn" | "insult",
): Mood {
  const s = ensure(hostessId);
  s.lastEventAt = Date.now();
  if (event === "won") {
    s.wins += 1;
    s.streak = s.streak >= 0 ? s.streak + 1 : 1;
  } else if (event === "lost") {
    s.losses += 1;
    s.streak = s.streak <= 0 ? s.streak - 1 : -1;
  } else if (event === "insult") {
    s.insults += 1;
  } else if (event === "long-turn") {
    s.longTurns += 1;
  }

  if (s.insults >= 2) s.mood = "furiosa";
  else if (s.streak <= -3) s.mood = "furiosa";
  else if (s.streak >= 3) s.mood = "confiada";
  else if (s.streak <= -2) s.mood = "nerviosa";
  else if (s.longTurns >= 3) s.mood = "aburrida";
  else if (event === "insult") s.mood = "furiosa";
  else if (Math.abs(s.streak) <= 1 && s.insults === 0) s.mood = "neutral";
  return s.mood;
}

export function getMood(hostessId: string): Mood {
  return state.get(hostessId)?.mood ?? "neutral";
}

export function getMoodState(hostessId: string): MoodState {
  return { ...ensure(hostessId) };
}

export function applyMood(p: HostessAiProfile, mood: Mood): HostessAiProfile {
  const d = MOOD_DELTAS[mood];
  return {
    ...p,
    skill: clamp01(p.skill + d.skill),
    aggression: clamp01(p.aggression + d.aggression),
    bluff: clamp01(p.bluff + d.bluff),
    patience: clamp01(p.patience + d.patience),
    memory: clamp01(p.memory + d.memory),
  };
}

const MOOD_DELTAS: Record<
  Mood,
  {
    skill: number;
    aggression: number;
    bluff: number;
    patience: number;
    memory: number;
  }
> = {
  neutral: { skill: 0.0, aggression: 0.0, bluff: 0.0, patience: 0.0, memory: 0.0 },
  confiada: { skill: 0.05, aggression: 0.15, bluff: 0.1, patience: -0.1, memory: 0.05 },
  nerviosa: { skill: -0.1, aggression: -0.1, bluff: -0.05, patience: 0.05, memory: -0.05 },
  furiosa: { skill: -0.05, aggression: 0.25, bluff: 0.15, patience: -0.2, memory: -0.1 },
  aburrida: { skill: 0.0, aggression: -0.1, bluff: 0.15, patience: -0.05, memory: 0.0 },
};

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
