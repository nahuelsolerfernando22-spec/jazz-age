/**
 * Catálogo fijo de misiones secretas, al estilo de las tarjetas del T.E.G.
 * original, pero escritas para los barrios de la ciudad.
 *
 * Cada noche el mapa cambia (es un roguelike: distinto tamaño, distinta forma),
 * así que las misiones no se usan crudas: primero se filtran las que el mapa de
 * esta partida permite cumplir y después se les recorta la exigencia a lo que
 * realmente hay sobre la mesa.
 */

import { BARRIOS, type BarrioId, type Territorio } from "@/lib/sindicato-data";

export interface MisionParcial {
  barrio: BarrioId;
  n: number;
}

export interface MisionTarjeta {
  id: string;
  titulo: string;
  /** Barrios que hay que dominar enteros. */
  completos: BarrioId[];
  /** Barrios donde alcanza con una cantidad de sectores. */
  parciales: MisionParcial[];
  /** Sectores propios en cualquier lado (0 = no aplica). */
  total: number;
}

export const CATALOGO_MISIONES: MisionTarjeta[] = [
  {
    id: "mis-muelles",
    titulo: "Dueño de los muelles",
    completos: ["puerto"],
    parciales: [{ barrio: "rieles", n: 3 }],
    total: 0,
  },
  {
    id: "mis-banca",
    titulo: "Romper la banca",
    completos: ["casino"],
    parciales: [{ barrio: "alta", n: 3 }],
    total: 0,
  },
  {
    id: "mis-luces-rojas",
    titulo: "Las luces rojas",
    completos: ["rojo"],
    parciales: [{ barrio: "bajo", n: 4 }],
    total: 0,
  },
  {
    id: "mis-alta-sociedad",
    titulo: "Alta sociedad",
    completos: ["alta"],
    parciales: [{ barrio: "casino", n: 3 }],
    total: 0,
  },
  {
    id: "mis-riel-a-riel",
    titulo: "De riel a riel",
    completos: ["rieles"],
    parciales: [
      { barrio: "puerto", n: 2 },
      { barrio: "bajo", n: 2 },
    ],
    total: 0,
  },
  {
    id: "mis-fondo",
    titulo: "El que manda en el fondo",
    completos: ["bajo"],
    parciales: [{ barrio: "rojo", n: 3 }],
    total: 0,
  },
  {
    id: "mis-eje-norte",
    titulo: "Eje norte",
    completos: ["puerto", "alta"],
    parciales: [],
    total: 0,
  },
  {
    id: "mis-eje-vicio",
    titulo: "El circuito del vicio",
    completos: ["casino", "rojo"],
    parciales: [],
    total: 0,
  },
  {
    id: "mis-cinturon",
    titulo: "Cinturón de hierro",
    completos: ["rieles", "bajo"],
    parciales: [],
    total: 0,
  },
  {
    id: "mis-contrabando",
    titulo: "Ruta de contrabando",
    completos: [],
    parciales: [
      { barrio: "puerto", n: 4 },
      { barrio: "rieles", n: 4 },
      { barrio: "bajo", n: 2 },
    ],
    total: 0,
  },
  {
    id: "mis-recaudacion",
    titulo: "La recaudación",
    completos: [],
    parciales: [
      { barrio: "casino", n: 4 },
      { barrio: "rojo", n: 3 },
      { barrio: "alta", n: 2 },
    ],
    total: 0,
  },
  {
    id: "mis-mano-larga",
    titulo: "Mano larga",
    completos: [],
    parciales: [
      { barrio: "puerto", n: 2 },
      { barrio: "casino", n: 2 },
      { barrio: "alta", n: 2 },
      { barrio: "bajo", n: 2 },
    ],
    total: 0,
  },
  {
    id: "mis-media-ciudad",
    titulo: "Media ciudad",
    completos: [],
    parciales: [],
    total: 22,
  },
  {
    id: "mis-tenaza",
    titulo: "La tenaza",
    completos: ["puerto"],
    parciales: [{ barrio: "casino", n: 3 }],
    total: 16,
  },
  {
    id: "mis-cerco",
    titulo: "Cerco a la zona alta",
    completos: [],
    parciales: [
      { barrio: "alta", n: 5 },
      { barrio: "rieles", n: 3 },
    ],
    total: 14,
  },
  {
    id: "mis-tres-frentes",
    titulo: "Tres frentes abiertos",
    completos: [],
    parciales: [
      { barrio: "rojo", n: 3 },
      { barrio: "bajo", n: 3 },
      { barrio: "rieles", n: 3 },
    ],
    total: 0,
  },
];

export function nombreBarrio(id: BarrioId) {
  return BARRIOS.find((b) => b.id === id)?.nombre ?? id;
}

/** Sectores del barrio que existen en el mapa de esta noche. */
export function sectoresDeBarrio(territories: Territorio[], barrio: BarrioId) {
  return territories.filter((t) => t.barrio === barrio).length;
}

/**
 * Recorta la tarjeta al mapa actual. Devuelve null si esta noche la ciudad no
 * da para cumplirla (barrio ausente o demasiado chico).
 */
export function adaptarMision(
  tarjeta: MisionTarjeta,
  territories: Territorio[],
): MisionTarjeta | null {
  const total = territories.length;
  const techo = Math.max(4, Math.floor(total * 0.6));

  for (const b of tarjeta.completos) {
    // Un barrio de un solo sector no es una conquista, es un trámite.
    if (sectoresDeBarrio(territories, b) < 2) return null;
  }

  const parciales: MisionParcial[] = [];
  for (const p of tarjeta.parciales) {
    const hay = sectoresDeBarrio(territories, p.barrio);
    if (hay < 1) return null;
    parciales.push({ barrio: p.barrio, n: Math.min(p.n, hay) });
  }

  // Lo pedido no puede superar lo que hay en el tablero.
  const pedido =
    tarjeta.completos.reduce((n, b) => n + sectoresDeBarrio(territories, b), 0) +
    parciales.reduce((n, p) => n + p.n, 0);
  if (pedido > techo) return null;

  const totalAjustado = tarjeta.total > 0 ? Math.max(pedido, Math.min(tarjeta.total, techo)) : 0;

  return { ...tarjeta, parciales, total: totalAjustado };
}

/** Texto de la tarjeta, ya adaptado al mapa. */
export function textoMision(m: MisionTarjeta): string {
  const partes: string[] = [];
  if (m.completos.length) {
    partes.push(`dominá por completo ${m.completos.map(nombreBarrio).join(" y ")}`);
  }
  for (const p of m.parciales) {
    partes.push(`tomá ${p.n} ${p.n === 1 ? "sector" : "sectores"} de ${nombreBarrio(p.barrio)}`);
  }
  if (m.total > 0) partes.push(`llegá a ${m.total} sectores propios`);
  const cuerpo = partes.join(", ").replace(/,([^,]*)$/, " y$1");
  return cuerpo.charAt(0).toUpperCase() + cuerpo.slice(1) + ".";
}
