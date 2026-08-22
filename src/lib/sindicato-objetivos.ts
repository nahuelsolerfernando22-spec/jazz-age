/**
 * Objetivos secretos al estilo T.E.G.
 *
 * Cada capo recibe un objetivo tapado al empezar la noche. Se gana cumpliéndolo
 * o, si eso se vuelve imposible, alcanzando el objetivo común de la mesa
 * (dominar N sectores). El objetivo de destrucción hereda la regla clásica: si
 * al rival lo bajó otro, el tuyo pasa a ser el objetivo común.
 */

import { BARRIOS, type BarrioId, type Territorio } from "@/lib/sindicato-data";
import {
  CATALOGO_MISIONES,
  adaptarMision,
  textoMision,
  type MisionParcial,
} from "@/lib/sindicato-misiones";

export type Objetivo =
  | {
      /** Tarjeta del catálogo fijo, ya recortada al mapa de esta noche. */
      kind: "mision";
      id: string;
      titulo: string;
      desc: string;
      completos: BarrioId[];
      parciales: MisionParcial[];
      total: number;
    }
  | { kind: "barrios"; id: string; titulo: string; desc: string; barrios: BarrioId[] }
  | {
      kind: "barrios-mas";
      id: string;
      titulo: string;
      desc: string;
      barrios: BarrioId[];
      extra: number;
    }
  | { kind: "cantidad"; id: string; titulo: string; desc: string; n: number }
  | { kind: "destruir"; id: string; titulo: string; desc: string; targetId: number }
  | { kind: "frentes"; id: string; titulo: string; desc: string; barrios: number; porBarrio: number };

export interface ObjetivoBoard {
  conquests: Record<string, { id: string; ownerId: number; troops: number }>;
  territories: Territorio[];
  /** Jugadores vivos: id -> eliminado */
  eliminados: Record<number, boolean>;
  /** Objetivo común de la mesa (cantidad de sectores). */
  comun: number;
}

function rngDe(semilla: string) {
  let h = 2166136261;
  for (let i = 0; i < semilla.length; i++) {
    h ^= semilla.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function nombreBarrio(id: BarrioId) {
  return BARRIOS.find((b) => b.id === id)?.nombre ?? id;
}

function barriosActivos(territories: Territorio[]): BarrioId[] {
  const set = new Set<BarrioId>();
  for (const t of territories) set.add(t.barrio);
  return [...set];
}

function terrsDeBarrio(territories: Territorio[], barrio: BarrioId) {
  return territories.filter((t) => t.barrio === barrio);
}

/** ¿Cuántos sectores tiene el jugador? */
function misSectores(b: ObjetivoBoard, playerId: number) {
  return Object.values(b.conquests).filter((c) => c.ownerId === playerId);
}

function dominaBarrio(b: ObjetivoBoard, playerId: number, barrio: BarrioId) {
  const terrs = terrsDeBarrio(b.territories, barrio);
  return terrs.length > 0 && terrs.every((t) => b.conquests[t.id]?.ownerId === playerId);
}

/** Misiones del catálogo que esta ciudad permite cumplir, ya recortadas. */
export function misionesPosibles(territories: Territorio[]) {
  return CATALOGO_MISIONES.map((m) => adaptarMision(m, territories)).filter(
    (m): m is NonNullable<typeof m> => m !== null,
  );
}

/**
 * Reparte una tarjeta tapada a cada capo, determinista por semilla.
 *
 * Primero se barajan las misiones del catálogo que el mapa de esta noche
 * habilita; si la ciudad salió chica o partida y no alcanzan las tarjetas, se
 * completa con "ajuste de cuentas" o "fuerza bruta".
 */
export function repartirObjetivos(
  semilla: string,
  playerIds: number[],
  territories: Territorio[],
  comun: number,
): Record<number, Objetivo> {
  const rnd = rngDe(`obj:${semilla}:${playerIds.length}`);
  const total = territories.length;
  const out: Record<number, Objetivo> = {};

  // Barajado determinista de las tarjetas viables.
  const mazo = misionesPosibles(territories)
    .map((m) => ({ m, k: rnd() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.m);

  playerIds.forEach((pid) => {
    const otros = playerIds.filter((p) => p !== pid);
    const tirada = rnd();

    // Una de cada cinco tarjetas es de destrucción, como en la mesa original.
    if (tirada < 0.2 && otros.length > 0) {
      const target = otros[Math.floor(rnd() * otros.length)];
      out[pid] = {
        kind: "destruir",
        id: `obj-d-${pid}`,
        titulo: "Ajuste de cuentas",
        desc: `Borrá del mapa al capo #${target + 1}. Si lo baja otro, te vale el objetivo común.`,
        targetId: target,
      };
      return;
    }

    const tarjeta = mazo.pop();
    if (tarjeta) {
      out[pid] = {
        kind: "mision",
        id: `${tarjeta.id}-${pid}`,
        titulo: tarjeta.titulo,
        desc: textoMision(tarjeta),
        completos: tarjeta.completos,
        parciales: tarjeta.parciales,
        total: tarjeta.total,
      };
      return;
    }

    const n = Math.max(comun, Math.ceil(total * 0.55));
    out[pid] = {
      kind: "cantidad",
      id: `obj-c-${pid}`,
      titulo: "Fuerza bruta",
      desc: `Controlá ${n} sectores.`,
      n,
    };
  });

  return out;
}

export interface ProgresoObjetivo {
  cumplido: boolean;
  /** 0..1 */
  progreso: number;
  detalle: string;
}

/** Evalúa el objetivo de un jugador contra el tablero. */
export function evaluarObjetivo(
  obj: Objetivo | null,
  b: ObjetivoBoard,
  playerId: number,
): ProgresoObjetivo {
  const mios = misSectores(b, playerId);
  const comunCumplido = mios.length >= b.comun;
  const comunProg = Math.min(1, mios.length / Math.max(1, b.comun));

  if (!obj) {
    return {
      cumplido: comunCumplido,
      progreso: comunProg,
      detalle: `${mios.length}/${b.comun} sectores (objetivo común)`,
    };
  }

  switch (obj.kind) {
    case "barrios": {
      const hechos = obj.barrios.filter((x) => dominaBarrio(b, playerId, x));
      return {
        cumplido: hechos.length === obj.barrios.length || comunCumplido,
        progreso: Math.max(hechos.length / obj.barrios.length, comunProg),
        detalle: `${hechos.length}/${obj.barrios.length} barrios dominados`,
      };
    }
    case "barrios-mas": {
      const hechos = obj.barrios.filter((x) => dominaBarrio(b, playerId, x));
      const enBarrios = new Set(
        b.territories.filter((t) => obj.barrios.includes(t.barrio)).map((t) => t.id),
      );
      const fuera = mios.filter((c) => !enBarrios.has(c.id)).length;
      const ok = hechos.length === obj.barrios.length && fuera >= obj.extra;
      const prog =
        (hechos.length / obj.barrios.length) * 0.7 + Math.min(1, fuera / obj.extra) * 0.3;
      return {
        cumplido: ok || comunCumplido,
        progreso: Math.max(prog, comunProg),
        detalle: `${hechos.length}/${obj.barrios.length} barrios · ${Math.min(fuera, obj.extra)}/${obj.extra} sectores extra`,
      };
    }
    case "cantidad": {
      return {
        cumplido: mios.length >= obj.n,
        progreso: Math.min(1, mios.length / obj.n),
        detalle: `${mios.length}/${obj.n} sectores`,
      };
    }
    case "frentes": {
      const porBarrio = new Map<BarrioId, number>();
      for (const c of mios) {
        const t = b.territories.find((x) => x.id === c.id);
        if (!t) continue;
        porBarrio.set(t.barrio, (porBarrio.get(t.barrio) ?? 0) + 1);
      }
      const frentes = [...porBarrio.values()].filter((n) => n >= obj.porBarrio).length;
      const meta = Math.ceil(b.territories.length * 0.4);
      const ok = frentes >= obj.barrios && mios.length >= meta;
      return {
        cumplido: ok || comunCumplido,
        progreso: Math.max(
          Math.min(1, frentes / obj.barrios) * 0.5 + Math.min(1, mios.length / meta) * 0.5,
          comunProg,
        ),
        detalle: `${frentes}/${obj.barrios} barrios con presencia · ${mios.length}/${meta} sectores`,
      };
    }
    case "destruir": {
      const vivo = !b.eliminados[obj.targetId];
      const suyos = Object.values(b.conquests).filter((c) => c.ownerId === obj.targetId).length;
      if (!vivo) {
        // Regla T.E.G.: si lo bajó otro, pasás al objetivo común.
        return {
          cumplido: comunCumplido,
          progreso: comunProg,
          detalle: `Rival ya caído · ${mios.length}/${b.comun} sectores (objetivo común)`,
        };
      }
      return {
        cumplido: false,
        progreso: Math.max(comunProg, suyos === 0 ? 1 : 1 - Math.min(1, suyos / 8)),
        detalle: `Al capo #${obj.targetId + 1} le quedan ${suyos} sectores`,
      };
    }
  }
}
