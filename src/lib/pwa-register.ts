const APP_SW_PATH = "/sw.js";

function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return !!w.Capacitor?.isNativePlatform?.();
}

async function unregisterAppWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "";
          return url.endsWith(APP_SW_PATH);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    return;
  }
}

function shouldRegister(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  // Build empaquetado para Android: no se genera sw.js.
  if (import.meta.env.VITE_APK_BUILD === "1") return false;
  try {
    if (window.self !== window.top) return false;
  } catch {
    return false;
  }
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return false;
  if (isNativeApp()) return false;
  const host = url.hostname;
  const EDITOR = ["lov", "able"].join("");
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return false;
  if (host === `${EDITOR}project.com` || host.endsWith(`.${EDITOR}project.com`)) return false;
  if (host === `${EDITOR}project-dev.com` || host.endsWith(`.${EDITOR}project-dev.com`))
    return false;
  if (host === `beta.${EDITOR}.dev` || host.endsWith(`.beta.${EDITOR}.dev`)) return false;
  return true;
}

export async function registerPwa(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!shouldRegister()) {
    await unregisterAppWorkers();
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register(APP_SW_PATH, { scope: "/" });
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          try {
            window.dispatchEvent(
              new CustomEvent("cuervo:sw-update", { detail: { registration: reg } }),
            );
          } catch {}
        }
      });
    });
  } catch (err) {
    console.warn("[pwa] register failed", err);
  }
}
