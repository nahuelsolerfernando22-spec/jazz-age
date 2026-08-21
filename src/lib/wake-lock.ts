let nativeKeepAwakeMod: typeof import("@capacitor-community/keep-awake") | null = null;
let webLock: WakeLockSentinel | null = null;
let refCount = 0;

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return !!w.Capacitor?.isNativePlatform?.();
}

async function loadNative() {
  if (nativeKeepAwakeMod) return nativeKeepAwakeMod;
  try {
    nativeKeepAwakeMod = await import("@capacitor-community/keep-awake");
    return nativeKeepAwakeMod;
  } catch {
    return null;
  }
}

interface WakeLockSentinel {
  released: boolean;
  release: () => Promise<void>;
}

async function acquire() {
  if (isNative()) {
    const mod = await loadNative();
    if (mod) {
      try {
        await mod.KeepAwake.keepAwake();
      } catch {
        /* noop */
      }
    }
    return;
  }
  if (typeof navigator === "undefined") return;
  const wl = (
    navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockSentinel> } }
  ).wakeLock;
  if (!wl) return;
  try {
    webLock = await wl.request("screen");
  } catch {
    /* noop */
  }
}

async function releaseAll() {
  if (isNative()) {
    const mod = await loadNative();
    if (mod) {
      try {
        await mod.KeepAwake.allowSleep();
      } catch {
        /* noop */
      }
    }
    return;
  }
  if (webLock && !webLock.released) {
    try {
      await webLock.release();
    } catch {
      /* noop */
    }
  }
  webLock = null;
}

export async function acquireWakeLock() {
  refCount += 1;
  if (refCount === 1) await acquire();
}

export async function releaseWakeLock() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) await releaseAll();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && refCount > 0) void acquire();
  });
}
