import { describe, expect, it, beforeEach } from "vitest";
import { useRuletaRun } from "@/store/games/ruleta/ruleta-run";
import { findRuletaLevel } from "@/lib/games/ruleta/ruleta-levels";

beforeEach(() => {
  useRuletaRun.setState({
    activeLevel: null,
    startedAt: null,
    spinsUsed: 0,
    chipsGained: 0,
    budgetLeft: 0,
    progress: 0,
    outsideStreak: 0,
    forbiddenNumber: null,
    lastEndReason: null,
    lastResult: null,
    cleared: {},
  });
});

describe("ruleta-run", () => {
  it("sólo desbloquea RU01 al inicio", () => {
    const s = useRuletaRun.getState();
    expect(s.isUnlocked("RU01")).toBe(true);
    expect(s.isUnlocked("RU02")).toBe(false);
  });

  it("startRun activa el nivel y setea budget", () => {
    useRuletaRun.getState().startRun("RU01");
    const s = useRuletaRun.getState();
    const l = findRuletaLevel("RU01")!;
    expect(s.activeLevel).toBe("RU01");
    expect(s.budgetLeft).toBe(l.budget);
    expect(s.startedAt).not.toBeNull();
  });

  it("bankroll gana cuando el neto alcanza el target", () => {
    useRuletaRun.getState().startRun("RU01");
    const target = (findRuletaLevel("RU01")!.objective as { target: number }).target;

    useRuletaRun.getState().trackSpin({
      n: 17,
      staked: 10,
      gross: target + 20,
      straightHits: 1,
      outsideHits: 0,
    });
    const s = useRuletaRun.getState();
    expect(s.activeLevel).toBeNull();
    expect(s.lastResult?.won).toBe(true);
    expect(s.cleared["RU01"]?.stars).toBeGreaterThanOrEqual(1);
  });

  it("full-hits cuenta plenos hasta cumplir objetivo", () => {
    useRuletaRun.getState().startRun("RU05");
    useRuletaRun.getState().trackSpin({
      n: 7,
      staked: 5,
      gross: 180,
      straightHits: 1,
      outsideHits: 0,
    });
    const s = useRuletaRun.getState();
    expect(s.lastResult?.won).toBe(true);
  });

  it("perder budget termina el run", () => {
    useRuletaRun.getState().startRun("RU01");
    const l = findRuletaLevel("RU01")!;

    useRuletaRun.getState().trackSpin({
      n: 5,
      staked: l.budget * 3,
      gross: 0,
      straightHits: 0,
      outsideHits: 0,
    });
    const s = useRuletaRun.getState();
    expect(s.activeLevel).toBeNull();
    expect(s.lastResult?.won).toBe(false);
    expect(s.lastEndReason).toBe("lost-budget");
  });

  it("agotar giros pierde el run", () => {
    useRuletaRun.getState().startRun("RU01");
    const l = findRuletaLevel("RU01")!;
    for (let i = 0; i < l.spinLimit; i++) {
      useRuletaRun.getState().trackSpin({
        n: 1,
        staked: 1,
        gross: 0,
        straightHits: 0,
        outsideHits: 0,
      });
      if (!useRuletaRun.getState().activeLevel) break;
    }
    const s = useRuletaRun.getState();
    expect(s.activeLevel).toBeNull();
    expect(s.lastEndReason === "lost-spins" || s.lastEndReason === "lost-budget").toBe(true);
  });

  it("abandonar limpia sin recompensa", () => {
    useRuletaRun.getState().startRun("RU01");
    useRuletaRun.getState().abandon();
    const s = useRuletaRun.getState();
    expect(s.activeLevel).toBeNull();
    expect(s.lastEndReason).toBe("abandoned");
  });

  it("desbloquea el siguiente nivel tras ganar", () => {
    useRuletaRun.getState().startRun("RU01");
    const target = (findRuletaLevel("RU01")!.objective as { target: number }).target;
    useRuletaRun.getState().trackSpin({
      n: 3,
      staked: 10,
      gross: target + 30,
      straightHits: 1,
      outsideHits: 0,
    });
    expect(useRuletaRun.getState().isUnlocked("RU02")).toBe(true);
  });
});
