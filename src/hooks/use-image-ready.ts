import { useEffect, useState } from "react";

export type ImageReadyState = "loading" | "ready" | "failed";

const decoded = new Set<string>();

/**
 * Carga una imagen fuera del árbol y avisa cuando está decodificada.
 *
 * Pensado para el WebView de Android: si el primer intento se corta (el
 * WebView descarta el bitmap al recuperar memoria, o el asset todavía no está
 * montado desde el APK) reintenta con espera creciente en vez de dejar el
 * hueco vacío. Nunca hace peticiones de red extra: el `src` siempre es un
 * asset empaquetado, así que funciona igual sin conexión.
 */
export function useImageReady(
  src: string | null | undefined,
  opts: { retries?: number; timeoutMs?: number } = {},
): ImageReadyState {
  const retries = opts.retries ?? 3;
  const timeoutMs = opts.timeoutMs ?? 6000;
  const [state, setState] = useState<ImageReadyState>(() =>
    src && decoded.has(src) ? "ready" : "loading",
  );

  useEffect(() => {
    if (!src) {
      setState("failed");
      return;
    }
    if (decoded.has(src)) {
      setState("ready");
      return;
    }
    if (typeof window === "undefined") return;

    let cancelled = false;
    let attempt = 0;
    let timer = 0;
    let retryTimer = 0;
    let img: HTMLImageElement | null = null;

    setState("loading");

    const settle = (ok: boolean) => {
      if (cancelled) return;
      window.clearTimeout(timer);
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
      if (ok) {
        decoded.add(src);
        setState("ready");
        return;
      }
      attempt += 1;
      if (attempt > retries) {
        setState("failed");
        return;
      }
      retryTimer = window.setTimeout(attemptLoad, 240 * attempt);
    };

    function attemptLoad() {
      if (cancelled || !src) return;
      img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.onload = () => {
        const el = img;
        if (!el) return;
        const done = () => settle(el.naturalWidth > 0);
        const p = el.decode?.();
        if (p && typeof p.then === "function") p.then(done, done);
        else done();
      };
      img.onerror = () => settle(false);
      timer = window.setTimeout(() => settle(false), timeoutMs);
      img.src = src;
      if (img.complete && img.naturalWidth > 0) settle(true);
    }

    attemptLoad();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(retryTimer);
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [src, retries, timeoutMs]);

  return state;
}
