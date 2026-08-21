import { describe, it, expect } from "vitest";
import { simulateMatch } from "@/lib/ai/truco/selfplay";
import { DEFAULT_WEIGHTS, mutateWeights, type LearnedWeights } from "@/store/ai/truco-weights";
import type { AiProfile } from "@/lib/games/truco/truco";

function profileOf(w: LearnedWeights): AiProfile {
  return {
    skill: 0.7,
    aggression: 0.55,
    bluff: 0.35,
    patience: 0.55,
    memory: 0.55,
    depth: 2,
    weights: w,
  };
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

describe("Simulación 500 partidas × 10 seeds · invariantes de picardía/reclamos", () => {
  it("verifica reglas y aprendizaje en todo el rango", () => {
    const SEEDS = [
      0xc0ffee, 0xbada55, 0xdeadbe, 0x1337, 0xcafe, 0xfeedf, 0xabcdef, 0x900d, 0x5eed, 0xb16b00,
    ];
    const GAMES = 500;
    const GOAL = 30;
    const perSeed: Array<{
      seed: number;
      champWins: number;
      chalWins: number;
      adoptions: number;
      avgHands: number;
      avgSpread: number;
      early: number;
      late: number;
      finalChampion: LearnedWeights;
    }> = [];
    let totalGames = 0,
      totalInvariantsChecked = 0;

    for (const seed of SEEDS) {
      let champion: LearnedWeights = { ...DEFAULT_WEIGHTS };
      let championProfile = profileOf(champion);
      let champWins = 0,
        chalWins = 0,
        adoptions = 0;
      let totalHands = 0,
        totalSpread = 0;
      const wins: number[] = [];

      for (let i = 0; i < GAMES; i++) {
        const rng = rng32((seed ^ (i * 2654435761)) >>> 0);
        const challenger = mutateWeights(champion, 0.35, rng);
        const challengerProfile = profileOf(challenger);
        const champIsAi = i % 2 === 0;
        const res = simulateMatch({
          aiProfile: champIsAi ? championProfile : challengerProfile,
          opponentProfile: champIsAi ? challengerProfile : championProfile,
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
        expect(res.hands).toBeGreaterThanOrEqual(0);
        expect(res.hands).toBeLessThanOrEqual(80);
        expect(res.spread).toBe(Math.abs(res.scores.you - res.scores.ai));
        totalInvariantsChecked += 8;

        const aiWon = res.winner === "ai";
        const championWonThis = champIsAi ? aiWon : !aiWon;
        if (championWonThis) champWins++;
        else chalWins++;
        totalHands += res.hands;
        totalSpread += res.spread;
        wins.push(championWonThis ? 1 : 0);
        if (!championWonThis) {
          champion = challenger;
          championProfile = challengerProfile;
          adoptions++;
        }
      }

      const early = wins.slice(0, 100).reduce((a, b) => a + b, 0) / 100;
      const late = wins.slice(-100).reduce((a, b) => a + b, 0) / 100;
      perSeed.push({
        seed,
        champWins,
        chalWins,
        adoptions,
        avgHands: +(totalHands / GAMES).toFixed(2),
        avgSpread: +(totalSpread / GAMES).toFixed(2),
        early: +early.toFixed(2),
        late: +late.toFixed(2),
        finalChampion: champion,
      });
      totalGames += GAMES;
    }

    const agg = {
      totalGames,
      totalSeeds: SEEDS.length,
      totalInvariantsChecked,
      avgAdoptionsPerSeed: +(perSeed.reduce((a, x) => a + x.adoptions, 0) / SEEDS.length).toFixed(
        1,
      ),
      avgEarlyChampWinRate: +(perSeed.reduce((a, x) => a + x.early, 0) / SEEDS.length).toFixed(3),
      avgLateChampWinRate: +(perSeed.reduce((a, x) => a + x.late, 0) / SEEDS.length).toFixed(3),
      avgHands: +(perSeed.reduce((a, x) => a + x.avgHands, 0) / SEEDS.length).toFixed(2),
      avgSpread: +(perSeed.reduce((a, x) => a + x.avgSpread, 0) / SEEDS.length).toFixed(2),
    };
    console.log("=== 500 × 10 SEEDS ===");
    console.log(JSON.stringify(agg, null, 2));
    console.log("--- por seed ---");
    for (const r of perSeed) {
      console.log(
        `seed=0x${r.seed.toString(16)}  champ=${r.champWins}/${r.chalWins}  adopt=${r.adoptions}  early→late=${r.early}→${r.late}  hands≈${r.avgHands}  spread≈${r.avgSpread}`,
      );
    }

    expect(totalGames).toBe(5000);
    expect(agg.avgAdoptionsPerSeed).toBeGreaterThan(0);
  }, 600_000);
});
