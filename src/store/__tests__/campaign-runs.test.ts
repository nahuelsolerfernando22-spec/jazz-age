import { describe, expect, it, beforeEach } from "vitest";
import { useBagatelleCampaign, useBlackjackCampaign } from "@/lib/campaign-themes";

beforeEach(() => {
  useBagatelleCampaign.setState({
    activeLevel: null,
    startedAt: null,
    chipsGained: 0,
    chipsLost: 0,
    events: 0,
    lastEndReason: null,
    lastResult: null,
    cleared: {},
  });
  useBlackjackCampaign.setState({
    activeLevel: null,
    startedAt: null,
    chipsGained: 0,
    chipsLost: 0,
    events: 0,
    lastEndReason: null,
    lastResult: null,
    cleared: {},
  });
});

describe("campaign-runs", () => {
  it("solo desbloquea L01 al inicio", () => {
    const s = useBagatelleCampaign.getState();
    expect(s.isUnlocked("BG01")).toBe(true);
    expect(s.isUnlocked("BG02")).toBe(false);
  });

  it("startRun activa el nivel", () => {
    useBagatelleCampaign.getState().startRun("BG01");
    const s = useBagatelleCampaign.getState();
    expect(s.activeLevel).toBe("BG01");
    expect(s.startedAt).not.toBeNull();
  });

  it("bumpChips gana al alcanzar objetivo (chips)", () => {
    useBagatelleCampaign.getState().startRun("BG01");
    const l = useBagatelleCampaign.getState().findLevel("BG01")!;
    if (l.objective.kind !== "chips") throw new Error("expected chips");
    useBagatelleCampaign.getState().bumpChips(l.objective.target + 10);
    const s = useBagatelleCampaign.getState();
    expect(s.activeLevel).toBeNull();
    expect(s.lastResult?.won).toBe(true);
  });

  it("bumpEvents gana al alcanzar objetivo (events)", () => {
    useBlackjackCampaign.getState().startRun("BJ01");
    const l = useBlackjackCampaign.getState().findLevel("BJ01")!;
    if (l.objective.kind !== "events") throw new Error("expected events");
    for (let i = 0; i < l.objective.target; i++) {
      useBlackjackCampaign.getState().bumpEvents();
    }
    const s = useBlackjackCampaign.getState();
    expect(s.activeLevel).toBeNull();
    expect(s.lastResult?.won).toBe(true);
  });

  it("bumpChips negativo pierde el run", () => {
    useBagatelleCampaign.getState().startRun("BG01");
    const l = useBagatelleCampaign.getState().findLevel("BG01")!;
    useBagatelleCampaign.getState().bumpChips(-l.budget - 1);
    const s = useBagatelleCampaign.getState();
    expect(s.activeLevel).toBeNull();
    expect(s.lastResult?.won).toBe(false);
  });

  it("desbloquea el siguiente nivel tras ganar", () => {
    useBagatelleCampaign.getState().startRun("BG01");
    const l = useBagatelleCampaign.getState().findLevel("BG01")!;
    if (l.objective.kind !== "chips") throw new Error();
    useBagatelleCampaign.getState().bumpChips(l.objective.target + 1);
    expect(useBagatelleCampaign.getState().isUnlocked("BG02")).toBe(true);
  });

  it("abandonar limpia sin recompensa", () => {
    useBagatelleCampaign.getState().startRun("BG01");
    useBagatelleCampaign.getState().abandon();
    const s = useBagatelleCampaign.getState();
    expect(s.activeLevel).toBeNull();
    expect(s.lastEndReason).toBe("abandoned");
  });
});
