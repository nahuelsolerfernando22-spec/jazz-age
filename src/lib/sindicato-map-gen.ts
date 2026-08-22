import { TERRITORIOS, type Territorio, type BarrioId, BARRIOS } from "./sindicato-data";
import { rngFromSeed, rngInt, type RngFn } from "./rng";

/** Formas posibles de la ciudad en una noche. */
export type VarianteMapa = "mancha" | "archipielago" | "corredor";

export interface ProceduralMap {
  territorios: Territorio[];
  seed: string;
  variante: VarianteMapa;
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

    if (variante === "corredor") {
      // Prefiere bordes poco pegados: la ciudad sale larga y angosta.
      const min = Math.min(...cand.map((c) => adherencia(c, sel)));
      const flacos = cand.filter((c) => adherencia(c, sel) === min);
      elegido = flacos[rngInt(rng, 0, flacos.length - 1)];
    } else if (variante === "mancha") {
      // Prefiere bordes muy pegados: la ciudad sale redonda y densa.
      const max = Math.max(...cand.map((c) => adherencia(c, sel)));
      const gordos = cand.filter((c) => adherencia(c, sel) === max);
      elegido = gordos[rngInt(rng, 0, gordos.length - 1)];
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

  const tirada = rng();
  const variante: VarianteMapa =
    tirada < 0.4 ? "mancha" : tirada < 0.72 ? "corredor" : "archipielago";

  const nucleos = variante === "archipielago" ? rngInt(rng, 2, 3) : 1;
  const sel = new Set<string>();
  for (let i = 0; i < nucleos; i++) {
    sel.add(TERRITORIOS[rngInt(rng, 0, TERRITORIOS.length - 1)].id);
  }

  crecer(sel, objetivo, rng, variante);

  // Nos quedamos con la parte conexa y, si quedó chica, la seguimos empujando.
  let final = mayorComponente(sel);
  if (final.size < objetivo) crecer(final, objetivo, rng, variante);
  final = mayorComponente(final);

  const territorios: Territorio[] = TERRITORIOS.filter((t) => final.has(t.id)).map((t) => ({
    ...t,
    vecinos: t.vecinos.filter((v) => final.has(v)),
  }));

  return { territorios, seed, variante };
}

export function getActiveBarrios(territorios: Territorio[]) {
  const barrioIds = new Set(territorios.map((t) => t.barrio));
  return BARRIOS.filter((b) => barrioIds.has(b.id));
}

export type { BarrioId };
