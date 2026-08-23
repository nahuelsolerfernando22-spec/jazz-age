import { TERRITORIOS, type Territorio, type BarrioId, type Point, BARRIOS } from "./sindicato-data";
import { rngFromSeed, rngInt, type RngFn } from "./rng";
import { aplicarTuneles, generarRasgos, type MapaRasgos } from "./sindicato-rasgos";

/** Formas posibles de la ciudad en una noche. */
export type VarianteMapa =
  | "mancha"
  | "archipielago"
  | "corredor"
  | "peninsula"
  | "anillo"
  | "cuna";

export const VARIANTE_NOMBRE: Record<VarianteMapa, string> = {
  mancha: "Mancha cerrada",
  archipielago: "Archipiélago",
  corredor: "Corredor largo",
  peninsula: "Península",
  anillo: "Anillo de barrios",
  cuna: "Cuña partida",
};

export interface ProceduralMap {
  territorios: Territorio[];
  seed: string;
  variante: VarianteMapa;
  /** Marcas de sector de esta noche (fortín, contrabando, túnel...). */
  rasgos: MapaRasgos;
  /** Pares de túneles conectados. */
  tuneles: Array<[string, string]>;
  /** Puentes tendidos para que ningún sector quede aislado. */
  puentes: Array<[string, string]>;
}


/** Vecindad simétrica: en los datos hay lindes cargadas de un solo lado. */
const VECINOS_POR_ID: Record<string, string[]> = (() => {
  const m: Record<string, Set<string>> = Object.fromEntries(
    TERRITORIOS.map((t) => [t.id, new Set<string>()]),
  );
  for (const t of TERRITORIOS) {
    for (const v of t.vecinos) {
      if (!m[v]) continue;
      m[t.id].add(v);
      m[v].add(t.id);
    }
  }
  return Object.fromEntries(Object.entries(m).map(([k, s]) => [k, [...s]]));
})();

/** Componente conexa más grande dentro de un conjunto de sectores. */
function mayorComponente(ids: Set<string>): Set<string> {
  const visto = new Set<string>();
  let mejor = new Set<string>();
  for (const raiz of ids) {
    if (visto.has(raiz)) continue;
    const comp = new Set<string>([raiz]);
    const cola = [raiz];
    visto.add(raiz);
    while (cola.length) {
      const cur = cola.pop()!;
      for (const v of VECINOS_POR_ID[cur] ?? []) {
        if (!ids.has(v) || visto.has(v)) continue;
        visto.add(v);
        comp.add(v);
        cola.push(v);
      }
    }
    if (comp.size > mejor.size) mejor = comp;
  }
  return mejor;
}

/** Cuántos vecinos ya seleccionados tiene un candidato (mide "compacidad"). */
function adherencia(id: string, sel: Set<string>) {
  return (VECINOS_POR_ID[id] ?? []).filter((v) => sel.has(v)).length;
}

function crecer(sel: Set<string>, objetivo: number, rng: RngFn, variante: VarianteMapa) {
  const frontera = new Set<string>();
  for (const id of sel) {
    for (const v of VECINOS_POR_ID[id] ?? []) if (!sel.has(v)) frontera.add(v);
  }

  while (sel.size < objetivo && frontera.size > 0) {
    const cand = [...frontera];
    let elegido: string;

    if (variante === "corredor" || variante === "peninsula") {
      // Prefiere bordes poco pegados: la ciudad sale larga y angosta.
      const min = Math.min(...cand.map((c) => adherencia(c, sel)));
      const flacos = cand.filter((c) => adherencia(c, sel) === min);
      elegido = flacos[rngInt(rng, 0, flacos.length - 1)];
    } else if (variante === "mancha" || variante === "cuna") {
      // Prefiere bordes muy pegados: la ciudad sale redonda y densa.
      const max = Math.max(...cand.map((c) => adherencia(c, sel)));
      const gordos = cand.filter((c) => adherencia(c, sel) === max);
      elegido = gordos[rngInt(rng, 0, gordos.length - 1)];
    } else if (variante === "anillo") {
      // Alterna pegado y suelto: la ciudad se cierra sobre sí misma.
      const usarBorde = sel.size % 3 === 0;
      const vals = cand.map((c) => adherencia(c, sel));
      const objetivo = usarBorde ? Math.min(...vals) : Math.max(...vals);
      const filtrados = cand.filter((c) => adherencia(c, sel) === objetivo);
      elegido = filtrados[rngInt(rng, 0, filtrados.length - 1)];
    } else {
      elegido = cand[rngInt(rng, 0, cand.length - 1)];
    }

    sel.add(elegido);
    frontera.delete(elegido);
    for (const v of VECINOS_POR_ID[elegido] ?? []) if (!sel.has(v)) frontera.add(v);
  }
}

/**
 * Arma la ciudad de la noche: un recorte conexo del mapa completo, distinto en
 * cada partida tanto en tamaño como en forma (mancha, corredor o archipiélago
 * de núcleos que terminan pegándose).
 */
export function generateSubMap(seed: string, targetCount: number): ProceduralMap {
  const rng = rngFromSeed(`map-gen:${seed}`);
  const objetivo = Math.max(8, Math.min(TERRITORIOS.length, targetCount));

  const barajaVariantes: VarianteMapa[] = [
    "mancha",
    "mancha",
    "corredor",
    "archipielago",
    "peninsula",
    "anillo",
    "cuna",
  ];
  const variante = barajaVariantes[rngInt(rng, 0, barajaVariantes.length - 1)];

  const nucleos =
    variante === "archipielago" ? rngInt(rng, 2, 4) : variante === "cuna" ? 2 : 1;
  const sel = new Set<string>();
  for (let i = 0; i < nucleos; i++) {
    sel.add(TERRITORIOS[rngInt(rng, 0, TERRITORIOS.length - 1)].id);
  }

  crecer(sel, objetivo, rng, variante);

  // Ya no descartamos las islas: se quedan y después se unen con puentes.
  if (mayorComponente(sel).size < objetivo) crecer(sel, objetivo, rng, variante);
  const final = sel;

  const base: Territorio[] = TERRITORIOS.filter((t) => final.has(t.id)).map((t) => ({
    ...t,
    vecinos: (VECINOS_POR_ID[t.id] ?? []).filter((v) => final.has(v)),
  }));

  const rasgos = generarRasgos(`${seed}:${variante}`, base);
  const { territorios: conTuneles, pares } = aplicarTuneles(seed, base, rasgos);
  const { territorios, puentes } = tenderPuentes(conTuneles);

  return { territorios, seed, variante, rasgos, tuneles: pares, puentes };
}

function centroide(t: Territorio): Point {
  return t.points.reduce(
    (acc, p) => ({ x: acc.x + p.x / t.points.length, y: acc.y + p.y / t.points.length }),
    { x: 0, y: 0 },
  );
}

/**
 * Tiende puentes hasta que la ciudad sea una sola pieza y ningún sector quede
 * con una única salida. Sin esto quedaban barrios imposibles de atacar.
 */
export function tenderPuentes(territorios: Territorio[]): {
  territorios: Territorio[];
  puentes: Array<[string, string]>;
} {
  const porId = new Map(territorios.map((t) => [t.id, { ...t, vecinos: [...t.vecinos] }]));
  const centros = new Map([...porId.values()].map((t) => [t.id, centroide(t)] as const));
  const puentes: Array<[string, string]> = [];

  const dist = (a: string, b: string) => {
    const pa = centros.get(a)!;
    const pb = centros.get(b)!;
    return Math.hypot(pa.x - pb.x, pa.y - pb.y);
  };

  const unir = (a: string, b: string) => {
    const ta = porId.get(a)!;
    const tb = porId.get(b)!;
    if (ta.vecinos.includes(b)) return;
    ta.vecinos.push(b);
    tb.vecinos.push(a);
    puentes.push([a, b]);
  };

  // Componentes actuales del grafo.
  const componentes = (): string[][] => {
    const visto = new Set<string>();
    const out: string[][] = [];
    for (const id of porId.keys()) {
      if (visto.has(id)) continue;
      const comp: string[] = [id];
      const cola = [id];
      visto.add(id);
      while (cola.length) {
        const cur = cola.pop()!;
        for (const v of porId.get(cur)?.vecinos ?? []) {
          if (!porId.has(v) || visto.has(v)) continue;
          visto.add(v);
          comp.push(v);
          cola.push(v);
        }
      }
      out.push(comp);
    }
    return out;
  };

  // 1) Unir islas: siempre por el par de sectores más cercano entre ellas.
  let comps = componentes();
  while (comps.length > 1) {
    comps.sort((a, b) => b.length - a.length);
    const principal = comps[0];
    let mejor: [string, string] | null = null;
    let mejorD = Infinity;
    for (let i = 1; i < comps.length; i++) {
      for (const a of principal) {
        for (const b of comps[i]) {
          const d = dist(a, b);
          if (d < mejorD) {
            mejorD = d;
            mejor = [a, b];
          }
        }
      }
    }
    if (!mejor) break;
    unir(mejor[0], mejor[1]);
    comps = componentes();
  }

  // 2) Callejones sin salida: todo sector debe tener al menos dos accesos.
  for (const t of porId.values()) {
    if (t.vecinos.length >= 2) continue;
    const cand = [...porId.keys()]
      .filter((id) => id !== t.id && !t.vecinos.includes(id))
      .sort((a, b) => dist(t.id, a) - dist(t.id, b))[0];
    if (cand) unir(t.id, cand);
  }

  return { territorios: [...porId.values()], puentes };
}


export function getActiveBarrios(territorios: Territorio[]) {
  const barrioIds = new Set(territorios.map((t) => t.barrio));
  return BARRIOS.filter((b) => barrioIds.has(b.id));
}

export type { BarrioId };
