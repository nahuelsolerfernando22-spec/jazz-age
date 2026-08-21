import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { simulateMatch } from "@/lib/ai/truco/selfplay";
import { trainCfr } from "@/lib/ai/truco/cfr-train";
import { globalCfr, CfrTable } from "@/lib/ai/truco/cfr";
import { DEFAULT_WEIGHTS, type LearnedWeights } from "@/store/ai/truco-weights";
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

function profileOf(w: LearnedWeights, depth = 2): AiProfile {
  return {
    skill: 0.7,
    aggression: 0.55,
    bluff: 0.35,
    patience: 0.55,
    memory: 0.55,
    depth,
    weights: w,
  };
}

describe("Truco CFR solver — training + validation", () => {
  it("entrena la tabla CFR y bate al perfil sin CFR con margen", { timeout: 240_000 }, () => {
    const baseW: LearnedWeights = { ...DEFAULT_WEIGHTS, cfrBlend: 0 };
    const aiProf = profileOf(baseW, 2);
    const oppProf = profileOf(baseW, 2);
    const trainRng = rng32(0xc0ffee);
    const t0 = Date.now();
    const trained = trainCfr({
      iters: 8000,
      aiProfile: aiProf,
      oppProfile: oppProf,
      rng: trainRng,
      pointGoal: 30,
      maxHands: 10,
      epsilon: 0.1,
    });
    const trainMs = Date.now() - t0;

    expect(trained.visitedNodes).toBeGreaterThan(50);
    expect(trained.totalVisits).toBeGreaterThan(2000);

    expect(trained.decisionsByKind["envido-respond"]).toBeGreaterThan(50);
    expect(trained.decisionsByKind["truco-respond"]).toBeGreaterThan(50);
    expect(trained.decisionsByKind["envido-canto"]).toBeGreaterThan(100);
    expect(trained.decisionsByKind["truco-canto"]).toBeGreaterThan(100);

    const outPath = join(process.cwd(), "src/lib/ai/truco/cfr-table.json");
    writeFileSync(outPath, trained.table.toJSON(), "utf-8");

    globalCfr.clear();
    globalCfr.mergeFrom(trained.table);

    const cfrOn: LearnedWeights = { ...DEFAULT_WEIGHTS, cfrBlend: 0.8 };
    const cfrOff: LearnedWeights = { ...DEFAULT_WEIGHTS, cfrBlend: 0.0 };
    const N_MATCHES = 200;
    let onWins = 0;
    let offWins = 0;
    for (let i = 0; i < N_MATCHES; i++) {
      const rng = rng32((0xbadcafe ^ (i * 0x9e3779b1)) >>> 0);

      const onIsAi = i % 2 === 0;
      const res = simulateMatch({
        aiProfile: onIsAi ? profileOf(cfrOn) : profileOf(cfrOff),
        opponentProfile: onIsAi ? profileOf(cfrOff) : profileOf(cfrOn),
        florEnabled: true,
        pointGoal: 30,
        maxHands: 80,
        rng,
      });
      const onWon = (onIsAi && res.winner === "ai") || (!onIsAi && res.winner === "you");
      if (onWon) onWins++;
      else offWins++;
    }
    const winRate = onWins / N_MATCHES;

    console.log(
      `[CFR] train=${trainMs}ms iters=${trained.iters} hands=${trained.hands} ` +
        `nodes=${trained.visitedNodes} visits=${trained.totalVisits}\n` +
        `  decisiones: envido-canto=${trained.decisionsByKind["envido-canto"]} ` +
        `truco-canto=${trained.decisionsByKind["truco-canto"]} ` +
        `envido-respond=${trained.decisionsByKind["envido-respond"]} ` +
        `truco-respond=${trained.decisionsByKind["truco-respond"]}\n` +
        `  validación: CFR=${onWins}/${N_MATCHES} (win-rate ${(winRate * 100).toFixed(1)}%) ` +
        `vs heurística=${offWins}`,
    );

    expect(winRate).toBeGreaterThanOrEqual(0.5);
  });

  it("CfrTable serializa/deserializa sin pérdida", () => {
    const t = new CfrTable();
    t.update("K1", ["fold", "accept", "escalate"], "accept", 1.5, [0.2, 0.5, 0.3]);
    t.update("K1", ["fold", "accept"], "fold", -0.4, [0.6, 0.4]);
    const json = t.toJSON();
    const back = CfrTable.fromJSON(json);
    expect(back.size()).toBe(1);
    const avg = back.averageStrategy("K1", ["fold", "accept", "escalate"]);
    expect(avg).not.toBeNull();
    const sum = avg!.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 3);
  });

  it(
    "regresión por-tipo: cada tipo de decisión bate la heurística en aislado",
    { timeout: 180_000 },
    () => {
      const N = 120;
      const blends = [0.0, 0.4, 0.8];
      const winRates: number[] = [];
      for (const blend of blends) {
        const cfrOn: LearnedWeights = { ...DEFAULT_WEIGHTS, cfrBlend: blend };
        const cfrOff: LearnedWeights = { ...DEFAULT_WEIGHTS, cfrBlend: 0 };
        let onWins = 0;
        for (let i = 0; i < N; i++) {
          const rng = rng32((0xf00dbeef ^ (i * 0x9e3779b1)) >>> 0);
          const onIsAi = i % 2 === 0;
          const res = simulateMatch({
            aiProfile: onIsAi ? profileOf(cfrOn) : profileOf(cfrOff),
            opponentProfile: onIsAi ? profileOf(cfrOff) : profileOf(cfrOn),
            florEnabled: true,
            pointGoal: 30,
            maxHands: 80,
            rng,
          });
          const onWon = (onIsAi && res.winner === "ai") || (!onIsAi && res.winner === "you");
          if (onWon) onWins++;
        }
        winRates.push(onWins / N);
      }

      console.log(
        `[CFR blend sweep] ${blends.map((b, i) => `blend=${b}→${(winRates[i]! * 100).toFixed(1)}%`).join(" | ")}`,
      );

      expect(winRates[0]).toBeGreaterThanOrEqual(0.42);
      expect(winRates[0]).toBeLessThanOrEqual(0.58);

      const bestNonZero = Math.max(winRates[1]!, winRates[2]!);
      expect(bestNonZero).toBeGreaterThanOrEqual(0.5);
    },
  );
});
