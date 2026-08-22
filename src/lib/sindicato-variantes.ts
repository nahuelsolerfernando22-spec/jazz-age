/**
 * Variantes de reglas del T.E.G. para el Sindicato.
 *
 * Cada mesa puede jugarse con una reglamentación distinta: cuántas fichas se
 * ponen en las rondas de acomodo, desde cuándo se puede asaltar, con cuántos
 * dados se pelea y cómo pagan los canjes. Todo el motor lee estos valores,
 * así que cambiar de variante cambia la partida de verdad.
 */

export interface ReglasVariante {
  id: string;
  nombre: string;
  desc: string;
  /** Tropas mínimas que tiene que tener el sector de origen para asaltar. */
  minTropasAtaque: number;
  /** Dados máximos del atacante por tirada. */
  maxDadosAtaque: number;
  /** Dados máximos del defensor por tirada. */
  maxDadosDefensa: number;
  /** Fichas de la primera ronda de acomodo. */
  fichasRonda1: number;
  /** Fichas de la segunda ronda de acomodo. */
  fichasRonda2: number;
  /** Rondas iniciales sin asalto (0 = se pelea desde la primera). */
  rondasSinAsalto: number;
  /** Refuerzos de ronda: sectores / divisor. */
  divisorRefuerzos: number;
  /** Piso de refuerzos por ronda. */
  refuerzoMinimo: number;
  /** Escalera de fichas por canje de trío. */
  canjeProgresion: number[];
  /** Fichas extra que caen en el sector propio dibujado en el naipe canjeado. */
  bonoSectorCanje: number;
  /** A partir de cuántos canjes hace falta tomar 2 sectores para llevarse naipe. */
  canjesParaDobleConquista: number;
  /** Naipes en mano que obligan a canjear antes de seguir. */
  maxNaipesEnMano: number;
  /** Reagrupes permitidos en la fase de fortificación. */
  reagrupesPorTurno: number;
}

export const VARIANTE_CLASICA: ReglasVariante = {
  id: "clasica",
  nombre: "T.E.G. clásico",
  desc: "5 y 3 fichas de acomodo, se asalta desde la 3ª vuelta, 3 dados por lado.",
  minTropasAtaque: 2,
  maxDadosAtaque: 3,
  maxDadosDefensa: 3,
  fichasRonda1: 5,
  fichasRonda2: 3,
  rondasSinAsalto: 2,
  divisorRefuerzos: 2,
  refuerzoMinimo: 3,
  canjeProgresion: [4, 7, 10, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31],
  bonoSectorCanje: 2,
  canjesParaDobleConquista: 3,
  maxNaipesEnMano: 5,
  reagrupesPorTurno: 3,
};

export const VARIANTES: ReglasVariante[] = [
  VARIANTE_CLASICA,
  {
    ...VARIANTE_CLASICA,
    id: "express",
    nombre: "Redada exprés",
    desc: "8 fichas de arranque y fuego libre desde la 2ª vuelta. Partidas cortas.",
    fichasRonda1: 8,
    fichasRonda2: 5,
    rondasSinAsalto: 1,
    refuerzoMinimo: 4,
    canjeProgresion: [6, 9, 12, 15, 18, 21, 24, 27, 30],
  },
  {
    ...VARIANTE_CLASICA,
    id: "guerra-abierta",
    nombre: "Guerra abierta",
    desc: "Sin acomodo: se asalta de entrada, 4 dados de ataque y refuerzos gordos.",
    fichasRonda1: 10,
    fichasRonda2: 6,
    rondasSinAsalto: 0,
    maxDadosAtaque: 4,
    divisorRefuerzos: 2,
    refuerzoMinimo: 5,
  },
  {
    ...VARIANTE_CLASICA,
    id: "asedio",
    nombre: "Asedio",
    desc: "Hace falta 3 tropas para salir, el defensor tira fuerte y los canjes rinden poco.",
    minTropasAtaque: 3,
    maxDadosDefensa: 3,
    fichasRonda1: 6,
    fichasRonda2: 4,
    rondasSinAsalto: 2,
    divisorRefuerzos: 3,
    refuerzoMinimo: 3,
    canjeProgresion: [3, 5, 7, 9, 11, 13, 15, 17],
    bonoSectorCanje: 3,
    reagrupesPorTurno: 2,
  },
];

export function varianteDe(id?: string | null): ReglasVariante {
  return VARIANTES.find((v) => v.id === id) ?? VARIANTE_CLASICA;
}

/** Normaliza reglas venidas de storage viejo o parciales. */
export function normalizarReglas(r?: Partial<ReglasVariante> | null): ReglasVariante {
  if (!r) return VARIANTE_CLASICA;
  const base = varianteDe(r.id);
  return { ...base, ...r } as ReglasVariante;
}

/** Fichas de despliegue de la ronda según la variante. */
export function fichasDeRonda(
  reglas: ReglasVariante,
  ronda: number,
  sectoresPropios: number,
): number {
  if (ronda === 1) return reglas.fichasRonda1;
  if (ronda === 2) return reglas.fichasRonda2;
  return Math.max(
    reglas.refuerzoMinimo,
    Math.floor(sectoresPropios / Math.max(1, reglas.divisorRefuerzos)),
  );
}
