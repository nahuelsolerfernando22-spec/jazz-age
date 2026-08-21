import { SINGLE_GAMES, type SingleGame } from "./single-games";

export const GAME_PATHS: ReadonlySet<string> = new Set(SINGLE_GAMES.map((g) => g.to));

export function isGameRoute(pathname: string): boolean {
  if (!pathname) return false;
  const clean = pathname.replace(/\/+$/, "") || "/";
  return GAME_PATHS.has(clean);
}

export function gameForPath(pathname: string): SingleGame | null {
  if (!pathname) return null;
  const clean = pathname.replace(/\/+$/, "") || "/";
  return SINGLE_GAMES.find((g) => g.to === clean) ?? null;
}
