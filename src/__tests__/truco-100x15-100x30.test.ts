import { describe, it, expect } from "vitest";
import { simulateMatch } from "@/lib/ai/truco/selfplay";
import { DEFAULT_WEIGHTS } from "@/store/ai/truco-weights";
import type { AiProfile } from "@/lib/games/truco/truco";

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
const prof = (): AiProfile => ({
  skill: 0.7,
  aggression: 0.55,
  bluff: 0.35,
  patience: 0.55,
  memory: 0.55,
  depth: 2,
  weights: DEFAULT_WEIGHTS,
});

function runBatch(goal: number) {
  const N = 100;
  let aiWins = 0,
    youWins = 0,
    totalHands = 0,
    totalSpread = 0;
  let minHands = Infinity,
    maxHands = 0;
  const errors: string[] = [];
  for (let i = 0; i < N; i++) {
    const rng = rng32((0xb16b00 ^ (i * 2654435761)) >>> 0);
    const res = simulateMatch({
      aiProfile: prof(),
      opponentProfile: prof(),
      florEnabled: true,
      pointGoal: goal,
      maxHands: 100,
      rng,
    });
    const win = res.winner === "ai" ? res.scores.ai : res.scores.you;
    const lose = res.winner === "ai" ? res.scores.you : res.scores.ai;
    if (win < goal) errors.push(`match ${i}: winner<${goal}`);
    if (lose >= goal) errors.push(`match ${i}: loser>=${goal}`);
    if (res.spread !== Math.abs(res.scores.you - res.scores.ai))
      errors.push(`match ${i}: spread mismatch`);
    if (res.winner === "ai") aiWins++;
    else youWins++;
    totalHands += res.hands;
    totalSpread += res.spread;
    if (res.hands < minHands) minHands = res.hands;
    if (res.hands > maxHands) maxHands = res.hands;
  }
  return {
    goal,
    N,
    aiWins,
    youWins,
    avgHands: +(totalHands / N).toFixed(2),
    avgSpread: +(totalSpread / N).toFixed(2),
    minHands,
    maxHands,
    errors,
  };
}

describe("Truco 100+100", () => {
  it("100 a 15 y 100 a 30", () => {
    const r15 = runBatch(15);
    const r30 = runBatch(30);
    console.log("=== 100 PARTIDAS A 15 ===\n" + JSON.stringify(r15, null, 2));
    console.log("=== 100 PARTIDAS A 30 ===\n" + JSON.stringify(r30, null, 2));
    expect(r15.errors).toEqual([]);
    expect(r30.errors).toEqual([]);
    expect(r15.aiWins + r15.youWins).toBe(100);
    expect(r30.aiWins + r30.youWins).toBe(100);
  }, 300_000);
});
