import { dailySeed } from "@/lib/tournament";

/**
 * Formato de los torneos semanales del Cuervo.
 *
 * Cada torneo tiene un formato propio: una cantidad fija de RONDAS y de
 * INTENTOS por ronda. Una ronda es una entrada a la pizarra; el puntaje de la
 * ronda es el mejor de sus intentos y el puntaje del torneo es la SUMA de las
 * rondas. Cuando se usaron todas las rondas, la marca queda cerrada hasta el
 * lunes siguiente.
 *
 * Todo esto vive en el dispositivo (localStorage) para que funcione sin
 * conexión: la semilla de cada ronda se deriva de la semana, así que el
 * tablero/grilla/reparto es el mismo para todos.
 */

export type TourneyGame = "truco" | "mahjong" | "bagatelle" | "solitario" | "dados";

export const TOURNEY_ROTATION: TourneyGame[] = [
  "truco",
  "mahjong",
  "bagatelle",
  "solitario",
  "dados",
];

export interface TourneyFormat {
  /** Cantidad de entradas a la pizarra que tenés en la semana. */
  rounds: number;
  /** Intentos por ronda; se guarda el mejor de esos intentos. */
  attemptsPerRound: number;
  /** Nombre de la unidad de ronda, para la UI ("Grilla", "Mano", ...). */
  roundLabel: string;
  /** Cómo se arma el puntaje, en una línea. */
  scoring: string;
  /** Reglas cortas que se muestran en la ficha del torneo. */
  rules: string[];
}

export const TOURNEY_FORMAT: Record<TourneyGame, TourneyFormat> = {
  truco: {
    rounds: 5,
    attemptsPerRound: 1,
    roundLabel: "Mano",
    scoring: "Suma de las 5 manos",
    rules: [
      "5 manos a 15 puntos contra la casa",
      "Puntúa la diferencia que le sacás a la mesa",
      "Abandonar una mano la cierra en cero",
    ],
  },
  mahjong: {
    rounds: 2,
    attemptsPerRound: 1,
    roundLabel: "Tablero",
    scoring: "Suma de los 2 tableros",
    rules: [
      "2 tableros semanales, iguales para todos",
      "Un intento por tablero, sin pistas",
      "Solo puntúa el tablero terminado",
    ],
  },
  bagatelle: {
    rounds: 3,
    attemptsPerRound: 1,
    roundLabel: "Tirada",
    scoring: "Suma de las 3 tiradas",
    rules: [
      "3 tiradas de 3 bolas cada una",
      "Misma mesa para toda la semana",
      "Cuentan las tres, no la mejor",
    ],
  },
  solitario: {
    rounds: 2,
    attemptsPerRound: 1,
    roundLabel: "Reparto",
    scoring: "Suma de los 2 repartos",
    rules: [
      "2 repartos semanales, los mismos para todos",
      "Un intento por reparto",
      "Menos movimientos, más puntos",
    ],
  },
  dados: {
    rounds: 2,
    attemptsPerRound: 1,
    roundLabel: "Planilla",
    scoring: "Suma de las 2 planillas",
    rules: [
      "2 planillas completas",
      "Una sola planilla por ronda",
      "Cuenta el total final de cada planilla",
    ],
  },
};

/** Total de entradas que reparte el torneo (rondas × intentos). */
export function tourneyTotalEntries(game: TourneyGame): number {
  const f = TOURNEY_FORMAT[game];
  return f.rounds * f.attemptsPerRound;
}

/** Semilla determinista de una ronda concreta: mismo tablero para todos. */
export function tourneyRoundSeed(game: TourneyGame, week: number, round: number): number {
  return dailySeed(`tourney:${game}:r${round}`, week, 0);
}

const ROUNDS_PREFIX = "cuervo:tourney:rounds:v1";

interface StoredRounds {
  scores: number[];
  attempts: number[];
}

export interface TourneyRoundState {
  /** Puntaje logrado en cada ronda (0 si todavía no se jugó). */
  scores: number[];
  /** Intentos consumidos en cada ronda. */
  attempts: number[];
  /** Índice de la ronda abierta, o null si el torneo ya está completo. */
  currentRound: number | null;
  /** Rondas ya cerradas. */
  roundsDone: number;
  /** Suma de las rondas: lo que va a la pizarra. */
  total: number;
  /** Intentos que quedan en la ronda abierta. */
  attemptsLeft: number;
  finished: boolean;
}

function roundsKey(week: number, game: TourneyGame) {
  return `${ROUNDS_PREFIX}:${week}:${game}`;
}

function readStored(week: number, game: TourneyGame, rounds: number): StoredRounds {
  const empty: StoredRounds = { scores: Array(rounds).fill(0), attempts: Array(rounds).fill(0) };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(roundsKey(week, game));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<StoredRounds>;
    const norm = (arr: unknown): number[] => {
      const out = Array(rounds).fill(0) as number[];
      if (Array.isArray(arr)) {
        for (let i = 0; i < rounds; i++) {
          const v = Number(arr[i]);
          out[i] = Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
        }
      }
      return out;
    };
    return { scores: norm(parsed.scores), attempts: norm(parsed.attempts) };
  } catch {
    return empty;
  }
}

function writeStored(week: number, game: TourneyGame, data: StoredRounds) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(roundsKey(week, game), JSON.stringify(data));
  } catch {}
}

function toState(game: TourneyGame, stored: StoredRounds): TourneyRoundState {
  const f = TOURNEY_FORMAT[game];
  let currentRound: number | null = null;
  for (let i = 0; i < f.rounds; i++) {
    if (stored.attempts[i] < f.attemptsPerRound) {
      currentRound = i;
      break;
    }
  }
  const total = stored.scores.reduce((a, b) => a + b, 0);
  const roundsDone = stored.attempts.filter((a) => a >= f.attemptsPerRound).length;
  return {
    scores: stored.scores,
    attempts: stored.attempts,
    currentRound,
    roundsDone,
    total,
    attemptsLeft: currentRound === null ? 0 : f.attemptsPerRound - stored.attempts[currentRound],
    finished: currentRound === null,
  };
}

/** Estado del torneo de esa semana en este dispositivo. */
export function tourneyRoundState(game: TourneyGame, week: number): TourneyRoundState {
  return toState(game, readStored(week, game, TOURNEY_FORMAT[game].rounds));
}

export interface RoundRecordResult extends TourneyRoundState {
  /** false si ya no quedaban rondas: el puntaje no entra. */
  accepted: boolean;
  /** Ronda donde cayó el puntaje (0-indexed). */
  round: number | null;
  /** true si con esta entrada se cerró el torneo de la semana. */
  justFinished: boolean;
}

/**
 * Registra un puntaje en la ronda abierta. Consume un intento y guarda el
 * mejor resultado de la ronda. Devuelve el estado resultante.
 */
export function recordTourneyRound(
  game: TourneyGame,
  week: number,
  score: number,
): RoundRecordResult {
  const f = TOURNEY_FORMAT[game];
  const stored = readStored(week, game, f.rounds);
  const before = toState(game, stored);
  if (before.currentRound === null) {
    return { ...before, accepted: false, round: null, justFinished: false };
  }
  const round = before.currentRound;
  const clean = Math.max(0, Math.floor(score));
  stored.scores[round] = Math.max(stored.scores[round], clean);
  stored.attempts[round] = Math.min(f.attemptsPerRound, stored.attempts[round] + 1);
  writeStored(week, game, stored);
  const after = toState(game, stored);
  return { ...after, accepted: true, round, justFinished: after.finished };
}

/** Limpia el registro de una semana (uso interno al archivar). */
export function clearTourneyRounds(game: TourneyGame, week: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(roundsKey(week, game));
  } catch {}
}
