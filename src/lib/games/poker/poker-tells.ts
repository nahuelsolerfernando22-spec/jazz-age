// "Cara de Piedra": lecturas de los rivales de la mesa de póker.
// Cada rival tiene tics propios. La pista nunca dice la mano real: describe un
// gesto y arriesga una lectura (farol o firme) que puede estar equivocada.
// A medida que lo estudiás (legajo), la lectura aparece más seguido y falla menos.
import { type PokerState, type Seat } from "./poker-engine";
import { handStrength } from "./poker-ai";

export type LecturaPoker = "farol" | "firme";

export interface TellPoker {
  seat: Seat;
  read: LecturaPoker;
  gesto: string;
  /** 0..1, para modular la intensidad visual de la pista. */
  confianza: number;
}

/** Una entrada del legajo: cuántas veces lo leíste y cuántas acertaste. */
export interface FichaLegajo {
  lecturas: number;
  aciertos: number;
}

export type Legajo = Record<string, FichaLegajo>;

export const LEGAJO_VACIO: Legajo = {};

interface PerfilTells {
  /** 0..1 — qué tan bien esconde sus intenciones. */
  compostura: number;
  farol: string[];
  firme: string[];
}

const PERFIL: Record<string, PerfilTells> = {
  lola: {
    compostura: 0.55,
    farol: [
      "Se acomoda el guante antes de empujar las fichas",
      "Deja el cigarrillo sin encender en el cenicero",
      "Cuenta el bote dos veces, como si le sobrara tiempo",
      "Apoya el codo y mira la puerta un instante",
    ],
    firme: [
      "Sostiene la mirada y no toca sus cartas",
      "Empuja las fichas en una sola pila prolija",
      "Sonríe apenas, con la boca cerrada",
      "Habla más bajo de lo normal",
    ],
  },
  bruno: {
    compostura: 0.25,
    farol: [
      "Se afloja el nudo de la corbata",
      "Se ríe fuerte y golpea la mesa",
      "Amaga con retirarse y después sube",
      "Le tiembla el pulgar sobre la pila de fichas",
    ],
    firme: [
      "Se queda quieto, casi aburrido",
      "Ordena las fichas por color sin apuro",
      "Pide otro whisky en medio de la mano",
      "Repite tu nombre antes de pagar",
    ],
  },
};

function semilla(base: string): number {
  let h = 2166136261;
  for (let i = 0; i < base.length; i++) {
    h ^= base.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Precisión conocida del legajo, 0..1. Con pocas lecturas todavía no significa nada. */
export function precisionLegajo(legajo: Legajo, seat: Seat): number {
  const f = legajo[seat];
  if (!f || f.lecturas < 3) return 0;
  return f.aciertos / f.lecturas;
}

/** Cuánto lo tenés estudiado, 0..1: baja su compostura efectiva. */
export function estudio(legajo: Legajo, seat: Seat): number {
  const f = legajo[seat];
  if (!f) return 0;
  return Math.min(1, f.lecturas / 14);
}

/**
 * Lectura del último movimiento de un rival, o null si esta vez no se le escapa nada.
 * Se calcula sobre la acción ya jugada: no adelanta información del futuro.
 */
export function leerTellPoker(s: PokerState | null, seat: Seat, legajo: Legajo): TellPoker | null {
  if (!s || s.stage === "showdown" || s.stage === "espera") return null;
  if (s.folded[seat]) return null;
  const accion = s.lastAction[seat];
  if (!accion) return null;

  const perfil = PERFIL[seat];
  if (!perfil) return null;

  const clave = `${s.hand}|${s.stage}|${seat}|${accion}|${s.pot}`;
  const compostura = Math.max(0.08, perfil.compostura - estudio(legajo, seat) * 0.35);

  if (semilla(clave) < 0.14 + compostura * 0.5) return null;

  const fuerza = handStrength(s.hole[seat], s.board);
  const real: LecturaPoker = fuerza < 0.45 ? "farol" : "firme";

  const engaño = Math.max(0.04, 0.08 + compostura * 0.24 - estudio(legajo, seat) * 0.1);
  const read: LecturaPoker =
    semilla(`${clave}#err`) < engaño ? (real === "farol" ? "firme" : "farol") : real;

  const pool = read === "farol" ? perfil.farol : perfil.firme;
  const gesto = pool[Math.floor(semilla(`${clave}#g`) * pool.length) % pool.length]!;
  const confianza = Math.max(0.2, Math.min(1, 1 - engaño - compostura * 0.3 + estudio(legajo, seat) * 0.2));

  return { seat, read, gesto, confianza };
}

/** Verifica una lectura contra las cartas descubiertas y devuelve el legajo actualizado. */
export function anotarLegajo(
  legajo: Legajo,
  seat: Seat,
  read: LecturaPoker,
  fuerzaReal: number,
): Legajo {
  const real: LecturaPoker = fuerzaReal < 0.45 ? "farol" : "firme";
  const prev = legajo[seat] ?? { lecturas: 0, aciertos: 0 };
  return {
    ...legajo,
    [seat]: {
      lecturas: prev.lecturas + 1,
      aciertos: prev.aciertos + (real === read ? 1 : 0),
    },
  };
}

/** Tu propia cara: dudar demasiado te delata y los rivales aprietan. */
export interface TellPropio {
  /** 0..1 — cuánto se te nota. */
  nivel: number;
  texto: string;
}

export function tellPropio(msPensados: number): TellPropio | null {
  if (msPensados < 7000) return null;
  const nivel = Math.min(1, (msPensados - 7000) / 13000);
  const texto =
    nivel > 0.66
      ? "Se te fue el color de la cara: la mesa te está leyendo"
      : nivel > 0.33
        ? "Dudás demasiado y Bruno ya se dio cuenta"
        : "Tardás de más: Lola te mira las manos";
  return { nivel, texto };
}
