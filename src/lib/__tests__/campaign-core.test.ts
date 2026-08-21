import { describe, expect, it } from "vitest";
import { buildCampaign, computeCampaignStars, rewardForCampaignStars } from "@/lib/campaign-core";

const theme = {
  gameId: "test",
  storageKey: "cuervo:campaign:test:v1",
  displayName: "Test",
  campaignName: "Test Campaign",
  levelPrefix: "TS",
  titles: Array.from({ length: 30 }, (_, i) => `Nivel ${i + 1}`),
  bossQuotes: { 10: "boss10", 20: "boss20", 30: "boss30" },
  objectiveKind: "chips" as const,
  baseTarget: 100,
  targetGrowth: 1.1,
  baseBudget: 100,
  budgetGrowth: 1.1,
  baseReward: 100,
  rewardGrowth: 1.1,
};

describe("campaign-core", () => {
  it("genera 30 niveles con IDs correctos", () => {
    const levels = buildCampaign(theme);
    expect(levels).toHaveLength(30);
    expect(levels[0].id).toBe("TS01");
    expect(levels[29].id).toBe("TS30");
  });

  it("marca L10/L20/L30 como jefes", () => {
    const levels = buildCampaign(theme);
    expect(levels[9].boss).toBe(true);
    expect(levels[19].boss).toBe(true);
    expect(levels[29].boss).toBe(true);
    expect(levels[0].boss).toBeFalsy();
  });

  it("aumenta el objetivo con el nivel", () => {
    const levels = buildCampaign(theme);
    const t0 = levels[0].objective.kind === "chips" ? levels[0].objective.target : 0;
    const t29 = levels[29].objective.kind === "chips" ? levels[29].objective.target : 0;
    expect(t29).toBeGreaterThan(t0 * 5);
  });

  it("computa estrellas por umbrales", () => {
    const [level] = buildCampaign(theme);

    expect(computeCampaignStars(level, 200)).toBe(3);
    expect(computeCampaignStars(level, 130)).toBe(2);
    expect(computeCampaignStars(level, 100)).toBe(1);
    expect(computeCampaignStars(level, 50)).toBe(0);
  });

  it("premia según estrellas", () => {
    const [level] = buildCampaign(theme);
    expect(rewardForCampaignStars(level, 0)).toBe(0);
    expect(rewardForCampaignStars(level, 3)).toBeGreaterThan(rewardForCampaignStars(level, 1));
  });
});
