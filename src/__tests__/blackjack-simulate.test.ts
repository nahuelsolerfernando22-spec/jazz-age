import { describe, it, expect } from "vitest";
import { settleHands, score, type BJCard, type BJHand } from "@/lib/games/blackjack/blackjack";

const RANKS: { rank: string; value: number }[] = [
  { rank: "A", value: 11 },
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 10 },
  { rank: "Q", value: 10 },
  { rank: "K", value: 10 },
];

function seededRng(seed: number) {
  let t = seed >>> 0 || 1;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function dealHand(rng: () => number, min: number, max: number): BJCard[] {
  const n = min + Math.floor(rng() * (max - min + 1));
  const cards: BJCard[] = [];
  for (let i = 0; i < n; i++) cards.push(RANKS[Math.floor(rng() * RANKS.length)]);
  return cards;
}

describe("blackjack · 100 liquidaciones aleatorias", () => {
  it("payouts y neta son coherentes en cada ronda", () => {
    const rng = seededRng(0xb1a1);
    for (let i = 0; i < 100; i++) {
      const dealer = dealHand(rng, 2, 5);
      const nHands = 1 + Math.floor(rng() * 3);
      const hands: BJHand[] = [];
      for (let h = 0; h < nHands; h++) {
        const cards = dealHand(rng, 2, 5);
        hands.push({
          cards,
          wager: 10 + Math.floor(rng() * 40),
          doubled: false,
          surrendered: rng() < 0.05,
          fromSplitAces: nHands > 1 && rng() < 0.2,
        });
      }
      const insurance = rng() < 0.2 ? 5 : 0;
      const res = settleHands(hands, dealer, insurance);

      for (const r of res.perHand) {
        expect(r.payout).toBeGreaterThanOrEqual(0);
        expect(r.score).toBe(score(hands[res.perHand.indexOf(r)].cards));
      }

      const sumPayouts = res.perHand.reduce((a, r) => a + r.payout, 0);
      expect(res.totalPayout).toBe(sumPayouts + res.insurancePayout);

      const sumNet = res.perHand.reduce((a, r) => a + r.net, 0);
      expect(res.netHands).toBe(sumNet);

      res.perHand.forEach((r, k) => {
        if (r.outcome === "surrender") {
          expect(r.payout).toBeLessThanOrEqual(hands[k].wager);
        }
      });
    }
  });
});
