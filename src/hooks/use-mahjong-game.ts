import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAHJONG_TILE_NAMES,
  MAHJONG_TILE_NAMES_2,
  MAHJONG_TILE_NAMES_3,
  MAHJONG_TILE_NAMES_4,
  MAHJONG_TILE_NAMES_5,
  MAHJONG_SPECIAL_NAMES,
  MAHJONG_SPECIAL_NAMES_2,
  MAHJONG_SPECIAL_NAMES_3,
  MAHJONG_SPECIAL_NAMES_4,
  MAHJONG_SPECIAL_NAMES_5,
  specialGroup,
  type SpecialGroup,
  type SheetIdx,
} from "@/components/casino/mahjong/MahjongTile";
import { getLevel, LEVELS, type LevelDef } from "@/lib/games/mahjong/mahjong-levels";
import { useMahjongAlbum } from "@/store/games/mahjong/mahjong-album";
import type { SpecialFlash } from "@/components/casino/mahjong/SpecialSynergyBadge";
import {
  applyPresagioToLevel,
  drawMahjongPresagio,
  presagioScoreMult,
  type MahjongPresagio,
} from "@/lib/games/mahjong/mahjong-presagios";
import { aplicarReliquiasANivel, reliquiasScoreMult } from "@/lib/games/mahjong/mahjong-reliquias";
import { useMahjongRun } from "@/store/games/mahjong/mahjong-run";
import type { MahjongRelic } from "@/store/games/mahjong/mahjong-run";

const EMPTY_RELICS: MahjongRelic[] = [];
import { setLastMahjongDifficulty } from "@/lib/games/mahjong/mahjong-resume";
import { useSettings } from "@/store/settings";

export type Difficulty = string;
export type LevelId = string;
export const DEFAULT_LEVEL: LevelId = LEVELS[0].id;

export const TRAY_SIZE = 4;
export const MATCH_SIZE = 2;

export function comboMult(chain: number): number {
  if (chain >= 8) return 4;
  if (chain >= 7) return 3.5;
  if (chain >= 6) return 3;
  if (chain >= 5) return 2.5;
  if (chain >= 4) return 2;
  if (chain >= 3) return 1.5;
  if (chain >= 2) return 1.25;
  return 1;
}

function matchSizeOf(level: LevelDef): number {
  return level.matchSize ?? MATCH_SIZE;
}

export interface TilePos {
  x: number;
  y: number;
  z: number;
}

export type TileVariant = "char" | "special";

export interface Tile {
  id: string;
  variant: TileVariant;
  type: number;
  sheet: SheetIdx;
  group?: SpecialGroup;
  pos: TilePos;
  removed: boolean;
  seal: number;
  faceDown: boolean;
  rotMax?: number;
  gate?: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type PoolItem = { variant: TileVariant; type: number; sheet: SheetIdx };

function buildPool(level: LevelDef): PoolItem[] {
  const list: PoolItem[] = [];
  const m = matchSizeOf(level);

  for (let t = 0; t < level.charTrios; t++) {
    const sheet = Math.floor(Math.random() * 5) as SheetIdx;
    const nameSets = [
      MAHJONG_TILE_NAMES,
      MAHJONG_TILE_NAMES_2,
      MAHJONG_TILE_NAMES_3,
      MAHJONG_TILE_NAMES_4,
      MAHJONG_TILE_NAMES_5,
    ];
    const max = nameSets[sheet].length;
    const type = Math.floor(Math.random() * max);
    for (let k = 0; k < m; k++) list.push({ variant: "char", type, sheet });
  }

  const groupBases: Record<SpecialGroup, { sheet: SheetIdx; pool: number[] }> = {
    bebidas: { sheet: 0, pool: [0, 1, 2, 3] },
    vicios: { sheet: 0, pool: [4, 5, 6, 7] },
    armas: { sheet: 1, pool: [0, 1, 2, 3] },
    tesoros: { sheet: 1, pool: [4, 5, 6, 7] },
    joyas: { sheet: 2, pool: [0, 1, 2, 3] },
    suerte: { sheet: 2, pool: [4, 5, 6, 7] },
    mascaras: { sheet: 3, pool: [0, 1, 2, 3] },
    sombras: { sheet: 3, pool: [4, 5, 6, 7] },
    reliquias: { sheet: 4, pool: [0, 1, 2, 3] },
    pecados: { sheet: 4, pool: [4, 5, 6, 7] },
  };
  const specialsAny = level.specials as Record<SpecialGroup, number | undefined>;
  for (const g of Object.keys(groupBases) as SpecialGroup[]) {
    const count = specialsAny[g] ?? 0;
    for (let i = 0; i < count; i++) {
      const { sheet, pool } = groupBases[g];
      const idx = pool[Math.floor(Math.random() * pool.length)];
      for (let k = 0; k < m; k++) list.push({ variant: "special", type: idx, sheet });
    }
  }
  if (list.length !== level.positions.length) {
    throw new Error(
      `Reparto inválido para ${level.id}: generadas=${list.length} esperadas=${level.positions.length}`,
    );
  }
  return list;
}

function assemble(level: LevelDef, items: PoolItem[]): Tile[] {
  return level.positions.map((pos, i) => {
    const item = items[i];
    const charLens = [
      MAHJONG_TILE_NAMES.length,
      MAHJONG_TILE_NAMES_2.length,
      MAHJONG_TILE_NAMES_3.length,
      MAHJONG_TILE_NAMES_4.length,
      MAHJONG_TILE_NAMES_5.length,
    ];
    const specLens = [
      MAHJONG_SPECIAL_NAMES.length,
      MAHJONG_SPECIAL_NAMES_2.length,
      MAHJONG_SPECIAL_NAMES_3.length,
      MAHJONG_SPECIAL_NAMES_4.length,
      MAHJONG_SPECIAL_NAMES_5.length,
    ];
    const maxType = item.variant === "char" ? charLens[item.sheet] : specLens[item.sheet];
    const tile: Tile = {
      id: `t-${pos.z}-${pos.x}-${pos.y}`,
      variant: item.variant,
      type: item.type % maxType,
      sheet: item.sheet,
      pos,
      removed: false,
      seal: 0,
      faceDown: false,
    };
    if (item.variant === "special") tile.group = specialGroup(tile.type, tile.sheet);
    return tile;
  });
}

function applySeals(
  tiles: Tile[],
  cfg: { count: number; strength: number } | undefined,
  matchSize: number,
): Tile[] {
  if (!cfg || cfg.count <= 0 || cfg.strength <= 0) return tiles;

  const totalPairs = tiles.length / matchSize;
  const strength = Math.min(cfg.strength, Math.max(1, totalPairs - 2));

  const sorted = [...tiles].sort(
    (a, b) => b.pos.z - a.pos.z || a.pos.x + a.pos.y - (b.pos.x + b.pos.y),
  );
  const sealedIds = new Set<string>();
  const usedKeys = new Map<string, number>();
  for (const t of sorted) {
    if (sealedIds.size >= cfg.count) break;
    const k = `${t.variant}:${t.sheet}:${t.type}`;

    if ((usedKeys.get(k) ?? 0) >= matchSize - 1) continue;
    sealedIds.add(t.id);
    usedKeys.set(k, (usedKeys.get(k) ?? 0) + 1);
  }
  return tiles.map((t) => (sealedIds.has(t.id) ? { ...t, seal: strength } : t));
}

function applyFaceDown(tiles: Tile[]): Tile[] {
  return tiles.map((t) => {
    const covered = tiles.some(
      (o) => o.id !== t.id && o.pos.z === t.pos.z + 1 && o.pos.x === t.pos.x && o.pos.y === t.pos.y,
    );
    return covered ? { ...t, faceDown: true } : t;
  });
}

function greedySolveOnce(
  initial: Tile[],
  matchSize: number,
  TRAY: number,
  jitter: boolean,
): boolean {
  let tiles = initial.map((t) => ({ ...t }));
  let tray: Tile[] = [];
  const trayIds = new Set<string>();
  const trayCounts = new Map<string, number>();
  let safety = 5000;
  while (safety-- > 0) {
    if (tiles.every((t) => t.removed) && tray.length === 0) return true;
    const view = tiles.map((tt) => (trayIds.has(tt.id) ? { ...tt, removed: true } : tt));
    const free: Tile[] = [];
    for (const t of tiles) {
      if (!t.removed && !trayIds.has(t.id) && isFree(t, view)) free.push(t);
    }
    if (free.length === 0) return false;
    if (jitter) {
      for (let i = free.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [free[i], free[j]] = [free[j], free[i]];
      }
    }

    let pick: Tile | undefined;
    for (const t of free) {
      if ((trayCounts.get(trioKey(t)) ?? 0) >= matchSize - 1) {
        pick = t;
        break;
      }
    }

    if (!pick) {
      const freeCounts = new Map<string, number>();
      for (const t of free) {
        const k = trioKey(t);
        freeCounts.set(k, (freeCounts.get(k) ?? 0) + 1);
      }
      let best = -1;
      for (const t of free) {
        if (tray.length + 1 > TRAY) continue;
        const k = trioKey(t);
        const inTray = trayCounts.get(k) ?? 0;
        const inFree = freeCounts.get(k) ?? 0;
        const noise = jitter ? Math.random() : 0;
        const score = inTray * 100 + inFree * 10 + noise;
        if (score > best) {
          best = score;
          pick = t;
        }
      }
    }
    if (!pick) return false;

    tray.push(pick);
    trayIds.add(pick.id);
    const pk = trioKey(pick);
    trayCounts.set(pk, (trayCounts.get(pk) ?? 0) + 1);

    const removeIds = detectQuads(tray, matchSize);
    if (removeIds.length > 0) {
      const rm = new Set(removeIds);
      tray = tray.filter((t) => !rm.has(t.id));
      for (const id of rm) {
        trayIds.delete(id);
      }
      trayCounts.clear();
      for (const t of tray) {
        const k = trioKey(t);
        trayCounts.set(k, (trayCounts.get(k) ?? 0) + 1);
      }
      tiles = tiles.map((t) => (rm.has(t.id) ? { ...t, removed: true } : t));
    }
    if (tray.length >= TRAY) return false;
  }
  return false;
}

export function isSolvable(
  initial: Tile[],
  matchSize: number,
  traySize?: number,
  restarts = 6,
): boolean {
  const TRAY = Math.max(traySize ?? TRAY_SIZE, matchSize + 1);
  if (greedySolveOnce(initial, matchSize, TRAY, false)) return true;
  for (let i = 0; i < restarts; i++) {
    if (greedySolveOnce(initial, matchSize, TRAY, true)) return true;
  }
  return false;
}

export function deal(levelId: LevelId, presagio: MahjongPresagio | null = null): Tile[] {
  const level = applyPresagioToLevel(getLevel(levelId), presagio);
  const m = matchSizeOf(level);
  const pool = buildPool(level);
  const trayCap = Math.max(m + 1, level.traySize ?? TRAY_SIZE);
  const budgetMs = level.positions.length > 400 ? 900 : level.positions.length > 200 ? 600 : 400;
  const t0 = Date.now();
  for (let attempt = 0; attempt < 80; attempt++) {
    const shuffled = shuffle(pool);
    const tiles = assemble(level, shuffled);
    if (isSolvable(tiles, m, trayCap))
      return applyGates(applyFaceDown(applySeals(tiles, level.seals, m)), level.gates, m);
    if (Date.now() - t0 > budgetMs) break;
  }
  return applyGates(
    applyFaceDown(applySeals(assemble(level, shuffle(pool)), level.seals, m)),
    level.gates,
    m,
  );
}

function applyGates(
  tiles: Tile[],
  cfg: { count: number; unlockAt: number } | undefined,
  matchSize: number,
): Tile[] {
  if (!cfg || cfg.count <= 0) return tiles;
  const sorted = [...tiles].sort(
    (a, b) => b.pos.z - a.pos.z || a.pos.x + a.pos.y - (b.pos.x + b.pos.y),
  );
  const gatedIds = new Set<string>();
  const usedByKey = new Map<string, number>();
  for (const t of sorted) {
    if (gatedIds.size >= cfg.count) break;
    if (t.seal > 0) continue;
    const k = `${t.variant}:${t.sheet}:${t.type}`;
    if ((usedByKey.get(k) ?? 0) >= matchSize - 1) continue;
    gatedIds.add(t.id);
    usedByKey.set(k, (usedByKey.get(k) ?? 0) + 1);
  }
  return tiles.map((t) => (gatedIds.has(t.id) ? { ...t, gate: cfg.unlockAt } : t));
}

function applyRot(tiles: Tile[], cfg: { count: number; seconds: number } | undefined): Tile[] {
  if (!cfg || cfg.count <= 0) return tiles;

  const candidates = tiles
    .map((t, i) => ({ i, z: t.pos.z, sealed: t.seal > 0 }))
    .filter((c) => !c.sealed)
    .sort(() => Math.random() - 0.5)
    .slice(0, cfg.count);
  const set = new Set(candidates.map((c) => c.i));
  return tiles.map((t, i) => (set.has(i) ? { ...t, rotMax: cfg.seconds } : t));
}

export function isFree(tile: Tile, tiles: Tile[]): boolean {
  if (tile.removed) return false;
  const above = tiles.some(
    (o) =>
      !o.removed && o.pos.z === tile.pos.z + 1 && o.pos.x === tile.pos.x && o.pos.y === tile.pos.y,
  );
  if (above) return false;
  const left = tiles.some(
    (o) =>
      !o.removed && o.pos.z === tile.pos.z && o.pos.y === tile.pos.y && o.pos.x === tile.pos.x - 1,
  );
  const right = tiles.some(
    (o) =>
      !o.removed && o.pos.z === tile.pos.z && o.pos.y === tile.pos.y && o.pos.x === tile.pos.x + 1,
  );
  return !left || !right;
}

// Spatial index: O(N) build, O(1) lookup.

type BoardIndex = {
  has: (z: number, x: number, y: number) => boolean;
};
function buildBoardIndex(tiles: Tile[], virtualRemoved?: Set<string>): BoardIndex {
  const set = new Set<number>();

  const key = (z: number, x: number, y: number) => (z * 4096 + x + 2048) * 4096 + (y + 2048);
  for (const t of tiles) {
    if (t.removed) continue;
    if (virtualRemoved && virtualRemoved.has(t.id)) continue;
    set.add(key(t.pos.z, t.pos.x, t.pos.y));
  }
  return { has: (z, x, y) => set.has(key(z, x, y)) };
}
function isFreeIdx(tile: Tile, idx: BoardIndex): boolean {
  if (tile.removed) return false;
  const { z, x, y } = tile.pos;
  if (idx.has(z + 1, x, y)) return false;
  const left = idx.has(z, x - 1, y);
  const right = idx.has(z, x + 1, y);
  return !left || !right;
}

function trioKey(t: Tile): string {
  return `${t.variant}:${t.sheet}:${t.type}`;
}

function detectQuads(tray: Tile[], matchSize: number): string[] {
  const groups = new Map<string, Tile[]>();
  for (const t of tray) {
    const k = trioKey(t);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }
  const remove: string[] = [];
  for (const items of groups.values()) {
    while (items.length >= matchSize) {
      for (let i = 0; i < matchSize; i++) remove.push(items.shift()!.id);
    }
  }
  return remove;
}

interface Snapshot {
  tiles: Tile[];
  tray: Tile[];
  score: number;
  trios: number;
  specialTrios: number;
}

export function useMahjongGame(initial: LevelId = DEFAULT_LEVEL, challenge = 0, running = true) {
  const [difficulty, setDifficultyState] = useState<LevelId>(initial);

  const [presagio, setPresagio] = useState<MahjongPresagio | null>(() => drawMahjongPresagio());

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [dealt, setDealt] = useState(false);
  useEffect(() => {
    if (dealt) return;

    const id =
      typeof queueMicrotask === "function"
        ? (queueMicrotask(() => {
            setTiles(applyRot(deal(initial, presagio), getLevel(initial).rot));
            setDealt(true);
          }),
          0)
        : window.setTimeout(() => {
            setTiles(applyRot(deal(initial, presagio), getLevel(initial).rot));
            setDealt(true);
          }, 0);
    return () => {
      if (id) window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const albumSeenInitRef = useRef(false);
  useEffect(() => {
    if (albumSeenInitRef.current) return;
    albumSeenInitRef.current = true;
    const seen = new Set<string>();
    const api = useMahjongAlbum.getState();
    for (const t of tiles) {
      const k = `${t.variant}:${t.sheet}:${t.type}`;
      if (seen.has(k)) continue;
      seen.add(k);
      api.markSeen(t.variant, t.sheet, t.type);
    }
  }, [tiles]);
  const [tray, setTray] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [trios, setTrios] = useState(0);
  const [specialTrios, setSpecialTrios] = useState(0);
  const [surrendered, setSurrendered] = useState(false);
  const [hintId, setHintId] = useState<string | null>(null);
  const [shuffleNonce, setShuffleNonce] = useState(0);
  const [reshuffleCount, setReshuffleCount] = useState(0);
  const [shuffledIds, setShuffledIds] = useState<Set<string>>(new Set());
  const [lockedShuffleIds, setLockedShuffleIds] = useState<Set<string>>(new Set());
  const [magnetUses, setMagnetUses] = useState(1);
  const [extraSlotUsed, setExtraSlotUsed] = useState(false);
  const [lastDelta, setLastDelta] = useState(0);
  const [lastDeltaTick, setLastDeltaTick] = useState(0);
  const [lastGroup, setLastGroup] = useState<SpecialGroup | "char" | null>(null);
  const [combo, setCombo] = useState(0);
  const [comboBest, setComboBest] = useState(0);
  const comboTimerRef = useRef<number | null>(null);
  const historyRef = useRef<Snapshot[]>([]);
  const [historyLen, setHistoryLen] = useState(0);
  const [deadlockShuffles, setDeadlockShuffles] = useState(0);
  const [undoUses, setUndoUses] = useState(0);
  const [lastSpecial, setLastSpecial] = useState<SpecialFlash | null>(null);
  const specialFlashId = useRef(0);
  const [synergyPulse, setSynergyPulse] = useState<{ group: SpecialGroup; tick: number } | null>(
    null,
  );
  const synergyTickRef = useRef(0);
  const [matchBurst, setMatchBurst] = useState<{
    x: number;
    y: number;
    z: number;
    tick: number;
    big: boolean;
  } | null>(null);
  const matchBurstTickRef = useRef(0);

  const breakComboRef = useRef<() => void>(() => {});

  const runRelics = useMahjongRun((s) => (s.active ? s.relics : EMPTY_RELICS));
  const levelDef = useMemo(
    () => aplicarReliquiasANivel(applyPresagioToLevel(getLevel(difficulty), presagio), runRelics),
    [difficulty, presagio, runRelics],
  );
  const matchSize = matchSizeOf(levelDef);
  const undoLimit = levelDef.undoLimit ?? 3;
  const [undosLeft, setUndosLeft] = useState(undoLimit);
  const [secondsLeft, setSecondsLeft] = useState(levelDef.timeLimit ?? 0);
  const deadlineRef = useRef<number | null>(null);
  const resetDeadline = useCallback((secs: number) => {
    deadlineRef.current = secs > 0 ? Date.now() + secs * 1000 : null;
    setSecondsLeft(secs);
  }, []);
  const [rotLeft, setRotLeft] = useState<Record<string, number>>({});
  const timeUp = !!levelDef.timeLimit && secondsLeft <= 0;

  const trayPenalty = challenge >= 0.5 ? 1 : 0;
  const reshufflePenalty = challenge >= 0.7 ? 2 : challenge >= 0.3 ? 1 : 0;

  const baseTraySize = Math.max(matchSize + 1, (levelDef.traySize ?? TRAY_SIZE) - trayPenalty);
  const rawReshuffle = levelDef.reshuffleLimit ?? Infinity;
  const reshuffleLimit = Number.isFinite(rawReshuffle)
    ? Math.max(0, (rawReshuffle as number) - reshufflePenalty)
    : rawReshuffle;
  const traySize = baseTraySize + (extraSlotUsed ? 2 : 0);

  const remaining = tiles.filter((t) => !t.removed).length - tray.length;
  const won = dealt && remaining === 0 && tray.length === 0;
  const canReshuffle = reshuffleCount < reshuffleLimit;
  const fever = combo >= 5;

  const freeIds = useMemo(() => {
    const ids = new Set<string>();
    const trayIds = new Set(tray.map((t) => t.id));
    const idx = buildBoardIndex(tiles, trayIds);
    for (const t of tiles) {
      if (t.removed || trayIds.has(t.id)) continue;
      if (isFreeIdx(t, idx)) ids.add(t.id);
    }
    return ids;
  }, [tiles, tray]);

  const tappableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of tiles) {
      if (!freeIds.has(t.id)) continue;
      if (t.seal > 0) continue;
      ids.add(t.id);
    }
    return ids;
  }, [tiles, freeIds]);

  useEffect(() => {
    const toFlip: string[] = [];
    const idx = buildBoardIndex(tiles);
    for (const t of tiles) {
      if (!t.faceDown || t.removed) continue;
      if (!idx.has(t.pos.z + 1, t.pos.x, t.pos.y)) toFlip.push(t.id);
    }
    if (toFlip.length === 0) return;
    const flip = new Set(toFlip);
    setTiles((cur) => cur.map((t) => (flip.has(t.id) ? { ...t, faceDown: false } : t)));
  }, [tiles]);

  const sealedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of tiles) if (!t.removed && t.seal > 0) ids.add(t.id);
    return ids;
  }, [tiles]);

  const isDeadlocked = useMemo(() => {
    if (won) return false;
    const anyLeft = tiles.some((t) => !t.removed);
    if (!anyLeft) return false;
    if (tappableIds.size === 0) return true;

    const alive = new Map<string, number>();
    for (const t of tiles) {
      if (t.removed) continue;
      const k = trioKey(t);
      alive.set(k, (alive.get(k) ?? 0) + 1);
    }
    for (const c of alive.values()) if (c >= matchSize) return false;
    return tray.length > 0 || tiles.some((t) => !t.removed);
  }, [tiles, tray, tappableIds, matchSize, won]);

  const lost = surrendered || tray.length >= traySize || timeUp || (isDeadlocked && !canReshuffle);

  const matchableIds = useMemo(() => {
    const trayKeys = new Set(tray.map((t) => trioKey(t)));
    const ids = new Set<string>();
    if (trayKeys.size === 0) return ids;
    for (const t of tiles) {
      if (!tappableIds.has(t.id)) continue;
      if (trayKeys.has(trioKey(t))) ids.add(t.id);
    }
    return ids;
  }, [tiles, tray, tappableIds]);

  const pushHistory = useCallback(() => {
    historyRef.current.push({
      tiles: tiles.map((t) => ({ ...t })),
      tray: tray.slice(),
      score,
      trios,
      specialTrios,
    });
    if (historyRef.current.length > 20) historyRef.current.shift();
    setHistoryLen(historyRef.current.length);
  }, [tiles, tray, score, trios, specialTrios]);

  const newGame = useCallback(
    (d: Difficulty = difficulty) => {
      setDifficultyState(d);
      const nextPresagio = drawMahjongPresagio();
      setPresagio(nextPresagio);
      const lv = applyPresagioToLevel(getLevel(d), nextPresagio);
      const fresh = applyRot(deal(d, nextPresagio), lv.rot);
      setTiles(fresh);

      {
        const seen = new Set<string>();
        const api = useMahjongAlbum.getState();
        for (const t of fresh) {
          const k = `${t.variant}:${t.sheet}:${t.type}`;
          if (seen.has(k)) continue;
          seen.add(k);
          api.markSeen(t.variant, t.sheet, t.type);
        }
      }
      setTray([]);
      setScore(0);
      setTrios(0);
      setSpecialTrios(0);
      setSurrendered(false);
      setHintId(null);
      setReshuffleCount(0);
      setShuffledIds(new Set());
      setLockedShuffleIds(new Set());
      setMagnetUses(1);
      setExtraSlotUsed(false);
      setCombo(0);
      setComboBest(0);
      setUndosLeft(lv.undoLimit ?? 3);
      resetDeadline(lv.timeLimit ?? 0);
      setRotLeft({});
      setLastGroup(null);
      setLastSpecial(null);
      setSynergyPulse(null);
      setMatchBurst(null);
      setDeadlockShuffles(0);
      setUndoUses(0);
      if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
      historyRef.current = [];
      setHistoryLen(0);
      setShuffleNonce((n) => n + 1);
      try {
        window.localStorage.removeItem(`mahjong:save:${d}`);
      } catch {}
      setLastMahjongDifficulty(d);
    },
    [difficulty],
  );

  const setDifficulty = useCallback((d: Difficulty) => newGame(d), [newGame]);

  const surrender = useCallback(() => {
    if (won || lost) return;
    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    setHintId(null);
    setCombo(0);
    setRotLeft({});
    setSynergyPulse(null);
    setMatchBurst(null);
    historyRef.current = [];
    setHistoryLen(0);
    setSurrendered(true);
    try {
      window.localStorage.removeItem(`mahjong:save:${difficulty}`);
    } catch {}
  }, [difficulty, lost, won]);

  const tap = useCallback(
    (id: string) => {
      if (won || lost) return false;
      setHintId(null);
      const tile = tiles.find((t) => t.id === id);
      if (!tile || tile.removed) return false;
      if (!freeIds.has(id)) return false;
      if (tile.seal > 0) return false;
      if (tile.gate && trios < tile.gate) return false;
      if (tray.length >= traySize) return false;

      pushHistory();

      if (tile.variant === "special" && tile.group) {
        synergyTickRef.current += 1;
        setSynergyPulse({ group: tile.group, tick: synergyTickRef.current });
        window.setTimeout(() => {
          setSynergyPulse((cur) => (cur && cur.tick === synergyTickRef.current ? null : cur));
        }, 900);
      }

      const k = trioKey(tile);
      const lastSameIdx = tray
        .map((x, i) => ({ x, i }))
        .filter(({ x }) => trioKey(x) === k)
        .map(({ i }) => i)
        .pop();
      const insertAt = lastSameIdx === undefined ? tray.length : lastSameIdx + 1;
      const newTray = [...tray.slice(0, insertAt), tile, ...tray.slice(insertAt)];
      const removeIds = detectQuads(newTray, matchSize);
      let trayAfter = newTray;

      if (removeIds.length > 0) {
        const pairCount = removeIds.length / matchSize;
        const completed = newTray.filter((t) => removeIds.includes(t.id));
        const specialCount = completed.filter((t) => t.variant === "special").length / matchSize;
        const charCount = pairCount - specialCount;

        const setBonus = matchSize === 4 ? 2.2 : matchSize === 3 ? 1.5 : 1;

        const base = (charCount * 26 + specialCount * 54) * setBonus;
        const nextCombo = combo + 1;

        const mult = comboMult(nextCombo);

        const pMult = presagioScoreMult(presagio, specialCount);
        const rMult = reliquiasScoreMult(runRelics, specialCount);
        const delta = Math.round(base * mult * pMult * rMult);
        trayAfter = newTray.filter((t) => !removeIds.includes(t.id));

        matchBurstTickRef.current += 1;
        const burstOrigin = completed[completed.length - 1] ?? completed[0];
        setMatchBurst({
          x: burstOrigin.pos.x,
          y: burstOrigin.pos.y,
          z: burstOrigin.pos.z,
          tick: matchBurstTickRef.current,
          big: specialCount > 0 || nextCombo >= 4,
        });

        setTiles((cur) =>
          cur.map((t) => {
            if (removeIds.includes(t.id)) return { ...t, removed: true };

            if (t.seal > 0 && !t.removed) return { ...t, seal: Math.max(0, t.seal - pairCount) };
            return t;
          }),
        );
        setScore((s) => s + delta);
        setTrios((p) => p + pairCount);
        if (specialCount > 0) setSpecialTrios((p) => p + specialCount);
        setLastDelta(delta);
        setLastDeltaTick((n) => n + 1);

        const firstDone = completed[0];
        setLastGroup(firstDone?.variant === "special" ? (firstDone.group ?? null) : "char");

        const uniqueKeys = new Set<string>();
        const albumApi = useMahjongAlbum.getState();
        for (const t of completed) {
          const key = `${t.variant}:${t.sheet}:${t.type}`;
          if (uniqueKeys.has(key)) continue;
          uniqueKeys.add(key);
          albumApi.markMatched(t.variant, t.sheet, t.type);
        }

        if (specialCount > 0 && firstDone?.variant === "special") {
          specialFlashId.current += 1;
          const groupKey = firstDone.group ?? "bebidas";

          const nameSets = [
            MAHJONG_SPECIAL_NAMES,
            MAHJONG_SPECIAL_NAMES_2,
            MAHJONG_SPECIAL_NAMES_3,
            MAHJONG_SPECIAL_NAMES_4,
            MAHJONG_SPECIAL_NAMES_5,
          ] as const;
          const nm = nameSets[firstDone.sheet]?.[firstDone.type] ?? "Especial";

          const synergy = albumApi.claimedSets.includes(`special-${groupKey}`);
          setLastSpecial({
            id: specialFlashId.current,
            sheet: firstDone.sheet,
            type: firstDone.type,
            group: groupKey,
            name: nm,
            base: delta,
            combo: nextCombo,
            synergy,
          });
        }
        setCombo(nextCombo);
        setComboBest((b) => Math.max(b, nextCombo));
        if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);

        const comboWindow = Math.max(2500, 6000 - nextCombo * 500);
        comboTimerRef.current = window.setTimeout(() => breakComboRef.current(), comboWindow);

        if (nextCombo >= 3) {
          setRotLeft((cur) => {
            const next: Record<string, number> = {};
            for (const [id, v] of Object.entries(cur)) next[id] = Math.max(1, v - 1);
            return next;
          });
        }

        if (nextCombo >= 5) {
          setTiles((cur) => {
            const trayIdsNow = new Set(trayAfter.map((t) => t.id));
            const cand = cur.filter(
              (t) =>
                !t.removed &&
                !trayIdsNow.has(t.id) &&
                t.seal === 0 &&
                !t.faceDown &&
                !t.rotMax &&
                isFree(
                  t,
                  cur.map((tt) => (trayIdsNow.has(tt.id) ? { ...tt, removed: true } : tt)),
                ),
            );
            if (cand.length === 0) return cur;
            const target = cand[Math.floor(Math.random() * cand.length)];

            const seconds = nextCombo >= 7 ? 4 : 6;
            return cur.map((t) => (t.id === target.id ? { ...t, rotMax: seconds } : t));
          });
        }

        const closedNow = trios + pairCount;
        const closedBefore = trios;
        const crossed8 = Math.floor(closedNow / 8) > Math.floor(closedBefore / 8);
        if (crossed8) {
          setTiles((cur) => {
            const trayIdsNow = new Set(trayAfter.map((t) => t.id));
            const cand = cur.filter(
              (t) =>
                !t.removed &&
                !trayIdsNow.has(t.id) &&
                t.seal === 0 &&
                !t.faceDown &&
                isFree(
                  t,
                  cur.map((tt) => (trayIdsNow.has(tt.id) ? { ...tt, removed: true } : tt)),
                ),
            );
            if (cand.length === 0) return cur;
            const target = cand[Math.floor(Math.random() * cand.length)];
            return cur.map((t) => (t.id === target.id ? { ...t, seal: 1 } : t));
          });
        }

        if (
          typeof navigator !== "undefined" &&
          navigator.vibrate &&
          useSettings.getState().hapticFeedback
        ) {
          navigator.vibrate(specialCount > 0 ? [25, 30, 60] : [20, 20, 20]);
        }
      } else {
        if (trayAfter.length >= traySize - 1) {
          if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
          breakComboRef.current();
        }

        if (
          typeof navigator !== "undefined" &&
          navigator.vibrate &&
          useSettings.getState().hapticFeedback
        ) {
          navigator.vibrate(8);
        }
      }

      setTray(trayAfter);
      return true;
    },
    [tiles, tray, freeIds, pushHistory, won, lost, traySize, combo, matchSize, runRelics],
  );

  const undo = useCallback(() => {
    if (undosLeft <= 0) return;
    const snap = historyRef.current.pop();
    if (!snap) return;

    const usesBefore = undoUses;
    const penalty = 15 * Math.pow(2, usesBefore);
    setTiles(snap.tiles);
    setTray(snap.tray);
    setScore(Math.max(0, snap.score - penalty));
    setTrios(snap.trios);
    setSpecialTrios(snap.specialTrios);
    setHintId(null);
    setHistoryLen(historyRef.current.length);
    setUndosLeft((u) => Math.max(0, u - 1));
    setUndoUses((n) => n + 1);
    setLastDelta(-penalty);
    setLastDeltaTick((n) => n + 1);

    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    breakComboRef.current();
  }, [undosLeft, undoUses]);

  const returnTray3 = useCallback(() => {
    if (tray.length === 0) return;
    pushHistory();
    const keep = Math.max(0, tray.length - 3);
    setTray(tray.slice(0, keep));
    setScore((s) => Math.max(0, s - 8));
  }, [tray, pushHistory]);

  const magnet = useCallback(() => {
    if (magnetUses <= 0) return false;
    const free = tiles.filter((t) => tappableIds.has(t.id));
    const byKey = new Map<string, Tile[]>();
    for (const t of free) {
      const k = trioKey(t);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k)!.push(t);
    }
    let pickIds: string[] | null = null;
    let pickVariant: TileVariant = "char";
    for (const [, items] of byKey) {
      if (items.length >= matchSize) {
        pickIds = items.slice(0, matchSize).map((t) => t.id);
        pickVariant = items[0].variant;
        break;
      }
    }
    if (!pickIds) return false;
    pushHistory();
    const ids = new Set(pickIds);
    setTiles((cur) =>
      cur.map((t) => {
        if (ids.has(t.id)) return { ...t, removed: true };
        if (t.seal > 0 && !t.removed) return { ...t, seal: Math.max(0, t.seal - 1) };
        return t;
      }),
    );
    const setBonus = matchSize === 4 ? 2.2 : matchSize === 3 ? 1.5 : 1;
    const delta = Math.round((pickVariant === "special" ? 60 : 30) * setBonus);
    setScore((s) => s + delta);
    setTrios((p) => p + 1);
    if (pickVariant === "special") setSpecialTrios((p) => p + 1);
    setMagnetUses((u) => u - 1);
    setLastDelta(delta);
    setLastDeltaTick((n) => n + 1);
    setHintId(null);
    return true;
  }, [tiles, tappableIds, magnetUses, pushHistory, matchSize]);

  const extraSlot = useCallback(() => {
    if (extraSlotUsed) return false;
    pushHistory();
    setExtraSlotUsed(true);
    return true;
  }, [extraSlotUsed, pushHistory]);

  const findHint = useCallback((): string | null => {
    const free = tiles.filter((t) => tappableIds.has(t.id));

    for (const t of free) {
      const k = trioKey(t);
      const inTray = tray.filter((x) => trioKey(x) === k).length;
      if (inTray >= matchSize - 1) return t.id;
    }

    const byKey = new Map<string, string[]>();
    for (const t of free) {
      const k = trioKey(t);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k)!.push(t.id);
    }
    const ranked = [...byKey.entries()]
      .filter(([, ids]) => ids.length >= matchSize)
      .sort((a, b) => b[1].length - a[1].length);
    if (ranked.length > 0) return ranked[0][1][0];
    return null;
  }, [tiles, tray, tappableIds, matchSize]);

  const showHint = useCallback(() => {
    const id = findHint();
    if (!id) return;
    setHintId(id);
    setScore((s) => Math.max(0, s - 2));
    window.setTimeout(() => setHintId(null), 1800);
  }, [findHint]);

  const showHintFree = useCallback(() => {
    const id = findHint();
    if (!id) return;
    setHintId(id);
    window.setTimeout(() => setHintId(null), 1500);
  }, [findHint]);

  const keyRemaining = useMemo(() => {
    const m = new Map<string, number>();
    const trayIds = new Set(tray.map((t) => t.id));
    for (const t of tiles) {
      if (t.removed || trayIds.has(t.id)) continue;
      const k = trioKey(t);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [tiles, tray]);

  const tileKey = useCallback((t: Tile) => trioKey(t), []);

  const reshuffle = useCallback(() => {
    if (reshuffleCount >= reshuffleLimit) return false;
    pushHistory();

    const triggeredByDeadlock = isDeadlocked;
    const dsBefore = deadlockShuffles;
    const baseCost = triggeredByDeadlock ? 5 * Math.pow(2, dsBefore) : 5;
    setTiles((cur) => {
      const inTrayIds = new Set(tray.map((t) => t.id));
      const trayKeys = new Set(tray.map((t) => trioKey(t)));

      const lockedIds = new Set<string>();
      const onBoard = cur.filter((t) => !t.removed && !inTrayIds.has(t.id));
      for (const t of onBoard) {
        if (trayKeys.has(trioKey(t))) lockedIds.add(t.id);
      }

      const movable = onBoard.filter((t) => !lockedIds.has(t.id));
      const byZ = new Map<number, Tile[]>();
      for (const t of movable) {
        if (!byZ.has(t.pos.z)) byZ.set(t.pos.z, []);
        byZ.get(t.pos.z)!.push(t);
      }

      const attempts = triggeredByDeadlock ? 24 : 12;
      let bestNext: Tile[] | null = null;
      let bestMoved = new Set<string>();
      let bestScore = -Infinity;
      for (let a = 0; a < attempts; a++) {
        const newPosById = new Map<string, TilePos>();
        const moved = new Set<string>();
        for (const [z, group] of byZ) {
          const slots = group.map((t) => ({ ...t.pos }));
          const tilesShuffled = shuffle(group);
          tilesShuffled.forEach((t, i) => {
            const ns = slots[i];
            newPosById.set(t.id, { x: ns.x, y: ns.y, z });
            if (t.pos.x !== ns.x || t.pos.y !== ns.y) moved.add(t.id);
          });
        }
        const candidate = cur.map((t) => {
          const np = newPosById.get(t.id);
          return np ? { ...t, pos: np } : t;
        });

        let freeCount = 0;
        for (const t of candidate) {
          if (t.removed) continue;
          if (inTrayIds.has(t.id)) continue;
          if (t.seal > 0) continue;
          if (
            isFree(
              t,
              candidate.map((tt) => (inTrayIds.has(tt.id) ? { ...tt, removed: true } : tt)),
            )
          )
            freeCount++;
        }

        if (freeCount < matchSize) continue;

        const s = -freeCount * (triggeredByDeadlock ? 3 : 1);
        if (s > bestScore) {
          bestScore = s;
          bestNext = candidate;
          bestMoved = moved;
        }
      }
      const next = bestNext ?? cur;
      const moved = bestMoved;
      setShuffledIds(moved);
      setLockedShuffleIds(lockedIds);
      window.setTimeout(() => {
        setShuffledIds(new Set());
        setLockedShuffleIds(new Set());
      }, 1400);
      return next;
    });
    setHintId(null);
    setScore((s) => Math.max(0, s - baseCost));
    setLastDelta(-baseCost);
    setLastDeltaTick((n) => n + 1);
    if (triggeredByDeadlock) setDeadlockShuffles((n) => n + 1);
    setReshuffleCount((c) => c + 1);
    setShuffleNonce((n) => n + 1);

    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    breakComboRef.current();
    return true;
  }, [
    pushHistory,
    tray,
    reshuffleCount,
    reshuffleLimit,
    isDeadlocked,
    deadlockShuffles,
    matchSize,
  ]);

  const totalTiles = tiles.length;

  useEffect(() => {
    if (!running) return;
    if (!levelDef.timeLimit) return;
    if (won || lost) return;
    if (deadlineRef.current == null) {
      deadlineRef.current = Date.now() + (secondsLeft || levelDef.timeLimit) * 1000;
    }
    const compute = () => {
      const d = deadlineRef.current;
      if (d == null) return;
      setSecondsLeft(Math.max(0, Math.ceil((d - Date.now()) / 1000)));
    };
    compute();
    const iv = window.setInterval(compute, 1000);
    const onVis = () => {
      if (!document.hidden) compute();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, levelDef.timeLimit, won, lost, shuffleNonce]);

  const tapRef = useRef<((id: string) => boolean) | null>(null);
  useEffect(() => {
    if (!running) return;
    if (won || lost) return;
    const rotTiles = tiles.filter((t) => !t.removed && t.rotMax && tappableIds.has(t.id));
    if (rotTiles.length === 0) return;
    const step = fever ? 2 : 1;
    const iv = window.setInterval(() => {
      setRotLeft((cur) => {
        const next = { ...cur };
        const expired: string[] = [];
        for (const t of rotTiles) {
          const v = (next[t.id] ?? t.rotMax!) - step;
          if (v <= 0) {
            expired.push(t.id);
            delete next[t.id];
          } else {
            next[t.id] = v;
          }
        }

        if (expired.length > 0 && tapRef.current) {
          for (const id of expired) tapRef.current(id);
        }

        if (presagio?.id === "rot_vivo" && expired.length > 0) {
          const originIds = new Set(expired);
          const origins = rotTiles.filter((t) => originIds.has(t.id));
          window.setTimeout(() => {
            setTiles((cur) => {
              let mutated = false;
              const next = cur.slice();
              for (const origin of origins) {
                const neighbors = next.filter(
                  (t) =>
                    !t.removed &&
                    t.seal === 0 &&
                    !t.faceDown &&
                    !t.rotMax &&
                    t.pos.z === origin.pos.z &&
                    Math.abs(t.pos.x - origin.pos.x) + Math.abs(t.pos.y - origin.pos.y) === 1 &&
                    isFree(t, next),
                );
                if (neighbors.length === 0) continue;
                const victim = neighbors[Math.floor(Math.random() * neighbors.length)];
                const idx = next.indexOf(victim);
                next[idx] = { ...victim, rotMax: 6 };
                mutated = true;
              }
              return mutated ? next : cur;
            });
          }, 80);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(iv);
  }, [running, tiles, tappableIds, won, lost, fever, presagio]);
  useEffect(() => {
    tapRef.current = tap;
  }, [tap]);

  useEffect(() => {
    breakComboRef.current = () => {
      setCombo((prev) => {
        if (prev <= 0) return 0;

        const cut = Math.min(8, 3 + prev);
        setRotLeft((cur) => {
          const next: Record<string, number> = {};
          for (const [id, v] of Object.entries(cur)) {
            next[id] = Math.max(1, v - cut);
          }
          return next;
        });

        if (prev >= 4) {
          const strength = Math.min(3, prev - 2);

          const seals = prev >= 5 ? 2 : 1;
          setTiles((cur) => {
            const candidates = cur.filter((t) => !t.removed && t.seal === 0 && !t.faceDown);
            if (candidates.length === 0) return cur;

            candidates.sort((a, b) => b.pos.z - a.pos.z);
            const picked = new Set<string>();
            for (let i = 0; i < seals && i < candidates.length; i++) {
              const pool = candidates.filter((c) => !picked.has(c.id));
              if (pool.length === 0) break;
              const target = pool[Math.floor(Math.random() * Math.min(3, pool.length))];
              picked.add(target.id);
            }
            return cur.map((t) => (picked.has(t.id) ? { ...t, seal: strength } : t));
          });
        }
        return 0;
      });
    };
  }, []);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = window.localStorage.getItem(`mahjong:save:${initial}`);
      if (!raw) return;
      const s = JSON.parse(raw) as Snapshot & {
        undosLeft: number;
        secondsLeft: number;
        reshuffleCount: number;
        combo?: number;
        comboBest?: number;
        magnetUses?: number;
        extraSlotUsed?: boolean;
        undoUses?: number;
        deadlockShuffles?: number;
        presagio?: MahjongPresagio | null;
      };
      if (!s || !s.tiles || s.tiles.length === 0) return;
      setTiles(s.tiles);
      setTray(s.tray);
      setScore(s.score);
      setTrios(s.trios);
      setSpecialTrios(s.specialTrios);
      setUndosLeft(s.undosLeft);
      resetDeadline(s.secondsLeft);
      setReshuffleCount(s.reshuffleCount);
      if (typeof s.combo === "number") setCombo(s.combo);
      if (typeof s.comboBest === "number") setComboBest(s.comboBest);
      if (typeof s.magnetUses === "number") setMagnetUses(s.magnetUses);
      if (typeof s.extraSlotUsed === "boolean") setExtraSlotUsed(s.extraSlotUsed);
      if (typeof s.undoUses === "number") setUndoUses(s.undoUses);
      if (typeof s.deadlockShuffles === "number") setDeadlockShuffles(s.deadlockShuffles);
      if (s.presagio) setPresagio(s.presagio);
      setLastMahjongDifficulty(initial);
    } catch {}
  }, [initial]);

  const secondsLeftRef = useRef(secondsLeft);
  useEffect(() => {
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);
  useEffect(() => {
    if (won || lost) return;
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          `mahjong:save:${difficulty}`,
          JSON.stringify({
            tiles,
            tray,
            score,
            trios,
            specialTrios,
            undosLeft,
            secondsLeft: secondsLeftRef.current,
            reshuffleCount,
            combo,
            comboBest,
            magnetUses,
            extraSlotUsed,
            undoUses,
            deadlockShuffles,
            presagio,
          }),
        );
      } catch {}
    }, 800);
    return () => window.clearTimeout(handle);
  }, [
    tiles,
    tray,
    score,
    trios,
    specialTrios,
    undosLeft,
    reshuffleCount,
    combo,
    comboBest,
    magnetUses,
    extraSlotUsed,
    undoUses,
    deadlockShuffles,
    presagio,
    difficulty,
    won,
    lost,
  ]);
  useEffect(() => {
    if (won || lost) {
      try {
        window.localStorage.removeItem(`mahjong:save:${difficulty}`);
      } catch {}
    }
  }, [won, lost, difficulty]);

  return {
    difficulty,
    setDifficulty,
    tiles,
    tray,
    traySize,
    matchSize,
    freeIds,
    tappableIds,
    sealedIds,
    hintId,
    score,
    trios,
    specialTrios,
    remaining,
    total: totalTiles,
    won,
    lost,
    surrendered,
    undoCount: historyLen,
    undosLeft,
    undoLimit,
    timeLimit: levelDef.timeLimit ?? 0,
    secondsLeft,
    rotLeft,
    isDeadlocked,
    lastGroup,
    lastSpecial,
    presagio,
    synergyPulse,
    matchBurst,
    deadlockShuffles,
    undoUses,
    starPenalty: Math.min(2, Math.floor(undoUses / 2) + Math.floor(deadlockShuffles / 2)),
    reshuffleCount,
    reshuffleLimit,
    canReshuffle,
    shuffleNonce,
    shuffledIds,
    lockedShuffleIds,
    magnetUses,
    extraSlotUsed,
    lastDelta,
    lastDeltaTick,
    matchableIds,
    combo,
    comboBest,
    fever,
    surrender,
    tap,
    undo,
    showHint,
    showHintFree,
    keyRemaining,
    tileKey,
    reshuffle,
    returnTray3,
    magnet,
    extraSlot,
    newGame,
  };
}
