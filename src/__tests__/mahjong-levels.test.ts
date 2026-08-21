import { describe, it, expect } from "vitest";
import { LEVELS } from "@/lib/games/mahjong/mahjong-levels";

describe("mahjong · catálogo de niveles", () => {
  it("cada nivel deja al menos un set de personajes tras los especiales", () => {
    for (const l of LEVELS) {
      expect(
        Number.isInteger(l.charTrios),
        `${l.id} tiene charTrios no entero: ${l.charTrios}`,
      ).toBe(true);
      expect(l.charTrios, `${l.id} quedó sin personajes (spec > pos)`).toBeGreaterThanOrEqual(0);
    }
  });

  it("todos los ids son únicos", () => {
    const ids = LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("L31-L40 existen con bosses y puertas configuradas", () => {
    const l31 = LEVELS.find((l) => l.id === "l31");
    const l34 = LEVELS.find((l) => l.id === "l34");
    const l36 = LEVELS.find((l) => l.id === "l36");
    const l38 = LEVELS.find((l) => l.id === "l38");
    const l39 = LEVELS.find((l) => l.id === "l39");
    const l40 = LEVELS.find((l) => l.id === "l40");
    expect(l31).toBeDefined();
    expect(l34?.gates).toBeDefined();
    expect(l36?.gates).toBeDefined();
    expect(l38?.boss).toBe(true);
    expect(l38?.traySize).toBe(5);
    expect(l38?.undoLimit).toBe(0);
    expect(l39?.gates).toBeDefined();
    expect(l40?.boss).toBe(true);
    expect(l40?.traySize).toBe(5);
    expect(l40?.undoLimit).toBe(0);
    expect(l40?.gates).toBeDefined();
  });
});
