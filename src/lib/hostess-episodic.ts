const KEY = "hostess-episodic:v1";
const BUFFER_SIZE = 12;

export interface Episode {
  tag: string;
  outcome?: "win" | "loss" | "neutral";
  at: number;
}

type Store = Record<string, Episode[]>;

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) ?? {};
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

export function pushEpisode(hostessId: string, ep: Omit<Episode, "at">): void {
  if (!hostessId || !ep.tag) return;
  const store = load();
  const list = store[hostessId] ?? [];
  list.push({ ...ep, at: Date.now() });
  while (list.length > BUFFER_SIZE) list.shift();
  store[hostessId] = list;
  save(store);
}

export function getEpisodes(hostessId: string): Episode[] {
  return load()[hostessId] ?? [];
}

export function countTag(hostessId: string, tag: string): number {
  return getEpisodes(hostessId).filter((e) => e.tag === tag).length;
}

export function dominantPattern(hostessId: string): { tag: string; ratio: number } | null {
  const eps = getEpisodes(hostessId);
  if (eps.length < 4) return null;
  const counts = new Map<string, number>();
  for (const e of eps) counts.set(e.tag, (counts.get(e.tag) ?? 0) + 1);
  let best: [string, number] | null = null;
  for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
  if (!best) return null;
  const ratio = best[1] / eps.length;
  return ratio >= 0.4 ? { tag: best[0], ratio } : null;
}

export function resetEpisodes(hostessId?: string): void {
  const s = load();
  if (hostessId) delete s[hostessId];
  else for (const k of Object.keys(s)) delete s[k];
  save(s);
}
