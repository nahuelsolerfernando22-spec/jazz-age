export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type RngFn = () => number;

export const hashSeed = hashString;

export function mulberry32(seed: number): RngFn {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFromSeed(seed: string): RngFn {
  return mulberry32(hashSeed(seed));
}

export function rngInt(rng: RngFn, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngPick<T>(rng: RngFn, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function rngShuffle<T>(rng: RngFn, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Rng {
  private next01: RngFn;

  constructor(seed: number | string) {
    const s = typeof seed === "string" ? hashString(seed) : seed >>> 0;
    this.next01 = mulberry32(s === 0 ? 1 : s);
  }

  next(): number {
    return this.next01();
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)]!;
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export function getDailySeed(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function randomSeed(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dailySeed(game: string, date: Date = new Date()): string {
  return `cuervo:${game}:${todayKey(date)}`;
}
