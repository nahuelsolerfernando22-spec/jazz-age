// Objetivos diarios de "La Mano Muerta": determinísticos por día (seed = todayKey),
// no dependen de la sesión del jugador. Se muestran antes de repartir y en la
// pantalla final; el pago de fichas lo resuelve el store solitario-objectives.
import { hashSeed, mulberry32 } from "@/lib/seededRng";
import { todayKey } from "@/lib/date-keys";

export type SolitarioObjectiveKind = "moves-under" | "suits-closed" | "no-undo";

export interface SolitarioObjective {
  id: string;
  kind: SolitarioObjectiveKind;
  label: string;
  target: number;
  reward: number;
}

interface ObjectiveStats {
  won: boolean;
  moves: number;
  suitsClosed: number;
  usedUndo: boolean;
}

const MOVES_TARGETS = [110, 130, 150, 170];
const SUITS_TARGETS = [2, 3];

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Tres objetivos por día, siempre los mismos para todos los jugadores. */
export function dailyObjectives(dayKey: string = todayKey()): SolitarioObjective[] {
  const rng = mulberry32(hashSeed(`solitario:objectives:${dayKey}`));

  const movesTarget = pick(rng, MOVES_TARGETS);
  const suitsTarget = pick(rng, SUITS_TARGETS);

  return [
    {
      id: `moves-under-${movesTarget}`,
      kind: "moves-under",
      label: `Cerrar la mano en menos de ${movesTarget} movimientos`,
      target: movesTarget,
      reward: 60,
    },
    {
      id: `suits-closed-${suitsTarget}`,
      kind: "suits-closed",
      label: `Completar ${suitsTarget} de los 4 palos`,
      target: suitsTarget,
      reward: 50,
    },
    {
      id: "no-undo",
      kind: "no-undo",
      label: "Ganar la mano sin usar deshacer",
      target: 1,
      reward: 70,
    },
  ];
}

export function isObjectiveMet(o: SolitarioObjective, s: ObjectiveStats): boolean {
  switch (o.kind) {
    case "moves-under":
      return s.won && s.moves <= o.target;
    case "suits-closed":
      return s.suitsClosed >= o.target;
    case "no-undo":
      return s.won && !s.usedUndo;
    default:
      return false;
  }
}
