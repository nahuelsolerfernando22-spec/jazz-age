const CARD_ART = import.meta.glob("@/assets/chinchon-v2/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const BY_STEM: Record<string, string> = {};
const ALL_DECK_URLS: string[] = [];

for (const path in CARD_ART) {
  const stem = path.split("/").pop()?.split(".")[0];
  if (stem) {
    BY_STEM[stem] = CARD_ART[path];
    ALL_DECK_URLS.push(CARD_ART[path]);
  }
}


// Las figuras del mazo español llegan como 10/11/12 pero el arte está guardado
// como sota/caballo/rey (y bastos 8/9 sólo existe en su versión "-clean").
// Sin este puente algunas cartas salían con el dorso puesto.
const FIGURE_STEM: Record<string, string> = { "10": "sota", "11": "caballo", "12": "rey" };
function stemFor(suit: string, rank: number | string): string[] {
  const r = String(rank);
  const out = [`${suit}-${r}`];
  const fig = FIGURE_STEM[r];
  if (fig) out.push(`${suit}-${fig}`);
  out.push(`${suit}-${r}-clean`);
  return out;
}
function resolveArt(suit: string, rank: number | string): string {
  for (const s of stemFor(suit, rank)) if (BY_STEM[s]) return BY_STEM[s];
  return BY_STEM["card-back"] || "";
}

export function findCardArt(card: { suit: string; rank: number | string } | string): string {
  if (typeof card === "string") return BY_STEM[card] || BY_STEM["card-back"] || "";
  return resolveArt(card.suit, card.rank);
}

export function cardArt(card: { suit: string; rank: number | string }): string {
  return resolveArt(card.suit, card.rank);
}

async function decodeOne(url: string): Promise<void> {
  if (typeof window === "undefined") return;
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    /* noop */
  }
}

function whenIdle(cb: () => void) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (
      window as Window & { requestIdleCallback: (cb: () => void, o?: { timeout?: number }) => void }
    ).requestIdleCallback(cb, { timeout: 2000 });
  } else {
    setTimeout(cb, 400);
  }
}

export function preloadDeck(concurrency = 4): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const queue = ALL_DECK_URLS.slice();
  return new Promise<void>((resolve) => {
    let active = 0;
    const pump = () => {
      if (queue.length === 0 && active === 0) {
        resolve();
        return;
      }
      while (active < concurrency && queue.length > 0) {
        const url = queue.shift()!;
        active += 1;
        void decodeOne(url).then(() => {
          active -= 1;
          whenIdle(pump);
        });
      }
    };
    whenIdle(pump);
  });
}

export function isSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (
    navigator as unknown as {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;
  if (!c) return false;
  if (c.saveData) return true;
  const et = c.effectiveType ?? "";
  return et === "slow-2g" || et === "2g" || et === "3g";
}

export function prefetchCards(stems: Iterable<string>): Promise<void> {
  const urls: string[] = [];
  for (const stem of stems) {
    const u = BY_STEM[stem];
    if (u) urls.push(u);
  }
  return Promise.all(urls.map(decodeOne)).then(() => undefined);
}
