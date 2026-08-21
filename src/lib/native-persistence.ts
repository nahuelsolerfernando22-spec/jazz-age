const KEY_PREFIXES = [
  "cuervo:",
  "cuervo-",
  "cd:",
  "slots:",
  "truco:",
  "mahjong:",
  "solitario:",
  "speakeasy",
  "hostess-",
  "login-streak",
  "mahjong-album",
  "casino-",
  "collectibles:",
];

const EXTRA_KEYS = new Set<string>(["speakeasy-music-on", "speakeasy-muted"]);

const SNAPSHOT_KEY = "cuervo:snapshot:v2";
const SNAPSHOT_BAK_KEY = "cuervo:snapshot:v2.bak";

let installed = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let mirrorRunning = false;
let mirrorQueued = false;

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return !!w.Capacitor?.isNativePlatform?.();
}

function shouldMirror(key: string): boolean {
  if (EXTRA_KEYS.has(key)) return true;
  for (const p of KEY_PREFIXES) if (key.startsWith(p)) return true;
  return false;
}

async function getPrefs() {
  const mod = await import("@capacitor/preferences");
  return mod.Preferences;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function collectKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && shouldMirror(k)) keys.push(k);
    }
  } catch {
    /* noop */
  }
  return keys;
}

function buildSnapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of collectKeys()) {
    const v = safeGet(key);
    if (v != null) out[key] = v;
  }
  return out;
}

function applySnapshot(snap: Record<string, string>): number {
  let restored = 0;
  for (const [key, value] of Object.entries(snap)) {
    if (!shouldMirror(key)) continue;
    if (safeGet(key) == null) {
      if (safeSet(key, value)) restored++;
    }
  }
  return restored;
}

const RELOAD_GUARD_KEY = "cuervo:native-restore-reloaded";

async function restoreFromNative(): Promise<number> {
  try {
    const Prefs = await getPrefs();
    const primary = await Prefs.get({ key: SNAPSHOT_KEY });
    const raw = primary.value ?? (await Prefs.get({ key: SNAPSHOT_BAK_KEY })).value;
    if (raw) {
      try {
        const snap = JSON.parse(raw) as Record<string, string>;
        return applySnapshot(snap);
      } catch {
        /* noop */
      }
    }
  } catch (err) {
    console.error("[native-persistence] restore", err);
  }
  return 0;
}

async function mirrorToNative() {
  if (mirrorRunning) {
    mirrorQueued = true;
    return;
  }
  mirrorRunning = true;
  try {
    const Prefs = await getPrefs();
    const snap = JSON.stringify(buildSnapshot());
    const prev = await Prefs.get({ key: SNAPSHOT_KEY });
    if (prev.value && prev.value !== snap) {
      await Prefs.set({ key: SNAPSHOT_BAK_KEY, value: prev.value });
    }
    await Prefs.set({ key: SNAPSHOT_KEY, value: snap });
  } catch (err) {
    console.error("[native-persistence] mirror", err);
  } finally {
    mirrorRunning = false;
    if (mirrorQueued) {
      mirrorQueued = false;
      void mirrorToNative();
    }
  }
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void mirrorToNative();
  }, 1500);
}

export async function installNativePersistence(): Promise<void> {
  if (installed) return;
  installed = true;
  if (!isNative()) return;

  const restored = await restoreFromNative();

  // Zustand persist stores hydrate synchronously at module import time —

  if (restored > 0 && typeof window !== "undefined") {
    try {
      const already = window.sessionStorage.getItem(RELOAD_GUARD_KEY);
      if (!already) {
        window.sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
        window.location.reload();
        return;
      }
    } catch {
      /* noop */
    }
  }

  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = (key: string, value: string) => {
    try {
      originalSetItem(key, value);
    } catch (err) {
      console.error("[persistence] setItem", err);
      throw err;
    }
    if (shouldMirror(key)) scheduleFlush();
  };
  localStorage.removeItem = (key: string) => {
    try {
      originalRemoveItem(key);
    } catch (err) {
      console.error("[persistence] removeItem", err);
      throw err;
    }
    if (shouldMirror(key)) scheduleFlush();
  };

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) void mirrorToNative();
    });
    App.addListener("pause", () => {
      void mirrorToNative();
    });
  } catch (err) {
    console.error("[native-persistence] listeners", err);
  }

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
      void mirrorToNative();
    });
    window.addEventListener("beforeunload", () => {
      void mirrorToNative();
    });
  }
}
