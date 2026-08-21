import { describe, expect, it } from "vitest";
import {
  RULETA_LEVELS,
  computeRuletaStars,
  findRuletaLevel,
} from "@/lib/games/ruleta/ruleta-levels";

describe("ruleta-levels", () => {
  it("genera 30 niveles con IDs RU01..RU30", () => {
    expect(RULETA_LEVELS).toHaveLength(30);
    expect(RULETA_LEVELS[0].id).toBe("RU01");
    expect(RULETA_LEVELS[29].id).toBe("RU30");
  });

  it("marca L10/L20/L30 como jefes con cita", () => {
    for (const o of [10, 20, 30]) {
      const l = RULETA_LEVELS[o - 1];
      expect(l.boss).toBe(true);
      expect(l.bossQuote && l.bossQuote.length).toBeGreaterThan(5);
    }
    expect(RULETA_LEVELS[0].boss).toBeFalsy();
  });

  it("cada nivel tiene budget, spinLimit y objective válidos", () => {
    for (const l of RULETA_LEVELS) {
      expect(l.budget).toBeGreaterThan(0);
      expect(l.spinLimit).toBeGreaterThan(0);
      expect(["bankroll", "full-hits", "outside-streak"]).toContain(l.objective.kind);
      expect(l.reward.one).toBeGreaterThan(0);
      expect(l.reward.three).toBeGreaterThanOrEqual(l.reward.one);
    }
  });

  it("computeRuletaStars respeta umbrales", () => {
    const l = RULETA_LEVELS[0];
    expect(computeRuletaStars(l, 6)).toBe(3);
    expect(computeRuletaStars(l, 10)).toBe(2);
    expect(computeRuletaStars(l, 15)).toBe(1);
    expect(computeRuletaStars(l, 999)).toBe(1);
  });

  it("findRuletaLevel resuelve por ID", () => {
    expect(findRuletaLevel("RU10")?.title).toBeDefined();
    expect(findRuletaLevel("nope")).toBeUndefined();
  });
});
