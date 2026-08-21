import { suspendMusic, resumeMusicIfEnabled } from "@/lib/background-music";
import { installLowPower } from "@/lib/low-power";
import { installSyncQueue, drainSyncQueue } from "@/lib/sync-queue";
import { installPauseOnBackground } from "@/lib/pause-on-background";
import { installAppLifecycle, onAppPauseChange, reportNativeAppState } from "@/lib/app-lifecycle";

let installed = false;
let visibilityBound = false;
let splashHidden = false;

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return !!w.Capacitor?.isNativePlatform?.();
}

function bindVisibilityFallback() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) suspendMusic();
    else resumeMusicIfEnabled();
  });
  window.addEventListener("pagehide", suspendMusic);
  window.addEventListener("pageshow", resumeMusicIfEnabled);
}

export async function hideNativeSplash(): Promise<void> {
  if (splashHidden || !isNative()) return;
  splashHidden = true;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 240 });
  } catch {
    /* noop */
  }
}

/**
 * El juego es vertical, punto. El horizontal quedaba mal en todas las mesas,
 * así que se bloquea portrait en cualquier dispositivo (teléfono o tablet).
 */
async function applyOrientationPolicy(): Promise<void> {
  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.lock({ orientation: "portrait" });
  } catch (err) {
    console.error("[native-bridge] orientation", err);
  }
}

export async function installNativeBridge(): Promise<void> {
  if (installed) return;
  installed = true;
  bindVisibilityFallback();
  installLowPower();
  installAppLifecycle();
  installSyncQueue();
  installPauseOnBackground();
  // Android puede tener la app abierta días: al volver del segundo plano hay
  // que cerrar las jornadas de liga y torneos que hayan vencido mientras tanto.
  onAppPauseChange((paused) => {
    if (paused) return;
    void import("@/store/league-progress").then((m) => {
      m.useLeagueProgress.getState().resolveStaleDays();
    });
    void import("@/lib/daily-tournament").then((m) => {
      m.resolveOfflineTourneyWeeks();
    });
    // Lo que no se pudo publicar sin red se reintenta al volver.
    void drainSyncQueue();
  });
  if (!isNative()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0d0906" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.error("[native-bridge] status-bar", err);
  }

  await applyOrientationPolicy();
  // Split-screen y plegables pueden cambiar el tamaño en caliente.
  window.addEventListener("resize", () => {
    void applyOrientationPolicy();
  });

  if (typeof window !== "undefined") {
    window.addEventListener(
      "cuervo:hub-ready",
      () => {
        void hideNativeSplash();
      },
      { once: true },
    );
    // Red de seguridad: nunca dejamos el splash colgado.
    setTimeout(() => {
      void hideNativeSplash();
    }, 4000);
  }

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("appStateChange", ({ isActive }) => {
      reportNativeAppState(isActive);
      if (isActive) resumeMusicIfEnabled();
      else suspendMusic();
    });
  } catch (err) {
    console.error("[native-bridge] app-state", err);
  }

  try {
    const { KeepAwake } = await import("@capacitor-community/keep-awake");
    await KeepAwake.keepAwake();
  } catch {
    /* opcional */
  }
}
