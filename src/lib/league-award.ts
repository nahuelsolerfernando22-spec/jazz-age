import { awardLeaguePoints } from "@/store/league-progress";
import type { LeagueGameId } from "@/lib/leagues-daily";
import { broadcastResult } from "@/lib/cross-reputation";
import { useDebts } from "@/store/debts";

const PATH_TO_GAME: Readonly<Record<string, LeagueGameId>> = {
  "/ruleta": "ruleta",
  "/blackjack": "blackjack",
  "/tables": "blackjack",
  "/mahjong": "mahjong",
  "/dados": "dados",
  "/chinchon": "chinchon",
  "/bagatelle": "bagatelle",
  "/escoba": "escoba",
  "/solitario": "solitario",
  "/truco": "truco",
};

function currentGame(): LeagueGameId | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  for (const [prefix, id] of Object.entries(PATH_TO_GAME)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return id;
  }
  return null;
}

const LEAGUE_HOSTESS: Partial<Record<LeagueGameId, string>> = {
  ruleta: "clara",
  slots: "salome",
  blackjack: "vita",
  mahjong: "lin",
  dados: "zelda",
  bagatelle: "lola",
  chinchon: "luisa",
  truco: "eulalia",
  escoba: "bettie",
  solitario: "jade",
};

export function awardLeagueFromChipsDelta(delta: number): number {
  if (delta <= 0) return 0;
  const game = currentGame();
  if (!game) return 0;
  const points = Math.max(1, Math.floor(delta / 2));
  awardLeaguePoints(game, points);
  const hostess = LEAGUE_HOSTESS[game];
  if (hostess && delta >= 50) {
    broadcastResult(hostess, "win", delta);
  }
  const debts = useDebts.getState();
  debts.recordFavorProgress(game, 1);
  const entry = debts.debts.find((d) => d.gameId === game);
  if (!entry || entry.balance <= 0 || entry.payoutPenalty <= 0) return 0;
  const cut = Math.max(1, Math.floor(delta * entry.payoutPenalty));
  return debts.repay(game, cut);
}
