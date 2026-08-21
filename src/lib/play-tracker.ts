import { useNemesis } from "@/store/nemesis";
import { useSingleScores } from "@/store/single-scores";
import { useGameStreaks } from "@/store/game-streaks";
import { useDailyMissions } from "@/store/daily-missions";
import { useDailyEcho } from "@/store/daily-echo";
import { installEncargoTracker } from "@/lib/encargo-tracker";
import { SINGLE_GAMES } from "@/lib/single-games";
import { track } from "@/lib/analytics";

let installed = false;

export function installPlayTracker() {
  if (installed) return;
  installed = true;

  installEncargoTracker();

  let prevNemesis = snapshotNemesis();
  let prevScores = snapshotScores();

  useNemesis.subscribe((state) => {
    const next = snapshotNemesisFrom(state.byGame);
    for (const id of Object.keys(next)) {
      const before = prevNemesis[id] ?? { plays: 0, wins: 0 };
      const after = next[id];
      const dPlays = after.plays - before.plays;
      const dWins = after.wins - before.wins;
      if (dPlays > 0) {
        useGameStreaks.getState().trackPlay(id, { won: dWins > 0 });
        useDailyMissions.getState().tick(id, { plays: dPlays, wins: Math.max(0, dWins) });
        useDailyEcho.getState().tick(id, { plays: dPlays, wins: Math.max(0, dWins) });
        track("game_finish", { gameId: id, plays: dPlays, wins: Math.max(0, dWins) });
      }
    }
    prevNemesis = next;
  });

  useSingleScores.subscribe((state) => {
    const next = snapshotScoresFrom(state.byGame);
    for (const id of Object.keys(next)) {
      const before = prevScores[id] ?? { plays: 0 };
      const after = next[id];
      const dPlays = after.plays - before.plays;
      if (dPlays > 0) {
        // Las mesas con némesis ya cuentan por el otro canal: evitamos duplicar.
        const hasNemesis = SINGLE_GAMES.find((g) => g.id === id)?.hasNemesis ?? false;
        if (!hasNemesis) {
          useGameStreaks.getState().trackPlay(id, { won: (after.best ?? 0) > 0 });
          useDailyMissions.getState().tick(id, { plays: dPlays, wins: dPlays });
          useDailyEcho.getState().tick(id, { plays: dPlays, wins: dPlays });
        }
        track("game_finish", { gameId: id, plays: dPlays, score: after.best ?? 0 });
      }
    }
    prevScores = next;
  });
}

function snapshotNemesis(): Record<string, { plays: number; wins: number }> {
  return snapshotNemesisFrom(useNemesis.getState().byGame);
}
function snapshotNemesisFrom(by: Record<string, { wins: number; losses: number; draws: number }>) {
  const out: Record<string, { plays: number; wins: number }> = {};
  for (const [id, r] of Object.entries(by)) {
    out[id] = { plays: r.wins + r.losses + r.draws, wins: r.wins };
  }
  return out;
}
function snapshotScores(): Record<string, { plays: number; best: number }> {
  return snapshotScoresFrom(useSingleScores.getState().byGame);
}
function snapshotScoresFrom(by: Record<string, { plays: number; best: number }>) {
  const out: Record<string, { plays: number; best: number }> = {};
  for (const [id, r] of Object.entries(by)) {
    out[id] = { plays: r.plays, best: r.best };
  }
  return out;
}
