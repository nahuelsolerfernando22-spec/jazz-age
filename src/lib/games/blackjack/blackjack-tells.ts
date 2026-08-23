// "Filo de Veintiuno" como duelo de reputación: el croupier no reparte nada más
// que cartas, pero la cara lo delata. Cada mano deja una lectura sobre la carta
// tapada; el legajo guarda cuántas veces le acertaste y afina las siguientes.

export type LecturaBJ = "flojo" | "firme";

export interface TellBJ {
  /** Gesto observable del croupier. */
  gesto: string;
  /** Lectura que arriesga la mesa (puede estar equivocada). */
  lectura: LecturaBJ;
  /** 0..1 — qué tan segura suena la lectura. */
  confianza: number;
}

export interface LegajoBJ {
  lecturas: number;
  aciertos: number;
}

export const LEGAJO_BJ_VACIO: LegajoBJ = { lecturas: 0, aciertos: 0 };

const GESTOS_FLOJO = [
  "Se toma un segundo de más antes de mirar la tapada",
  "Acomoda el zapato con la punta de los dedos",
  "Mira de reojo al jefe de mesa",
  "Golpea el fieltro dos veces, sin darse cuenta",
  "Se pasa el pulgar por el puño de la camisa",
];

const GESTOS_FIRME = [
  "Deja la mano quieta sobre la tapada",
  "Reparte sin levantar la vista",
  "Suelta el aire por la nariz, tranquilo",
  "Alinea las fichas del pozo con calma",
  "Sonríe apenas antes de cantar el punto",
];

/** Precisión de la mesa según el legajo acumulado. */
export function precisionLegajo(legajo: LegajoBJ): number {
  if (legajo.lecturas < 3) return 0.55;
  const tasa = legajo.aciertos / legajo.lecturas;
  return Math.min(0.9, 0.55 + tasa * 0.35);
}

/**
 * Lectura de la mano del croupier. `verdad` es lo que realmente esconde:
 * `firme` si con la tapada ya llega a 17 o más.
 */
export function leerCroupier(verdad: LecturaBJ, legajo: LegajoBJ): TellBJ {
  const p = precisionLegajo(legajo);
  const acierta = Math.random() < p;
  const lectura: LecturaBJ = acierta ? verdad : verdad === "firme" ? "flojo" : "firme";
  const pool = lectura === "firme" ? GESTOS_FIRME : GESTOS_FLOJO;
  return {
    gesto: pool[Math.floor(Math.random() * pool.length)]!,
    lectura,
    confianza: p,
  };
}

/** Lo que el croupier realmente esconde, con sus dos primeras cartas. */
export function verdadDelCroupier(total: number): LecturaBJ {
  return total >= 17 ? "firme" : "flojo";
}

/** Veredicto del duelo cerrado, en palabra y no en plata. */
export function veredictoDuelo(reputacion: number): string {
  if (reputacion > 120) return "Salís con la palabra pesada: en esta mesa te van a recordar.";
  if (reputacion > 0) return "Te vas arriba, sin ruido. La casa toma nota.";
  if (reputacion === 0) return "Empataste la noche. Nadie te leyó del todo.";
  if (reputacion > -120) return "Perdiste terreno, pero seguís sentado.";
  return "Te leyeron la cara toda la noche. Eso se paga caro acá.";
}
