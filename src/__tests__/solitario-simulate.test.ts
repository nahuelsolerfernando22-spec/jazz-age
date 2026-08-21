import { describe, it, expect } from "vitest";
import { dealNewGame, drawFromStock, SUITS, RANKS } from "@/lib/games/solitario/solitaire";

function cardKey(c: { suit: string; rank: number }) {
  return `${c.suit}-${c.rank}`;
}

describe("solitario · 100 deals", () => {
  it("baraja íntegra y estructura inicial correcta", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const g = dealNewGame(seed);
      const all: string[] = [];
      g.tableau.forEach((col, i) => {
        expect(col.length, `col ${i}`).toBe(i + 1);
        col.forEach((c, r) => {
          all.push(cardKey(c));
          expect(c.faceUp).toBe(r === i);
        });
      });
      g.stock.forEach((c) => {
        all.push(cardKey(c));
        expect(c.faceUp).toBe(false);
      });
      expect(g.stock.length).toBe(24);
      expect(g.waste.length).toBe(0);
      for (const s of SUITS) expect(g.foundations[s].length).toBe(0);

      expect(new Set(all).size).toBe(52);
      expect(all.length).toBe(52);

      for (const s of SUITS)
        for (const r of RANKS) {
          expect(all.includes(`${s}-${r}`)).toBe(true);
        }
    }
  });

  it("drawFromStock: ciclo completo devuelve stock a 24 y waste a 0", () => {
    const g0 = dealNewGame(42);
    let g = g0;

    for (let i = 0; i < 24; i++) g = drawFromStock(g);
    expect(g.stock.length).toBe(0);
    expect(g.waste.length).toBe(24);

    g = drawFromStock(g);
    expect(g.stock.length).toBe(24);
    expect(g.waste.length).toBe(0);
    for (const c of g.stock) expect(c.faceUp).toBe(false);
  });
});
