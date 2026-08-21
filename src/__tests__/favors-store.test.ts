import { describe, it, expect, beforeEach } from "vitest";
import { useFavors } from "@/store/favors";

describe("useFavors store contract", () => {
  beforeEach(() => {
    useFavors.getState().reset();
  });

  it("expone add, earn, spend, has y reset", () => {
    const s = useFavors.getState();
    expect(typeof s.add).toBe("function");
    expect(typeof s.earn).toBe("function");
    expect(typeof s.spend).toBe("function");
    expect(typeof s.has).toBe("function");
    expect(typeof s.reset).toBe("function");
  });

  it("earn suma favors y lifetime igual que add", () => {
    useFavors.getState().earn(5);
    expect(useFavors.getState().favors).toBe(5);
    expect(useFavors.getState().lifetime).toBe(5);
    useFavors.getState().add(3);
    expect(useFavors.getState().favors).toBe(8);
    expect(useFavors.getState().lifetime).toBe(8);
  });

  it("earn ignora valores no positivos o no finitos", () => {
    useFavors.getState().earn(0);
    useFavors.getState().earn(-2);
    useFavors.getState().earn(NaN);
    expect(useFavors.getState().favors).toBe(0);
    expect(useFavors.getState().lifetime).toBe(0);
  });

  it("spend descuenta sólo si hay saldo suficiente", () => {
    useFavors.getState().earn(10);
    expect(useFavors.getState().spend(4)).toBe(true);
    expect(useFavors.getState().favors).toBe(6);
    expect(useFavors.getState().spend(99)).toBe(false);
    expect(useFavors.getState().favors).toBe(6);
  });

  it("cuenta sources por origen y suma independientemente", () => {
    useFavors.getState().earn(3, "mission");
    useFavors.getState().earn(2, "bagatelle");
    useFavors.getState().add(5, "mission");
    const src = useFavors.getState().sources;
    expect(src.mission).toBe(8);
    expect(src.bagatelle).toBe(2);
    expect(useFavors.getState().favors).toBe(10);
  });

  it("earn sin source cae en 'other'", () => {
    useFavors.getState().earn(4);
    expect(useFavors.getState().sources.other).toBe(4);
  });

  it("reset limpia balance, lifetime y sources", () => {
    useFavors.getState().earn(7, "league");
    useFavors.getState().reset();
    const s = useFavors.getState();
    expect(s.favors).toBe(0);
    expect(s.lifetime).toBe(0);
    expect(s.sources).toEqual({});
  });
});
