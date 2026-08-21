export interface BetStep {
  value: number;
  minLevel: number;
  label?: string;
}

export const BET_LADDER: BetStep[] = [
  { value: 10, minLevel: 0 },
  { value: 25, minLevel: 0 },
  { value: 50, minLevel: 1, label: "Regular" },
  { value: 100, minLevel: 2, label: "Card Sharp" },
  { value: 250, minLevel: 3, label: "High Roller" },
  { value: 500, minLevel: 4, label: "Made Man" },
];

export function unlockedBets(level: number): number[] {
  return BET_LADDER.filter((b) => level >= b.minLevel).map((b) => b.value);
}

export function clampBet(bet: number, level: number): number {
  const allowed = unlockedBets(level);
  if (allowed.includes(bet)) return bet;
  return allowed[allowed.length - 1] ?? 10;
}

export function nextBetStep(bet: number): BetStep | null {
  const idx = BET_LADDER.findIndex((b) => b.value === bet);
  if (idx === -1 || idx >= BET_LADDER.length - 1) return null;
  return BET_LADDER[idx + 1];
}

export function prevBetStep(bet: number): BetStep | null {
  const idx = BET_LADDER.findIndex((b) => b.value === bet);
  if (idx <= 0) return null;
  return BET_LADDER[idx - 1];
}
