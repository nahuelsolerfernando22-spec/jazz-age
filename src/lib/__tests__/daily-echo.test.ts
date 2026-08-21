import { describe, expect, it } from "vitest";
import { generateDailyEcho } from "@/lib/daily-echo";

describe("daily-echo", () => {
  it("el mismo día produce los mismos desafíos", () => {
    const a = generateDailyEcho("2026-07-16");
    const b = generateDailyEcho("2026-07-16");
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
  });

  it("días distintos producen sets distintos", () => {
    const a = generateDailyEcho("2026-07-16");
    const b = generateDailyEcho("2026-07-17");
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("los 3 desafíos son de mesas distintas", () => {
    const set = generateDailyEcho("2026-08-01");
    expect(new Set(set.map((c) => c.gameId)).size).toBe(3);
  });

  it("cada desafío es medible, con ruta real y recompensa", () => {
    for (const day of ["2026-09-15", "2026-01-02", "2026-12-31"]) {
      for (const c of generateDailyEcho(day)) {
        expect(c.route).toMatch(/^\//);
        expect(c.reward).toBeGreaterThan(0);
        expect(c.target).toBeGreaterThan(0);
        expect(["plays", "wins", "encargo"]).toContain(c.kind);
        expect(c.title.length).toBeGreaterThan(0);
      }
    }
  });
});
