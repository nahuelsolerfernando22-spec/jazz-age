import { isFree, type Tile } from "@/hooks/use-mahjong-game";
import { getLearnedMahjongWeights, type MahjongWeights } from "./mahjong-learned-weights";

export interface MahjongAiExplanation {
  tileId: string;
  score: number;
  reason: string;
  completesMatch: boolean;
  isSpecial: boolean;
  keyRemaining: number;
  trayAfter: number;
  unlocks: number;
}

function keyOf(t: { variant: string; sheet: number; type: number }): string {
  return `${t.variant}:${t.sheet}:${t.type}`;
}

function countUnlocks(t: Tile, tiles: Tile[]): number {
  return tiles.filter(
    (o) =>
      !o.removed &&
      o.id !== t.id &&
      o.pos.z === t.pos.z - 1 &&
      o.pos.x === t.pos.x &&
      o.pos.y === t.pos.y &&
      o.faceDown,
  ).length;
}

export interface MahjongAiInput {
  tiles: Tile[];
  tray: Tile[];
  traySize: number;
  matchSize?: number;
  weights?: MahjongWeights;
}

export function mahjongAiSuggest(input: MahjongAiInput): MahjongAiExplanation | null {
  const { tiles, tray, traySize } = input;
  const matchSize = input.matchSize ?? 2;
  const weights = input.weights ?? getLearnedMahjongWeights();

  const trayIds = new Set(tray.map((t) => t.id));
  const maskedBoard = tiles.map((t) => (trayIds.has(t.id) ? { ...t, removed: true } : t));
  const candidates = tiles.filter(
    (t) => !t.removed && !trayIds.has(t.id) && t.seal === 0 && isFree(t, maskedBoard),
  );
  if (candidates.length === 0) return null;

  const boardCounts = new Map<string, number>();
  for (const t of tiles) {
    if (t.removed || trayIds.has(t.id)) continue;
    const k = keyOf(t);
    boardCounts.set(k, (boardCounts.get(k) ?? 0) + 1);
  }
  const trayCounts = new Map<string, number>();
  for (const t of tray) {
    const k = keyOf(t);
    trayCounts.set(k, (trayCounts.get(k) ?? 0) + 1);
  }

  let best: MahjongAiExplanation | null = null;
  for (const t of candidates) {
    const k = keyOf(t);
    const inTray = trayCounts.get(k) ?? 0;
    const remaining = boardCounts.get(k) ?? 0;
    const completes = inTray >= matchSize - 1;
    const isSpecial = t.variant === "special";
    const unlocks = countUnlocks(t, tiles);
    const trayAfter = completes ? tray.length - 1 : tray.length + 1;
    const willOverflow = !completes && trayAfter >= traySize;

    let score = 0;
    if (completes) {
      score += weights.completeBonus;
      if (isSpecial) score += weights.specialPref;
    } else {
      score += weights.buildBonus * inTray;
    }
    if (willOverflow) score -= weights.overflowPenalty;
    if (!completes && remaining < matchSize - inTray) score -= weights.orphanPenalty;
    score += weights.unlockBonus * unlocks;

    const setName = matchSize === 4 ? "cuarteto" : matchSize === 3 ? "trío" : "par";
    let reason: string;
    if (completes) {
      const bonus = matchSize === 4 ? "+kong" : matchSize === 3 ? "+pung" : "";
      reason = isSpecial
        ? `Cierra ${setName} especial ${bonus}. Bandeja ${trayAfter}/${traySize}.`
        : `Cierra ${setName} ${bonus}. Bandeja ${trayAfter}/${traySize}.`;
    } else if (willOverflow) {
      reason = `Riesgo: llena la bandeja sin cerrar el ${setName}. Buscá otro antes.`;
    } else if (remaining < matchSize - inTray) {
      reason = `Huérfana: no quedan copias suficientes para armar el ${setName}. Postergala.`;
    } else {
      reason = `Prepara ${setName} (${inTray + 1}/${matchSize} en bandeja · ${remaining - 1} libres restantes).`;
    }
    if (unlocks > 0) reason += ` Destapa ${unlocks} ficha${unlocks > 1 ? "s" : ""}.`;

    if (!best || score > best.score) {
      best = {
        tileId: t.id,
        score,
        reason,
        completesMatch: completes,
        isSpecial,
        keyRemaining: remaining,
        trayAfter,
        unlocks,
      };
    }
  }
  return best;
}
