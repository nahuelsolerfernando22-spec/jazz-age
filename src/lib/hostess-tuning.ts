import type { HostessAiProfile } from "./hostess-ai";
import { getHostessAiProfile } from "./hostess-ai";
import { adaptProfile, getHostessMemory } from "./hostess-learning";
import { applyMood, getMood } from "./hostess-mood";
import { getHostessPlaystyle } from "./hostess-playstyle";

export type Axis = "skill" | "aggression" | "bluff" | "patience" | "memory";
export type TuningBias = Partial<Record<Axis, number>>;

const STORAGE_KEY = "hostess-tuning:v1";
const MAX_BIAS = 0.3;

function loadTuning(): Record<string, TuningBias> {
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

function saveTuning(t: Record<string, TuningBias>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {}
}

export function getHostessTuning(id: string): TuningBias {
  return loadTuning()[id] ?? {};
}

export function setHostessTuning(id: string, patch: TuningBias): void {
  const store = loadTuning();
  const cur = store[id] ?? {};
  const merged: TuningBias = { ...cur };
  for (const k of Object.keys(patch) as Axis[]) {
    const v = patch[k];
    if (typeof v === "number") merged[k] = clamp(v, -MAX_BIAS, MAX_BIAS);
  }
  store[id] = merged;
  saveTuning(store);
}

export function resetHostessTuning(id?: string): void {
  const store = loadTuning();
  if (id) delete store[id];
  else for (const k of Object.keys(store)) delete store[k];
  saveTuning(store);
}

function applyTuning(base: HostessAiProfile, id: string): HostessAiProfile {
  const t = getHostessTuning(id);
  return {
    ...base,
    skill: clamp01(base.skill + (t.skill ?? 0)),
    aggression: clamp01(base.aggression + (t.aggression ?? 0)),
    bluff: clamp01(base.bluff + (t.bluff ?? 0)),
    patience: clamp01(base.patience + (t.patience ?? 0)),
    memory: clamp01(base.memory + (t.memory ?? 0)),
  };
}

function applyInfiniteRamp(p: HostessAiProfile, id: string): HostessAiProfile {
  const mem = getHostessMemory(id);
  const g = mem.games;

  const easeEarly = 0.015 * Math.min(g, 12);

  const steepLate = 0.11 * Math.log1p(Math.max(0, g - 12) / 6);

  const playerWinrate = g > 0 ? mem.losses / g : 0;
  const perfWeight = Math.min(1, g / 8);
  const perfBoost = clamp01((playerWinrate - 0.5) * 2) * perfWeight;
  const skillRamp = easeEarly + steepLate + 0.15 * perfBoost;
  const memRamp = easeEarly * 0.75 + steepLate * 0.6 + 0.1 * perfBoost;
  const aggRamp = easeEarly * 0.5 + steepLate * 0.4 + 0.08 * perfBoost;
  return {
    ...p,
    skill: clamp01(p.skill + skillRamp),
    memory: clamp01(p.memory + memRamp),
    aggression: clamp01(p.aggression + aggRamp),
  };
}

function applyRevengeMode(p: HostessAiProfile, id: string): HostessAiProfile {
  const mem = getHostessMemory(id);
  if (mem.games < 4) return p;
  const playerWinrate = mem.losses / Math.max(1, mem.games);
  const tooFast = mem.avgDurationMs > 0 && mem.avgDurationMs < 60_000;
  if (playerWinrate > 0.7 && tooFast) {
    return {
      ...p,
      skill: clamp01(p.skill + 0.15),
      memory: clamp01(p.memory + 0.1),
      patience: clamp01(p.patience - 0.1),
    };
  }
  return p;
}

function applyCrossRepBoost(p: HostessAiProfile, id: string): HostessAiProfile {
  if (typeof window === "undefined") return p;
  try {
    const raw = window.sessionStorage.getItem("cross-rep:pending:v1");
    if (!raw) return p;
    const store = JSON.parse(raw) as Record<string, Array<{ kind: string }>>;
    const events = store[id] ?? [];
    const wins = events.filter((e) => e.kind === "win" || e.kind === "streak").length;
    if (wins === 0) return p;
    const boost = Math.min(0.12, wins * 0.04);
    return {
      ...p,
      skill: clamp01(p.skill + boost),
      aggression: clamp01(p.aggression + boost * 0.5),
    };
  } catch {
    return p;
  }
}

export function getEffectiveProfile(id: string): HostessAiProfile {
  const base = getHostessAiProfile(id);
  const tuned = applyTuning(base, id);
  const adapted = adaptProfile(tuned, id);
  const ramped = applyInfiniteRamp(adapted, id);
  const revenge = applyRevengeMode(ramped, id);
  const withRep = applyCrossRepBoost(revenge, id);
  return applyMood(withRep, getMood(id));
}

export { getHostessPlaystyle };

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}
function clamp01(x: number): number {
  return clamp(x, 0, 1);
}
