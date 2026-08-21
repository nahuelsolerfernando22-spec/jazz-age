/**
 * Cerebro de los capos del Sindicato.
 *
 * El bot viejo era un matón: reforzaba la frontera al voleo y pegaba tres
 * veces al vecino más flaco. Este módulo le da cabeza de estratega:
 *
 *  - Calcula la probabilidad real de tomar un sector (enumerando los dados
 *    del asalto, igual que `tirarAsalto`), así no ataca de prepo.
 *  - Valora cada barrio: completar un barrio da bono de refuerzos, y romper
 *    el barrio ajeno se lo saca. Eso pesa en dónde despliega y a quién pega.
 *  - Mide amenaza (tropas enemigas que tocan cada sector propio) para no
 *    dejar la puerta abierta atrás.
 *  - Encadena asaltos cuando el barrio queda a tiro y se planta cuando la
 *    chance baja del umbral de su nivel.
 *  - Fortifica moviendo tropas del interior más dormido a la frontera más
 *    caliente, buscando el camino por territorio propio (BFS).
 *
 * Todo es puro: recibe una foto del tablero y devuelve un plan. La store
 * ejecuta ese plan paso a paso para que se vea en pantalla.
 */

import type { Territorio, BarrioId } from "@/lib/sindicato-data";

export interface AiConquest {
  id: string;
  troops: number;
  ownerId: number;
}

export interface AiBoard {
  botId: number;
  conquests: Record<string, AiConquest>;
  territories: Territorio[];
}

export type AiNivel = "matón" | "capo" | "consejero";

export interface NivelTuning {
  /** Chance mínima de tomar el sector para animarse al asalto. */
  minOdds: number;
  /** Asaltos máximos por turno. */
  maxAsaltos: number;
  /** Cuánto pesa completar o romper un barrio. */
  barrio: number;
}

export const NIVEL_TUNING: Record<AiNivel, NivelTuning> = {
  matón: { minOdds: 0.55, maxAsaltos: 2, barrio: 0.5 },
  capo: { minOdds: 0.45, maxAsaltos: 4, barrio: 1 },
  consejero: { minOdds: 0.38, maxAsaltos: 6, barrio: 1.6 },
};

/* ------------------------------------------------------------------ */
/* Probabilidad de asalto                                              */
/* ------------------------------------------------------------------ */

/** Distribución de bajas de una tirada con a y d dados (máx 3 cada uno). */
function rondaDist(a: number, d: number): Array<{ p: number; bajasA: number; bajasD: number }> {
  const pares = Math.min(a, d);
  const acc = new Map<string, number>();
  const total = Math.pow(6, a + d);
  const tiradas = (n: number): number[][] => {
    if (n === 0) return [[]];
    const prev = tiradas(n - 1);
    const out: number[][] = [];
    for (const p of prev) for (let v = 1; v <= 6; v++) out.push([...p, v]);
    return out;
  };
  for (const ta of tiradas(a)) {
    const sa = [...ta].sort((x, y) => y - x);
    for (const td of tiradas(d)) {
      const sd = [...td].sort((x, y) => y - x);
      let bajasA = 0;
      let bajasD = 0;
      for (let i = 0; i < pares; i++) {
        if (sa[i] > sd[i]) bajasD++;
        else bajasA++;
      }
      const k = `${bajasA}:${bajasD}`;
      acc.set(k, (acc.get(k) ?? 0) + 1);
    }
  }
  return [...acc.entries()].map(([k, c]) => {
    const [bajasA, bajasD] = k.split(":").map(Number);
    return { p: c / total, bajasA, bajasD };
  });
}

const distCache = new Map<string, ReturnType<typeof rondaDist>>();
function dist(a: number, d: number) {
  const k = `${a}:${d}`;
  let v = distCache.get(k);
  if (!v) {
    v = rondaDist(a, d);
    distCache.set(k, v);
  }
  return v;
}

const oddsCache = new Map<string, number>();

/**
 * Probabilidad de que el atacante termine tomando el sector si insiste
 * hasta quedarse con una sola tropa o hasta limpiar la defensa.
 * `tropasAtacante` incluye la tropa que queda siempre de guarnición.
 */
export function probTomar(tropasAtacante: number, tropasDefensor: number): number {
  const atacan = tropasAtacante - 1;
  if (atacan <= 0) return 0;
  if (tropasDefensor <= 0) return 1;
  const key = `${atacan}|${tropasDefensor}`;
  const hit = oddsCache.get(key);
  if (hit !== undefined) return hit;

  const a = Math.min(3, atacan);
  const d = Math.min(3, tropasDefensor);
  let p = 0;
  for (const r of dist(a, d)) {
    const na = atacan - r.bajasA;
    const nd = tropasDefensor - r.bajasD;
    if (nd <= 0) p += r.p;
    else if (na <= 0) continue;
    else p += r.p * probTomar(na + 1, nd);
  }
  oddsCache.set(key, p);
  return p;
}

/* ------------------------------------------------------------------ */
/* Lectura del tablero                                                 */
/* ------------------------------------------------------------------ */

function vecinosDe(b: AiBoard, id: string): string[] {
  return b.territories.find((t) => t.id === id)?.vecinos ?? [];
}

function barrioDe(b: AiBoard, id: string): BarrioId | undefined {
  return b.territories.find((t) => t.id === id)?.barrio;
}

export interface BarrioStatus {
  barrio: BarrioId;
  total: number;
  propios: number;
  faltan: number;
  /** true si un rival lo tiene completo (romperlo le saca el bono). */
  ajenoCompleto: number | null;
}

export function leerBarrios(b: AiBoard): Record<string, BarrioStatus> {
  const out: Record<string, BarrioStatus> = {};
  for (const t of b.territories) {
    const st = (out[t.barrio] ??= {
      barrio: t.barrio,
      total: 0,
      propios: 0,
      faltan: 0,
      ajenoCompleto: null,
    });
    st.total++;
    if (b.conquests[t.id]?.ownerId === b.botId) st.propios++;
  }
  for (const st of Object.values(out)) {
    st.faltan = st.total - st.propios;
    const dueños = new Set(
      b.territories.filter((t) => t.barrio === st.barrio).map((t) => b.conquests[t.id]?.ownerId),
    );
    const único = dueños.size === 1 ? [...dueños][0] : undefined;
    st.ajenoCompleto = único !== undefined && único !== b.botId ? único : null;
  }
  return out;
}

/** Tropas enemigas que amenazan un sector propio. */
export function amenaza(b: AiBoard, id: string): number {
  return vecinosDe(b, id).reduce((acc, n) => {
    const c = b.conquests[n];
    if (!c || c.ownerId === b.botId) return acc;
    return acc + c.troops;
  }, 0);
}

/** Valor estratégico de un sector para el bot (0..~10). */
export function valorSector(b: AiBoard, id: string, tuning = NIVEL_TUNING.capo): number {
  const barrios = leerBarrios(b);
  const bar = barrioDe(b, id);
  const st = bar ? barrios[bar] : undefined;
  let v = 1;
  if (st) {
    // Cuanto menos falta para completar el barrio, más vale cada pieza.
    v += tuning.barrio * (3 - Math.min(3, st.faltan));
    if (st.faltan === 1) v += tuning.barrio * 2.5;
    if (st.ajenoCompleto !== null) v += tuning.barrio * 2; // romper bono ajeno
  }
  // Los cruces (muchos vecinos) mandan más que los rincones.
  v += vecinosDe(b, id).length * 0.25;
  return v;
}

/* ------------------------------------------------------------------ */
/* Planes                                                              */
/* ------------------------------------------------------------------ */

export interface DeployStep {
  id: string;
  troops: number;
}

/**
 * Reparte los refuerzos entre frontera amenazada y sectores desde donde
 * conviene abrir el próximo asalto.
 */
export function planDeployment(b: AiBoard, refuerzos: number, tuning = NIVEL_TUNING.capo): DeployStep[] {
  if (refuerzos <= 0) return [];
  const propios = Object.values(b.conquests).filter((c) => c.ownerId === b.botId);
  const frontera = propios.filter((c) =>
    vecinosDe(b, c.id).some((n) => b.conquests[n] && b.conquests[n].ownerId !== b.botId),
  );
  const base = frontera.length ? frontera : propios;
  if (!base.length) return [];

  const puntaje = new Map<string, number>();
  for (const c of base) {
    const th = amenaza(b, c.id);
    const defensa = th - c.troops; // negativo = está cubierto
    // Objetivo más apetecible al lado.
    const mejorObjetivo = vecinosDe(b, c.id)
      .filter((n) => b.conquests[n] && b.conquests[n].ownerId !== b.botId)
      .map((n) => valorSector(b, n, tuning) - b.conquests[n].troops * 0.6)
      .sort((x, y) => y - x)[0] ?? 0;
    puntaje.set(c.id, defensa * 1.2 + mejorObjetivo + valorSector(b, c.id, tuning) * 0.5);
  }

  // Reparto goloso: siempre al sector con mejor puntaje marginal.
  const asignado: Record<string, number> = {};
  const tropasSim: Record<string, number> = Object.fromEntries(base.map((c) => [c.id, c.troops]));
  for (let i = 0; i < refuerzos; i++) {
    let mejor = base[0].id;
    let mejorVal = -Infinity;
    for (const c of base) {
      const val = (puntaje.get(c.id) ?? 0) - tropasSim[c.id] * 0.8;
      if (val > mejorVal) {
        mejorVal = val;
        mejor = c.id;
      }
    }
    tropasSim[mejor]++;
    asignado[mejor] = (asignado[mejor] ?? 0) + 1;
  }
  return Object.entries(asignado).map(([id, troops]) => ({ id, troops }));
}

export interface AttackPlan {
  from: string;
  to: string;
  odds: number;
  valor: number;
}

/**
 * Elige el mejor asalto disponible según probabilidad × valor del sector,
 * descontando el riesgo de dejar el origen desguarnecido.
 */
export function mejorAsalto(
  b: AiBoard,
  tuning = NIVEL_TUNING.capo,
  puedeAtacar: (from: string, to: string) => boolean = () => true,
): AttackPlan | null {
  let mejor: AttackPlan | null = null;
  for (const c of Object.values(b.conquests)) {
    if (c.ownerId !== b.botId || c.troops < 2) continue;
    for (const n of vecinosDe(b, c.id)) {
      const def = b.conquests[n];
      if (!def || def.ownerId === b.botId) continue;
      if (!puedeAtacar(c.id, n)) continue;
      const odds = probTomar(c.troops, def.troops);
      if (odds < tuning.minOdds) continue;
      const valor = valorSector(b, n, tuning);
      // Si al irme dejo el origen expuesto, castigo la jugada.
      const expuesto = Math.max(0, amenaza(b, c.id) - 1) * 0.15;
      const score = odds * valor - expuesto;
      if (!mejor || score > mejor.odds * mejor.valor) {
        mejor = { from: c.id, to: n, odds, valor: score };
      }
    }
  }
  return mejor;
}

export interface FortifyPlan {
  from: string;
  to: string;
  amount: number;
}

/** Camino más corto por territorio propio (para mover tropas de verdad). */
function caminoPropio(b: AiBoard, from: string, to: string): string[] | null {
  const prev = new Map<string, string>();
  const q = [from];
  const visto = new Set([from]);
  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) {
      const path = [cur];
      let p = cur;
      while (prev.has(p)) {
        p = prev.get(p)!;
        path.unshift(p);
      }
      return path;
    }
    for (const n of vecinosDe(b, cur)) {
      if (visto.has(n)) continue;
      if (b.conquests[n]?.ownerId !== b.botId) continue;
      visto.add(n);
      prev.set(n, cur);
      q.push(n);
    }
  }
  return null;
}

/**
 * Saca tropas del sector propio más tranquilo y las manda al frente más
 * caliente, siempre que estén conectados por territorio propio.
 */
export function planFortify(b: AiBoard, tuning = NIVEL_TUNING.capo): FortifyPlan | null {
  const propios = Object.values(b.conquests).filter((c) => c.ownerId === b.botId);
  if (propios.length < 2) return null;

  const conAmenaza = propios.map((c) => ({ c, th: amenaza(b, c.id) }));
  const dormidos = conAmenaza
    .filter((x) => x.th === 0 && x.c.troops > 1)
    .sort((a, z) => z.c.troops - a.c.troops);
  const frentes = conAmenaza
    .filter((x) => x.th > 0)
    .sort(
      (a, z) =>
        z.th - z.c.troops + valorSector(b, z.c.id, tuning) - (a.th - a.c.troops + valorSector(b, a.c.id, tuning)),
    );
  if (!dormidos.length || !frentes.length) return null;

  for (const origen of dormidos) {
    for (const destino of frentes) {
      if (origen.c.id === destino.c.id) continue;
      const path = caminoPropio(b, origen.c.id, destino.c.id);
      if (!path || path.length < 2) continue;
      // Se mueve al vecino siguiente del camino: la store sólo permite
      // movimientos entre sectores adyacentes.
      const siguiente = path[1];
      const amount = origen.c.troops - 1;
      if (amount <= 0) continue;
      return { from: origen.c.id, to: siguiente, amount };
    }
  }
  return null;
}

/** ¿Le conviene canjear naipes ahora? (o está obligado por tener 5+). */
export function debeCanjear(cantidadNaipes: number, hayTrio: boolean): boolean {
  if (!hayTrio) return false;
  return cantidadNaipes >= 3;
}
