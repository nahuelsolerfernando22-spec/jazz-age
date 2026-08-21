/**
 * Pausa automática al mandar la app a segundo plano.
 *
 * En Android, salir de la app (llamada, notificación, botón home) no puede
 * dejar el reloj de la partida corriendo. Al volver, el jugador retoma donde
 * estaba: se queda en pausa y decide él cuándo seguir.
 *
 * Solo aplica dentro de una sala de juego; en el hub y en los menús no hay
 * nada que pausar.
 */

import { onAppPauseChange } from "./app-lifecycle";
import { useGamePause } from "@/store/game-pause";
import { isGameRoute } from "./game-routes";

let installed = false;

function inGameRoom(): boolean {
  if (typeof window === "undefined") return false;
  return isGameRoute(window.location.pathname);
}

export function installPauseOnBackground(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  onAppPauseChange((paused) => {
    if (!paused) return;
    if (!inGameRoom()) return;
    useGamePause.getState().requestPause();
  });
}
