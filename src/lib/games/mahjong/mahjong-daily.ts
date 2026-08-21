import { mulberry32 } from "@/lib/seededRng";
import { dateKey } from "@/lib/daily/daily-challenge";

export type MahjongObjectiveKind =
  "trios" | "specialTrios" | "score" | "winAny" | "winUnder" | "winWithoutHint";

export interface MahjongObjectiveDef {
  id: string;
  kind: MahjongObjectiveKind;
  target: number;
  label: string;
  favors: number;
  xp: number;
}

const POOL: MahjongObjectiveDef[] = [
  { id: "trios-10", kind: "trios", target: 10, label: "Cerrá 10 tríos hoy", favors: 2, xp: 40 },
  { id: "trios-20", kind: "trios", target: 20, label: "Cerrá 20 tríos hoy", favors: 3, xp: 80 },
  { id: "spec-3", kind: "specialTrios", target: 3, label: "3 tríos especiales", favors: 3, xp: 60 },
  {
    id: "spec-6",
    kind: "specialTrios",
    target: 6,
    label: "6 tríos especiales",
    favors: 5,
    xp: 120,
  },
  { id: "score-200", kind: "score", target: 200, label: "Acumulá 200 puntos", favors: 2, xp: 50 },
  { id: "score-500", kind: "score", target: 500, label: "Acumulá 500 puntos", favors: 4, xp: 100 },
  { id: "win-1", kind: "winAny", target: 1, label: "Ganá 1 mesa", favors: 3, xp: 80 },
  { id: "win-2", kind: "winAny", target: 2, label: "Ganá 2 mesas", favors: 5, xp: 160 },
  {
    id: "win-under-180",
    kind: "winUnder",
    target: 180,
    label: "Ganá en menos de 3 min",
    favors: 4,
    xp: 120,
  },
  {
    id: "win-under-120",
    kind: "winUnder",
    target: 120,
    label: "Ganá en menos de 2 min",
    favors: 6,
    xp: 180,
  },
  {
    id: "win-nohint",
    kind: "winWithoutHint",
    target: 1,
    label: "Ganá sin usar pistas",
    favors: 5,
    xp: 140,
  },
];

function seedFromDate(d: Date): number {
  const s = "mj:" + dateKey(d);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function todaysMahjongObjectives(now: Date = new Date()): MahjongObjectiveDef[] {
  const rng = mulberry32(seedFromDate(now));
  const pool = [...POOL];
  const picked: MahjongObjectiveDef[] = [];
  const seenKinds = new Set<MahjongObjectiveKind>();
  while (picked.length < 3 && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    const cand = pool.splice(idx, 1)[0]!;
    if (seenKinds.has(cand.kind) && picked.length < pool.length + picked.length) continue;
    seenKinds.add(cand.kind);
    picked.push(cand);
  }
  return picked;
}

export function mahjongDailyKey(now: Date = new Date()): string {
  return dateKey(now);
}
