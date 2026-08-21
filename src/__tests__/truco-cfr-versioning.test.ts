import { describe, it, expect } from "vitest";
import {
  CfrTable,
  CFR_ABSTRACTION_VERSION,
  cfrEffectiveBlend,
  type DecisionCtx,
} from "@/lib/ai/truco/cfr";

function ctx(kind: DecisionCtx["kind"], key: string): DecisionCtx {
  return { kind, key, legal: ["fold", "accept"] };
}

describe("CFR — versionado de tabla persistida", () => {
  it("toJSON emite el wrapper con versión actual", () => {
    const t = new CfrTable();
    t.update("T030n0ff", ["fold", "accept"], "accept", 1, [0.4, 0.6]);
    const raw = JSON.parse(t.toJSON());
    expect(raw.v).toBe(CFR_ABSTRACTION_VERSION);
    expect(raw.nodes).toBeDefined();
    expect(Object.keys(raw.nodes).length).toBe(1);
  });

  it("fromJSON con versión distinta descarta la tabla (marca incompatible)", () => {
    const payload = JSON.stringify({
      v: CFR_ABSTRACTION_VERSION + 999,
      nodes: { T030n0ff: [["fold", "accept"], [0.5, -0.5], [10, 20], 30] },
    });
    const t = CfrTable.fromJSON(payload);
    expect(t.size()).toBe(0);
    expect(t.loadInfo.status).toBe("incompatible");
    expect(t.loadInfo.version).toBe(CFR_ABSTRACTION_VERSION + 999);
  });

  it("fromJSON con formato legacy (objeto plano)", () => {
    const legacy = JSON.stringify({
      T030n0ff: [["fold", "accept"], [0.5, -0.5], [10, 20], 30],
    });
    const t = CfrTable.fromJSON(legacy);
    if ((CFR_ABSTRACTION_VERSION as number) === 1) {
      expect(t.size()).toBe(1);
      expect(t.loadInfo.status).toBe("legacy");
      expect(t.nodeVisits("T030n0ff")).toBe(30);
    } else {
      expect(t.size()).toBe(0);
      expect(t.loadInfo.status).toBe("incompatible");
      expect(t.loadInfo.version).toBe(1);
    }
  });

  it("round-trip wrapped preserva nodos y visitas", () => {
    const t = new CfrTable();
    t.update("Ce4M0ff", ["pass", "canto-lo", "canto-hi"], "canto-lo", 0.7, [0.2, 0.5, 0.3]);
    const back = CfrTable.fromJSON(t.toJSON());
    expect(back.loadInfo.status).toBe("ok");
    expect(back.loadInfo.version).toBe(CFR_ABSTRACTION_VERSION);
    expect(back.size()).toBe(1);
    expect(back.nodeVisits("Ce4M0ff")).toBe(1);
  });
});

describe("CFR — blend adaptativo por tipo / nodo", () => {
  it("tabla vacía ⇒ blend efectivo = 0 (usar heurística)", () => {
    const t = new CfrTable();
    const eff = cfrEffectiveBlend(ctx("truco-respond", "T030n0ff"), 0.8, t);
    expect(eff).toBe(0);
  });

  it("nodo poco visitado ⇒ blend efectivo bajo pero > 0", () => {
    const t = new CfrTable();

    for (let i = 0; i < 800; i++) {
      t.update(`T030n0f${i % 100}`, ["fold", "accept"], "accept", 0.1, [0.5, 0.5]);
    }

    const key = "T030n0fZ";
    for (let i = 0; i < 3; i++) t.update(key, ["fold", "accept"], "accept", 0.1, [0.5, 0.5]);
    const eff = cfrEffectiveBlend(ctx("truco-respond", key), 1.0, t);
    expect(eff).toBeGreaterThan(0);
    expect(eff).toBeLessThan(0.5);
  });

  it("nodo y tipo bien entrenados ⇒ blend efectivo ≈ base", () => {
    const t = new CfrTable();

    for (let i = 0; i < 60_000; i++) {
      t.update(`Ct${i % 500}`, ["pass", "canto-lo"], "canto-lo", 0.1, [0.5, 0.5]);
    }
    const eff = cfrEffectiveBlend(ctx("truco-canto", "Ct0"), 0.8, t);
    expect(eff).toBeGreaterThan(0.7);
    expect(eff).toBeLessThanOrEqual(0.8);
  });

  it("tipos distintos escalan independientemente", () => {
    const t = new CfrTable();

    for (let i = 0; i < 60_000; i++) {
      t.update(
        `Ce${i % 200}`,
        ["pass", "canto-lo", "canto-hi"],
        "canto-lo",
        0.1,
        [0.34, 0.33, 0.33],
      );
    }
    const ce = cfrEffectiveBlend(ctx("envido-canto", "Ce0"), 1.0, t);
    const tr = cfrEffectiveBlend(ctx("truco-respond", "T030n0ff"), 1.0, t);
    expect(ce).toBeGreaterThan(0.9);
    expect(tr).toBe(0);
  });
});
