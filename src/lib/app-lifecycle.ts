/**
 * Ciclo de vida de la app (Android).
 *
 * Android puede mandar la app a segundo plano en cualquier momento (llamada,
 * notificación, botón home) y matar el proceso sin aviso. Una app seria tiene
 * que:
 *   1. pausar partida, temporizadores y animaciones al perder el foco,
 *   2. reanudar exactamente donde estaba al volver,
 *   3. dejar el progreso guardado antes de irse.
 *
 * Este módulo centraliza esa señal en un único evento para que cualquier sala
 * pueda suscribirse sin conocer Capacitor.
 */

export const APP_PAUSE_EVENT = "cuervo:app-pause";
export const APP_RESUME_EVENT = "cuervo:app-resume";

let installed = false;
let paused = false;

/** ¿La app está en segundo plano (o la pestaña oculta)? */
export function isAppPaused(): boolean {
  return paused;
}

function setPaused(next: boolean) {
  if (next === paused) return;
  paused = next;
  if (typeof document !== "undefined") {
    if (next) document.body.dataset.appPaused = "1";
    else delete document.body.dataset.appPaused;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(next ? APP_PAUSE_EVENT : APP_RESUME_EVENT));
  }
}

/** Suscripción simple; devuelve la función de limpieza. */
export function onAppPauseChange(cb: (paused: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onPause = () => cb(true);
  const onResume = () => cb(false);
  window.addEventListener(APP_PAUSE_EVENT, onPause);
  window.addEventListener(APP_RESUME_EVENT, onResume);
  return () => {
    window.removeEventListener(APP_PAUSE_EVENT, onPause);
    window.removeEventListener(APP_RESUME_EVENT, onResume);
  };
}

/** Notifica desde el puente nativo (`appStateChange`). */
export function reportNativeAppState(isActive: boolean) {
  setPaused(!isActive);
}

export function installAppLifecycle(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;

  // Fallback web / WebView: visibilidad del documento.
  document.addEventListener("visibilitychange", () => {
    setPaused(document.hidden);
  });
  window.addEventListener("blur", () => {
    if (document.hidden) setPaused(true);
  });
  window.addEventListener("pagehide", () => setPaused(true));
  window.addEventListener("pageshow", () => setPaused(false));
}
