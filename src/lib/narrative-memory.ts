export type MomentType =
  | "big_win"
  | "big_loss"
  | "clutch"
  | "bluff_caught"
  | "bluff_landed"
  | "streak"
  | "gift"
  | "insult"
  | "confession"
  | "reunion"
  | "first_meeting"
  | "betrayal";

export interface Moment {
  type: MomentType;
  at: number;
  note?: string;
}

const KEY = "narrative-memory:v1";
const BUFFER_SIZE = 12;

type Store = Record<string, Moment[]>;

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) ?? {}) : {};
  } catch {
    return {};
  }
}

function save(s: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function pushMoment(hostessId: string, type: MomentType, note?: string): void {
  if (!hostessId) return;
  const store = load();
  const list = store[hostessId] ?? [];
  list.push({ type, at: Date.now(), note: note?.slice(0, 80) });
  while (list.length > BUFFER_SIZE) list.shift();
  store[hostessId] = list;
  save(store);
}

export function getMoments(hostessId: string): Moment[] {
  return load()[hostessId] ?? [];
}

export function recallMoment(hostessId: string, type: MomentType): Moment | null {
  const list = getMoments(hostessId);
  for (let i = list.length - 1; i >= 0; i--) if (list[i].type === type) return list[i];
  return null;
}

export function hadRecent(hostessId: string, type: MomentType, days = 3): boolean {
  const m = recallMoment(hostessId, type);
  if (!m) return false;
  return Date.now() - m.at < days * 86400_000;
}

export function isFirstMeeting(hostessId: string): boolean {
  return getMoments(hostessId).length === 0;
}

export function daysSinceLastMoment(hostessId: string): number | null {
  const list = getMoments(hostessId);
  if (!list.length) return null;
  return Math.floor((Date.now() - list[list.length - 1].at) / 86400_000);
}

export function clearMemory(hostessId?: string): void {
  if (!hostessId) {
    save({});
    return;
  }
  const s = load();
  delete s[hostessId];
  save(s);
}
