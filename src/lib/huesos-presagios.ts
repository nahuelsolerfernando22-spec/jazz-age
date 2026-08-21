export type PresagioId =
  | "carta_alta"
  | "escalera_doble"
  | "dos_tiros"
  | "generala_o_nada"
  | "sin_servida"
  | "manos_frias"
  | "hex_del_uno";

export interface Presagio {
  id: PresagioId;
  title: string;
  omen: string;
  effect: string;
  bonusChips: number;
  penaltyChips: number;
}

export const PRESAGIOS: Presagio[] = [
  {
    id: "carta_alta",
    title: "La Carta Alta",
    omen: "«Los seises son fuego. Quien se aferra a ellos, se quema.»",
    effect: "No se pueden retener 6s. Bono +50% si terminás sin quemar contratos.",
    bonusChips: 150,
    penaltyChips: 40,
  },
  {
    id: "escalera_doble",
    title: "La Escalera del Diablo",
    omen: "«Cinco peldaños. Cinco tumbas. Y una salida hacia arriba.»",
    effect: "Escalera del Fondo paga doble.",
    bonusChips: 80,
    penaltyChips: 0,
  },
  {
    id: "dos_tiros",
    title: "Las Manos del Cuervo",
    omen: "«Dos aleteos y basta. El cuervo no ruega tres veces.»",
    effect: "Sólo 2 tiros por turno.",
    bonusChips: 220,
    penaltyChips: 0,
  },
  {
    id: "generala_o_nada",
    title: "Los Cinco Huesos o Nada",
    omen: "«O la corona o el silencio. No hay medias tintas esta noche.»",
    effect: "El contrato Los Cinco Huesos paga triple.",
    bonusChips: 300,
    penaltyChips: 120,
  },
  {
    id: "sin_servida",
    title: "El Cubilete Frío",
    omen: "«El primer tiro miente siempre. No lo escuches.»",
    effect: "Las jugadas servidas no otorgan bonus.",
    bonusChips: 120,
    penaltyChips: 0,
  },
  {
    id: "manos_frias",
    title: "Manos Frías",
    omen: "«Un solo tiro para elegir. El resto, al azar.»",
    effect: "Sólo podés elegir qué dados guardar después del primer tiro.",
    bonusChips: 180,
    penaltyChips: 0,
  },
  {
    id: "hex_del_uno",
    title: "El Hex del Cuervo",
    omen: "«Un dado siempre estará marcado. Con él no se pacta.»",
    effect: "Un dado por tirada queda maldito y no se puede retener.",
    bonusChips: 200,
    penaltyChips: 0,
  },
];

export function drawPresagio(seed?: string): Presagio {
  const s = seed ?? Math.random().toString(36).slice(2);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Math.imul devuelve un entero de 32 bits *con signo*: sin este >>> 0 el
  // módulo daba negativo la mitad de las veces y el presagio salía undefined,
  // lo que rompía la partida al sentarse a la mesa.
  return PRESAGIOS[(h >>> 0) % PRESAGIOS.length];
}

export function maxRollsFor(p: Presagio | null, base: number): number {
  if (!p) return base;
  if (p.id === "dos_tiros") return 2;
  return base;
}

export function canHoldWith(
  p: Presagio | null,
  face: number,
  cursedIndex: number,
  index: number,
  rollsLeft: number,
): { allowed: boolean; reason?: string } {
  if (!p) return { allowed: true };
  if (p.id === "carta_alta" && face === 6) {
    return { allowed: false, reason: "El presagio prohíbe retener 6s." };
  }
  if (p.id === "hex_del_uno" && index === cursedIndex) {
    return { allowed: false, reason: "Dado maldito — no se puede retener." };
  }
  if (p.id === "manos_frias" && rollsLeft < maxRollsFor(p, 3) - 1) {
    return { allowed: false, reason: "Ya pasó tu oportunidad de retener." };
  }
  return { allowed: true };
}

/**
 * Ajusta el pago de un contrato de Cinco Huesos según el presagio activo.
 */
export function adjustContractScore(
  p: Presagio | null,
  contractId: string,
  base: number,
  servida: boolean,
): { value: number; note?: string } {
  if (!p || base <= 0) return { value: base };
  if (p.id === "escalera_doble" && contractId === "escalera") {
    return { value: base * 2, note: "Escalera del Diablo ×2" };
  }
  if (p.id === "generala_o_nada" && contractId === "cinco_huesos") {
    return { value: base * 3, note: "Los Cinco Huesos ×3" };
  }
  if (p.id === "sin_servida" && servida) {
    return { value: Math.max(0, Math.round(base * 0.8)), note: "Sin bonus de servida" };
  }
  return { value: base };
}

export function settlePresagio(
  p: Presagio | null,
  ctx: { brokeRule: boolean; won: boolean },
): { delta: number; note: string | null } {
  if (!p) return { delta: 0, note: null };
  if (ctx.brokeRule) {
    return { delta: -p.penaltyChips, note: `Rompiste el presagio (−${p.penaltyChips}).` };
  }
  if (p.id === "carta_alta" && ctx.won) {
    return { delta: p.bonusChips, note: `Presagio cumplido: La Carta Alta (+${p.bonusChips}).` };
  }
  if (ctx.won) {
    return { delta: p.bonusChips, note: `Presagio cumplido: ${p.title} (+${p.bonusChips}).` };
  }
  return { delta: 0, note: null };
}
