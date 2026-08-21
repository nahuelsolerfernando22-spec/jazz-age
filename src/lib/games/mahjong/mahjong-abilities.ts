import { getLevel, LEVELS, type LevelDef } from "./mahjong-levels";

/** Identificadores de las habilidades del tablero de mahjong. */
export type AbilityId = "mezclar" | "pista" | "deshacer" | "iman" | "espacio" | "devolver";

export interface AbilityDef {
  id: AbilityId;
  label: string;
  /** Ronda (orden de mesa) a partir de la cual la habilidad queda disponible. */
  unlocksAt: number;
  /** Texto que se muestra mientras sigue bloqueada. */
  hint: string;
}

/**
 * Las habilidades se ganan avanzando de ronda: en la primera mesa sólo hay
 * mezclar y pista, y el resto se abre a medida que se superan mesas.
 */
export const ABILITIES: AbilityDef[] = [
  { id: "mezclar", label: "Mezclar", unlocksAt: 1, hint: "Disponible desde la primera mesa" },
  { id: "pista", label: "Pista", unlocksAt: 1, hint: "Disponible desde la primera mesa" },
  { id: "deshacer", label: "Deshacer", unlocksAt: 2, hint: "Se abre en la ronda 2" },
  { id: "iman", label: "Imán", unlocksAt: 3, hint: "Se abre en la ronda 3" },
  { id: "espacio", label: "Espacio", unlocksAt: 5, hint: "Se abre en la ronda 5" },
  { id: "devolver", label: "Devolver", unlocksAt: 7, hint: "Se abre en la ronda 7" },
];

const BY_ID = new Map(ABILITIES.map((a) => [a.id, a]));

export function abilityDef(id: AbilityId): AbilityDef {
  return BY_ID.get(id) ?? ABILITIES[0];
}

/** Mesas de práctica no cuentan para el desbloqueo. */
function orderOf(level: LevelDef): number {
  return level.practice ? 0 : level.order;
}

/**
 * Ronda alcanzada = la mesa más alta superada (al menos una estrella) más una,
 * nunca menor que la mesa que se está jugando ahora.
 */
export function reachedRound(
  currentLevelId: string,
  perLevel: Record<string, { stars: number }>,
): number {
  let bestCleared = 0;
  for (const lv of LEVELS) {
    if (lv.practice) continue;
    if ((perLevel[lv.id]?.stars ?? 0) >= 1) bestCleared = Math.max(bestCleared, lv.order);
  }
  const current = orderOf(getLevel(currentLevelId));
  return Math.max(1, current, bestCleared + 1);
}

export function isAbilityUnlocked(id: AbilityId, round: number): boolean {
  return round >= abilityDef(id).unlocksAt;
}

/** Habilidades que se desbloquean exactamente al llegar a esa ronda. */
export function abilitiesUnlockedAt(round: number): AbilityDef[] {
  return ABILITIES.filter((a) => a.unlocksAt === round);
}
