import { useSyncExternalStore } from "react";

export type CallbackSource = "moment" | "crosstalk" | "gossip" | "mood" | "dealer" | "custom";

export interface CallbackEntry {
  npcId: string;
  text: string;
  source: CallbackSource;
  priority: number;
  expiresAt: number;
  publishedAt: number;
}

interface PushOpts {
  npcId: string;
  text: string;
  source?: CallbackSource;
  priority?: number;
  ttl?: number;
  cooldown?: number;
}

const DEFAULT_PRIORITY: Record<CallbackSource, number> = {
  crosstalk: 90,
  moment: 80,
  gossip: 70,
  dealer: 50,
  mood: 40,
  custom: 60,
};

const DEFAULT_COOLDOWN: Record<CallbackSource, number> = {
  crosstalk: 30_000,
  moment: 90_000,
  gossip: 30_000,
  dealer: 8_000,
  mood: 20_000,
  custom: 15_000,
};

const DEFAULT_TTL = 5_000;
const MIN_TTL = 1_500;
const MAX_TTL = 12_000;

const active = new Map<string, CallbackEntry>();
const lastBySource = new Map<string, { at: number; text: string }>();
const listeners = new Map<string, Set<() => void>>();

function key(npcId: string, source: CallbackSource): string {
  return `${npcId}::${source}`;
}

function notify(npcId: string): void {
  const set = listeners.get(npcId);
  if (!set) return;
  set.forEach((l) => l());
}

function purgeIfExpired(npcId: string): void {
  const cur = active.get(npcId);
  if (cur && cur.expiresAt <= Date.now()) {
    active.delete(npcId);
    notify(npcId);
  }
}

export function pushNpcCallback(opts: PushOpts): boolean {
  const source = opts.source ?? "custom";
  const priority = opts.priority ?? DEFAULT_PRIORITY[source];
  const ttl = Math.min(MAX_TTL, Math.max(MIN_TTL, opts.ttl ?? DEFAULT_TTL));
  const cooldown = opts.cooldown ?? DEFAULT_COOLDOWN[source];
  const now = Date.now();
  const text = opts.text?.trim();
  if (!text || !opts.npcId) return false;

  const last = lastBySource.get(key(opts.npcId, source));
  if (last && now - last.at < cooldown && last.text === text) return false;

  const cur = active.get(opts.npcId);
  if (cur && cur.expiresAt > now && priority < cur.priority) return false;

  const entry: CallbackEntry = {
    npcId: opts.npcId,
    text,
    source,
    priority,
    expiresAt: now + ttl,
    publishedAt: now,
  };
  active.set(opts.npcId, entry);
  lastBySource.set(key(opts.npcId, source), { at: now, text });
  notify(opts.npcId);

  if (typeof window !== "undefined") {
    window.setTimeout(() => purgeIfExpired(opts.npcId), ttl + 30);
  }
  return true;
}

export function clearNpcCallback(npcId: string): void {
  if (active.delete(npcId)) notify(npcId);
}

export function getNpcCallback(npcId: string): CallbackEntry | null {
  const cur = active.get(npcId);
  if (!cur) return null;
  if (cur.expiresAt <= Date.now()) {
    active.delete(npcId);
    return null;
  }
  return cur;
}

function subscribe(npcId: string, cb: () => void): () => void {
  let set = listeners.get(npcId);
  if (!set) {
    set = new Set();
    listeners.set(npcId, set);
  }
  set.add(cb);
  return () => {
    set!.delete(cb);
    if (set!.size === 0) listeners.delete(npcId);
  };
}

export function useNpcCallback(npcId: string | undefined | null): CallbackEntry | null {
  return useSyncExternalStore(
    (cb) => (npcId ? subscribe(npcId, cb) : () => {}),
    () => (npcId ? getNpcCallback(npcId) : null),
    () => null,
  );
}
