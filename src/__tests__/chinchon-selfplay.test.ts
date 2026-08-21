import { describe, expect, it } from "vitest";
import { championWinRate, trainChinchon } from "@/lib/ai/chinchon/selfplay";
import { DEFAULT_WEIGHTS, CHAMPION_WEIGHTS } from "@/lib/ai/chinchon/weights";

describe("chinchon self-play (smoke)", () => {
  // 8 manos daban una varianza enorme (una sola derrota movía el resultado 12
  // puntos): con 40 partidas la medición es estable y sigue siendo rápida.
  // Una sola seed oscila entre 0.20 y 0.35, así que el smoke promedia tres
  // seeds: mide la fuerza real del campeón sin fallar por varianza.
  it("champion no colapsa vs default", () => {
    const seeds = [123, 7, 2024];
    const wrs = seeds.map((s) => championWinRate(CHAMPION_WEIGHTS, DEFAULT_WEIGHTS, 40, s));
    const mean = wrs.reduce((a, b) => a + b, 0) / wrs.length;

    expect(mean).toBeGreaterThanOrEqual(0.25);
  }, 600_000);
});

if (process.env.RUN_TRAIN === "1" || process.env.RUN_TRAIN === "long") {
  const long = process.env.RUN_TRAIN === "long";
  const generations = long ? 20 : 10;
  const matchesPerGen = long ? 15 : 10;
  describe("chinchon self-play (train)", () => {
    it(
      `mejora el campeón por hill-climbing (${generations}×${matchesPerGen} = ${generations * matchesPerGen} matches)`,
      async () => {
        const report = trainChinchon({
          generations,
          matchesPerGen,
          startFrom: CHAMPION_WEIGHTS,
          seed: 7,
          log: (msg) => console.log("[chinchon-train]", msg),
        });
        console.log("[chinchon-train] final:", report);
        const fs = await import("node:fs");
        const path = await import("node:path");
        const p = path.resolve("src/lib/ai/chinchon/champion.json");
        fs.writeFileSync(p, JSON.stringify(report.weights, null, 2) + "\n");
        expect(report.championWinRateVsDefault).toBeGreaterThanOrEqual(0.4);
      },
      60 * 60_000,
    );
  });
}
