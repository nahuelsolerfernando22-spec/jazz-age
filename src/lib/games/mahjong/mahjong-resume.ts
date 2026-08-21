const LAST_KEY = "mahjong:save:v2:last";
const SAVE_PREFIX = "mahjong:save:";

export function setLastMahjongDifficulty(d: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_KEY, d);
  } catch {}
}

export function getLastMahjongDifficulty(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

export function clearLastMahjongDifficulty(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAST_KEY);
  } catch {}
}

export function hasMahjongSave(difficulty: string | null | undefined): boolean {
  if (!difficulty) return false;
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(`${SAVE_PREFIX}${difficulty}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { tiles?: unknown[] };
    return Array.isArray(parsed?.tiles) && parsed.tiles.length > 0;
  } catch {
    return false;
  }
}
