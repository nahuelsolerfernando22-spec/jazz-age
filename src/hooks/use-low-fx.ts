import { useEffect, useState } from "react";
import { isLowEnd } from "@/lib/perf-tier";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Modo de bajo rendimiento: APK Android / gama baja o "reducir movimiento".
 * En ese modo las salas recortan partículas, blurs, sombras y acortan las
 * animaciones largas para que el toque responda al instante en la WebView.
 *
 * Se resuelve en un efecto (no en el render inicial) para no romper la
 * hidratación cuando la ruta se prerrenderiza.
 */
export function useLowFx(): boolean {
  const reduced = useReducedMotion();
  const [low, setLow] = useState(false);
  useEffect(() => {
    setLow(isLowEnd());
  }, []);
  return low || reduced;
}
