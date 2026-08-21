import { useBlackjackRun, type HandReport } from "@/store/games/blackjack/blackjack-run";

export function trackBlackjackHand(report: HandReport): void {
  try {
    if (!useBlackjackRun.getState().activeLevel) return;
    useBlackjackRun.getState().trackHand(report);
  } catch {}
}
