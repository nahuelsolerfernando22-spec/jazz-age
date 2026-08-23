/**
 * Rutas del sindicato: cómo llego desde mis sectores hasta un blanco.
 *
 * Sirve para el indicador de ruta: dice si hay camino, por qué sectores paso
 * y si en el medio hay que cruzar un puente (y si ese puente está tomado).
 */

import type { Territorio } from "./sindicato-data";

export interface PasoRuta {
  id: string;
  /** El tramo que llega a este sector es un puente. */
  porPuente: boolean;
  /** Capo que tiene el retén en ese puente, si lo hay. */
  bloqueadoPor: number | null;
}

export interface Ruta {
  pasos: PasoRuta[];
  /** Hay camino usable (ningún tramo cortado por un retén rival). */
  transitable: boolean;
  /** Se cruza al menos un puente. */
  usaPuente: boolean;
}

interface Opciones {
  territorios: Territorio[];
  duenos: Record<string, number | undefined>;
  ownerId: number;
  destino: string;
  esPuente: (a: string, b: string) => boolean;
  bloqueadoPor: (a: string, b: string) => number | null;
}

/**
 * Camino más corto desde cualquier sector propio hasta el destino, pasando
 * únicamente por sectores propios. Devuelve null si no hay conexión.
 */
export function buscarRuta({
  territorios,
  duenos,
  ownerId,
  destino,
  esPuente,
  bloqueadoPor,
}: Opciones): Ruta | null {
  const porId = new Map(territorios.map((t) => [t.id, t]));
  if (!porId.has(destino)) return null;

  const origenes = territorios.filter((t) => duenos[t.id] === ownerId).map((t) => t.id);
  if (origenes.length === 0) return null;

  const previo = new Map<string, string | null>();
  const cola: string[] = [];
  for (const id of origenes) {
    previo.set(id, null);
    cola.push(id);
  }

  let hallado = false;
  while (cola.length && !hallado) {
    const cur = cola.shift()!;
    for (const v of porId.get(cur)?.vecinos ?? []) {
      if (previo.has(v) || !porId.has(v)) continue;
      if (v !== destino && duenos[v] !== ownerId) continue;
      previo.set(v, cur);
      if (v === destino) {
        hallado = true;
        break;
      }
      cola.push(v);
    }
  }

  if (!previo.has(destino)) return null;

  const cadena: string[] = [];
  let cur: string | null | undefined = destino;
  while (cur) {
    cadena.unshift(cur);
    cur = previo.get(cur) ?? null;
  }

  let usaPuente = false;
  let transitable = true;
  const pasos: PasoRuta[] = cadena.map((id, i) => {
    if (i === 0) return { id, porPuente: false, bloqueadoPor: null };
    const anterior = cadena[i - 1];
    const puente = esPuente(anterior, id);
    const reten = puente ? bloqueadoPor(anterior, id) : null;
    if (puente) usaPuente = true;
    if (reten !== null && reten !== ownerId) transitable = false;
    return { id, porPuente: puente, bloqueadoPor: reten };
  });

  return { pasos, transitable, usaPuente };
}
