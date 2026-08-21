const KEY = "cuervo:room-plays:v1";
const MAX_ROOMS = 12;

type Counts = Record<string, number>;

function read(): Counts {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Counts;
    return {};
  } catch {
    return {};
  }
}

function write(counts: Counts) {
  if (typeof window === "undefined") return;
  const trimmed: Counts = {};
  for (const [k, v] of Object.entries(counts)) {
    if (typeof v === "number" && v > 0) trimmed[k] = v;
  }
  const top = Object.entries(trimmed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ROOMS);
  const out: Counts = Object.fromEntries(top);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    /* noop */
  }
}

export function trackRoomVisit(route: string) {
  if (!route) return;
  const slug = route.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!slug || slug.length < 3) return;
  const counts = read();
  counts[slug] = (counts[slug] ?? 0) + 1;
  write(counts);
}

export function topRoomSlugs(limit = 3): string[] {
  return Object.entries(read())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);
}
