import { useRuletaRun, type SpinReport } from "@/store/games/ruleta/ruleta-run";

import type { BetKind } from "@/lib/roulette-math";

interface PlacedBet {
  kind: BetKind;
  amount: number;
}

interface TrackArgs {
  n: number;
  bets: PlacedBet[];
  hotNumber?: number;
  payoutFor: (bet: BetKind, n: number, hotNumber?: number) => number;
}

export function trackRuletaSpin({ n, bets, hotNumber, payoutFor }: TrackArgs): void {
  try {
    if (!useRuletaRun.getState().activeLevel) return;
    let gross = 0;
    let staked = 0;
    let straightHits = 0;
    let outsideHits = 0;
    for (const b of bets) {
      staked += b.amount;
      const mult = payoutFor(b.kind, n, hotNumber);
      if (mult > 0) {
        gross += b.amount * mult;
        if (b.kind.kind === "number") straightHits += 1;
        else outsideHits += 1;
      }
    }
    const report: SpinReport = { n, staked, gross, straightHits, outsideHits };
    useRuletaRun.getState().trackSpin(report);
  } catch {}
}
