import { useBagatelleRun, type LaunchReport } from "@/store/games/bagatelle/bagatelle-run";

export function trackBagatelleLaunch(report: LaunchReport): void {
  try {
    if (!useBagatelleRun.getState().activeLevel) return;
    useBagatelleRun.getState().trackLaunch(report);
  } catch {}
}
