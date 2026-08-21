// Lecturas ("tells") de la rival: pistas visuales cuando canta.
// La idea es que el jugador pueda sospechar un farol sin tener certeza:
// la pista es correcta la mayoría de las veces, pero puede engañar.
import { trucoPower, calcEnvido, type Card, type GameState } from "./truco";

export type TellRead = "farol" | "firme";

export interface TrucoTell {
  read: TellRead;
  /** Gesto observable, sin nombrar la fuerza real de la mano. */
  gesto: string;
  /** Confianza de la lectura, 0..1, para modular la intensidad visual. */
  confianza: number;
}

const GESTOS_FAROL = [
  "Se toca el ala del sombrero antes de cantar",
  "Traga saliva y aprieta las cartas contra el pecho",
  "Se ríe medio segundo tarde",
  "Golpetea la mesa con la uña, apurada",
  "Mira el mazo en lugar de mirarte",
];

const GESTOS_FIRME = [
  "Acomoda las cartas sin apuro y sostiene la mirada",
  "Deja el vaso en la mesa y se acomoda en la silla",
  "Sonríe con la boca cerrada",
  "Canta bajito, como si te hiciera un favor",
  "Apoya las cartas boca abajo, tranquila",
];

/** Fuerza 0..1 de la mano de la rival para el canto en juego. */
function fuerzaRival(g: GameState, kind: "truco" | "envido" | "flor"): number {
  const h = g.hand;
  if (kind === "truco") {
    const cartas: Card[] = h.aiHand.length ? h.aiHand : h.origAiHand;
    const media = cartas.reduce((a, c) => a + trucoPower(c), 0) / Math.max(1, cartas.length);
    return Math.max(0, Math.min(1, (media - 3) / 9));
  }
  const e = calcEnvido(h.origAiHand);
  return Math.max(0, Math.min(1, (e - 18) / 15));
}

/** Aleatoriedad estable por mano + canto: la misma pista no cambia al re-renderizar. */
function semilla(g: GameState, kind: string, level: string | number | null): number {
  const base = `${g.hand.mano}|${g.hand.trick}|${g.scores.you}|${g.scores.ai}|${kind}|${level ?? "-"}|${g.hand.origAiHand.map((c) => c.id).join(",")}`;
  let hSeed = 2166136261;
  for (let i = 0; i < base.length; i++) {
    hSeed ^= base.charCodeAt(i);
    hSeed = Math.imul(hSeed, 16777619);
  }
  return (hSeed >>> 0) / 4294967296;
}

/**
 * Devuelve la lectura visible del canto de la rival, o null si esta vez
 * no se le escapa nada (mano de póker perfecta).
 *
 * @param compostura 0..1 — qué tan bien oculta sus intenciones (perfil de la rival).
 */
export function leerTell(
  g: GameState | null,
  kind: "truco" | "envido" | "flor" | null,
  level: string | number | null,
  compostura = 0.35,
): TrucoTell | null {
  if (!g || !kind || g.winner || g.hand.handOver) return null;
  if (g.hand.pending?.by !== "ai") return null;

  const r = semilla(g, kind, level);
  // Cuanto más compuesta la rival, más seguido no muestra nada.
  const ocultar = 0.18 + compostura * 0.5;
  if (r < ocultar) return null;

  const fuerza = fuerzaRival(g, kind);
  const real: TellRead = fuerza < 0.42 ? "farol" : "firme";

  // Margen de error: a veces la pista miente (más seguido si es compuesta).
  const r2 = semilla(g, kind + "#err", level);
  const engaño = 0.1 + compostura * 0.2;
  const read: TellRead = r2 < engaño ? (real === "farol" ? "firme" : "farol") : real;

  const pool = read === "farol" ? GESTOS_FAROL : GESTOS_FIRME;
  const idx = Math.floor(semilla(g, kind + "#g", level) * pool.length) % pool.length;
  const confianza = Math.max(0.25, Math.min(1, 1 - engaño - compostura * 0.25));

  return { read, gesto: pool[idx]!, confianza };
}
