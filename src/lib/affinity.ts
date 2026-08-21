const AFFINITY_KEY = "speakeasy:affinity:v1";
const META_KEY = "speakeasy:affinity:meta:v1";

export interface AffinityState {
  points: Record<string, number>;
}

interface AffinityMeta {
  lastGreet: Record<string, string>;
  lastVisit: Record<string, string>;
  visitStreak: Record<string, number>;
  lastStreakBonus: Record<string, string>;
  lastInvite?: Record<string, string>;
  winStreak?: Record<string, number>;
}

export const SALON_UNLOCK_THRESHOLD = 300;

export const AFFECTION_LEVELS = [
  { level: 0, min: 0, name: "Desconocida" },
  { level: 1, min: 300, name: "Saludada" },
  { level: 2, min: 1_500, name: "Conocida" },
  { level: 3, min: 10_000, name: "Habitual" },
  { level: 4, min: 40_000, name: "Confidente" },
  { level: 5, min: 85_000, name: "Cómplice" },
  { level: 6, min: 300_000, name: "Amor" },
  { level: 7, min: 1_000_000, name: "Cuervo Dorado" },
] as const;

export const MAX_AFFECTION_LEVEL = 7;

export type AffectionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function load(): AffinityState {
  try {
    const raw = localStorage.getItem(AFFINITY_KEY);
    if (!raw) return { points: {} };
    return JSON.parse(raw);
  } catch {
    return { points: {} };
  }
}
function save(s: AffinityState) {
  try {
    localStorage.setItem(AFFINITY_KEY, JSON.stringify(s));
  } catch {}
}
function loadMeta(): AffinityMeta {
  const empty: AffinityMeta = {
    lastGreet: {},
    lastVisit: {},
    visitStreak: {},
    lastStreakBonus: {},
    lastInvite: {},
    winStreak: {},
  };
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      lastGreet: parsed.lastGreet ?? {},
      lastVisit: parsed.lastVisit ?? {},
      visitStreak: parsed.visitStreak ?? {},
      lastStreakBonus: parsed.lastStreakBonus ?? {},
      lastInvite: parsed.lastInvite ?? {},
      winStreak: parsed.winStreak ?? {},
    };
  } catch {
    return empty;
  }
}
function saveMeta(m: AffinityMeta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {}
}

export function getAffinity(npcId: string): number {
  return load().points[npcId] ?? 0;
}

export interface AffectionLevelUpDetail {
  npcId: string;
  fromLevel: AffectionLevel;
  toLevel: AffectionLevel;
  points: number;
}

export function addAffinity(npcId: string, delta: number) {
  const before = getLevel(npcId);
  const s = load();
  s.points[npcId] = Math.max(0, (s.points[npcId] ?? 0) + delta);
  save(s);
  try {
    window.dispatchEvent(
      new CustomEvent("affection:changed", { detail: { npcId, points: s.points[npcId] } }),
    );
  } catch {}

  const after = getLevel(npcId);
  if (after > before) {
    try {
      window.dispatchEvent(
        new CustomEvent<AffectionLevelUpDetail>("affection:levelup", {
          detail: { npcId, fromLevel: before, toLevel: after, points: s.points[npcId] },
        }),
      );
    } catch {}
  }
}

export const SOFT_LEVEL_CAP: AffectionLevel = 3;

export function getLevel(npcId: string): AffectionLevel {
  const pts = getAffinity(npcId);
  let lvl: AffectionLevel = 0;
  for (const t of AFFECTION_LEVELS) {
    if (pts >= t.min) lvl = t.level as AffectionLevel;
  }
  return (lvl > SOFT_LEVEL_CAP ? SOFT_LEVEL_CAP : lvl) as AffectionLevel;
}

export function getLevelInfo(npcId: string) {
  const pts = getAffinity(npcId);
  const lvl = getLevel(npcId);

  const capped = lvl >= SOFT_LEVEL_CAP;
  const next = capped ? undefined : AFFECTION_LEVELS.find((t) => t.level === lvl + 1);
  return {
    level: lvl,
    name: AFFECTION_LEVELS[lvl].name,
    points: pts,
    nextAt: next?.min ?? null,
    toNext: next ? Math.max(0, next.min - pts) : 0,
    capped,
  };
}

export function alreadyGreetedToday(npcId: string): boolean {
  return loadMeta().lastGreet[npcId] === todayKey();
}

export function dailyGreet(
  npcId: string,
  bonus: number,
): { applied: boolean; gained: number; total: number } {
  if (alreadyGreetedToday(npcId)) {
    return { applied: false, gained: 0, total: getAffinity(npcId) };
  }
  const m = loadMeta();
  m.lastGreet[npcId] = todayKey();
  saveMeta(m);
  addAffinity(npcId, bonus);
  return { applied: true, gained: bonus, total: getAffinity(npcId) };
}

export function recordVisit(npcId: string): { streak: number; streakBonus: number } {
  const m = loadMeta();
  const today = todayKey();
  if (m.lastVisit[npcId] === today) {
    return { streak: m.visitStreak[npcId] ?? 1, streakBonus: 0 };
  }
  const yesterday = yesterdayKey();
  const prev = m.visitStreak[npcId] ?? 0;
  const next = m.lastVisit[npcId] === yesterday ? prev + 1 : 1;
  m.lastVisit[npcId] = today;
  m.visitStreak[npcId] = next;

  let streakBonus = 0;
  if (next >= 5 && m.lastStreakBonus[npcId] !== today) {
    const bonusEvery = next % 5 === 0;
    if (bonusEvery) {
      streakBonus = 8;
      m.lastStreakBonus[npcId] = today;
    }
  }
  saveMeta(m);
  if (streakBonus > 0) addAffinity(npcId, streakBonus);
  return { streak: next, streakBonus };
}

export function isSalonUnlocked(npcId: string): boolean {
  return getAffinity(npcId) >= SALON_UNLOCK_THRESHOLD;
}

export function countSalonUnlocked(roster: { id: string }[]): number {
  const s = load();
  return roster.filter((n) => (s.points[n.id] ?? 0) >= SALON_UNLOCK_THRESHOLD).length;
}

export function alreadyInvitedToday(npcId: string): boolean {
  return (loadMeta().lastInvite ?? {})[npcId] === todayKey();
}

export function inviteDrink(
  npcId: string,
  bonus = 5,
): { applied: boolean; gained: number; total: number } {
  if (alreadyInvitedToday(npcId)) {
    return { applied: false, gained: 0, total: getAffinity(npcId) };
  }
  const m = loadMeta();
  const map = m.lastInvite ?? {};
  map[npcId] = todayKey();
  m.lastInvite = map;
  saveMeta(m);
  addAffinity(npcId, bonus);
  return { applied: true, gained: bonus, total: getAffinity(npcId) };
}

export type WinMagnitude = "normal" | "big";

export interface AwardAffectionOnWinResult {
  gained: number;
  streakBonus: number;
  winStreak: number;
  total: number;
}

export function awardAffectionOnWin(
  npcId: string,
  magnitude: WinMagnitude = "normal",
): AwardAffectionOnWinResult {
  if (!npcId) return { gained: 0, streakBonus: 0, winStreak: 0, total: 0 };
  const base = magnitude === "big" ? 15 : 5;
  const m = loadMeta();
  const streaks = m.winStreak ?? {};
  const next = (streaks[npcId] ?? 0) + 1;
  streaks[npcId] = next;
  m.winStreak = streaks;
  const streakBonus = next > 0 && next % 3 === 0 ? 25 : 0;
  saveMeta(m);
  const gained = base + streakBonus;
  addAffinity(npcId, gained);
  return { gained, streakBonus, winStreak: next, total: getAffinity(npcId) };
}

export function registerHostessLoss(npcId: string) {
  if (!npcId) return;
  const m = loadMeta();
  const streaks = m.winStreak ?? {};
  if (streaks[npcId]) {
    streaks[npcId] = 0;
    m.winStreak = streaks;
    saveMeta(m);
  }
}
