export type Suit = "oros" | "copas" | "espadas" | "bastos";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

import { DEFAULT_WEIGHTS, type ChinchonWeights } from "@/lib/ai/chinchon/weights";

export interface Card {
  id: string;
  suit: Suit | "joker";
  rank: Rank | 0;
  isJoker: boolean;
  /** Carta marcada con "El Corte Sucio": funciona como comodín pero delata al que cierra. */
  dirty?: boolean;
}

export const SUITS: Suit[] = ["oros", "copas", "espadas", "bastos"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const JOKER_VALUE = 25;

export const cardValue = (c: Card): number => (c.isJoker ? JOKER_VALUE : (c.rank as number));

export const orderOf = (r: Rank) => (r as number) - 1;

export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS)
    for (const r of RANKS) {
      deck.push({ id: `${s}-${r}`, suit: s, rank: r, isJoker: false });
    }
  deck.push({ id: "joker-1", suit: "joker", rank: 0, isJoker: true });
  deck.push({ id: "joker-2", suit: "joker", rank: 0, isJoker: true });
  return deck;
}

function defaultRnd(): number {
  try {
    const g = (globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } })
      .crypto;
    if (g && g.getRandomValues) {
      const buf = new Uint32Array(1);
      g.getRandomValues(buf);
      return buf[0] / 0x100000000;
    }
  } catch {}
  return Math.random();
}

export function shuffle<T>(arr: T[], rnd: () => number = defaultRnd, passes = 3): T[] {
  const a = arr.slice();
  for (let p = 0; p < passes; p++) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

export type Meld = { kind: "set"; cards: Card[] } | { kind: "run"; cards: Card[] };

export interface Partition {
  melds: Meld[];
  loose: Card[];
  looseSum: number;
}

function popcount(n: number): number {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

function kCombinations<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const n = arr.length;
  if (k === 0) return [[]];
  if (k > n) return out;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    out.push(idx.map((i) => arr[i]));
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return out;
}

function enumerateMelds(hand: Card[]): { meld: Meld; mask: number }[] {
  const out: { meld: Meld; mask: number }[] = [];
  const idxOf = new Map(hand.map((c, i) => [c.id, i]));
  const reals = hand.filter((c) => !c.isJoker);
  const jokers = hand.filter((c) => c.isJoker);
  const realIdx = reals.map((c) => idxOf.get(c.id) as number);
  const jokerIdx = jokers.map((c) => idxOf.get(c.id) as number);
  const J = jokers.length;
  const nR = reals.length;

  for (let mask = 1; mask < 1 << nR; mask++) {
    const picked: Card[] = [];
    let pickedMask = 0;
    for (let i = 0; i < nR; i++)
      if (mask & (1 << i)) {
        picked.push(reals[i]);
        pickedMask |= 1 << realIdx[i];
      }

    for (let j = 0; j <= Math.min(J, 2); j++) {
      const size = picked.length + j;
      if (size < 3) continue;

      if (picked.length === 0) continue;

      if (size <= 4 && picked.every((c) => c.rank === picked[0].rank)) {
        for (const jSel of kCombinations(jokerIdx, j)) {
          let mm = pickedMask;
          for (const ji of jSel) mm |= 1 << ji;
          const meldCards: Card[] = [...picked, ...jSel.map((ji) => hand[ji])];
          out.push({ meld: { kind: "set", cards: meldCards }, mask: mm });
        }
      }

      if (picked.every((c) => c.suit === picked[0].suit)) {
        const ranks = picked.map((c) => c.rank as number);
        if (new Set(ranks).size === ranks.length) {
          const minR = Math.min(...ranks);
          const maxR = Math.max(...ranks);
          const span = maxR - minR + 1;
          if (span <= size) {
            const wLow = Math.max(1, maxR - size + 1);
            const wHigh = Math.min(12 - size + 1, minR);
            if (wLow <= wHigh) {
              for (const jSel of kCombinations(jokerIdx, j)) {
                let mm = pickedMask;
                for (const ji of jSel) mm |= 1 << ji;
                const meldCards: Card[] = [...picked, ...jSel.map((ji) => hand[ji])];
                out.push({ meld: { kind: "run", cards: meldCards }, mask: mm });
              }
            }
          }
        }
      }
    }
  }
  return out;
}

export function bestPartition(hand: Card[]): Partition {
  if (hand.length === 0) return { melds: [], loose: [], looseSum: 0 };
  const melds = enumerateMelds(hand);
  const total = (1 << hand.length) - 1;

  const totalSum = hand.reduce((s, c) => s + cardValue(c), 0);
  let bestSum = totalSum;
  let bestUsed = 0;
  let bestPick: number[] = [];

  const order = melds
    .map((_, i) => i)
    .sort((a, b) => popcount(melds[b].mask) - popcount(melds[a].mask));

  const cardVals = hand.map(cardValue);
  function sumOfLoose(usedMask: number): number {
    let s = 0;
    for (let i = 0; i < hand.length; i++) if (!(usedMask & (1 << i))) s += cardVals[i];
    return s;
  }

  function dfs(idx: number, used: number, picked: number[]) {
    const s = sumOfLoose(used);
    if (s < bestSum || (s === bestSum && popcount(used) > bestUsed)) {
      bestSum = s;
      bestUsed = popcount(used);
      bestPick = picked.slice();
    }
    if (s === 0) return;
    for (let k = idx; k < order.length; k++) {
      const i = order[k];
      const m = melds[i].mask;
      if ((m & used) === 0) {
        picked.push(i);
        dfs(k + 1, used | m, picked);
        picked.pop();
      }
    }
  }
  dfs(0, 0, []);

  const usedMask = bestPick.reduce((m, i) => m | melds[i].mask, 0);
  const loose: Card[] = [];
  for (let i = 0; i < hand.length; i++) {
    if (!(usedMask & (1 << i))) loose.push(hand[i]);
  }
  return {
    melds: bestPick.map((i) => melds[i].meld),
    loose,
    looseSum: bestSum,
  };
}

export function validateMeld(cards: Card[]): Meld | null {
  if (cards.length < 3) return null;
  const jokers = cards.filter((c) => c.isJoker).length;
  if (jokers > 2) return null;
  const reals = cards.filter((c) => !c.isJoker);
  if (reals.length === 0) return null;
  if (cards.length <= 4 && reals.every((c) => c.rank === reals[0].rank)) {
    return { kind: "set", cards };
  }
  if (reals.every((c) => c.suit === reals[0].suit)) {
    const ranks = reals.map((c) => c.rank as number);
    if (new Set(ranks).size === ranks.length) {
      const minR = Math.min(...ranks);
      const maxR = Math.max(...ranks);
      const size = cards.length;
      const span = maxR - minR + 1;
      if (span <= size) {
        const wLow = Math.max(1, maxR - size + 1);
        const wHigh = Math.min(12 - size + 1, minR);
        if (wLow <= wHigh) return { kind: "run", cards };
      }
    }
  }
  return null;
}

export function partitionFromGroups(
  hand: Card[],
  groups: string[][],
): { ok: true; partition: Partition } | { ok: false; error: string } {
  const byId = new Map(hand.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const melds: Meld[] = [];
  for (const g of groups) {
    if (g.length === 0) continue;
    const cards: Card[] = [];
    for (const id of g) {
      if (seen.has(id))
        return { ok: false, error: "Una carta no puede estar en dos combinaciones." };
      const c = byId.get(id);
      if (!c) return { ok: false, error: "Carta inválida." };
      seen.add(id);
      cards.push(c);
    }
    const meld = validateMeld(cards);
    if (!meld) return { ok: false, error: "Combinación inválida." };
    melds.push(meld);
  }
  const loose = hand.filter((c) => !seen.has(c.id));
  const looseSum = loose.reduce((s, c) => s + cardValue(c), 0);
  return { ok: true, partition: { melds, loose, looseSum } };
}

export function isChinchon(hand: Card[]): boolean {
  if (hand.length !== 7) return false;
  const reals = hand.filter((c) => !c.isJoker);
  const jokers = hand.length - reals.length;
  if (reals.length === 0) return false;
  const suit = reals[0].suit;
  if (!reals.every((c) => c.suit === suit)) return false;
  const ranks = reals.map((c) => c.rank as number);
  if (new Set(ranks).size !== ranks.length) return false;
  const minR = Math.min(...ranks);
  const maxR = Math.max(...ranks);
  const span = maxR - minR + 1;
  if (span > 7) return false;

  const wLow = Math.max(1, maxR - 6);
  const wHigh = Math.min(12 - 6, minR);
  return wLow <= wHigh && reals.length + jokers === 7;
}

export function isPureChinchon(hand: Card[]): boolean {
  if (hand.length !== 7) return false;
  if (hand.some((c) => c.isJoker)) return false;
  return isChinchon(hand);
}

export function canCloseDiscarding(hand: Card[], discardId: string): boolean {
  const rest = hand.filter((c) => c.id !== discardId);
  if (isChinchon(rest)) return true;
  return bestPartition(rest).looseSum <= 3;
}

export type PlayerId = "user" | "ai";

export interface RoundState {
  deck: Card[];
  pile: Card[];
  hands: Record<PlayerId, Card[]>;
  turn: PlayerId;
  phase: "draw" | "discard";
  starter: PlayerId;
  pileDrawnCardId: string | null;
  discardsPlayed: number;
}

export function canDiscardCard(r: RoundState, cardId: string): boolean {
  return r.pileDrawnCardId !== cardId;
}

export function canDrawFromPile(r: RoundState): boolean {
  if (r.phase !== "draw" || r.pile.length === 0) return false;
  const isFirstTurnOfHand = r.discardsPlayed === 0 && r.turn !== r.starter;
  return !isFirstTurnOfHand;
}

export interface MatchState {
  scores: Record<PlayerId, number>;
  round: RoundState;
  roundNo: number;
  history: RoundResult[];
  over: false | { winner: PlayerId; reason: "score" | "chinchon" };
  secondLivesUsed: number;
  /** Una Carta Sucia por jugador y por partida. */
  dirtyUsed: Record<PlayerId, boolean>;
}

/** Fichas de soborno que paga quien cierra con una Carta Sucia en la mano. */
export const DIRTY_PENALTY = 5;

export interface RoundResult {
  closer: PlayerId | null;
  badClose: boolean;
  chinchon: boolean;
  jokeredChinchon: boolean;
  delta: Record<PlayerId, number>;
  closerPartition: Partition;
  otherPartition: Partition;
}

export function dealRound(starter: PlayerId, rnd: () => number = Math.random): RoundState {
  const deck = shuffle(newDeck(), rnd);
  const hands: Record<PlayerId, Card[]> = { user: [], ai: [] };
  const order: PlayerId[] = starter === "user" ? ["ai", "user"] : ["user", "ai"];
  for (let i = 0; i < 7; i++) for (const p of order) hands[p].push(deck.shift() as Card);
  const pile = [deck.shift() as Card];
  return {
    deck,
    pile,
    hands,
    turn: order[0],
    phase: "draw",
    starter,
    pileDrawnCardId: null,
    discardsPlayed: 0,
  };
}

export function startMatch(
  starter: PlayerId = "user",
  rnd: () => number = Math.random,
): MatchState {
  return {
    scores: { user: 0, ai: 0 },
    round: dealRound(starter, rnd),
    roundNo: 1,
    history: [],
    over: false,
    secondLivesUsed: 0,
    dirtyUsed: { user: false, ai: false },
  };
}

/**
 * Marca una carta de la mano como Sucia: pasa a valer como comodín para armar
 * juegos, pero suma 25 si queda suelta y delata el cierre (DIRTY_PENALTY).
 */
export function markDirtyCard(m: MatchState, player: PlayerId, cardId: string): MatchState {
  if (m.over) return m;
  const used = m.dirtyUsed ?? { user: false, ai: false };
  if (used[player]) return m;
  const hand = m.round.hands[player];
  const card = hand.find((c) => c.id === cardId);
  if (!card || card.isJoker) return m;
  const nextHand = hand.map((c) => (c.id === cardId ? { ...c, isJoker: true, dirty: true } : c));
  return {
    ...m,
    dirtyUsed: { ...used, [player]: true },
    round: { ...m.round, hands: { ...m.round.hands, [player]: nextHand } },
  };
}

/** Heurística de la rival: usa su Carta Sucia cuando está contra las cuerdas. */
export function aiDirtyChoice(m: MatchState): string | null {
  if (m.over) return null;
  if ((m.dirtyUsed ?? { user: false, ai: false }).ai) return null;
  const hand = m.round.hands.ai;
  if (hand.length !== 7) return null;
  const part = bestPartition(hand);
  const desperate = m.scores.ai >= 65 || m.scores.user <= 25;
  if (!desperate) return null;
  if (part.looseSum <= 8) return null;
  const candidates = part.loose.filter((c) => !c.isJoker);
  if (!candidates.length) return null;
  let best = candidates[0];
  for (const c of candidates) if (cardValue(c) > cardValue(best)) best = c;
  const simulated = hand.map((c) => (c.id === best.id ? { ...c, isJoker: true, dirty: true } : c));
  if (bestPartition(simulated).looseSum >= part.looseSum) return null;
  return best.id;
}

export function drawFromDeck(r: RoundState): RoundState {
  if (r.phase !== "draw") return r;
  if (r.deck.length === 0) {
    if (r.pile.length === 0) return r;
    if (r.pile.length === 1) {
      r = { ...r, deck: [...r.pile], pile: [] };
    } else {
      const top = r.pile[r.pile.length - 1];
      const rest = r.pile.slice(0, -1);
      r = { ...r, deck: shuffle(rest), pile: [top] };
    }
  }
  const card = r.deck[0];
  const hands = { ...r.hands, [r.turn]: [...r.hands[r.turn], card] };
  return { ...r, deck: r.deck.slice(1), hands, phase: "discard", pileDrawnCardId: null };
}

export function drawFromPile(r: RoundState): RoundState {
  if (!canDrawFromPile(r)) return r;
  const card = r.pile[r.pile.length - 1];
  const hands = { ...r.hands, [r.turn]: [...r.hands[r.turn], card] };
  return { ...r, pile: r.pile.slice(0, -1), hands, phase: "discard", pileDrawnCardId: card.id };
}

export interface DiscardResult {
  round: RoundState;
  closed: false | { closer: PlayerId; badClose: boolean; chinchon: boolean };
}

export function discard(r: RoundState, cardId: string, attemptClose: boolean): DiscardResult {
  if (r.phase !== "discard") return { round: r, closed: false };
  const hand = r.hands[r.turn];
  if (!hand.find((c) => c.id === cardId)) return { round: r, closed: false };
  if (r.pileDrawnCardId === cardId) return { round: r, closed: false };
  const newHand = hand.filter((c) => c.id !== cardId);
  const card = hand.find((c) => c.id === cardId) as Card;
  const next: PlayerId = r.turn === "user" ? "ai" : "user";

  const chinchonHit = attemptClose && isPureChinchon(newHand);

  if (attemptClose) {
    const part = bestPartition(newHand);

    const validClose = chinchonHit || isChinchon(newHand) || part.looseSum <= 3;
    const badClose = !validClose;
    const newRound: RoundState = {
      ...r,
      hands: { ...r.hands, [r.turn]: newHand },
      pile: [...r.pile, card],
      phase: "draw",
      turn: next,
      pileDrawnCardId: null,
      discardsPlayed: r.discardsPlayed + 1,
    };
    return {
      round: newRound,
      closed: { closer: r.turn, badClose, chinchon: chinchonHit },
    };
  }

  const newRound: RoundState = {
    ...r,
    hands: { ...r.hands, [r.turn]: newHand },
    pile: [...r.pile, card],
    phase: "draw",
    turn: next,
    pileDrawnCardId: null,
    discardsPlayed: r.discardsPlayed + 1,
  };
  return { round: newRound, closed: false };
}

export function chinchonDiscardId(hand8: Card[]): string | null {
  if (hand8.length !== 8) return null;
  for (const c of hand8) {
    const rest = hand8.filter((x) => x.id !== c.id);
    if (isChinchon(rest)) return c.id;
  }
  return null;
}

export function resolveRound(
  r: RoundState,
  closed: { closer: PlayerId; badClose: boolean; chinchon: boolean },
  override?: { player: PlayerId; partition: Partition },
): RoundResult {
  const other: PlayerId = closed.closer === "user" ? "ai" : "user";
  const closerPart =
    override?.player === closed.closer ? override.partition : bestPartition(r.hands[closed.closer]);
  const otherPart = override?.player === other ? override.partition : bestPartition(r.hands[other]);

  const delta: Record<PlayerId, number> = { user: 0, ai: 0 };

  if (closed.chinchon) {
    delta[other] = 200;
    return {
      closer: closed.closer,
      badClose: false,
      chinchon: true,
      jokeredChinchon: false,
      delta,
      closerPartition: closerPart,
      otherPartition: otherPart,
    };
  }

  let jokeredChinchon = false;
  if (closed.badClose) {
    delta[closed.closer] = 10 + closerPart.looseSum;
    delta[other] = 0;
  } else {
    jokeredChinchon =
      isChinchon(r.hands[closed.closer]) && r.hands[closed.closer].some((c) => c.isJoker);
    if (jokeredChinchon) {
      delta[closed.closer] = -50;
    } else {
      delta[closed.closer] = closerPart.looseSum === 0 ? -10 : closerPart.looseSum;
      if (r.hands[closed.closer].some((c) => c.dirty)) {
        delta[closed.closer] += DIRTY_PENALTY;
      }
    }
    delta[other] = otherPart.looseSum;
  }
  return {
    closer: closed.closer,
    badClose: closed.badClose,
    chinchon: false,
    jokeredChinchon,
    delta,
    closerPartition: closerPart,
    otherPartition: otherPart,
  };
}

export function applyResult(m: MatchState, res: RoundResult): MatchState {
  const scores = {
    user: m.scores.user + res.delta.user,
    ai: m.scores.ai + res.delta.ai,
  };
  let over: MatchState["over"] = false;
  if (res.chinchon) {
    const loser = res.delta.user > res.delta.ai ? "user" : "ai";
    over = { winner: loser === "user" ? "ai" : "user", reason: "chinchon" };
  } else if (scores.user >= 100 && scores.ai >= 100) {
    over = { winner: scores.user < scores.ai ? "user" : "ai", reason: "score" };
  } else if (scores.user >= 100) {
    over = { winner: "ai", reason: "score" };
  } else if (scores.ai >= 100) {
    over = { winner: "user", reason: "score" };
  }
  const nextStarter: PlayerId = m.round.starter === "user" ? "ai" : "user";
  return {
    ...m,
    scores,
    history: [...m.history, res],
    roundNo: m.roundNo + 1,
    round: over ? m.round : dealRound(nextStarter),
    over,
  };
}

export interface SecondLifeOpts {
  maxAllowed?: number;
  allowOnChinchon?: boolean;
}

export function grantSecondLife(
  m: MatchState,
  optsOrRnd: SecondLifeOpts | (() => number) = {},
  rndArg: () => number = Math.random,
): MatchState {
  if (!m.over) return m;
  const opts: SecondLifeOpts = typeof optsOrRnd === "function" ? {} : optsOrRnd;
  const rnd: () => number = typeof optsOrRnd === "function" ? optsOrRnd : rndArg;
  const maxAllowed = opts.maxAllowed ?? 1;
  const allowOnChinchon = opts.allowOnChinchon ?? false;
  if (m.over.reason === "chinchon" && !allowOnChinchon) return m;
  if (m.secondLivesUsed >= maxAllowed) return m;
  const winner = m.over.winner;
  const loser: PlayerId = winner === "user" ? "ai" : "user";
  const winnerScore = m.scores[winner];
  const scores: Record<PlayerId, number> = { user: m.scores.user, ai: m.scores.ai };
  scores[loser] = winnerScore;

  return {
    ...m,
    scores,
    over: false,
    secondLivesUsed: m.secondLivesUsed + 1,
    round: dealRound(loser, rnd),
    roundNo: m.roundNo + 1,
  };
}

export interface AiDecision {
  draw: "deck" | "pile";
  discardId: string;
  close: boolean;
  chinchon: boolean;
  explanation?: AiExplanation;
}

export interface AiExplanation {
  summary: string;
  ev: number;
  risk: number;
  melds: number;
  loose: number;
  drewFrom: "deck" | "pile";
  reason: "chinchon-puro" | "chinchon-joker" | "cierre" | "descarte" | "aguante-margen";
}

export interface AiOpts {
  rivalPilePicks?: Card[];
  rivalDiscards?: Card[];
  difficulty?: 0 | 1 | 2;
  depth?: 0 | 1 | 2 | 3;
  weights?: ChinchonWeights;
}

function feedsRival(c: Card, risk: Card[]): boolean {
  if (c.isJoker || risk.length === 0) return false;
  for (const r of risk) {
    if (r.isJoker) continue;
    if (r.rank === c.rank) return true;
    if (r.suit === c.suit) {
      const d = Math.abs((r.rank as number) - (c.rank as number));
      if (d > 0 && d <= 2) return true;
    }
  }
  return false;
}

function feedWeight(c: Card, picks: Card[]): number {
  if (c.isJoker || picks.length === 0) return 0;
  let w = 0;
  const n = picks.length;
  for (let i = 0; i < n; i++) {
    const r = picks[i];
    if (r.isJoker) continue;

    const rec = 0.4 + 0.6 * ((i + 1) / n);
    if (r.rank === c.rank) w = Math.max(w, rec);
    else if (r.suit === c.suit) {
      const d = Math.abs((r.rank as number) - (c.rank as number));
      if (d === 1) w = Math.max(w, rec);
      else if (d === 2) w = Math.max(w, rec * 0.65);
    }
  }
  return w;
}

function unseenCards(
  hand: Card[],
  belief: { discards: Card[]; picks: Card[]; pileTop: Card | null },
): Card[] {
  const seen = new Set<string>();
  for (const c of hand) seen.add(c.id);
  for (const c of belief.discards) seen.add(c.id);
  for (const c of belief.picks) seen.add(c.id);
  if (belief.pileTop) seen.add(belief.pileTop.id);
  const full = newDeck();
  return full.filter((c) => !seen.has(c.id));
}

function mcExpectedLoose(
  restHand: Card[],
  unseen: Card[],
  samples: number,
  rnd: () => number,
): number {
  if (unseen.length === 0 || samples <= 0) return bestPartition(restHand).looseSum;
  let acc = 0;
  for (let i = 0; i < samples; i++) {
    const idx = Math.floor(rnd() * unseen.length);
    const drawn = unseen[idx];
    acc += bestDiscardSum([...restHand, drawn]);
  }
  return acc / samples;
}

export function aiDecide(
  r: RoundState,
  rnd: () => number = Math.random,
  opts: AiOpts = {},
): AiDecision {
  const hand = r.hands.ai;
  const pileTop = r.pile[r.pile.length - 1];
  const base = bestPartition(hand);
  const picks = opts.rivalPilePicks ?? [];
  const rivalDiscards = opts.rivalDiscards ?? [];
  const diff = opts.difficulty ?? 1;
  const depth = opts.depth ?? 0;
  const W = opts.weights ?? DEFAULT_WEIGHTS;

  const feedPenaltyBase = diff * W.feedPenalty;

  const beliefDiscards = [...rivalDiscards, ...r.pile];
  const belief = { discards: beliefDiscards, picks, pileTop: pileTop ?? null };
  const unseen = depth > 0 ? unseenCards(hand, belief) : [];
  const mcSamples = depth === 0 ? 0 : depth === 1 ? 10 : 20;

  let draw: "deck" | "pile" = "deck";
  if (pileTop && canDrawFromPile(r)) {
    const withPile = bestPartition([...hand, pileTop]);
    const bestAfterPile = bestDiscardSum([...hand, pileTop]);
    const bestAfterDeckEstimate = base.looseSum;

    const pileEnablesClose = bestAfterPile <= 3 && bestAfterDeckEstimate > 3;
    const pileDelta = bestAfterDeckEstimate - bestAfterPile;
    if (
      pileEnablesClose ||
      pileTop.isJoker ||
      pileDelta > 2 + (1 - W.pickPilePref) * 2 ||
      withPile.melds.length > base.melds.length
    ) {
      draw = "pile";
    }
  }

  // Al robar del mazo, incorporamos la carta que efectivamente será robada
  // (top del deck, o del pozo si el deck está vacío y drawFromDeck lo reshufflea).
  // Sin esto, aiDecide subestima la mano de 8 y puede intentar cierres inválidos.
  const deckPeek: Card | null =
    draw === "deck"
      ? (r.deck[0] ??
        (r.pile.length === 1 ? r.pile[0] : r.pile.length > 1 ? r.pile[r.pile.length - 1] : null))
      : null;
  const handAfterDraw: Card[] =
    draw === "pile" ? [...hand, pileTop] : deckPeek ? [...hand, deckPeek] : hand;
  const blockedDiscardId = draw === "pile" ? pileTop.id : null;

  if (handAfterDraw.length === 8) {
    for (const c of handAfterDraw) {
      if (c.id === blockedDiscardId) continue;
      const rest = handAfterDraw.filter((x) => x.id !== c.id);
      if (isPureChinchon(rest)) {
        return {
          draw,
          discardId: c.id,
          close: true,
          chinchon: true,
          explanation: {
            summary: "Chinchón puro — escalera de 7 sin comodines. Cierro.",
            ev: 0,
            risk: 0,
            melds: 7,
            loose: 0,
            drewFrom: draw,
            reason: "chinchon-puro",
          },
        };
      }
    }
  }

  let jokeredChinchonDiscard: string | null = null;
  if (handAfterDraw.length === 8) {
    for (const c of handAfterDraw) {
      if (c.id === blockedDiscardId) continue;
      const rest = handAfterDraw.filter((x) => x.id !== c.id);
      if (isChinchon(rest) && rest.some((x) => x.isJoker)) {
        jokeredChinchonDiscard = c.id;
        break;
      }
    }
  }

  let bestId =
    handAfterDraw.find((c) => c.id !== blockedDiscardId && !c.isJoker)?.id ??
    handAfterDraw.find((c) => c.id !== blockedDiscardId)?.id ??
    handAfterDraw[0].id;
  let bestScore = Infinity;
  let bestLoose = Infinity;
  for (const c of handAfterDraw) {
    if (c.id === blockedDiscardId) continue;
    if (c.isJoker) continue;
    const rest = handAfterDraw.filter((x) => x.id !== c.id);
    const p = bestPartition(rest);
    const fw = feedWeight(c, picks);

    const rivalDumped = rivalDiscards.some(
      (d) => !d.isJoker && !c.isJoker && d.rank === c.rank && d.suit === c.suit,
    );
    const feeds = fw * feedPenaltyBase + (rivalDumped ? -0.4 : 0);

    const usedCount = rest.length - p.loose.length;
    const meldBonus = usedCount * W.meldBonus + p.melds.length * W.meldCountBonus;
    const tiebreak = -cardValue(c) * W.tiebreak;

    const mcE = depth > 0 ? mcExpectedLoose(rest, unseen, mcSamples, rnd) : p.looseSum;
    const looseTerm = (1 - W.mcBlend) * p.looseSum + W.mcBlend * mcE;
    const score = looseTerm + feeds - meldBonus + tiebreak;
    if (score < bestScore) {
      bestScore = score;
      bestLoose = p.looseSum;
      bestId = c.id;
    }
  }

  if (!Number.isFinite(bestScore)) {
    for (const c of handAfterDraw) {
      if (c.id === blockedDiscardId) continue;
      const rest = handAfterDraw.filter((x) => x.id !== c.id);
      const p = bestPartition(rest);
      if (p.looseSum < bestLoose) {
        bestLoose = p.looseSum;
        bestId = c.id;
      }
    }
  }

  // Cierre legal estricto: looseSum ≤ 3. closeMargin se usa como cojín
  // conservador para retrasar el cierre cuando la mano sigue mejorando.
  const legalClose = bestLoose <= 3;
  const conservativeGate = W.closeMargin > 0 ? bestLoose <= 3 - W.closeMargin : true;
  const canClose = legalClose && conservativeGate;

  const bestRest = handAfterDraw.filter((x) => x.id !== bestId);
  const bestPart = bestPartition(bestRest);
  const discardedCard = handAfterDraw.find((x) => x.id === bestId) as Card;
  const riskWeight = feedWeight(discardedCard, picks);
  const meldedCount = bestRest.length - bestPart.loose.length;

  if (jokeredChinchonDiscard) {
    return {
      draw,
      discardId: jokeredChinchonDiscard,
      close: true,
      chinchon: false,
      explanation: {
        summary: "Escalera con comodín — cierro por el bonus (−50).",
        ev: 0,
        risk: 0,
        melds: 7,
        loose: 0,
        drewFrom: draw,
        reason: "chinchon-joker",
      },
    };
  }

  // Aguantar por chinchón solo si hay camino real:
  //  - progresso del palo mayoritario en la mano final (ranks contiguos + jokers).
  //  - moderado por la agresividad del rival (si picó del pozo varias veces, cerramos ya).
  const progress = chinchonProgress(bestRest);
  const rivalHeat = Math.min(1, picks.length / 5);
  const diffMul = diff === 2 ? 2.2 : diff === 1 ? 1.1 : 0.4;
  const chinchonHold = W.chinchonHold * diffMul * (0.35 + 0.65 * progress) * (1 - 0.7 * rivalHeat);
  const goForChinchon = canClose && bestLoose > 0 && progress >= 0.55 && rnd() < chinchonHold;

  // Aguante por margen (faroleo): con dificultad alta, la rival a veces no
  // corta apenas puede sino que se guarda un turno extra buscando bajar el
  // "loose" a 0/1 y cortar por más diferencia. Cuanto peor el margen actual
  // (loose 2-3) y más floja la presión del rival, más tienta aguantar; si el
  // rival viene agresivo con el pozo, prioriza cerrar antes de que la
  // corten a ella.
  const marginHoldMul = diff === 2 ? 0.42 : diff === 1 ? 0.18 : 0.03;
  const marginBias = bestLoose / 3;
  const holdForBetterCut =
    canClose &&
    !goForChinchon &&
    bestLoose > 0 &&
    rnd() < marginHoldMul * marginBias * (1 - 0.6 * rivalHeat);

  const willClose = canClose && !goForChinchon && !holdForBetterCut;
  const summary = summarizeDiscard({
    close: willClose,
    discard: discardedCard,
    loose: bestPart.looseSum,
    ev: Number.isFinite(bestScore)
      ? Math.max(0, Math.round(bestScore * 10) / 10)
      : bestPart.looseSum,
    risk: riskWeight,
    melds: meldedCount,
    drewFrom: draw,
    aimingChinchon: goForChinchon,
    holdingMargin: holdForBetterCut,
  });
  return {
    draw,
    discardId: bestId,
    close: willClose,
    chinchon: false,
    explanation: {
      summary,
      ev: Number.isFinite(bestScore)
        ? Math.max(0, Math.round(bestScore * 10) / 10)
        : bestPart.looseSum,
      risk: Math.max(0, Math.min(1, riskWeight)),
      melds: meldedCount,
      loose: bestPart.looseSum,
      drewFrom: draw,
      reason: willClose ? "cierre" : holdForBetterCut ? "aguante-margen" : "descarte",
    },
  };
}

function bestDiscardSum(handPlusOne: Card[]): number {
  let best = Infinity;
  for (const c of handPlusOne) {
    const rest = handPlusOne.filter((x) => x.id !== c.id);
    const s = bestPartition(rest).looseSum;
    if (s < best) best = s;
  }
  return best;
}

// Score 0..1 aproximando cuán cerca está la mano de un chinchón (escalera de 7 en un palo).
// Cuenta cartas del palo dominante que puedan encajar dentro de una ventana de 7 ranks,
// sumando los jokers disponibles.
export function chinchonProgress(hand: Card[]): number {
  const jokers = hand.filter((c) => c.isJoker).length;
  let best = 0;
  for (const suit of SUITS) {
    const ranks = hand.filter((c) => !c.isJoker && c.suit === suit).map((c) => c.rank as number);
    if (ranks.length === 0) continue;
    const set = new Set(ranks);
    for (let start = 1; start <= 12 - 6; start++) {
      let inWindow = 0;
      for (let r = start; r < start + 7; r++) if (set.has(r)) inWindow++;
      const covered = Math.min(7, inWindow + jokers);
      if (covered > best) best = covered;
    }
  }
  return best / 7;
}

function cardName(c: Card): string {
  if (c.isJoker) return "comodín";
  const suitShort =
    c.suit === "oros"
      ? "oro"
      : c.suit === "copas"
        ? "copa"
        : c.suit === "espadas"
          ? "espada"
          : "basto";
  return `${c.rank} de ${suitShort}`;
}

function summarizeDiscard(x: {
  close: boolean;
  discard: Card;
  loose: number;
  ev: number;
  risk: number;
  melds: number;
  drewFrom: "deck" | "pile";
  aimingChinchon: boolean;
  holdingMargin?: boolean;
}): string {
  const cardTxt = cardName(x.discard);
  const fromTxt = x.drewFrom === "pile" ? "tras robar del pozo" : "tras robar del mazo";
  if (x.close) {
    return `Cierro con ${x.loose} de sueltos ${fromTxt}. Descarto ${cardTxt}.`;
  }
  if (x.aimingChinchon) {
    return `Aguanto por chinchón (loose ${x.loose}). Descarto ${cardTxt}.`;
  }
  if (x.holdingMargin) {
    return `Podría cerrar, pero aguanto un turno más buscando mejor margen. Descarto ${cardTxt}.`;
  }
  const riskTxt =
    x.risk >= 0.7
      ? "alto riesgo de alimentarte"
      : x.risk >= 0.35
        ? "riesgo moderado"
        : "riesgo bajo";
  return `Descarto ${cardTxt} — EV loose ~${x.ev}, ${x.melds} cartas ligadas, ${riskTxt}.`;
}
