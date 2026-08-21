import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { getStableVh } from "@/hooks/use-stable-viewport";

// Por debajo de ~0.8 el texto de los paneles baja de 11px reales y los botones
// quedan por debajo del área táctil cómoda en Android (48dp): preferimos
// permitir scroll antes que encoger más y volver el juego ilegible.
const MIN_SCALE = 0.8;

const MAX_PASSES = 6;

/** Comprimimos en teléfonos/tablets, tanto en vertical como en horizontal. */
function shouldFit() {
  if (typeof window === "undefined") return false;
  const w = window.innerWidth;
  const h = getStableVh();
  // Vertical de teléfono/tablet…
  if (w <= 900 && h >= w * 0.9) return true;
  // …y horizontal de teléfono/tablet, donde el alto es el recurso escaso.
  return w <= 1280 && h <= 620;
}

/**
 * Encaja el contenido de una sala en la altura visible sin scroll.
 *
 * Mide la altura natural del contenido y, si excede el alto disponible, lo
 * escala proporcionalmente (nunca deforma: el mismo factor en X e Y) hasta que
 * entra completo. El ancho del contenido se compensa (`width: 100/s%`) para que
 * siga ocupando todo el ancho de la pantalla después del escalado.
 *
 * Si ni con el mínimo de escala entra, se habilita el scroll como red de
 * seguridad en vez de recortar el juego.
 */
export function FitToScreen({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [active, setActive] = useState(false);
  const scaleRef = useRef(1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;

    let frame = 0;
    let passes = 0;

    const apply = (next: number) => {
      const clamped = Math.min(1, Math.max(MIN_SCALE, next));
      if (Math.abs(clamped - scaleRef.current) < 0.005) return false;
      scaleRef.current = clamped;
      setScale(clamped);
      return true;
    };

    const measure = () => {
      frame = 0;
      if (!shouldFit()) {
        setActive(false);
        passes = 0;
        apply(1);
        return;
      }
      setActive(true);
      const avail = box.clientHeight;
      // Con `zoom` el contenido se re-maquetea a lo ancho completo, así que la
      // altura real ya viene afectada por el factor actual: se corrige de forma
      // iterativa hasta que entra sin recortes ni columnas angostas.
      const real = inner.getBoundingClientRect().height;
      if (avail <= 0 || real <= 0) return;
      const changed = apply(scaleRef.current * (avail / real));
      if (changed && passes < MAX_PASSES) {
        passes += 1;
        frame = requestAnimationFrame(measure);
      } else {
        passes = 0;
      }
    };

    const schedule = () => {
      if (frame) return;
      passes = 0;
      frame = requestAnimationFrame(measure);
    };

    schedule();
    // Algunas salas crecen después del primer frame (imágenes, fuentes, datos
    // asíncronos) sin disparar el ResizeObserver del contenedor: re-medimos
    // varias veces durante los primeros segundos para no quedarnos cortos.
    const retries = [150, 400, 900, 1600, 2600, 4000].map((ms) => window.setTimeout(schedule, ms));
    const ro = new ResizeObserver(schedule);
    ro.observe(inner);
    ro.observe(box);
    // El contenido interno puede cambiar de alto sin cambiar el tamaño del
    // nodo observado (paneles que aparecen dentro de hijos posicionados).
    const mo = new MutationObserver(schedule);
    mo.observe(inner, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      retries.forEach((t) => window.clearTimeout(t));
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, []);

  // Exponemos el factor para que efectos/overlays puedan compensarlo si hace falta.
  useEffect(() => {
    document.documentElement.style.setProperty("--fit-scale", String(active ? scale : 1));
    return () => {
      document.documentElement.style.setProperty("--fit-scale", "1");
    };
  }, [scale, active]);

  const compressed = active && scale < 1;
  const atFloor = compressed && scale <= MIN_SCALE + 0.001;

  return (
    <div
      ref={boxRef}
      data-fit-box={active ? "1" : undefined}
      className={active ? "min-h-0 flex-1" : undefined}
      style={
        active
          ? ({
              overflowY: atFloor ? "auto" : "hidden",
              overflowX: "hidden",
              // Var local: los controles compensan el zoom para no bajar del
              // área táctil mínima, aunque haya varias salas montadas.
              "--fit-scale": compressed ? scale : 1,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div ref={innerRef} style={compressed ? ({ zoom: scale } as React.CSSProperties) : undefined}>
        {children}
      </div>
    </div>
  );
}
