import { dominantPattern } from "./hostess-episodic";
import { alliesOf } from "./cross-reputation";
import { maybeMintNickname } from "./hostess-nickname";

const INTEL_MAX = 3;

const STORAGE_KEY = "hostess-rivalry:v1";
const HUMILIATION_MARGIN = 0.6;

export interface Rivalry {
  hostessId: string;
  wins: number;
  losses: number;
  humiliations: number;
  lastDefeatTag: string | null;
  signatureMove: string | null;
  intel: string[];
  updatedAt: number;
}

type Store = Record<string, Rivalry>;

function empty(hostessId: string): Rivalry {
  return {
    hostessId,
    wins: 0,
    losses: 0,
    humiliations: 0,
    lastDefeatTag: null,
    signatureMove: null,
    intel: [],
    updatedAt: 0,
  };
}

function load(): Store {
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

function save(s: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function getRivalry(hostessId: string): Rivalry {
  return load()[hostessId] ?? empty(hostessId);
}

export interface BumpArgs {
  hostessWon: boolean;
  margin?: number;
  dominantTag?: string | null;
}

export function bumpRivalry(hostessId: string, args: BumpArgs): void {
  if (!hostessId) return;
  const store = load();
  const cur = store[hostessId] ?? empty(hostessId);
  const margin = clamp01(args.margin ?? 0.3);
  const tag = args.dominantTag ?? null;

  const next: Rivalry = {
    ...cur,
    wins: cur.wins + (args.hostessWon ? 1 : 0),
    losses: cur.losses + (args.hostessWon ? 0 : 1),
    humiliations: cur.humiliations + (margin >= HUMILIATION_MARGIN ? 1 : 0),
    lastDefeatTag: args.hostessWon ? cur.lastDefeatTag : (tag ?? cur.lastDefeatTag),
    signatureMove: args.hostessWon ? (tag ?? cur.signatureMove) : cur.signatureMove,
    updatedAt: Date.now(),
  };
  store[hostessId] = next;

  if (!args.hostessWon && tag) {
    for (const ally of alliesOf(hostessId)) {
      const cA = store[ally] ?? empty(ally);
      if (cA.intel.includes(tag)) continue;
      const nextIntel = [...cA.intel, tag].slice(-INTEL_MAX);
      store[ally] = { ...cA, intel: nextIntel, updatedAt: Date.now() };
    }
  }
  save(store);

  try {
    maybeMintNickname(hostessId);
  } catch {}
}

export function resetRivalry(hostessId?: string): void {
  const s = load();
  if (hostessId) delete s[hostessId];
  else for (const k of Object.keys(s)) delete s[k];
  save(s);
}

export function weaknessOf(hostessId: string): string | null {
  const dom = dominantPattern(hostessId);
  const riv = getRivalry(hostessId);
  if (!dom) {
    return riv.intel[riv.intel.length - 1] ?? null;
  }

  if (riv.intel.includes(dom.tag)) return dom.tag;
  if (riv.losses === 0) return null;
  if (riv.lastDefeatTag && dom.tag === riv.lastDefeatTag) return dom.tag;
  return dom.ratio >= 0.5 ? dom.tag : null;
}

export interface RivalryTrait {
  id: "vengativa" | "estudiosa" | "impredecible" | "curtida";
  label: string;
  modifier: {
    aggressionBoost?: number;
    errorRate?: number;
    bluffChance?: number;
    callBluffMargin?: number;
    thinkingMs?: number;
  };
}

export function traitOf(hostessId: string): RivalryTrait | null {
  const r = getRivalry(hostessId);
  const total = r.wins + r.losses;
  if (total < 3) return null;

  if (r.humiliations >= 3) {
    return {
      id: "vengativa",
      label: "Vengativa",
      modifier: { aggressionBoost: 0.15, callBluffMargin: -0.1, thinkingMs: -80 },
    };
  }
  if (r.losses >= 5 && r.losses > r.wins) {
    return {
      id: "estudiosa",
      label: "Estudiosa",
      modifier: { errorRate: -0.05, callBluffMargin: -0.08 },
    };
  }
  if (r.wins >= 5 && r.wins > r.losses * 2) {
    return {
      id: "curtida",
      label: "Curtida",
      modifier: { aggressionBoost: 0.08, errorRate: -0.03 },
    };
  }
  if (total >= 6 && Math.abs(r.wins - r.losses) <= 1) {
    return {
      id: "impredecible",
      label: "Impredecible",
      modifier: { bluffChance: 0.1, thinkingMs: -40 },
    };
  }
  return null;
}

export function listRivalries(): Rivalry[] {
  const all = Object.values(load());
  return all
    .filter((r) => r.wins + r.losses > 0)
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses));
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
