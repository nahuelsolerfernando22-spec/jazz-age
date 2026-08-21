import { useTrucoRun } from "@/store/games/truco/truco-run";

export function trackTrucoMatchEnd(won: boolean): void {
  try {
    if (!useTrucoRun.getState().activeLevel) return;
    useTrucoRun.getState().trackMatchEnd(won);
  } catch {}
}
