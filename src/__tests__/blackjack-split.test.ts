import { describe, expect, it } from "vitest";
import {
  isNaturalBlackjack,
  score,
  settleHands,
  type BJCard,
  type BJHand,
} from "@/lib/games/blackjack/blackjack";

const C = (rank: string, value: number): BJCard => ({ rank, value });
const A = C("A", 11);
const K = C("K", 10);
const T = C("10", 10);
const N9 = C("9", 9);
const N8 = C("8", 8);
const N6 = C("6", 6);
const N5 = C("5", 5);
const N3 = C("3", 3);

const hand = (cards: BJCard[], wager = 100, overrides: Partial<BJHand> = {}): BJHand => ({
  cards,
  wager,
  doubled: false,
  surrendered: false,
  fromSplitAces: false,
  ...overrides,
});

describe("score / blackjack", () => {
  it("cuenta un As como 1 cuando pasaría de 21", () => {
    expect(score([A, N9, N5])).toBe(15);
  });
  it("BJ natural: A + K con 2 cartas", () => {
    expect(isNaturalBlackjack([A, K])).toBe(true);
  });
  it("21 con 3 cartas no es BJ natural", () => {
    expect(isNaturalBlackjack([N5, N6, T])).toBe(false);
  });
});

describe("settleHands · mano única", () => {
  it("BJ natural paga 3:2 (100 → 250)", () => {
    const r = settleHands([hand([A, K])], [T, N9], 0);
    expect(r.perHand[0].outcome).toBe("blackjack");
    expect(r.perHand[0].payout).toBe(250);
    expect(r.netHands).toBe(150);
  });
  it("BJ del crupier gana sobre 20 del jugador", () => {
    const r = settleHands([hand([K, T])], [A, K], 0);
    expect(r.perHand[0].outcome).toBe("dealer-blackjack");
    expect(r.netHands).toBe(-100);
  });
  it("push devuelve la apuesta", () => {
    const r = settleHands([hand([K, N9])], [T, N9], 0);
    expect(r.perHand[0].outcome).toBe("push");
    expect(r.perHand[0].payout).toBe(100);
    expect(r.netHands).toBe(0);
  });
  it("rendición devuelve floor(mitad)", () => {
    const r = settleHands([hand([K, N6], 101, { surrendered: true })], [K, N9], 0);
    expect(r.perHand[0].outcome).toBe("surrender");
    expect(r.perHand[0].payout).toBe(50);
  });
  it("doblar: wager viene x2, gana 2x sobre 200 = 400", () => {
    const r = settleHands([hand([N5, N6, T], 200, { doubled: true })], [K, N6], 0);
    expect(r.perHand[0].outcome).toBe("win");
    expect(r.perHand[0].payout).toBe(400);
    expect(r.netHands).toBe(200);
  });
});

describe("settleHands · split", () => {
  it("21 con 2 cartas tras split NO es BJ natural (paga 2x, no 2.5x)", () => {
    const h1 = hand([N8, N8]);
    const h2 = hand([N8, T]);

    const h1b = hand([N8, N3]);
    const r = settleHands([h1b, h2], [K, T], 0);
    expect(r.perHand[0].outcome).toBe("lose");
    expect(r.perHand[1].outcome).toBe("lose");

    const h3 = hand([N8, K]);
    const h4 = hand([N8, T, N3]);
    const r2 = settleHands([h3, h4], [K, N9], 0);
    expect(r2.perHand[1].outcome).toBe("win");
    expect(r2.perHand[1].payout).toBe(200);
  });

  it("Ases divididos: 21 con 2 cartas NO es BJ (fromSplitAces)", () => {
    const h1 = hand([A, K], 100, { fromSplitAces: true });
    const h2 = hand([A, N9], 100, { fromSplitAces: true });
    const r = settleHands([h1, h2], [K, N8], 0);
    expect(r.perHand[0].outcome).toBe("win");
    expect(r.perHand[0].payout).toBe(200);
    expect(r.perHand[1].outcome).toBe("win");
    expect(r.netHands).toBe(200);
  });

  it("split: una gana, otra pierde → netHands = 0", () => {
    const h1 = hand([N8, T]);
    const h2 = hand([N8, K]);
    const r = settleHands([hand([N8, N3]), hand([N8, K])], [K, N9], 0);

    const r2 = settleHands([h1, h2], [K, N6, A], 0);
    expect(r2.perHand[0].outcome).toBe("win");
    expect(r2.perHand[1].outcome).toBe("win");
    expect(r2.netHands).toBe(200);
  });

  it("rendición no está permitida tras split (validación en UI, pero la función respeta el flag)", () => {
    const h1 = hand([N8, T], 100, { surrendered: true });
    const h2 = hand([N8, K]);
    const r = settleHands([h1, h2], [K, N9], 0);
    expect(r.perHand[0].outcome).toBe("surrender");
    expect(r.perHand[0].payout).toBe(50);
  });

  it("doblar en split: aplica sólo a la mano doblada", () => {
    const h1 = hand([N5, N6, T], 200, { doubled: true });
    const h2 = hand([N5, N3]);
    const r = settleHands([h1, h2], [K, N9], 0);
    expect(r.perHand[0].outcome).toBe("win");
    expect(r.perHand[0].payout).toBe(400);
    expect(r.perHand[1].outcome).toBe("lose");
    expect(r.netHands).toBe(100);
  });

  it("crupier se pasa: todas las manos vivas ganan 2x", () => {
    const r = settleHands([hand([N8, N9]), hand([N8, T])], [K, N6, T], 0);
    expect(r.perHand[0].outcome).toBe("dealer-bust");
    expect(r.perHand[1].outcome).toBe("dealer-bust");
    expect(r.netHands).toBe(200);
  });

  it("crupier con BJ contra split: ambas pierden (ninguna es BJ natural)", () => {
    const h1 = hand([N8, N8]);
    const h2 = hand([N8, K]);
    const r = settleHands([h1, h2], [A, K], 0);
    expect(r.perHand[0].outcome).toBe("dealer-blackjack");
    expect(r.perHand[1].outcome).toBe("dealer-blackjack");
    expect(r.netHands).toBe(-200);
  });
});

describe("settleHands · seguro", () => {
  it("seguro paga 2:1 si el crupier tiene BJ natural", () => {
    const r = settleHands([hand([K, N9])], [A, K], 50);
    expect(r.insurancePayout).toBe(150);
    expect(r.perHand[0].outcome).toBe("dealer-blackjack");
    expect(r.totalPayout).toBe(150);
  });
  it("seguro se pierde si el crupier no tiene BJ", () => {
    const r = settleHands([hand([K, N9])], [T, N9], 50);
    expect(r.insurancePayout).toBe(0);
    expect(r.perHand[0].outcome).toBe("push");
  });
});
