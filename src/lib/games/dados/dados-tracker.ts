import { useDadosRun, type DadosEventReport } from "@/store/games/dados/dados-run";

export function trackDadosEvent(report: DadosEventReport): void {
  try {
    if (!useDadosRun.getState().activeLevel) return;
    useDadosRun.getState().trackEvent(report);
  } catch {}
}
