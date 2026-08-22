/**
 * Rasgos de sector: la capa roguelike del tablero.
 *
 * Cada noche la ciudad no sólo cambia de forma y de tamaño: algunos sectores
 * aparecen con una marca que altera cómo rinden y cómo se defienden. Eso obliga
 * a leer el mapa antes de repartir fichas en vez de jugar siempre igual.
 *
 * Todo es determinista por semilla, así una misma run se puede reproducir.
 */

import type { Territorio } from "./sindicato-data";
import { rngFromSeed, rngInt, type RngFn } from "./rng";

export type RasgoId = "fortin" | "contrabando" | "cuartel" | "tunel" | "ruina" | "nido";

export interface Rasgo {
  id: RasgoId;
  nombre: string;
  icono: string;
  desc: string;
  /** Dados extra (o de menos) que tira el defensor. */
  defensa: number;
  /** Fichas extra por turno para el dueño. */
  renta: number;
  /** Refuerzos extra por turno para el dueño. */
  refuerzo: number;
  /** Peso para el cerebro de los capos. */
  valorIA: number;
  /** Cuán seguido aparece al armar la ciudad. */
  peso: number;
}

export const RASGOS: Rasgo[] = [
  {
    id: "fortin",
    nombre: "Fortín",
    icono: "🛡",
    desc: "Muros viejos: el defensor tira un dado extra.",
    defensa: 1,
    renta: 0,
    refuerzo: 0,
    valorIA: 2.2,
    peso: 22,
  },
  {
    id: "contrabando",
    nombre: "Contrabando",
    icono: "📦",
    desc: "Mercadería que no figura: +25 fichas por turno.",
    defensa: 0,
    renta: 25,
    refuerzo: 0,
    valorIA: 1.8,
    peso: 20,
  },
  {
    id: "cuartel",
    nombre: "Cuartel",
    icono: "⚑",
    desc: "Gente siempre lista: +1 refuerzo por turno.",
    defensa: 0,
    renta: 0,
    refuerzo: 1,
    valorIA: 2.6,
    peso: 18,
  },
  {
    id: "tunel",
    nombre: "Túnel",
    icono: "⛓",
    desc: "Pasaje clandestino a otro túnel del mapa.",
    defensa: 0,
    renta: 10,
    refuerzo: 0,
    valorIA: 2.4,
    peso: 16,
  },
  {
    id: "nido",
    nombre: "Nido de ratas",
    icono: "🐀",
    desc: "Soplones por todos lados: +15 fichas y +1 refuerzo, pero se defiende mal.",
    defensa: -1,
    renta: 15,
    refuerzo: 1,
    valorIA: 1.4,
    peso: 12,
  },
  {
    id: "ruina",
    nombre: "Ruina",
    icono: "🕳",
    desc: "Escombros: no rinde nada y el defensor tira un dado menos.",
    defensa: -1,
    renta: -5,
    refuerzo: 0,
    valorIA: 0.2,
    peso: 12,
  },
];

export const RASGO_POR_ID: Record<RasgoId, Rasgo> = Object.fromEntries(
  RASGOS.map((r) => [r.id, r]),
) as Record<RasgoId, Rasgo>;

export type MapaRasgos = Record<string, RasgoId>;

function elegirRasgo(rng: RngFn): RasgoId {
  const total = RASGOS.reduce((n, r) => n + r.peso, 0);
  let x = rng() * total;
  for (const r of RASGOS) {
    x -= r.peso;
    if (x <= 0) return r.id;
  }
  return RASGOS[0].id;
}

/**
 * Marca entre un tercio y algo menos de la mitad de los sectores. Los túneles
 * siempre quedan en cantidad par: si no, no hay con quién conectarlos.
 */
export function generarRasgos(seed: string, territorios: Territorio[]): MapaRasgos {
  const rng = rngFromSeed(`rasgos:${seed}`);
  const orden = [...territorios].sort((a, b) => (a.id < b.id ? -1 : 1));
  const cuantos = Math.max(2, Math.round(orden.length * (0.3 + rng() * 0.16)));

  const barajado = [...orden];
  for (let i = barajado.length - 1; i > 0; i--) {
    const j = rngInt(rng, 0, i);
    [barajado[i], barajado[j]] = [barajado[j], barajado[i]];
  }

  const out: MapaRasgos = {};
  for (let i = 0; i < cuantos && i < barajado.length; i++) {
    out[barajado[i].id] = elegirRasgo(rng);
  }

  // Túneles impares: al último lo pasamos a contrabando.
  const tuneles = Object.entries(out).filter(([, r]) => r === "tunel");
  if (tuneles.length === 1) out[tuneles[0][0]] = "contrabando";
  else if (tuneles.length % 2 === 1) out[tuneles[tuneles.length - 1][0]] = "cuartel";

  return out;
}

/**
 * Conecta los túneles de a pares (siempre entre sectores que no se tocan) y
 * devuelve los territorios con esa vecindad extra ya cargada.
 */
export function aplicarTuneles(
  seed: string,
  territorios: Territorio[],
  rasgos: MapaRasgos,
): { territorios: Territorio[]; pares: Array<[string, string]> } {
  const rng = rngFromSeed(`tuneles:${seed}`);
  const ids = territorios
    .filter((t) => rasgos[t.id] === "tunel")
    .map((t) => t.id)
    .sort();
  for (let i = ids.length - 1; i > 0; i--) {
    const j = rngInt(rng, 0, i);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  const porId = new Map(territorios.map((t) => [t.id, { ...t, vecinos: [...t.vecinos] }]));
  const pares: Array<[string, string]> = [];

  const libres = [...ids];
  while (libres.length >= 2) {
    const a = libres.shift()!;
    const idx = libres.findIndex((b) => !porId.get(a)!.vecinos.includes(b));
    const b = libres.splice(idx >= 0 ? idx : 0, 1)[0];
    if (!a || !b) break;
    const ta = porId.get(a)!;
    const tb = porId.get(b)!;
    if (!ta.vecinos.includes(b)) ta.vecinos.push(b);
    if (!tb.vecinos.includes(a)) tb.vecinos.push(a);
    pares.push([a, b]);
  }

  return { territorios: [...porId.values()], pares };
}

/** Dados que tira el defensor teniendo en cuenta el rasgo del sector. */
export function dadosDefensa(tropas: number, rasgo?: RasgoId): number {
  const mod = rasgo ? RASGO_POR_ID[rasgo].defensa : 0;
  return Math.max(1, Math.min(3, Math.min(3, tropas) + mod));
}

/** Fichas y refuerzos extra que dan los rasgos de una lista de sectores. */
export function bonosDeRasgos(ids: string[], rasgos: MapaRasgos) {
  let renta = 0;
  let refuerzo = 0;
  for (const id of ids) {
    const r = rasgos[id];
    if (!r) continue;
    renta += RASGO_POR_ID[r].renta;
    refuerzo += RASGO_POR_ID[r].refuerzo;
  }
  return { renta, refuerzo };
}
