import { describe, expect, it } from "vitest";
import { naipesRequeridos, puedeAsaltar, RONDAS_SIN_ASALTO } from "@/store/syndicate";

describe("reglas T.E.G. del Sindicato", () => {
  it("no deja asaltar en las rondas de acomodo", () => {
    expect(RONDAS_SIN_ASALTO).toBe(2);
    expect(puedeAsaltar(1)).toBe(false);
    expect(puedeAsaltar(2)).toBe(false);
    expect(puedeAsaltar(3)).toBe(true);
  });

  it("exige dos sectores para el naipe tras tres canjes", () => {
    expect(naipesRequeridos(0)).toBe(1);
    expect(naipesRequeridos(2)).toBe(1);
    expect(naipesRequeridos(3)).toBe(2);
    expect(naipesRequeridos(9)).toBe(2);
  });
});
