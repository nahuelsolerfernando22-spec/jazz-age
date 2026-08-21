import { hasMahjongSave, getLastMahjongDifficulty } from "@/lib/games/mahjong/mahjong-resume";

const RUN_STORE_KEYS: Record<string, string> = {
  blackjack: "cuervo:blackjack-run:v1",
  chinchon: "cuervo:chinchon-run:v1",
  truco: "cuervo:truco-run:v1",
  escoba: "cuervo:escoba-run:v1",
  dados: "cuervo:dados-run:v1",
  ruleta: "cuervo:ruleta-run:v1",
  slots: "cuervo:slots-run:v1",
  bagatelle: "cuervo:bagatelle-run:v1",
  solitario: "cuervo:solitario-run:v1",
};

function readPersistedActiveLevel(storeKey: string): string | null {
  try {
    const raw = window.localStorage.getItem(storeKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { activeLevel?: string | null } };
    const lvl = parsed?.state?.activeLevel;
    return typeof lvl === "string" && lvl.length > 0 ? lvl : null;
  } catch {
    return null;
  }
}

export function hasActiveRun(gameId: string): boolean {
  if (typeof window === "undefined") return false;
  if (gameId === "mahjong") {
    return hasMahjongSave(getLastMahjongDifficulty());
  }
  const key = RUN_STORE_KEYS[gameId];
  if (!key) return false;
  return readPersistedActiveLevel(key) !== null;
}
