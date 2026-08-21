import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { getStableVh } from "@/hooks/use-stable-viewport";

interface Props {
  /** Relación ancho/alto del tablero (por ej. 100/160). */
  aspect: number;
  /** Píxeles que hay que dejar libres debajo del tablero (zócalos, dock…). */
  reserveBottom?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Limita el ancho del tablero para que su alto entre completo en la pantalla.
 *
 * Los tableros verticales (bagatelle) ocupaban el 100% del ancho y, con la
 * relación 100×160, se salían de la pantalla en Android: quedaban cortados por
 * abajo justo donde están los flippers. Medimos el hueco real que queda desde
 * el tablero hasta el borde inferior y ajustamos el ancho para respetarlo.
 */
export function FitBoardArea({ aspect, reserveBottom = 16, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const availW = el.clientWidth || 0;
      if (availW <= 0) return;
      const vh = getStableVh();
      const top = el.getBoundingClientRect().top;
      const availH = Math.max(260, vh - Math.max(0, top) - reserveBottom);
      setWidth(Math.round(Math.min(availW, availH * aspect)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    const timers = [150, 500, 1200].map((ms) => window.setTimeout(compute, ms));
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      ro.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, [aspect, reserveBottom]);

  return (
    <div ref={ref} className={className}>
      <div className="mx-auto" style={width ? { width } : undefined}>
        {children}
      </div>
    </div>
  );
}
