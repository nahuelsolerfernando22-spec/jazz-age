import { useEffect } from "react";
import { invalidateStableVh } from "@/hooks/use-stable-viewport";

/**
 * Sincroniza la orientación real del dispositivo con el DOM para que el CSS
 * pueda reflujar el HUD, los botones y las mesas al rotar en Android.
 *
 * - `body[data-orient]`  → "portrait" | "landscape" (variantes de Tailwind).
 * - `body[data-short]`   → "1" cuando el alto útil es muy bajo (landscape de
 *   teléfono), para compactar cabeceras y franjas.
 * - `--cd-vh`            → alto estable en px, recalculado tras la rotación.
 *
 * Al rotar, Android reporta el alto definitivo uno o dos frames más tarde, así
 * que remedimos con un pequeño escalonado y disparamos `resize` para que
 * `FitToScreen` y demás observadores vuelvan a encajar el contenido.
 */
export function OrientationSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    const timers: number[] = [];

    const apply = () => {
      raf = 0;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h;
      const body = document.body;
      const root = document.documentElement;

      body.dataset.orient = landscape ? "landscape" : "portrait";
      if (landscape && h <= 540) body.dataset.short = "1";
      else delete body.dataset.short;

      root.style.setProperty("--cd-vh", `${h}px`);
      root.style.setProperty("--cd-vw", `${w}px`);
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };

    const onRotate = () => {
      invalidateStableVh();
      schedule();
      // El alto definitivo llega después de la animación de rotación.
      [120, 320, 600].forEach((ms) => {
        timers.push(
          window.setTimeout(() => {
            invalidateStableVh();
            apply();
            window.dispatchEvent(new Event("resize"));
          }, ms),
        );
      });
    };

    apply();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", onRotate);
    const mq = window.matchMedia("(orientation: landscape)");
    mq.addEventListener?.("change", onRotate);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", onRotate);
      mq.removeEventListener?.("change", onRotate);
    };
  }, []);

  return null;
}
