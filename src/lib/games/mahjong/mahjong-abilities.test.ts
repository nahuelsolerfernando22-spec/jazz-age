import { describe, expect, it } from "vitest";
import { ABILITIES, isAbilityUnlocked, reachedRound } from "@/lib/games/mahjong/mahjong-abilities";
import { LEVELS } from "@/lib/games/mahjong/mahjong-levels";

const firstId = LEVELS.find((l) => !l.practice)!.id;

describe("habilidades de mahjong", () => {
  it("en la primera ronda sólo hay mezclar y pista", () => {
    const round = reachedRound(firstId, {});
    expect(round).toBe(1);
    const abiertas = ABILITIES.filter((a) => isAbilityUnlocked(a.id, round)).map((a) => a.id);
    expect(abiertas).toEqual(["mezclar", "pista"]);
  });

  it("avanzar de mesa sube la ronda alcanzada", () => {
    const second = LEVELS.filter((l) => !l.practice)[1];
    const round = reachedRound(firstId, { [firstId]: { stars: 2 } });
    expect(round).toBeGreaterThanOrEqual(second.order);
    expect(isAbilityUnlocked("deshacer", round)).toBe(true);
    expect(isAbilityUnlocked("devolver", round)).toBe(false);
  });

  it("las habilidades tardías siguen bloqueadas hasta su ronda", () => {
    expect(isAbilityUnlocked("iman", 2)).toBe(false);
    expect(isAbilityUnlocked("iman", 3)).toBe(true);
    expect(isAbilityUnlocked("espacio", 4)).toBe(false);
    expect(isAbilityUnlocked("espacio", 5)).toBe(true);
    expect(isAbilityUnlocked("devolver", 7)).toBe(true);
  });
});
