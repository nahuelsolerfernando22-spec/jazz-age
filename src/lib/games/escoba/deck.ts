export type Suit = "oros" | "copas" | "espadas" | "bastos";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
  label: string;
  value: number;
}

const SUITS: Suit[] = ["oros", "copas", "espadas", "bastos"];
const RANK_LABELS: Record<Rank, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "S",
  9: "C",
  10: "R",
};
const RANK_STEMS: Record<Rank, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "sota",
  9: "caballo",
  10: "rey",
};

export function makeCard(suit: Suit, rank: Rank): Card {
  return {
    suit,
    rank,
    id: `${suit}-${RANK_STEMS[rank]}`,
    label: RANK_LABELS[rank],
    value: rank,
  };
}

export function stemOf(card: Card): string {
  return `${card.suit}-${RANK_STEMS[card.rank]}`;
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) {
    for (let r = 1 as Rank; r <= 10; r = (r + 1) as Rank) {
      deck.push(makeCard(s, r));
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
