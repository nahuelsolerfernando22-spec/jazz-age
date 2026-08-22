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
import { RASGO_POR_ID, type MapaRasgos, type RasgoId } from "@/lib/sindicato-rasgos";

export interface MisionParcial {
  barrio: BarrioId;
  n: number;
}

/** Requisito sobre las marcas del mapa de esta noche. */
export interface MisionRasgo {
  tipo: RasgoId;
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
  /** Sectores con cierta marca (fortines, túneles...). */
  rasgos?: MisionRasgo[];
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
  {
    id: "mis-llaves-ciudad",
    titulo: "Las llaves de la ciudad",
    completos: [],
    parciales: [
      { barrio: "puerto", n: 3 },
      { barrio: "rieles", n: 3 },
      { barrio: "casino", n: 3 },
    ],
    total: 0,
  },
  {
    id: "mis-nudo-sur",
    titulo: "El nudo del sur",
    completos: ["rieles"],
    parciales: [{ barrio: "rojo", n: 2 }],
    total: 12,
  },
  {
    id: "mis-doble-filo",
    titulo: "Doble filo",
    completos: ["bajo", "casino"],
    parciales: [],
    total: 0,
  },
  {
    id: "mis-puerto-rojo",
    titulo: "Del puerto al farol rojo",
    completos: [],
    parciales: [
      { barrio: "puerto", n: 5 },
      { barrio: "rojo", n: 4 },
    ],
    total: 0,
  },
  {
    id: "mis-corona",
    titulo: "La corona de la avenida",
    completos: ["alta"],
    parciales: [{ barrio: "bajo", n: 2 }],
    total: 13,
  },
  {
    id: "mis-vuelta-manzana",
    titulo: "La vuelta a la manzana",
    completos: [],
    parciales: [
      { barrio: "puerto", n: 1 },
      { barrio: "bajo", n: 1 },
      { barrio: "casino", n: 1 },
      { barrio: "rojo", n: 1 },
      { barrio: "alta", n: 1 },
      { barrio: "rieles", n: 1 },
    ],
    total: 0,
  },
  {
    id: "mis-fortines",
    titulo: "Cadena de fortines",
    completos: [],
    parciales: [],
    total: 0,
    rasgos: [{ tipo: "fortin", n: 3 }],
  },
  {
    id: "mis-red-tuneles",
    titulo: "La red subterránea",
    completos: [],
    parciales: [],
    total: 0,
    rasgos: [{ tipo: "tunel", n: 2 }],
  },
  {
    id: "mis-caja-negra",
    titulo: "La caja negra",
    completos: [],
    parciales: [{ barrio: "casino", n: 2 }],
    total: 0,
    rasgos: [{ tipo: "contrabando", n: 3 }],
  },
  {
    id: "mis-leva",
    titulo: "La leva",
    completos: [],
    parciales: [],
    total: 10,
    rasgos: [{ tipo: "cuartel", n: 2 }],
  },
  {
    id: "mis-limpieza",
    titulo: "Limpieza de ratas",
    completos: [],
    parciales: [{ barrio: "bajo", n: 3 }],
    total: 0,
    rasgos: [{ tipo: "nido", n: 2 }],
  },
  {
    id: "mis-cinco-esquinas",
    titulo: "Las cinco esquinas",
    completos: [],
    parciales: [
      { barrio: "casino", n: 2 },
      { barrio: "rojo", n: 2 },
      { barrio: "alta", n: 2 },
      { barrio: "rieles", n: 2 },
      { barrio: "puerto", n: 2 },
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
  rasgosMapa: MapaRasgos = {},
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

  // Requisitos de marcas: sólo valen si esta noche hay suficientes en el mapa.
  let rasgos: MisionRasgo[] | undefined;
  if (tarjeta.rasgos?.length) {
    const enMapa = territories.filter((t) => rasgosMapa[t.id]);
    rasgos = [];
    for (const r of tarjeta.rasgos) {
      const hay = enMapa.filter((t) => rasgosMapa[t.id] === r.tipo).length;
      if (hay < Math.min(2, r.n)) return null;
      rasgos.push({ tipo: r.tipo, n: Math.min(r.n, hay) });
    }
  }

  const totalAjustado = tarjeta.total > 0 ? Math.max(pedido, Math.min(tarjeta.total, techo)) : 0;

  return { ...tarjeta, parciales, total: totalAjustado, rasgos };
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
  for (const r of m.rasgos ?? []) {
    const info = RASGO_POR_ID[r.tipo];
    partes.push(`quedate con ${r.n} ${info.nombre.toLowerCase()}${r.n > 1 ? "es" : ""}`.replace("eses", "es"));
  }
  if (m.total > 0) partes.push(`llegá a ${m.total} sectores propios`);
  const cuerpo = partes.join(", ").replace(/,([^,]*)$/, " y$1");
  return cuerpo.charAt(0).toUpperCase() + cuerpo.slice(1) + ".";
}
