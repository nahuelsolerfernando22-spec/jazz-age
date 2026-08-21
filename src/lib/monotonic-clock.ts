const KEY = "mono-clock:v1";
const FORWARD_JUMP_THRESHOLD_MS = 25 * 60 * 60 * 1000;

interface Persisted {
  lastSeen: number;
  lastWall: number;
}

let cached: Persisted | null = null;

function load(): Persisted {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      if (typeof p.lastSeen === "number" && typeof p.lastWall === "number") {
        cached = p;
        return p;
      }
    }
  } catch {}
  const fresh = { lastSeen: 0, lastWall: 0 };
  cached = fresh;
  return fresh;
}

function save(p: Persisted) {
  cached = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function monoNow(): number {
  const wall = Date.now();
  const p = load();
  const next = Math.max(wall, p.lastSeen + 1);
  save({ lastSeen: next, lastWall: wall });
  return next;
}

export function detectForwardJump(): boolean {
  const wall = Date.now();
  const p = load();
  if (p.lastWall === 0) return false;
  return wall - p.lastWall > FORWARD_JUMP_THRESHOLD_MS;
}
