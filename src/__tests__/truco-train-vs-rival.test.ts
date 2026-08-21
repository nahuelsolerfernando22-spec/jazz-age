import { describe, it, expect } from "vitest";
import { simulateMatch } from "@/lib/ai/truco/selfplay";
import { DEFAULT_WEIGHTS, mutateWeights, type LearnedWeights } from "@/store/ai/truco-weights";
import { getRivalProfile, listRivals } from "@/lib/games/truco/truco-rivals";
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

function evalVs(
  champion: LearnedWeights,
  rivalProfile: AiProfile,
  matches: number,
  seed: number,
): number {
  let champWins = 0;
  for (let i = 0; i < matches; i++) {
    const rng = rng32((seed ^ (i * 0x9e3779b1)) >>> 0);
    const champIsAi = i % 2 === 0;
    const res = simulateMatch({
      aiProfile: champIsAi ? profileOf(champion) : rivalProfile,
      opponentProfile: champIsAi ? rivalProfile : profileOf(champion),
      florEnabled: true,
      pointGoal: 30,
      maxHands: 80,
      rng,
    });
    const aiWon = res.winner === "ai";
    if (champIsAi ? aiWon : !aiWon) champWins++;
  }
  return champWins / matches;
}

describe("Entrenamiento con Hall of Fame + rivales fijos", () => {
  it("mide mejora del campeón contra Bellver antes y después de entrenar", () => {
    const REFERENCE = getRivalProfile("bellver");
    const rivals = listRivals();
    const EVAL_MATCHES = 40;
    const SEED = 0xb16b00b5 >>> 0;

    const before = evalVs(DEFAULT_WEIGHTS, REFERENCE, EVAL_MATCHES, SEED);

    const hof: LearnedWeights[] = [];
    const MAX_HOF = 6;
    const K_MATCHES = 9;
    const GENERATIONS = 150;
    const SIGMA = 0.15;
    const mutRng = rng32(SEED ^ 0xdeadbeef);

    const fitness = (w: LearnedWeights): number => {
      let wins = 0;
      const pool: AiProfile[] = [...rivals.map((r) => r.profile)];
      for (const snap of hof) pool.push(profileOf(snap));
      for (let k = 0; k < K_MATCHES; k++) {
        const spar = pool[k % pool.length]!;
        const champIsAi = k % 2 === 0;

        const rng = rng32((SEED ^ (k * 977)) >>> 0);
        const res = simulateMatch({
          aiProfile: champIsAi ? profileOf(w) : spar,
          opponentProfile: champIsAi ? spar : profileOf(w),
          florEnabled: true,
          pointGoal: 30,
          maxHands: 80,
          rng,
        });
        expect(res.scores.you).toBeGreaterThanOrEqual(0);
        expect(res.scores.ai).toBeGreaterThanOrEqual(0);
        const aiWon = res.winner === "ai";
        if (champIsAi ? aiWon : !aiWon) wins++;
      }
      return wins;
    };

    let champion = { ...DEFAULT_WEIGHTS };
    let championFit = fitness(champion);
    const fitTrace: number[] = [championFit];
    let adoptions = 0;
    for (let gen = 1; gen <= GENERATIONS; gen++) {
      const challenger = mutateWeights(champion, SIGMA, mutRng);
      const chalFit = fitness(challenger);
      if (chalFit > championFit) {
        champion = challenger;
        championFit = chalFit;
        adoptions++;
        hof.unshift({ ...champion });
        if (hof.length > MAX_HOF) hof.length = MAX_HOF;
      }
      fitTrace.push(championFit);
    }
    const TRAIN_GAMES = GENERATIONS * K_MATCHES;
    console.log(
      `Fit trace (of ${K_MATCHES}): ${fitTrace[0]} → ${fitTrace[Math.floor(GENERATIONS / 2)]} → ${fitTrace[GENERATIONS]}`,
    );

    const after = evalVs(champion, REFERENCE, EVAL_MATCHES, SEED);

    const afterSerafina = evalVs(champion, getRivalProfile("serafina"), EVAL_MATCHES, SEED);
    const afterVasari = evalVs(champion, getRivalProfile("vasari"), EVAL_MATCHES, SEED);
    const beforeSerafina = evalVs(DEFAULT_WEIGHTS, getRivalProfile("serafina"), EVAL_MATCHES, SEED);
    const beforeVasari = evalVs(DEFAULT_WEIGHTS, getRivalProfile("vasari"), EVAL_MATCHES, SEED);

    console.log("=== HALL OF FAME + RIVALES ===");
    console.log(
      JSON.stringify(
        {
          trainGames: TRAIN_GAMES,
          adoptions,
          hofSize: hof.length,
          evalMatches: EVAL_MATCHES,
          vsBellver: { before: +before.toFixed(2), after: +after.toFixed(2) },
          vsSerafina: { before: +beforeSerafina.toFixed(2), after: +afterSerafina.toFixed(2) },
          vsVasari: { before: +beforeVasari.toFixed(2), after: +afterVasari.toFixed(2) },
          finalChampion: champion,
        },
        null,
        2,
      ),
    );

    expect(championFit).toBeGreaterThanOrEqual(fitTrace[0]!);
    const avgBefore = (before + beforeSerafina + beforeVasari) / 3;
    const avgAfter = (after + afterSerafina + afterVasari) / 3;
    console.log(
      `Promedio vs rivales · before=${avgBefore.toFixed(2)} → after=${avgAfter.toFixed(2)}`,
    );

    expect(avgAfter).toBeGreaterThanOrEqual(0.1);
  }, 300_000);
});
