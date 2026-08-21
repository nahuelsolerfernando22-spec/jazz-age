import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { simulateMatch } from "@/lib/ai/truco/selfplay";
import { trainCfr } from "@/lib/ai/truco/cfr-train";
import { globalCfr, CfrTable, CFR_ABSTRACTION_VERSION } from "@/lib/ai/truco/cfr";
import { DEFAULT_WEIGHTS, type LearnedWeights } from "@/store/ai/truco-weights";
import { getRivalProfile, listRivals } from "@/lib/games/truco/truco-rivals";
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

const RUN = process.env.RUN_CFR_RETRAIN === "1";
const maybe = RUN ? it : it.skip;

describe("Truco CFR — retraining v2 con rivales rotativos + descuento", () => {
  maybe("entrena, persiste y valida vs. heurística y rivales fijos", { timeout: 900_000 }, () => {
    expect(CFR_ABSTRACTION_VERSION).toBeGreaterThanOrEqual(2);

    console.log(`[CFR v2] globalCfr loadInfo=${JSON.stringify(globalCfr.loadInfo)}`);

    const baseW: LearnedWeights = { ...DEFAULT_WEIGHTS, cfrBlend: 0 };
    const aiProf = profileOf(baseW, 2);
    const bell = getRivalProfile("bellver");
    const sera = getRivalProfile("serafina");
    const vasa = getRivalProfile("vasari");

    const opponents: AiProfile[] = [aiProf, bell, sera, sera, vasa, vasa];
    void listRivals;

    const t0 = Date.now();

    const rounds = [
      { iters: 60_000, epsilon: 0.15, discount: 0.5, seed: 0xa11ce001 },
      { iters: 60_000, epsilon: 0.08, discount: 0.5, seed: 0xb0b1e002 },
      { iters: 40_000, epsilon: 0.04, discount: 0.5, seed: 0xc01d0003 },
    ];
    let table = new CfrTable();
    let totalIters = 0,
      totalHands = 0;
    const dec = { "envido-respond": 0, "truco-respond": 0, "envido-canto": 0, "truco-canto": 0 };
    for (const r of rounds) {
      const out = trainCfr({
        iters: r.iters,
        aiProfile: aiProf,
        oppProfile: aiProf,
        opponents,
        discount: r.discount,
        rng: rng32(r.seed),
        pointGoal: 30,
        maxHands: 10,
        epsilon: r.epsilon,
        seedTable: table,
      });
      table = out.table;
      totalIters += out.iters;
      totalHands += out.hands;
      for (const k of Object.keys(dec) as (keyof typeof dec)[]) dec[k] += out.decisionsByKind[k];
    }
    const trainMs = Date.now() - t0;

    const beforePrune = table.size();
    const pruned = table.prune(4);

    console.log(`[CFR v3] pruned ${pruned} nodos (< 4 visitas), ${beforePrune} → ${table.size()}`);

    const outPath = join(process.cwd(), "src/lib/ai/truco/cfr-table.json");
    writeFileSync(outPath, table.toJSON(), "utf-8");

    globalCfr.clear();
    globalCfr.mergeFrom(table);

    expect(table.size()).toBeGreaterThan(200);
    expect(dec["envido-respond"]).toBeGreaterThan(1000);
    expect(dec["truco-respond"]).toBeGreaterThan(1000);
    expect(dec["envido-canto"]).toBeGreaterThan(2000);
    expect(dec["truco-canto"]).toBeGreaterThan(2000);

    const cfrOn: LearnedWeights = { ...DEFAULT_WEIGHTS, cfrBlend: 0.85 };
    const cfrOff: LearnedWeights = { ...DEFAULT_WEIGHTS, cfrBlend: 0.0 };
    const N = 240;

    const runMatchup = (opp: AiProfile, label: string) => {
      let wins = 0;
      for (let i = 0; i < N; i++) {
        const rng = rng32((0xee110000 ^ (i * 0x9e3779b1)) >>> 0);
        const onIsAi = i % 2 === 0;
        const res = simulateMatch({
          aiProfile: onIsAi ? profileOf(cfrOn) : opp,
          opponentProfile: onIsAi ? opp : profileOf(cfrOn),
          florEnabled: true,
          pointGoal: 30,
          maxHands: 80,
          rng,
        });
        const onWon = (onIsAi && res.winner === "ai") || (!onIsAi && res.winner === "you");
        if (onWon) wins++;
      }

      console.log(`[CFR v2] ${label}: ${wins}/${N} (${((wins / N) * 100).toFixed(1)}%)`);
      return wins / N;
    };

    const wrHeur = runMatchup(profileOf(cfrOff), "vs heurística pura");
    const wrBellver = runMatchup(getRivalProfile("bellver"), "vs Bellver");
    const wrSerafina = runMatchup(getRivalProfile("serafina"), "vs Serafina");
    const wrVasari = runMatchup(getRivalProfile("vasari"), "vs Vasari");

    console.log(
      `[CFR v2] train=${trainMs}ms iters=${totalIters} hands=${totalHands} ` +
        `nodes=${table.size()} visits=${table.totalVisits()}\n` +
        `  decisiones: envido-canto=${dec["envido-canto"]} truco-canto=${dec["truco-canto"]} ` +
        `envido-respond=${dec["envido-respond"]} truco-respond=${dec["truco-respond"]}\n` +
        `  kindStats=${JSON.stringify(table.kindStats())}`,
    );

    const avg = (wrHeur + wrBellver + wrSerafina + wrVasari) / 4;
    expect(avg).toBeGreaterThanOrEqual(0.5);
    expect(wrHeur).toBeGreaterThanOrEqual(0.5);
  });
});
