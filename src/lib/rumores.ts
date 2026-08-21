/**
 * Rumores del bajo mundo.
 *
 * Eventos diarios deterministas (misma fecha → mismos rumores) que afectan
 * 2 o 3 mesas a la vez. Todo se resuelve en cliente con la semilla del día:
 * no hay backend ni estado persistido, solo lectura.
 */

import { dailySeed, dayKey, seededPick } from "./daily-seed";

export type RumorEffect =
  | { kind: "chips"; multiplier: number }
  | { kind: "payout"; multiplier: number }
  | { kind: "lives"; extra: number }
  | { kind: "flavor" };

export interface RumorDef {
  id: string;
  title: string;
  /** Texto en voz de la casa, corto para caber en móvil. */
  text: string;
  games: string[];
  effect: RumorEffect;
}

const RUMOR_POOL: RumorDef[] = [
  {
    id: "sudoku-doble",
    title: "Cuentas dobles",
    text: "El contador se equivocó a favor tuyo: los tableros lógicos pagan doble.",
    games: ["solitario", "mahjong"],
    effect: { kind: "chips", multiplier: 2 },
  },
  {
    id: "ruleta-generosa",
    title: "Rueda floja",
    text: "Clara aceitó la rueda de más. Los plenos pagan un poco mejor esta noche.",
    games: ["ruleta", "bagatelle"],
    effect: { kind: "payout", multiplier: 1.15 },
  },
  {
    id: "mesas-criollas",
    title: "Noche criolla",
    text: "Vino barato y cartas gastadas: las mesas españolas reparten propina extra.",
    games: ["truco", "chinchon", "escoba"],
    effect: { kind: "chips", multiplier: 1.5 },
  },
  {
    id: "redada",
    title: "Ronda policial",
    text: "Hay patrulleros en la esquina. La casa presta un aliento más en las mesas duras.",
    games: ["blackjack", "dados", "sindicato"],
    effect: { kind: "lives", extra: 1 },
  },
  {
    id: "mesa-caliente",
    title: "Mesa Caliente",
    text: "Los dados parecen tener memoria y las cartas altas no dejan de salir.",
    games: ["blackjack", "dados"],
    effect: { kind: "flavor" },
  },
  {
    id: "inspeccion-liga",
    title: "Inspección de la Liga",
    text: "Jueces en el salón: más puntos de liga, pero el dealer no perdona ni una.",
    games: ["blackjack", "truco", "chinchon"],
    effect: { kind: "flavor" },
  },
  {
    id: "marfil-caliente",
    title: "Marfil caliente",
    text: "Jade cambió el fieltro: las fichas corren y el reloj perdona.",
    games: ["mahjong", "solitario"],
    effect: { kind: "chips", multiplier: 1.5 },
  },
  {
    id: "bettie-humo",
    title: "Humo en el salón",
    text: "Bettie fuma junto a la palanca. Dicen que el rodillo se distrae.",
    games: ["bagatelle", "dados"],
    effect: { kind: "payout", multiplier: 1.2 },
  },
  {
    id: "zelda-apuesta",
    title: "Apuesta de Zelda",
    text: "Zelda dobló su propia apuesta: los huesos valen más de lo normal.",
    games: ["dados", "bagatelle"],
    effect: { kind: "chips", multiplier: 2 },
  },
];

export const RUMORS_PER_NIGHT = 2;

/** Rumores activos para una fecha (por defecto, hoy). */
export function activeRumors(at: Date = new Date()): RumorDef[] {
  return seededPick(RUMOR_POOL, RUMORS_PER_NIGHT, dailySeed("rumores", at));
}

/** Rumores que afectan a una mesa concreta. */
export function rumorsForGame(gameId: string, at: Date = new Date()): RumorDef[] {
  return activeRumors(at).filter((r) => r.games.includes(gameId));
}

/** Multiplicador acumulado de fichas para una mesa (1 si no hay rumor). */
export function chipMultiplierFor(gameId: string, at: Date = new Date()): number {
  return rumorsForGame(gameId, at).reduce(
    (acc, r) => (r.effect.kind === "chips" ? acc * r.effect.multiplier : acc),
    1,
  );
}

/** Multiplicador acumulado de pagos de azar para una mesa. */
export function payoutMultiplierFor(gameId: string, at: Date = new Date()): number {
  return rumorsForGame(gameId, at).reduce(
    (acc, r) => (r.effect.kind === "payout" ? acc * r.effect.multiplier : acc),
    1,
  );
}

/** Aliento extra concedido por rumores en una mesa. */
export function extraLivesFor(gameId: string, at: Date = new Date()): number {
  return rumorsForGame(gameId, at).reduce(
    (acc, r) => (r.effect.kind === "lives" ? acc + r.effect.extra : acc),
    0,
  );
}

/** Etiqueta corta para chips/badges. */
export function rumorBadge(r: RumorDef): string | null {
  if (r.effect.kind === "chips") return `x${formatMult(r.effect.multiplier)} fichas`;
  if (r.effect.kind === "payout") return `x${formatMult(r.effect.multiplier)} pagos`;
  if (r.effect.kind === "lives") return `+${r.effect.extra} aliento`;
  return null;
}

function formatMult(m: number): string {
  return Number.isInteger(m) ? String(m) : m.toFixed(2).replace(/0$/, "");
}

/** Cliente especial de la noche: una mesa destacada con desafío corto. */
export interface SpecialClient {
  gameId: string;
  name: string;
  demand: string;
  reward: number;
}

const CLIENT_NAMES = [
  "El Turco",
  "Don Anselmo",
  "La Viuda",
  "Rufino el Manco",
  "Señor Pálido",
  "La Condesa",
];

const CLIENT_TABLES = [
  "truco",
  "chinchon",
  "blackjack",
  "escoba",
  "dados",
  "mahjong",
  "solitario",
  "ruleta",
  "bagatelle",
  "sindicato",
];

export function specialClient(at: Date = new Date()): SpecialClient {
  const seed = dailySeed("cliente", at);
  const [gameId] = seededPick(CLIENT_TABLES, 1, seed);
  const [name] = seededPick(CLIENT_NAMES, 1, seed + 7);
  return {
    gameId: gameId!,
    name: name!,
    demand: "Ganá una mano en su mesa antes del cierre.",
    reward: 250,
  };
}

export function rumorsDayKey(at: Date = new Date()): string {
  return dayKey(at);
}
