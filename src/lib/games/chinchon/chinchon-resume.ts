import type { Card, MatchState } from "./chinchon";

const KEY = "cuervo:chinchon:live:v1";

export interface ChinchonSnapshot {
  match: MatchState;
  ante: number;
  userPilePicks: Card[];
  userDiscards: Card[];
  pileTopBy: "user" | "ai" | null;
  aiTookFromPile: boolean;
  savedAt: number;
}

export function loadChinchonSnapshot(): ChinchonSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as ChinchonSnapshot;
    if (!snap?.match || snap.match.over) return null;
    // Sanity: 50 cartas totales.
    const r = snap.match.round;
    const total =
      (r.deck?.length ?? 0) +
      (r.pile?.length ?? 0) +
      (r.hands?.user?.length ?? 0) +
      (r.hands?.ai?.length ?? 0);
    if (total !== 50) return null;
    return snap;
  } catch {
    return null;
  }
}

export function saveChinchonSnapshot(snap: ChinchonSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snap));
  } catch {
    // quota o modo privado: ignorar
  }
}

export function clearChinchonSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
