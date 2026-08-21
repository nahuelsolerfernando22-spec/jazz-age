import { describe, it, expect } from "vitest";
import {
  computeWager,
  wagerBeaten,
  bankMultiplier,
  computeCashout,
  bankContribution,
  bankAfterCurse,
  BANK_MAX_MULT,
} from "@/lib/games/bagatelle/bagatelle-wager";

describe("bagatelle wager", () => {
  it("nunca canta un número menor al stake", () => {
    expect(computeWager(10, 0)).toBeGreaterThanOrEqual(10);
    expect(computeWager(100, 0)).toBeGreaterThanOrEqual(100);
  });

  it("escala con el nivel y se estanca en el cap", () => {
    const w0 = computeWager(100, 0);
    const w10 = computeWager(100, 10);
    const w20 = computeWager(100, 20);
    const w50 = computeWager(100, 50);
    expect(w10).toBeGreaterThan(w0);
    expect(w20).toBeGreaterThan(w10);
    expect(w50).toBe(w20);
  });

  it("wagerBeaten sólo con wager > 0 y puntaje suficiente", () => {
    expect(wagerBeaten(50, 0)).toBe(false);
    expect(wagerBeaten(49, 50)).toBe(false);
    expect(wagerBeaten(50, 50)).toBe(true);
    expect(wagerBeaten(120, 50)).toBe(true);
  });
});

describe("bagatelle banca", () => {
  it("bankMultiplier arranca en 1 y llega al tope BANK_MAX_MULT", () => {
    expect(bankMultiplier(0)).toBe(1);
    expect(bankMultiplier(5)).toBeCloseTo(1.5, 5);
    expect(bankMultiplier(10)).toBe(BANK_MAX_MULT);
    expect(bankMultiplier(999)).toBe(BANK_MAX_MULT);
  });

  it("computeCashout redondea banca × multiplicador", () => {
    expect(computeCashout(0, 5)).toBe(0);
    expect(computeCashout(100, 0)).toBe(100);
    expect(computeCashout(100, 5)).toBe(150);
    expect(computeCashout(100, 10)).toBe(200);
  });

  it("bankContribution ignora bolas sin puntaje", () => {
    expect(bankContribution(0)).toBe(0);
    expect(bankContribution(-5)).toBe(0);
    expect(bankContribution(100)).toBe(25);
    expect(bankContribution(37)).toBe(9);
  });

  it("bankAfterCurse deja la mitad (floor) y protege negativos", () => {
    expect(bankAfterCurse(100)).toBe(50);
    expect(bankAfterCurse(99)).toBe(49);
    expect(bankAfterCurse(0)).toBe(0);
    expect(bankAfterCurse(-40)).toBe(0);
  });
});
