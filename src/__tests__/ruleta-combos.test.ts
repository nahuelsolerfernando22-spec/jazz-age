import { describe, expect, it } from "vitest";
import {
  COMBO_PAYOUT,
  EURO_ORDER,
  comboGroups,
  comboLabel,
  payoutFor,
  type ComboKind,
} from "@/lib/roulette-math";

const TIPOS: ComboKind[] = ["split", "street", "corner", "line"];
const TAMAÑO: Record<ComboKind, number> = { split: 2, street: 3, corner: 4, line: 6 };
const CANTIDAD: Record<ComboKind, number> = { split: 57, street: 12, corner: 22, line: 11 };

describe("Ruleta · grupos de apuestas combinadas", () => {
  it("cada tipo tiene la cantidad de grupos del paño europeo", () => {
    for (const k of TIPOS) {
      expect(comboGroups(k).length).toBe(CANTIDAD[k]);
    }
  });

  it("los grupos tienen el tamaño correcto, sin repetidos y sin el cero", () => {
    for (const k of TIPOS) {
      for (const g of comboGroups(k)) {
        expect(g.length).toBe(TAMAÑO[k]);
        expect(new Set(g).size).toBe(g.length);
        for (const n of g) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(36);
        }
      }
    }
  });

  it("no hay grupos duplicados dentro de un mismo tipo", () => {
    for (const k of TIPOS) {
      const claves = comboGroups(k).map((g) => g.join("-"));
      expect(new Set(claves).size).toBe(claves.length);
    }
  });

  it("los grupos vienen ordenados de menor a mayor", () => {
    for (const k of TIPOS) {
      for (const g of comboGroups(k)) {
        expect(g).toEqual([...g].sort((a, b) => a - b));
      }
    }
  });

  it("las calles son los tríos clásicos del paño", () => {
    const calles = comboGroups("street").map((g) => g.join("-"));
    expect(calles).toContain("1-2-3");
    expect(calles).toContain("34-35-36");
  });

  it("cada número del 1 al 36 aparece en alguna calle y en algún split", () => {
    for (const tipo of ["street", "split"] as ComboKind[]) {
      const cubiertos = new Set(comboGroups(tipo).flat());
      for (let n = 1; n <= 36; n++) expect(cubiertos.has(n)).toBe(true);
    }
  });
});

describe("Ruleta · pagos combinados", () => {
  it("paga solo si sale un número del grupo", () => {
    for (const k of TIPOS) {
      const g = comboGroups(k)[0];
      for (const n of g) {
        expect(payoutFor({ kind: "combo", combo: k, nums: g }, n)).toBe(COMBO_PAYOUT[k]);
      }
      const fuera = EURO_ORDER.find((n) => !g.includes(n))!;
      expect(payoutFor({ kind: "combo", combo: k, nums: g }, fuera)).toBe(0);
      expect(payoutFor({ kind: "combo", combo: k, nums: g }, 0)).toBe(0);
    }
  });

  it("los multiplicadores respetan la tabla europea", () => {
    expect(COMBO_PAYOUT.split).toBe(18);
    expect(COMBO_PAYOUT.street).toBe(12);
    expect(COMBO_PAYOUT.corner).toBe(9);
    expect(COMBO_PAYOUT.line).toBe(6);
  });

  it("la ventaja de la casa queda en torno al 2,7% en todos los combinados", () => {
    for (const k of TIPOS) {
      const g = comboGroups(k)[0];
      const retorno =
        EURO_ORDER.reduce(
          (acc: number, n: number) => acc + payoutFor({ kind: "combo", combo: k, nums: g }, n),
          0,
        ) / EURO_ORDER.length;
      expect(retorno).toBeGreaterThan(0.96);
      expect(retorno).toBeLessThan(0.98);
    }
  });

  it("la etiqueta describe el tipo y los números", () => {
    expect(comboLabel("street", [1, 2, 3])).toBe("Calle 1-2-3");
    expect(comboLabel("split", [1, 4])).toBe("Split 1-4");
  });
});
