import { useChinchonRun } from "@/store/games/chinchon/chinchon-run";

export function trackChinchonMatchEnd(won: boolean): void {
  try {
    if (!useChinchonRun.getState().activeLevel) return;
    useChinchonRun.getState().trackMatchEnd(won);
  } catch {}
}
