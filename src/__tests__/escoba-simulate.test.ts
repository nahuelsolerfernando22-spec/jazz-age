import { describe, it, expect } from "vitest";
import { autoAdvance, newMatch, playCard, type EscobaState } from "@/lib/games/escoba/engine";
import { capturesFor } from "@/lib/games/escoba/rules";

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

function totalCards(s: EscobaState) {
  return (
    s.deck.length +
    s.table.length +
    s.hands.player.length +
    s.hands.cpu.length +
    s.piles.player.captured.length +
    s.piles.cpu.captured.length
  );
}

function playerAutoMove(s: EscobaState): { cardIdx: number; captureIdx: number } | null {
  const hand = s.hands.player;
  if (!hand.length) return null;
  for (let i = 0; i < hand.length; i++) {
    const opts = capturesFor(s.table, hand[i]);
    if (opts.length > 0) return { cardIdx: i, captureIdx: 0 };
  }
  return { cardIdx: 0, captureIdx: 0 };
}

describe("escoba · 100 partidas", () => {
  it("conserva las 40 cartas y termina sin trabarse", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = seededRng(seed);
      let s = newMatch(rng);
      expect(totalCards(s)).toBe(40);
      let guard = 0;
      while (s.status !== "match-end" && guard++ < 5000) {
        s = autoAdvance(s, rng);
        if (s.status === "match-end") break;
        if (s.status === "round-end") {
          continue;
        }
        if (s.turn === "player") {
          const mv = playerAutoMove(s);
          if (!mv) break;
          s = playCard(s, "player", mv.cardIdx, mv.captureIdx, rng);
        }
        expect(totalCards(s)).toBe(40);
      }
      expect(s.status, `seed ${seed}`).toBe("match-end");
      expect(s.totals.player).toBeGreaterThanOrEqual(0);
      expect(s.totals.cpu).toBeGreaterThanOrEqual(0);
    }
  });
});
