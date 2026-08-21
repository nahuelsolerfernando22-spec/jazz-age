import { describe, it, expect, beforeEach } from "vitest";
import {
  getTableEconomy,
  GAME_TONE,
  GAME_HOSTESS,
  TONE_BASE_ANTE,
  HIGH_STAKES_ENTRY_COST,
  discountedAnte,
  getAnteDiscount,
  formatEconomyLine,
  type GameKey,
} from "@/lib/economy";

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
  key(i: number) {
    return Array.from(this.m.keys())[i] ?? null;
  }
  get length() {
    return this.m.size;
  }
}

function setAffinity(npc: string, points: number) {
  const data = { points: { [npc]: points } };
  window.localStorage.setItem("speakeasy:affinity:v1", JSON.stringify(data));
}

beforeEach(() => {
  const storage = new MemStorage();
  const g = globalThis as unknown as {
    window: { localStorage: MemStorage };
    localStorage: MemStorage;
  };
  g.localStorage = storage;
  g.window = { localStorage: storage };
});

describe("getTableEconomy — tono por juego", () => {
  const altos: GameKey[] = ["mahjong", "solitario"];
  const street: GameKey[] = ["bagatelle", "escoba"];

  it("mesas alto tienen ante base alto y no cobran peaje 🪶 (canon actual)", () => {
    for (const g of altos) {
      const e = getTableEconomy(g);
      expect(e.tone).toBe("alto");
      expect(e.baseAnte).toBe(TONE_BASE_ANTE.alto);

      expect(e.highStakesEntry).toBe(0);
      expect(e.discountPct).toBe(0);
    }

    expect(HIGH_STAKES_ENTRY_COST).toBeGreaterThan(0);
  });

  it("mesas street/salon nunca cobran entrada en 🪶", () => {
    for (const g of street) {
      const e = getTableEconomy(g);
      expect(e.tone).toBe("street");
      expect(e.highStakesEntry).toBe(0);
    }
    expect(getTableEconomy("ruleta").highStakesEntry).toBe(0);
    expect(getTableEconomy("tables").tone).toBe("salon");
  });
});

describe("getTableEconomy — descuento por afecto (cap actual nivel 3 = 18%)", () => {
  it("aplica 0/5/10/18% según pluma; el peaje 🪶 quedó desactivado en canon actual", () => {
    const hostess = GAME_HOSTESS.mahjong!;
    expect(GAME_TONE.mahjong).toBe("alto");

    setAffinity(hostess, 0);
    const lvl0 = getTableEconomy("mahjong");
    expect(lvl0.discountPct).toBe(0);
    expect(lvl0.highStakesEntry).toBe(0);

    setAffinity(hostess, 300);
    expect(getTableEconomy("mahjong").discountPct).toBe(5);

    setAffinity(hostess, 1_500);
    expect(getTableEconomy("mahjong").discountPct).toBe(10);

    setAffinity(hostess, 10_000);
    expect(getTableEconomy("mahjong").discountPct).toBe(18);

    setAffinity(hostess, 1_000_000);
    const capped = getTableEconomy("mahjong");
    expect(capped.discountPct).toBe(18);
    expect(capped.highStakesEntry).toBe(0);
  });
});

describe("helpers", () => {
  it("discountedAnte respeta mínimo 1", () => {
    expect(discountedAnte(0, undefined)).toBe(1);
    expect(discountedAnte(100, undefined)).toBe(100);
  });
  it("getAnteDiscount sin NPC es 0", () => {
    expect(getAnteDiscount(undefined)).toBe(0);
  });
});

describe("getTableEconomy — umbrales exactos de afecto", () => {
  const hostess = GAME_HOSTESS.mahjong!;

  it("nivel 0 ↔ nivel 1 cambia exactamente en 300 puntos", () => {
    setAffinity(hostess, 299);
    expect(getTableEconomy("mahjong").discountPct).toBe(0);
    setAffinity(hostess, 300);
    expect(getTableEconomy("mahjong").discountPct).toBe(5);
  });

  it("nivel 1 ↔ nivel 2 cambia exactamente en 1500 puntos", () => {
    setAffinity(hostess, 1_499);
    expect(getTableEconomy("mahjong").discountPct).toBe(5);
    setAffinity(hostess, 1_500);
    expect(getTableEconomy("mahjong").discountPct).toBe(10);
  });

  it("nivel 2 ↔ nivel 3 cambia exactamente en 10000 puntos", () => {
    setAffinity(hostess, 9_999);
    expect(getTableEconomy("mahjong").discountPct).toBe(10);
    setAffinity(hostess, 10_000);
    expect(getTableEconomy("mahjong").discountPct).toBe(18);
  });

  it("ante derivado coincide con baseAnte × (1 - discountPct/100)", () => {
    setAffinity(hostess, 1_500);
    const e = getTableEconomy("mahjong");
    expect(e.ante).toBe(Math.max(1, Math.floor(e.baseAnte * 0.9)));
  });
});

describe("formatEconomyLine — la UI refleja getTableEconomy", () => {
  it("Mahjong sin afecto: entrada gratis 🪶 (peaje desactivado)", () => {
    setAffinity(GAME_HOSTESS.mahjong!, 0);
    const e = getTableEconomy("mahjong");
    expect(formatEconomyLine(e, { showBaseAnte: false })).toBe(`Mesa alta · entrada gratis hoy 🪶`);
  });

  it("Mahjong nivel 2: incluye −10% por afecto y entrada gratis", () => {
    setAffinity(GAME_HOSTESS.mahjong!, 1_500);
    const e = getTableEconomy("mahjong");
    expect(formatEconomyLine(e, { showBaseAnte: false })).toBe(
      `Mesa alta · −10% por afecto · entrada gratis hoy 🪶`,
    );
  });

  it("Solitario nivel 3 con Jade: ante base, −18% y entrada gratis (cap actual)", () => {
    setAffinity(GAME_HOSTESS.solitario!, 10_000);
    const e = getTableEconomy("solitario");
    expect(formatEconomyLine(e, { hostessLabel: "Jade" })).toBe(
      `Mesa alta · ante base ${TONE_BASE_ANTE.alto}¢ · −18% por afecto con Jade · entrada gratis hoy 🪶`,
    );
  });

  it("Solitario sin afecto: ante base y entrada gratis, sin línea de descuento", () => {
    setAffinity(GAME_HOSTESS.solitario!, 0);
    const e = getTableEconomy("solitario");
    expect(formatEconomyLine(e, { hostessLabel: "Jade" })).toBe(
      `Mesa alta · ante base ${TONE_BASE_ANTE.alto}¢ · entrada gratis hoy 🪶`,
    );
  });

  it("usa exactamente los valores numéricos que devuelve getTableEconomy", () => {
    setAffinity(GAME_HOSTESS.mahjong!, 10_000);
    const e = getTableEconomy("mahjong");
    const line = formatEconomyLine(e);
    expect(line).toContain(`${e.baseAnte}¢`);
    expect(line).toContain(`${e.discountPct}%`);

    expect(line).toContain(`🪶`);
  });
});
