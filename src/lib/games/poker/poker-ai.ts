// Cabeza de los dos rivales de la mesa de póker. No hace cálculos exactos de
// equidad: estima la fuerza de la mano y la cruza con la personalidad del
// asiento, que es lo que hace que Lola y Bruno se sientan distintos.

import {
  type ActionKind,
  type Card,
  type PokerState,
  type Seat,
  evaluate,
  legalActions,
  toCall,
} from "./poker-engine";

interface Personality {
  /** Cuánta fuerza necesita para no retirarse. */
  fold: number;
  /** Cuánta fuerza necesita para subir. */
  raise: number;
  /** Con qué frecuencia apuesta sin nada. */
  bluff: number;
}

const PERSONALITY: Record<Seat, Personality> = {
  // Lola juega pocas manos y castiga fuerte cuando entra.
  lola: { fold: 0.34, raise: 0.68, bluff: 0.1 },
  // Bruno paga casi todo y farolea seguido; es el que regala fichas y sustos.
  bruno: { fold: 0.2, raise: 0.78, bluff: 0.24 },
  you: { fold: 0.3, raise: 0.7, bluff: 0.12 },
};

/** Fuerza estimada de la mano, de 0 (nada) a 1 (imbatible). */
export function handStrength(hole: Card[], board: Card[]): number {
  if (board.length === 0) return preflopStrength(hole);
  const value = evaluate([...hole, ...board]);
  const boardRanks = board.map((c) => c.r);
  const topBoard = Math.max(...boardRanks);
  const usesHole = value.ranks[0] !== undefined && hole.some((c) => c.r === value.ranks[0]);

  switch (value.cat) {
    case 0: {
      const high = Math.max(hole[0].r, hole[1].r);
      return high > topBoard ? 0.28 : 0.14;
    }
    case 1:
      return usesHole ? (value.ranks[0] >= topBoard ? 0.62 : 0.48) : 0.34;
    case 2:
      return usesHole ? 0.74 : 0.6;
    case 3:
      return 0.86;
    case 4:
      return 0.9;
    case 5:
      return 0.93;
    default:
      return 0.97;
  }
}

function preflopStrength(hole: Card[]): number {
  const [a, b] = [...hole].sort((x, y) => y.r - x.r);
  const pair = a.r === b.r;
  const suited = a.s === b.s;
  const gap = a.r - b.r;
  if (pair) return Math.min(0.97, 0.5 + (a.r - 2) / 26);
  let score = (a.r - 2) / 24 + (b.r - 2) / 48;
  if (suited) score += 0.1;
  if (gap === 1) score += 0.08;
  else if (gap === 2) score += 0.04;
  else if (gap > 4) score -= 0.08;
  return Math.max(0.05, Math.min(0.9, score));
}

/**
 * Acción elegida por un rival. Nunca devuelve una acción ilegal.
 *
 * @param presion 0..1 — cuánto te leyeron la cara: si dudás de más, aprietan
 * (farolean más seguido y se retiran menos ante tus apuestas).
 */
export function aiChoose(
  s: PokerState,
  seat: Seat,
  rng: () => number = Math.random,
  presion = 0,
): ActionKind {
  const legal = legalActions(s, seat);
  if (legal.length === 0) return "pasar";
  const kinds = new Set(legal.map((a) => a.kind));
  const base = PERSONALITY[seat];
  const p: Personality = {
    fold: Math.max(0.08, base.fold - presion * 0.12),
    raise: Math.max(0.3, base.raise - presion * 0.14),
    bluff: Math.min(0.6, base.bluff + presion * 0.22),
  };
  const strength = handStrength(s.hole[seat], s.board);
  const need = toCall(s, seat);
  const noise = (rng() - 0.5) * 0.12;
  const power = Math.max(0, Math.min(1, strength + noise));

  if (need === 0) {
    if (kinds.has("apostar") && (power > p.raise - 0.12 || rng() < p.bluff)) return "apostar";
    return "pasar";
  }

  // Con el bote grande frente a una apuesta chica conviene pagar más seguido.
  const odds = need / Math.max(1, s.pot + need);
  const foldLine = p.fold * (0.6 + odds);
  if (power < foldLine && kinds.has("retirarse")) return "retirarse";
  if (kinds.has("subir") && power > p.raise && rng() < 0.75) return "subir";
  return kinds.has("ver") ? "ver" : "pasar";
}
