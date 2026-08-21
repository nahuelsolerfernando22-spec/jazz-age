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

export function findCardArt(card: { suit: string; rank: number | string } | string): string {
  const stem = typeof card === "string" ? card : `${card.suit}-${card.rank}`;
  return BY_STEM[stem] || BY_STEM["card-back"] || "";
}

export function cardArt(card: { suit: string; rank: number | string }): string {
  const stem = `${card.suit}-${card.rank}`;
  return BY_STEM[stem] || BY_STEM["card-back"] || "";
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
