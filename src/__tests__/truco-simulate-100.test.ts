import { describe, it, expect } from "vitest";
import { simulateMatch } from "@/lib/ai/truco/selfplay";
import { DEFAULT_WEIGHTS, mutateWeights, type LearnedWeights } from "@/store/ai/truco-weights";
import type { AiProfile } from "@/lib/games/truco/truco";

function profileOf(
  w: LearnedWeights,
  skill = 0.7,
  aggression = 0.55,
  bluff = 0.35,
  memory = 0.55,
): AiProfile {
  return { skill, aggression, bluff, patience: 0.55, memory, depth: 2, weights: w };
}

function rng32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Simulación 100 partidas · hill-climbing con verificación de reglas", () => {
  it("100 partidas mano-a-mano CPU vs CPU, invariantes y aprendizaje", () => {
    const GAMES = 100;
    const GOAL = 30;
    let champion = { ...DEFAULT_WEIGHTS };
    let championSince = 0;
    let adoptions = 0;
    let champWins = 0;
    let chalWins = 0;
    let totalHands = 0;
    let totalSpread = 0;
    const winWindow: number[] = [];
    let earlyWinRate = 0;
    let lateWinRate = 0;

    for (let i = 0; i < GAMES; i++) {
      const rng = rng32(0xc0ffee ^ (i * 2654435761));
      const challenger = mutateWeights(champion, 0.35, rng);

      const champIsAi = i % 2 === 0;
      const res = simulateMatch({
        aiProfile: champIsAi ? profileOf(champion) : profileOf(challenger),
        opponentProfile: champIsAi ? profileOf(challenger) : profileOf(champion),
        florEnabled: true,
        pointGoal: GOAL,
        maxHands: 80,
        rng,
      });

      expect(res.winner === "you" || res.winner === "ai").toBe(true);

      const winScore = res.winner === "ai" ? res.scores.ai : res.scores.you;
      const loseScore = res.winner === "ai" ? res.scores.you : res.scores.ai;
      expect(winScore).toBeGreaterThanOrEqual(GOAL);

      expect(loseScore).toBeLessThan(GOAL);

      expect(res.scores.you).toBeGreaterThanOrEqual(0);
      expect(res.scores.ai).toBeGreaterThanOrEqual(0);

      expect(res.hands).toBeGreaterThan(0);
      expect(res.hands).toBeLessThanOrEqual(80);

      expect(res.spread).toBe(Math.abs(res.scores.you - res.scores.ai));

      const aiWon = res.winner === "ai";
      const championWonThis = champIsAi ? aiWon : !aiWon;
      if (championWonThis) champWins++;
      else chalWins++;
      totalHands += res.hands;
      totalSpread += res.spread;
      winWindow.push(championWonThis ? 1 : 0);

      if (!championWonThis) {
        champion = challenger;
        championSince = i;
        adoptions++;
      }

      if (i === 24) earlyWinRate = winWindow.slice(0, 25).reduce((a, b) => a + b, 0) / 25;
      if (i === 99) lateWinRate = winWindow.slice(75).reduce((a, b) => a + b, 0) / 25;
    }

    const summary = {
      games: GAMES,
      championWins: champWins,
      challengerWins: chalWins,
      adoptions,
      avgHandsPerMatch: +(totalHands / GAMES).toFixed(2),
      avgSpread: +(totalSpread / GAMES).toFixed(2),
      earlyChampWinRate25: +earlyWinRate.toFixed(2),
      lateChampWinRate25: +lateWinRate.toFixed(2),
      finalChampionSince: championSince,
      finalChampion: champion,
    };

    console.log("=== SIM 100 PARTIDAS ===");
    console.log(JSON.stringify(summary, null, 2));

    expect(adoptions).toBeGreaterThan(0);

    expect(champWins / GAMES).toBeGreaterThanOrEqual(0.3);
  }, 120_000);
});
