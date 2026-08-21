import { useEscobaRun, type EscobaEventReport } from "@/store/games/escoba/escoba-run";

export function trackEscobaEvent(report: EscobaEventReport): void {
  try {
    if (!useEscobaRun.getState().activeLevel) return;
    useEscobaRun.getState().trackEvent(report);
  } catch {}
}
