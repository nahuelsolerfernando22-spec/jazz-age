export type PerfTier = "low" | "mid" | "high";

interface NavigatorWithMem extends Navigator {
  deviceMemory?: number;
}

interface WindowWithCapacitor extends Window {
  Capacitor?: { isNativePlatform?: () => boolean };
}

export function isNativeAndroidApp(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const cap = (window as WindowWithCapacitor).Capacitor;
  const native = typeof cap !== "undefined" && cap.isNativePlatform?.() === true;
  const ua = navigator.userAgent || "";
  const android = /Android/i.test(ua);
  const webView = /; wv\)|\bwv\b|Version\/\d+(?:\.\d+)? Chrome\//i.test(ua);
  const localAndroidRuntime =
    window.location.hostname === "localhost" || window.location.protocol === "capacitor:";
  return android && (native || webView || localAndroidRuntime);
}

function detect(): PerfTier {
  if (typeof navigator === "undefined") return "high";
  const nav = navigator as NavigatorWithMem;
  const mem = typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
  const cores = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : undefined;
  const isAndroid = /Android/i.test(nav.userAgent || "");

  // APK real: priorizamos estabilidad de WebView/GPU sobre brillo visual.
  // Slots y Mahjong usan muchas texturas; forzarlos a low evita filtros,
  // blur, 3D y preloads agresivos que en dispositivos Android causan cuadros negros.
  if (isNativeAndroidApp()) return "low";
  if ((mem !== undefined && mem <= 3) || (cores !== undefined && cores <= 4)) return "low";
  if (isAndroid && mem === undefined && cores === undefined) return "mid";
  if (isAndroid && mem !== undefined && mem <= 6) return "mid";
  return "high";
}

let cached: PerfTier | null = null;

export function getPerfTier(): PerfTier {
  if (cached) return cached;
  cached = detect();
  return cached;
}

export function installPerfTier(): PerfTier {
  const tier = getPerfTier();
  if (typeof document !== "undefined") {
    try {
      document.documentElement.setAttribute("data-perf", tier);
    } catch {}
  }
  return tier;
}

export function isLowEnd(): boolean {
  return getPerfTier() === "low";
}
