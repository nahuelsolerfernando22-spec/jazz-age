import type { HostessAiProfile } from "./hostess-ai";

export interface HostessMemory {
  games: number;
  wins: number;
  losses: number;

  playerBluff: number;
  playerAggression: number;
  playerPatience: number;
  observations: number;
  lastPlayedAt: number;
  avgDurationMs: number;
}

const STORAGE_KEY = "hostess-learning:v1";
const EMA_ALPHA = 0.15;

const MAX_DELTA = {
  skill: 0.25,
  aggression: 0.18,
  bluff: 0.14,
  patience: 0.2,
  memory: 0.28,
} as const;

const WARMUP_GAMES = 2;

type Store = Record<string, HostessMemory>;

function emptyMemory(): HostessMemory {
  return {
    games: 0,
    wins: 0,
    losses: 0,
    playerBluff: 0.3,
    playerAggression: 0.5,
    playerPatience: 0.5,
    observations: 0,
    lastPlayedAt: 0,
    avgDurationMs: 0,
  };
}

function loadStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function getHostessMemory(hostessId: string): HostessMemory {
  return loadStore()[hostessId] ?? emptyMemory();
}

export interface MatchRecord {
  hostessWon: boolean;
  playerBluffRate?: number;
  playerAggressionRate?: number;
  playerPatienceRate?: number;
  durationMs?: number;
}

export function recordMatch(hostessId: string, r: MatchRecord): void {
  if (!hostessId) return;
  const store = loadStore();
  const cur = store[hostessId] ?? emptyMemory();
  const next: HostessMemory = {
    ...cur,
    games: cur.games + 1,
    wins: cur.wins + (r.hostessWon ? 1 : 0),
    losses: cur.losses + (r.hostessWon ? 0 : 1),
    lastPlayedAt: Date.now(),
    avgDurationMs:
      typeof r.durationMs === "number" && r.durationMs > 0
        ? Math.round(cur.avgDurationMs * (1 - EMA_ALPHA) + r.durationMs * EMA_ALPHA)
        : cur.avgDurationMs,
  };
  if (typeof r.playerBluffRate === "number") {
    next.playerBluff = ema(cur.playerBluff, clamp01(r.playerBluffRate));
    next.observations += 1;
  }
  if (typeof r.playerAggressionRate === "number") {
    next.playerAggression = ema(cur.playerAggression, clamp01(r.playerAggressionRate));
  }
  if (typeof r.playerPatienceRate === "number") {
    next.playerPatience = ema(cur.playerPatience, clamp01(r.playerPatienceRate));
  }
  store[hostessId] = next;
  saveStore(store);
}

export function resetHostessLearning(hostessId?: string): void {
  const store = loadStore();
  if (hostessId) {
    delete store[hostessId];
  } else {
    for (const k of Object.keys(store)) delete store[k];
  }
  saveStore(store);
}

export function listAllHostessMemory(): Array<[string, HostessMemory]> {
  const store = loadStore();
  return Object.entries(store).sort(([a], [b]) => a.localeCompare(b));
}

export function adaptProfile(base: HostessAiProfile, hostessId: string): HostessAiProfile {
  const mem = getHostessMemory(hostessId);
  if (mem.games < WARMUP_GAMES) return base;

  const lossRate = mem.losses / Math.max(1, mem.games);
  const skillPressure = clamp01((lossRate - 0.4) * 1.5) * Math.min(1, mem.games / 15);
  const dSkill = MAX_DELTA.skill * skillPressure;

  const bluffSignal = clamp01((mem.playerBluff - 0.4) * 2);
  const dMemory = MAX_DELTA.memory * bluffSignal;
  const dAggFromBluff = MAX_DELTA.aggression * 0.5 * bluffSignal;

  const aggSignal = clamp01((mem.playerAggression - 0.5) * 2);
  const dPatience = MAX_DELTA.patience * aggSignal;

  const passiveSignal = clamp01((0.4 - mem.playerAggression) * 2);
  const dAggFromPassive = MAX_DELTA.aggression * 0.7 * passiveSignal;

  const gullible = clamp01(mem.playerPatience - 0.5) * (1 - mem.playerBluff);
  const dBluff = MAX_DELTA.bluff * gullible;

  return {
    ...base,
    skill: clamp01(base.skill + dSkill),
    aggression: clamp01(base.aggression + dAggFromBluff + dAggFromPassive),
    bluff: clamp01(base.bluff + dBluff),
    patience: clamp01(base.patience + dPatience),
    memory: clamp01(base.memory + dMemory),
  };
}

function ema(prev: number, sample: number): number {
  return prev * (1 - EMA_ALPHA) + sample * EMA_ALPHA;
}
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
