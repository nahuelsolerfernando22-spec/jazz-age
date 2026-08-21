export type BJCard = { rank: string; value: number };

export type BJHand = {
  cards: BJCard[];
  wager: number;
  doubled: boolean;
  surrendered: boolean;
  fromSplitAces: boolean;
};

export function score(hand: BJCard[]): number {
  let total = hand.reduce((s, c) => s + c.value, 0);
  let aces = hand.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isNaturalBlackjack(hand: BJCard[]): boolean {
  return hand.length === 2 && score(hand) === 21;
}

export type HandOutcome =
  "blackjack" | "dealer-blackjack" | "surrender" | "bust" | "dealer-bust" | "win" | "push" | "lose";

export interface HandResult {
  outcome: HandOutcome;
  payout: number;
  net: number;
  score: number;
}

export interface SettlementResult {
  perHand: HandResult[];
  insurancePayout: number;
  totalPayout: number;
  netHands: number;
}

export function settleHands(
  hands: BJHand[],
  dealer: BJCard[],
  insuranceBet: number,
): SettlementResult {
  const dealerBJ = isNaturalBlackjack(dealer);
  const ds = score(dealer);
  const dealerBust = ds > 21;

  const perHand: HandResult[] = hands.map((h) => {
    const ps = score(h.cards);
    const isSingleHand = hands.length === 1;

    const playerBJ = isSingleHand && h.cards.length === 2 && ps === 21 && !h.fromSplitAces;

    if (h.surrendered) {
      const payout = Math.floor(h.wager / 2);
      return { outcome: "surrender", payout, net: payout - h.wager, score: ps };
    }
    if (playerBJ && !dealerBJ) {
      const payout = Math.floor(h.wager * 2.5);
      return { outcome: "blackjack", payout, net: payout - h.wager, score: ps };
    }
    if (dealerBJ && !playerBJ) {
      return { outcome: "dealer-blackjack", payout: 0, net: -h.wager, score: ps };
    }
    if (ps > 21) {
      return { outcome: "bust", payout: 0, net: -h.wager, score: ps };
    }
    if (dealerBust) {
      return { outcome: "dealer-bust", payout: h.wager * 2, net: h.wager, score: ps };
    }
    if (ps > ds) {
      return { outcome: "win", payout: h.wager * 2, net: h.wager, score: ps };
    }
    if (ps === ds) {
      return { outcome: "push", payout: h.wager, net: 0, score: ps };
    }
    return { outcome: "lose", payout: 0, net: -h.wager, score: ps };
  });

  const insurancePayout = insuranceBet > 0 && dealerBJ ? insuranceBet * 3 : 0;
  const totalPayout = perHand.reduce((s, r) => s + r.payout, 0) + insurancePayout;
  const netHands = perHand.reduce((s, r) => s + r.net, 0);

  return { perHand, insurancePayout, totalPayout, netHands };
}
