import type { Card, Suit } from "./deck";

export interface Pile {
  captured: Card[];
  sweeps: number;
}

export interface RoundBreakdown {
  cards: number;
  oros: number;
  siete: number;
  setenta: number;
  sweeps: number;
  total: number;
}

const SETENTA_VALUE: Record<number, number> = {
  7: 21,
  6: 18,
  1: 16,
  5: 15,
  4: 14,
  3: 13,
  2: 12,
  10: 10,
  9: 9,
  8: 8,
};

function setentaOf(cards: Card[]): number {
  const bestPerSuit: Partial<Record<Suit, number>> = {};
  for (const c of cards) {
    const v = SETENTA_VALUE[c.rank] ?? 0;
    const cur = bestPerSuit[c.suit] ?? -1;
    if (v > cur) bestPerSuit[c.suit] = v;
  }
  let total = 0;
  let suits = 0;
  for (const s of Object.keys(bestPerSuit) as Suit[]) {
    total += bestPerSuit[s] ?? 0;
    suits += 1;
  }

  return suits === 4 ? total : 0;
}

export function scoreRound(a: Pile, b: Pile): { a: RoundBreakdown; b: RoundBreakdown } {
  const aOros = a.captured.filter((c) => c.suit === "oros").length;
  const bOros = b.captured.filter((c) => c.suit === "oros").length;
  const aHasSiete = a.captured.some((c) => c.suit === "oros" && c.rank === 7);
  const aSetenta = setentaOf(a.captured);
  const bSetenta = setentaOf(b.captured);

  const mk = (
    pile: Pile,
    winCards: boolean,
    winOros: boolean,
    velo: boolean,
    winSetenta: boolean,
  ): RoundBreakdown => {
    const cards = winCards ? 1 : 0;
    const oros = winOros ? 1 : 0;
    const siete = velo ? 1 : 0;
    const setenta = winSetenta ? 1 : 0;
    const sweeps = pile.sweeps;
    return { cards, oros, siete, setenta, sweeps, total: cards + oros + siete + setenta + sweeps };
  };

  return {
    a: mk(a, a.captured.length > b.captured.length, aOros > bOros, aHasSiete, aSetenta > bSetenta),
    b: mk(
      b,
      b.captured.length > a.captured.length,
      bOros > aOros,
      !aHasSiete && b.captured.some((c) => c.suit === "oros" && c.rank === 7),
      bSetenta > aSetenta,
    ),
  };
}

export const TARGET_SCORE = 15;
