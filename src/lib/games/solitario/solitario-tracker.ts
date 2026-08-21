import { useSolitarioRun } from "@/store/games/solitario/solitario-run";

export function trackSolitarioMove(): void {
  try {
    if (!useSolitarioRun.getState().activeLevel) return;
    useSolitarioRun.getState().trackMove();
  } catch {}
}

export function trackSolitarioWon(elapsedMs: number): void {
  try {
    if (!useSolitarioRun.getState().activeLevel) return;
    useSolitarioRun.getState().trackWon(elapsedMs);
  } catch {}
}
