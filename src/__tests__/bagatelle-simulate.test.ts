import { describe, it, expect } from "vitest";
import {
  bankAfterCurse,
  bankContribution,
  bankMultiplier,
  computeCashout,
  computeWager,
  wagerBeaten,
  BANK_MAX_MULT,
  WAGER_LEVEL_CAP,
} from "@/lib/games/bagatelle/bagatelle-wager";

function rng(seed: number) {
  let t = seed >>> 0 || 1;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

describe("bagatelle · 100 sesiones", () => {
  it("banca y multiplicador se mantienen en los límites diseñados", () => {
    for (let sess = 0; sess < 100; sess++) {
      const r = rng(sess + 1);
      const stake = 5 + Math.floor(r() * 20);
      const level = Math.floor(r() * (WAGER_LEVEL_CAP + 5));
      let bank = 0;
      let streak = 0;
      let feathersEarned = 0;

      for (let ball = 0; ball < 30; ball++) {
        const wager = computeWager(stake, level);
        expect(wager).toBeGreaterThanOrEqual(stake);

        const totalWin = Math.floor(r() * stake * 3);
        const cursed = r() < 0.12;
        if (cursed) {
          const before = bank;
          bank = bankAfterCurse(bank);
          expect(bank).toBeLessThanOrEqual(before / 2 + 1);
          streak = 0;
          continue;
        }
        if (wagerBeaten(totalWin, wager)) feathersEarned++;
        if (totalWin > 0) {
          const add = bankContribution(totalWin);
          expect(add).toBeGreaterThanOrEqual(0);
          bank += add;
          streak++;
        } else {
          streak = 0;
        }
        const mult = bankMultiplier(streak);
        expect(mult).toBeGreaterThanOrEqual(1);
        expect(mult).toBeLessThanOrEqual(BANK_MAX_MULT);
        expect(computeCashout(bank, streak)).toBe(Math.round(bank * mult));
      }
      expect(feathersEarned).toBeGreaterThanOrEqual(0);
    }
  });

  it("bankAfterCurse jamás devuelve negativo aunque le pases valores raros", () => {
    expect(bankAfterCurse(-100)).toBe(0);
    expect(bankAfterCurse(0)).toBe(0);
    expect(bankAfterCurse(1)).toBe(0);
    expect(bankAfterCurse(2)).toBe(1);
    expect(bankAfterCurse(9999)).toBe(4999);
  });
});
