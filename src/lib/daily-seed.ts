/**
 * Semilla diaria compartida.
 *
 * Todos los jugadores comparten el mismo tablero/evento para una fecha dada,
 * sin necesidad de backend: la semilla se deriva del día local y del juego.
 */

export function dayKey(at: Date = new Date()): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Hash determinista (FNV-1a de 32 bits) para strings. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Semilla numérica estable para (fecha, juego). */
export function dailySeed(gameId: string, at: Date = new Date()): number {
  return hashString(`cuervo:${dayKey(at)}:${gameId}`);
}

/** PRNG mulberry32: mismo seed → misma secuencia. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Elige `count` elementos distintos de forma determinista. */
export function seededPick<T>(items: readonly T[], count: number, seed: number): T[] {
  const rng = seededRng(seed);
  const pool = items.slice();
  const out: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

/** Milisegundos hasta el próximo cierre del local (medianoche local). */
export function msUntilNextDay(at: Date = new Date()): number {
  const next = new Date(at.getFullYear(), at.getMonth(), at.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, next.getTime() - at.getTime());
}
