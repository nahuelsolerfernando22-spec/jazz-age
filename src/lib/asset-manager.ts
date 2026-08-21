import { getPerfTier, isNativeAndroidApp } from "@/lib/perf-tier";

type FetchPriority = "high" | "low" | "auto";

type WarmOptions = {
  timeoutMs?: number;
  priority?: number;
  fetchPriority?: FetchPriority;
  decoding?: "sync" | "async" | "auto";
  retain?: boolean;
};

type QueueItem = Required<Omit<WarmOptions, "retain">> & {
  src: string;
  retain: boolean;
  resolve: (ok: boolean) => void;
};

const retainedImages = new Map<string, HTMLImageElement>();
const inflight = new Map<string, Promise<boolean>>();
const queue: QueueItem[] = [];
let active = 0;
let visibilityBound = false;

function concurrency(): number {
  if (typeof window === "undefined") return 1;
  if (isNativeAndroidApp()) return 1;
  const tier = getPerfTier();
  return tier === "high" ? 3 : tier === "mid" ? 2 : 1;
}

function bindVisibilityDrain() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") drainQueue();
  });
}

function canStartWork(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}

function decodeImage(item: QueueItem): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !item.src) {
      resolve(true);
      return;
    }

    let done = false;
    const img = new Image();
    img.decoding = item.decoding;
    img.loading = "eager";
    img.fetchPriority = item.fetchPriority as never;

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      if (!item.retain) img.src = "";
    };
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      if (ok && item.retain) retainedImages.set(item.src, img);
      else cleanup();
      resolve(ok);
    };

    const timer = window.setTimeout(() => finish(false), item.timeoutMs);
    img.onload = () => {
      const decoder = img.decode?.();
      if (decoder && typeof decoder.then === "function") {
        decoder.then(() => finish(img.naturalWidth > 0)).catch(() => finish(img.naturalWidth > 0));
      } else {
        finish(img.naturalWidth > 0);
      }
    };
    img.onerror = () => finish(false);
    img.src = item.src;
    if (img.complete) finish(img.naturalWidth > 0);
  });
}

function drainQueue() {
  if (!canStartWork()) return;
  while (active < concurrency() && queue.length > 0) {
    queue.sort((a, b) => a.priority - b.priority);
    const item = queue.shift();
    if (!item) return;
    active += 1;
    void decodeImage(item)
      .then(item.resolve)
      .finally(() => {
        active = Math.max(0, active - 1);
        drainQueue();
      });
  }
}

export function warmImage(src: string, options: WarmOptions = {}): Promise<boolean> {
  if (typeof window === "undefined" || !src) return Promise.resolve(true);
  const priority = options.priority ?? 5;
  // Android APK: no forzamos decode masivo de assets de juego. El WebView ya
  // carga los fondos visibles; pre-decodificar decenas de símbolos/spritesheets
  // aumenta presión de GPU y puede disparar cuadros negros.
  if (isNativeAndroidApp() && priority > 0 && options.retain !== true) return Promise.resolve(true);
  bindVisibilityDrain();
  if (retainedImages.has(src)) return Promise.resolve(true);
  const existing = inflight.get(src);
  if (existing) return existing;

  const promise = new Promise<boolean>((resolve) => {
    const item: QueueItem = {
      src,
      timeoutMs: options.timeoutMs ?? 2600,
      priority,
      fetchPriority: options.fetchPriority ?? "auto",
      decoding: options.decoding ?? "async",
      retain: options.retain ?? false,
      resolve,
    };
    queue.push(item);
    drainQueue();
  }).finally(() => inflight.delete(src));

  inflight.set(src, promise);
  return promise;
}

export async function warmImages(
  srcs: readonly string[],
  options: WarmOptions = {},
): Promise<boolean> {
  if (srcs.length === 0) return true;
  const results = await Promise.all(srcs.map((src) => warmImage(src, options)));
  return results.every(Boolean);
}

export function releaseWarmedImages(match?: (src: string) => boolean): void {
  for (const [src, img] of retainedImages) {
    if (match && !match(src)) continue;
    img.onload = null;
    img.onerror = null;
    img.src = "";
    retainedImages.delete(src);
  }
}

export function reviveBrokenImages(selector: string): void {
  if (typeof document === "undefined") return;
  if (isNativeAndroidApp()) return;
  requestAnimationFrame(() => {
    document.querySelectorAll<HTMLImageElement>(selector).forEach((img) => {
      if (img.naturalWidth > 0 && img.complete) return;
      const src = img.currentSrc || img.src;
      if (!src) return;
      img.src = "";
      requestAnimationFrame(() => {
        img.dataset.retried = "0";
        img.src = src;
      });
    });
  });
}
