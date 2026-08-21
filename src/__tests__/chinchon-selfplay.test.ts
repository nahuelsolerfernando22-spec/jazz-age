import { describe, expect, it } from "vitest";
import { championWinRate, trainChinchon } from "@/lib/ai/chinchon/selfplay";
import { DEFAULT_WEIGHTS, CHAMPION_WEIGHTS } from "@/lib/ai/chinchon/weights";

describe("chinchon self-play (smoke)", () => {
  // 8 manos daban una varianza enorme (una sola derrota movía el resultado 12
  // puntos): con 40 partidas la medición es estable y sigue siendo rápida.
  it("champion no colapsa vs default", () => {
    const wr = championWinRate(CHAMPION_WEIGHTS, DEFAULT_WEIGHTS, 40, 123);

    expect(wr).toBeGreaterThanOrEqual(0.25);
  }, 300_000);
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
