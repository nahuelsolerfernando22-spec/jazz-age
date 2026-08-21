import { useEffect, useState } from "react";

/**
 * Alto de viewport ESTABLE para Android.
 *
 * `window.innerHeight` (y `100dvh`) cambian cuando la barra del navegador
 * aparece o desaparece al hacer scroll: el layout se re-escala y la pantalla
 * "sube y baja". Usamos el *small viewport* (`100svh`), que es constante
 * durante toda la sesión y sólo cambia al rotar el dispositivo.
 */

let cachedSvh = 0;
let cachedWidth = 0;

function measureSvh(): number {
  if (typeof window === "undefined") return 768;
  if (typeof document === "undefined") return window.innerHeight;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:100svh;pointer-events:none;visibility:hidden;";
  document.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  probe.remove();
  return h > 0 ? Math.round(h) : window.innerHeight;
}

/** Alto estable en px (svh). Cachea hasta que cambia el ancho (rotación). */
export function getStableVh(): number {
  if (typeof window === "undefined") return 768;
  if (!cachedSvh || cachedWidth !== window.innerWidth) {
    cachedWidth = window.innerWidth;
    cachedSvh = measureSvh();
  }
  return cachedSvh;
}

export function invalidateStableVh() {
  cachedSvh = 0;
}

export interface StableViewport {
  vw: number;
  vh: number;
  landscape: boolean;
}

function read(): StableViewport {
  if (typeof window === "undefined") return { vw: 360, vh: 768, landscape: false };
  const vw = window.innerWidth;
  const vh = getStableVh();
  return { vw, vh, landscape: vw > vh && vh < 500 };
}

/**
 * Devuelve el viewport estable y sólo re-renderiza cuando cambia de verdad
 * (rotación o redimensionado real), nunca por la barra de URL de Android.
 */
export function useStableViewport(): StableViewport {
  const [vp, setVp] = useState<StableViewport>(() => ({ vw: 360, vh: 768, landscape: false }));

  useEffect(() => {
    const update = () => {
      setVp((prev) => {
        const next = read();
        if (
          prev.vw === next.vw &&
          Math.abs(prev.vh - next.vh) < 2 &&
          prev.landscape === next.landscape
        ) {
          return prev;
        }
        return next;
      });
    };
    const onResize = () => {
      // Sólo recalculamos el svh si cambió el ancho (rotación / split screen).
      if (window.innerWidth !== cachedWidth) invalidateStableVh();
      update();
    };
    const onOrientation = () => {
      invalidateStableVh();
      // El alto definitivo llega un frame después de rotar.
      window.setTimeout(update, 120);
    };
    update();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, []);

  return vp;
}
