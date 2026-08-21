import type { SingleCategory, SingleGame } from "./single-games";

export interface CoverArt {
  from: string;
  via: string;
  to: string;
  accent: string;
  glyph: string;
  pattern: string;
}

const BASE: Record<SingleCategory, Omit<CoverArt, "glyph">> = {
  naipes: {
    from: "#3a0f14",
    via: "#7a1f24",
    to: "#c9a84c",
    accent: "#f6d989",
    pattern: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 14px)",
  },
  dados: {
    from: "#3a1a05",
    via: "#8a4213",
    to: "#f0b64a",
    accent: "#ffe0a3",
    pattern:
      "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.18) 0 3px, transparent 4px), radial-gradient(circle at 70% 65%, rgba(0,0,0,0.25) 0 3px, transparent 4px)",
  },
  azar: {
    from: "#1a0730",
    via: "#4a1370",
    to: "#c94c9c",
    accent: "#ffb4e2",
    pattern: "conic-gradient(from 200deg at 80% 20%, rgba(255,255,255,0.14), transparent 40%)",
  },
  puntaje: {
    from: "#0a1636",
    via: "#1e3b7a",
    to: "#7fa8ff",
    accent: "#d0e0ff",
    pattern:
      "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25) 0 2px, transparent 3px), radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0 1px, transparent 2px)",
  },
  meta: {
    from: "#0a1a0f",
    via: "#1a3d24",
    to: "#c9a84c",
    accent: "#f4d97a",
    pattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 12px)",
  },
};

const OVERRIDES: Record<string, Partial<CoverArt> & { glyph: string }> = {
  blackjack: { glyph: "21", from: "#0f2b1c", via: "#1e5638", to: "#c9a84c" },
  chinchon: { glyph: "7", from: "#3a1010", via: "#8a1c1c", to: "#f0b64a" },
  truco: { glyph: "★", from: "#1a2b0a", via: "#3a5a12", to: "#f0b64a" },
  mahjong: { glyph: "麻", from: "#0d2b1a", via: "#1e4a32", to: "#c9a84c" },

  dados: { glyph: "⚄", from: "#2b1405", via: "#7a3b0d", to: "#f0b64a" },

  mentirosos: { glyph: "⚃", from: "#2b0a0a", via: "#6b1a1a", to: "#f0b64a" },

  ruleta: { glyph: "◉", from: "#2b0a14", via: "#7a1230", to: "#f0b64a" },
  slots: { glyph: "7", from: "#1a0730", via: "#5a1470", to: "#f0b64a" },
  bagatelle: { glyph: "◦", from: "#0a1a30", via: "#1e3a7a", to: "#c94c9c" },

  solitario: { glyph: "♣", from: "#0a2036", via: "#1e4a7a", to: "#d0e0ff" },
  sindicato: { glyph: "☤", from: "#0a1a0f", via: "#1a3d24", to: "#c9a84c" },
  monte: { glyph: "M", from: "#2b0a24", via: "#5a1447", to: "#c9a84c" },
  poker: { glyph: "♠", from: "#07160f", via: "#12402c", to: "#e8c987" },
  sudoku: { glyph: "9", from: "#101026", via: "#26265a", to: "#e8c987" },
};

const ALGO_VERSION = 3;
const LS_KEY = `single:cover-art:v${ALGO_VERSION}`;
const LS_PREFIX = "single:cover-art:v";
const LRU_CAP = 64;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface Entry {
  art: CoverArt;
  t: number;
}

const CACHE = new Map<string, Entry>();
const isBrowser = typeof window !== "undefined";
let hydrated = false;
let dirty = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function purgeOldVersions() {
  if (!isBrowser) return;
  try {
    const ls = window.localStorage;
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i);
      if (k && k.startsWith(LS_PREFIX) && k !== LS_KEY) ls.removeItem(k);
    }
  } catch {}
}

function hydrateFromStorage() {
  if (hydrated || !isBrowser) return;
  hydrated = true;
  purgeOldVersions();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, Entry>;
    const now = Date.now();
    for (const [id, e] of Object.entries(parsed)) {
      if (!e || typeof e !== "object") continue;
      const art = (e as Entry).art;
      const t = (e as Entry).t;
      if (!art || typeof art.glyph !== "string") continue;
      if (typeof t !== "number" || now - t > TTL_MS) continue;
      CACHE.set(id, { art, t });
    }
  } catch {}
}

function scheduleFlush() {
  if (!isBrowser || !dirty || flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    if (!dirty) return;
    dirty = false;
    try {
      const obj: Record<string, Entry> = {};
      for (const [id, e] of CACHE) obj[id] = e;
      window.localStorage.setItem(LS_KEY, JSON.stringify(obj));
    } catch {
      try {
        const half = Math.floor(CACHE.size / 2);
        let dropped = 0;
        for (const id of CACHE.keys()) {
          if (dropped >= half) break;
          CACHE.delete(id);
          dropped++;
        }
        const obj: Record<string, Entry> = {};
        for (const [id, e] of CACHE) obj[id] = e;
        window.localStorage.setItem(LS_KEY, JSON.stringify(obj));
      } catch {}
    }
  }, 250);
}

function touch(id: string, entry: Entry) {
  CACHE.delete(id);
  CACHE.set(id, entry);
  if (CACHE.size > LRU_CAP) {
    const oldest = CACHE.keys().next().value;
    if (oldest) CACHE.delete(oldest);
  }
}

export function coverArtFor(g: Pick<SingleGame, "id" | "category">): CoverArt {
  hydrateFromStorage();
  const hit = CACHE.get(g.id);
  if (hit) {
    if (CACHE.size > LRU_CAP / 2) touch(g.id, hit);
    return hit.art;
  }
  const base = BASE[g.category];
  const ov = OVERRIDES[g.id];
  const art: CoverArt = {
    from: ov?.from ?? base.from,
    via: ov?.via ?? base.via,
    to: ov?.to ?? base.to,
    accent: ov?.accent ?? base.accent,
    pattern: ov?.pattern ?? base.pattern,
    glyph: ov?.glyph ?? "◆",
  };
  touch(g.id, { art, t: Date.now() });
  dirty = true;
  scheduleFlush();
  return art;
}

export function warmCoverArtCache(games: Array<Pick<SingleGame, "id" | "category">>) {
  hydrateFromStorage();
  const run = () => {
    for (const g of games) coverArtFor(g);
  };
  if (!isBrowser) return run();
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") ric(run, { timeout: 400 });
  else setTimeout(run, 0);
}

export function coverBackground(art: CoverArt): string {
  return `linear-gradient(135deg, ${art.from} 0%, ${art.via} 55%, ${art.to} 130%)`;
}

export function coverBannerBackground(art: CoverArt): string {
  return `linear-gradient(115deg, ${art.from} 0%, ${art.via} 40%, #0b1512 85%), radial-gradient(circle at 88% 22%, ${art.to} 0%, transparent 55%)`;
}
