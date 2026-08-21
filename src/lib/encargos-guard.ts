import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const warned = new Set<string>();

/**
 * El HUD de un encargo se muestra EN LA MESA (ruta del juego).
 * Solo se bloquea dentro del hub /encargos, donde ya hay tarjetas propias.
 */
export function useEncargoHudBlocked(componentName: string): boolean {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const blocked = pathname.startsWith("/encargos");
  useEffect(() => {
    if (blocked && !warned.has(componentName) && import.meta.env.DEV) {
      warned.add(componentName);
    }
  }, [blocked, componentName, pathname]);
  return blocked;
}
