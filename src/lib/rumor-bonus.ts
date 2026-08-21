import { chipMultiplierFor, payoutMultiplierFor } from "./rumores";
import { rankFor } from "@/store/hostess-rank";
import { hostessForGame } from "./single-hostess";
import { useCasino } from "@/store/casino";

/**
 * Aplica el multiplicador de fichas de los rumores del día y beneficios de rango a un premio.
 * Nunca reduce el premio: si no hay rumor activo devuelve el valor original.
 */
export function withRumorChips(gameId: string, reward: number): number {
  if (!Number.isFinite(reward) || reward <= 0) return reward;

  // 1. Rumores
  const rumorMult = chipMultiplierFor(gameId) * payoutMultiplierFor(gameId);

  // 2. Beneficios de Rango (Socio otorga x1.25 base)
  let rankMult = 1;
  const hostess = hostessForGame(gameId);
  if (hostess) {
    const rank = rankFor(hostess.npcId);
    if (rank.id === "socio") {
      rankMult = 1.25;
    } else if (rank.id === "complice") {
      rankMult = 1.1;
    }
  }

  // 3. Bonus Global del Rumor Activo (ej: Zelda x2)
  let extraMult = 1;
  const { currentRumor } = useCasino.getState();
  if (currentRumor?.id === "zelda-apuesta" && gameId === "dados") {
    extraMult = 2.0;
  }

  const finalMult = rumorMult * rankMult * extraMult;

  if (finalMult <= 1) return Math.round(reward);
  return Math.round(reward * finalMult);
}
