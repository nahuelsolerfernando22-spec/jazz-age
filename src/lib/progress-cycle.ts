import { useLeagueProgress } from "@/store/league-progress";
import { resolveOfflineTourneyWeeks } from "@/lib/daily-tournament";
import { onAppPauseChange } from "@/lib/app-lifecycle";

/**
 * Cierra las jornadas de liga y las semanas de torneo que hayan vencido.
 * Se ejecuta al abrir la app y cada vez que vuelve a primer plano, para que
 * el ranking y los premios no queden esperando a que el jugador entre a
 * /progreso.
 */
export function resolvePendingCycles(): void {
  if (typeof window === "undefined") return;
  try {
    useLeagueProgress.getState().resolveStaleDays();
  } catch {}
  try {
    resolveOfflineTourneyWeeks();
  } catch {}
}

export function installProgressCycle(): () => void {
  if (typeof window === "undefined") return () => {};
  resolvePendingCycles();
  // Android: la app puede pasar días en segundo plano. El cierre de jornada
  // se resuelve al volver al primer plano (`appStateChange` vía el puente
  // nativo), no cuando el jugador entra a /progreso.
  return onAppPauseChange((paused) => {
    if (!paused) resolvePendingCycles();
  });
}
