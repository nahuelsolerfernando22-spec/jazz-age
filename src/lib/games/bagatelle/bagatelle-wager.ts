export const WAGER_LEVEL_CAP = 20;
export const BANK_CONTRIB_PCT = 0.25;
export const BANK_CURSE_KEEP = 0.5;
export const BANK_MAX_MULT = 2;
export const BANK_STREAK_STEP = 0.1;

export function computeWager(stake: number, level: number): number {
  const safeStake = Math.max(0, Math.floor(stake));
  const safeLevel = Math.max(0, Math.min(WAGER_LEVEL_CAP, Math.floor(level)));
  return Math.max(safeStake, Math.round(safeStake * (1.15 + 0.09 * safeLevel)));
}

export function wagerBeaten(totalWin: number, wagerTarget: number): boolean {
  return wagerTarget > 0 && totalWin >= wagerTarget;
}

export function bankMultiplier(streak: number): number {
  const s = Math.max(0, Math.floor(streak));
  return 1 + Math.min(BANK_MAX_MULT - 1, s * BANK_STREAK_STEP);
}

export function computeCashout(bank: number, streak: number): number {
  if (bank <= 0) return 0;
  return Math.round(bank * bankMultiplier(streak));
}

export function bankContribution(totalWin: number): number {
  if (totalWin <= 0) return 0;
  return Math.round(totalWin * BANK_CONTRIB_PCT);
}

export function bankAfterCurse(bank: number): number {
  return Math.floor(Math.max(0, bank) * BANK_CURSE_KEEP);
}
