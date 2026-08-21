/**
 * Rango de anfitriona.
 *
 * Derivado de la afinidad ya persistida (`cuervo:single-affinity`): no duplica
 * datos, solo traduce afinidad + partidas a un nivel con nombre y desbloqueos.
 */

import { useSingleAffinity, type AffinityRecord } from "./single-affinity";

export type HostessRankId = "desconocido" | "habitue" | "complice" | "socio";

export interface HostessRank {
  id: HostessRankId;
  index: number;
  label: string;
  /** Afinidad mínima para alcanzarlo. */
  min: number;
  /** Qué abre este rango en la mesa de la anfitriona. */
  unlock: string;
}

export const HOSTESS_RANKS: HostessRank[] = [
  {
    id: "desconocido",
    index: 0,
    label: "Desconocido",
    min: 0,
    unlock: "Trato de cortesía y reglas de la casa.",
  },
  {
    id: "habitue",
    index: 1,
    label: "Habitué",
    min: 20,
    unlock: "Charla propia de la mesa y consejos durante la partida.",
  },
  {
    id: "complice",
    index: 2,
    label: "Cómplice",
    min: 50,
    unlock: "Un favor exclusivo de la anfitriona por sesión.",
  },
  {
    id: "socio",
    index: 3,
    label: "Socio",
    min: 80,
    unlock: "Regla de la casa alternativa y propina mejorada.",
  },
];

export function rankFromAffinity(affinity: number): HostessRank {
  let out = HOSTESS_RANKS[0]!;
  for (const r of HOSTESS_RANKS) if (affinity >= r.min) out = r;
  return out;
}

export function nextRank(rank: HostessRank): HostessRank | null {
  return HOSTESS_RANKS[rank.index + 1] ?? null;
}

/** Progreso 0..1 hacia el próximo rango (1 si es el máximo). */
export function rankProgress(affinity: number): number {
  const cur = rankFromAffinity(affinity);
  const next = nextRank(cur);
  if (!next) return 1;
  const span = next.min - cur.min;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (affinity - cur.min) / span));
}

export function affinityFor(npcId: string): AffinityRecord {
  return useSingleAffinity.getState().get(npcId);
}

export function rankFor(npcId: string): HostessRank {
  return rankFromAffinity(affinityFor(npcId).affinity);
}

/** ¿La anfitriona ya concede su favor exclusivo? */
export function hasExclusiveFavor(npcId: string): boolean {
  return rankFor(npcId).index >= 2;
}

/** ¿Está habilitada la regla de la casa alternativa? */
export function hasHouseRule(npcId: string): boolean {
  return rankFor(npcId).index >= 3;
}

/** Hook reactivo para la UI. */
export function useHostessRank(npcId: string): {
  record: AffinityRecord;
  rank: HostessRank;
  next: HostessRank | null;
  progress: number;
} {
  const record = useSingleAffinity((s) => s.byNpc[npcId]) ?? {
    affinity: 0,
    plays: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    lastAt: 0,
  };
  const rank = rankFromAffinity(record.affinity);
  return { record, rank, next: nextRank(rank), progress: rankProgress(record.affinity) };
}
