const WARMED_KEY = "cuervo:offline-warmed:v2";
import { getPerfTier } from "@/lib/perf-tier";
import { getLastRoom } from "@/lib/last-room";
import { topRoomSlugs } from "@/lib/room-plays";

const MAX_BYTES_BY_TIER: Record<string, number> = {
  low: 60 * 1024 * 1024,
  mid: 150 * 1024 * 1024,
  high: 250 * 1024 * 1024,
};
const MAX_BYTES = 250 * 1024 * 1024;

const PRIORITY_PATTERNS: RegExp[] = [
  /map-speakeasy/i,
  /map-camerinos-edificio/i,
  /-portrait/i,
  /icon-/i,
  /loader-/i,
  /corvina-madame/i,
  /^.*\/bg-[a-z]+\.(webp|jpg|png)$/i,
  /^.*\/zone-[a-z0-9-]+\.(webp|jpg|png)$/i,
  /single-hub/i,
  /hostess-loading/i,
  // hostess-error removed

  /bettie-portrait/i,
  // madge removed
  /pilar-scene-idle/i,
  /eulalia-portrait/i,
  /jade-portrait/i,
  /zelda-portrait/i,
  // luciera removed
  /daphne-portrait/i,
  /lola-portrait/i,
  /opal-portrait/i,
  /vita-portrait/i,
];

const BUNDLED_IMAGES = {
  ...import.meta.glob("@/assets/*.{webp,avif}", { eager: true, import: "default" }),
  // El material del juego pendiente (sindicato) no se empaqueta: suma peso y RAM sin usarse.
  ...import.meta.glob(["@/assets/**/*.{webp,avif,jpg,jpeg}", "!@/assets/sindicato/**"], {
    eager: true,
    import: "default",
  }),
} as Record<string, string>;

function lastRoomBoosts(): RegExp[] {
  const slugs = new Set<string>();
  const last = getLastRoom();
  const lastSlug = last?.route?.split("/").filter(Boolean)[0]?.toLowerCase();
  if (lastSlug && lastSlug.length >= 3) slugs.add(lastSlug);
  for (const s of topRoomSlugs(3)) if (s.length >= 3) slugs.add(s);
  if (slugs.size === 0) return [];
  const out: RegExp[] = [];
  for (const slug of slugs) {
    const esc = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out.push(new RegExp(`bg-${esc}`, "i"));
    out.push(new RegExp(`zone-${esc}`, "i"));
    out.push(new RegExp(`${esc}-`, "i"));
  }
  return out;
}

function collectUrls(): { key: string; url: string; priority: number }[] {
  const boosts = lastRoomBoosts();
  const seen = new Set<string>();
  const out: { key: string; url: string; priority: number }[] = [];
  for (const [key, url] of Object.entries(BUNDLED_IMAGES)) {
    if (typeof url !== "string" || seen.has(url)) continue;
    seen.add(url);

    let priority = 2;
    if (boosts.some((rx) => rx.test(key))) priority = 0;
    else if (PRIORITY_PATTERNS.some((rx) => rx.test(key))) priority = 1;
    out.push({ key, url, priority });
  }
  out.sort((a, b) => a.priority - b.priority);
  return out;
}

async function warmOne(url: string): Promise<number> {
  try {
    const res = await fetch(url, { credentials: "omit", mode: "no-cors" });

    const len = Number(res.headers.get("content-length") ?? 0);
    return Number.isFinite(len) && len > 0 ? len : 50 * 1024;
  } catch {
    return 0;
  }
}

async function warmPool(
  items: { url: string }[],
  concurrency = 4,
  budgetBytes = MAX_BYTES,
): Promise<{ warmed: number; bytes: number }> {
  let i = 0;
  let bytes = 0;
  let warmed = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length && bytes < budgetBytes) {
      const idx = i++;
      const size = await warmOne(items[idx].url);
      bytes += size;
      warmed++;
    }
  });
  await Promise.all(workers);
  return { warmed, bytes };
}

export function warmOfflineCache(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!navigator.onLine) return;
  try {
    if (localStorage.getItem(WARMED_KEY) === "1") return;
  } catch {}

  const run = async () => {
    try {
      const nav = navigator as Navigator & {
        storage?: { estimate?: () => Promise<{ quota?: number; usage?: number }> };
      };
      const est = await nav.storage?.estimate?.();
      if (est?.quota && est?.usage != null) {
        const free = est.quota - est.usage;
        if (free < 60 * 1024 * 1024) {
          console.warn(`[warm] skip — solo ${(free / 1024 / 1024).toFixed(0)} MB libres`);
          return;
        }
      }
    } catch {}

    const items = collectUrls();
    if (items.length === 0) return;
    const tier = getPerfTier();
    const budget = MAX_BYTES_BY_TIER[tier] ?? MAX_BYTES;
    const concurrency = tier === "low" ? 2 : 4;
    void warmPool(items, concurrency, budget).then(({ warmed, bytes }) => {
      try {
        localStorage.setItem(WARMED_KEY, "1");
      } catch {}
    });
  };

  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  if (typeof idle === "function") {
    idle(() => void run());
  } else {
    setTimeout(() => void run(), 2000);
  }
}
