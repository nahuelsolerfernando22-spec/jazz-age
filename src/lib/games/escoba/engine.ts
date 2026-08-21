import { buildDeck, shuffle, type Card } from "./deck";
import { capturesFor, wouldSweep } from "./rules";
import { scoreRound, type Pile, type RoundBreakdown, TARGET_SCORE } from "./scoring";

export type Seat = "player" | "cpu";

export interface EscobaState {
  deck: Card[];
  table: Card[];
  hands: Record<Seat, Card[]>;
  piles: Record<Seat, Pile>;
  turn: Seat;
  lastCapturer: Seat | null;
  dealer: Seat;
  round: number;
  totals: Record<Seat, number>;
  status: "playing" | "round-end" | "match-end";
  lastBreakdown?: { player: RoundBreakdown; cpu: RoundBreakdown };
  /** Cuando true, la CPU recibe una carta menos por reparto (mano mocha). */
  weakHand?: boolean;
  event?:
    | { type: "capture"; by: Seat; played: Card; picked: Card[]; sweep: boolean }
    | { type: "discard"; by: Seat; played: Card }
    | { type: "deal" }
    | { type: "round-end"; breakdown: { player: RoundBreakdown; cpu: RoundBreakdown } }
    | { type: "match-end"; winner: Seat | "draw" };
}

function emptyPile(): Pile {
  return { captured: [], sweeps: 0 };
}

export interface MatchOptions {
  /** Si true, la CPU juega con mano mocha: recibe 2 cartas en lugar de 3. */
  weakHand?: boolean;
}

export function newMatch(rng: () => number = Math.random, opts: MatchOptions = {}): EscobaState {
  const s = startRound(
    {
      deck: [],
      table: [],
      hands: { player: [], cpu: [] },
      piles: { player: emptyPile(), cpu: emptyPile() },
      turn: "player",
      lastCapturer: null,
      dealer: "player",
      round: 0,
      totals: { player: 0, cpu: 0 },
      status: "playing",
      weakHand: !!opts.weakHand,
    } as EscobaState & { weakHand?: boolean },
    rng,
  );
  return s;
}

function startRound(prev: EscobaState, rng: () => number): EscobaState {
  const deck = shuffle(buildDeck(), rng);

  let table = deck.splice(0, 4);
  let guard = 0;
  while (table.filter((c) => c.rank === 10).length >= 3 && guard++ < 10) {
    deck.push(...table);
    const re = shuffle(deck, rng);
    deck.length = 0;
    deck.push(...re);
    table = deck.splice(0, 4);
  }
  const cpuCards = prev.weakHand ? 2 : 3;
  const hands: Record<Seat, Card[]> = {
    player: deck.splice(0, 3),
    cpu: deck.splice(0, cpuCards),
  };

  const nextDealer: Seat =
    prev.round === 0 ? prev.dealer : prev.dealer === "player" ? "cpu" : "player";
  const opener: Seat = nextDealer === "player" ? "cpu" : "player";
  return {
    ...prev,
    deck,
    table,
    hands,
    piles: { player: emptyPile(), cpu: emptyPile() },
    turn: opener,
    lastCapturer: null,
    dealer: nextDealer,
    round: prev.round + 1,
    status: "playing",
    event: { type: "deal" },
    lastBreakdown: undefined,
  };
}

function dealHands(state: EscobaState): EscobaState {
  const d = state.deck.slice();
  const nextHands = {
    player: state.hands.player.slice(),
    cpu: state.hands.cpu.slice(),
  };
  const perSeat: Record<Seat, number> = {
    player: 3,
    cpu: state.weakHand ? 2 : 3,
  };
  for (const seat of ["player", "cpu"] as Seat[]) {
    for (let i = 0; i < perSeat[seat] && d.length > 0; i++) {
      nextHands[seat].push(d.shift()!);
    }
  }
  return { ...state, deck: d, hands: nextHands, event: { type: "deal" } };
}

export function playCard(
  state: EscobaState,
  seat: Seat,
  cardIdx: number,
  captureIdx = 0,
  rng: () => number = Math.random,
): EscobaState {
  if (state.status !== "playing" || state.turn !== seat) return state;
  const hand = state.hands[seat];
  const card = hand[cardIdx];
  if (!card) return state;

  const options = capturesFor(state.table, card);
  const picked = options[Math.min(captureIdx, Math.max(0, options.length - 1))] ?? null;

  let table = state.table.slice();
  const newHand = hand.slice();
  newHand.splice(cardIdx, 1);
  const nextPiles = {
    player: { ...state.piles.player, captured: state.piles.player.captured.slice() },
    cpu: { ...state.piles.cpu, captured: state.piles.cpu.captured.slice() },
  };

  let event: EscobaState["event"];
  let lastCapturer = state.lastCapturer;

  if (picked && picked.length > 0) {
    const ids = new Set(picked.map((c) => c.id));
    // Regla clásica: la escoba NO cuenta si es la última baza (ambas manos
    // se vacían y el mazo ya está agotado). Detectar antes de incrementar.
    const willEmptyHands =
      state.deck.length === 0 &&
      newHand.length === 0 &&
      state.hands[seat === "player" ? "cpu" : "player"].length === 0;
    const sweep = wouldSweep(table, picked) && !willEmptyHands;
    table = table.filter((c) => !ids.has(c.id));
    nextPiles[seat].captured.push(card, ...picked);
    if (sweep) nextPiles[seat].sweeps += 1;
    lastCapturer = seat;
    event = { type: "capture", by: seat, played: card, picked, sweep };
  } else {
    table.push(card);
    event = { type: "discard", by: seat, played: card };
  }

  let next: EscobaState = {
    ...state,
    table,
    hands: { ...state.hands, [seat]: newHand },
    piles: nextPiles,
    turn: seat === "player" ? "cpu" : "player",
    lastCapturer,
    event,
  };

  if (next.hands.player.length === 0 && next.hands.cpu.length === 0) {
    if (next.deck.length > 0) {
      next = dealHands(next);
    } else {
      next = closeRound(next, rng);
    }
  }
  return next;
}

function closeRound(state: EscobaState, rng: () => number): EscobaState {
  let piles = state.piles;
  if (state.lastCapturer && state.table.length > 0) {
    const s = state.lastCapturer;
    piles = {
      ...piles,
      [s]: { ...piles[s], captured: [...piles[s].captured, ...state.table] },
    };
  }
  const br = scoreRound(piles.player, piles.cpu);
  const totals = {
    player: state.totals.player + br.a.total,
    cpu: state.totals.cpu + br.b.total,
  };

  const reached = totals.player >= TARGET_SCORE || totals.cpu >= TARGET_SCORE;
  const matchEnded = reached && totals.player !== totals.cpu;
  const winner: Seat | "draw" = matchEnded
    ? totals.player > totals.cpu
      ? "player"
      : "cpu"
    : "draw";
  const state1: EscobaState = {
    ...state,
    table: [],
    piles,
    totals,
    status: matchEnded ? "match-end" : "round-end",
    lastBreakdown: { player: br.a, cpu: br.b },
    event: matchEnded
      ? { type: "match-end", winner }
      : { type: "round-end", breakdown: { player: br.a, cpu: br.b } },
  };
  return matchEnded ? state1 : startRound(state1, rng);
}

export function autoAdvance(state: EscobaState, rng?: () => number): EscobaState {
  let s = state;
  let guard = 0;
  while (s.status === "playing" && s.turn === "cpu" && guard++ < 20) {
    const move = pickCpuMove(s);
    if (!move) break;
    s = playCard(s, "cpu", move.cardIdx, move.captureIdx, rng);
  }
  return s;
}

/**
 * Cartas de cada valor que todavía no vio la CPU (cuenta de cartas): mano propia,
 * mesa y todo lo capturado ya son información pública para ella.
 */
function unseenByValue(state: EscobaState): number[] {
  // 8 cartas por valor en un mazo español de 40 (4 palos, valores 1..7,10,11,12).
  const remaining = new Array(13).fill(0) as number[];
  for (const v of [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]) remaining[v] = 4;
  const seen = [
    ...state.hands.cpu,
    ...state.table,
    ...state.piles.cpu.captured,
    ...state.piles.player.captured,
  ];
  for (const c of seen) remaining[c.rank] = Math.max(0, (remaining[c.rank] ?? 0) - 1);
  return remaining;
}

/** Riesgo de regalarle escoba al rival dejando esta mesa servida. */
function sweepRisk(table: Card[], remaining: number[]): number {
  const total = table.reduce((a, c) => a + c.value, 0);
  const need = 15 - total;
  if (need <= 0 || need > 12) return 0;
  const unseenTotal = remaining.reduce((a, b) => a + b, 0) || 1;
  // Probabilidad aproximada de que el rival tenga en mano la carta exacta.
  const copies = remaining[need] ?? 0;
  return (copies / unseenTotal) * 3 * 12;
}

function pickCpuMove(state: EscobaState): { cardIdx: number; captureIdx: number } | null {
  const hand = state.hands.cpu;
  if (!hand.length) return null;
  const remaining = unseenByValue(state);
  let best: { cardIdx: number; captureIdx: number; score: number } | null = null;

  const valueOf = (cards: Card[]): number => {
    let v = 0;
    for (const c of cards) {
      v += 1; // mayoría de cartas
      if (c.suit === "oros") v += 1.4; // mayoría de oros
      if (c.rank === 7) v += 1.6; // el juego del 7 (setenta)
      if (c.rank === 7 && c.suit === "oros") v += 5; // la carta clave del tanteo
    }
    return v;
  };

  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    const opts = capturesFor(state.table, card);
    if (opts.length === 0) {
      // Descarte: mide qué tan servida queda la mesa después de tirar esta carta.
      const after = [...state.table, card];
      const risk = sweepRisk(after, remaining);
      const score = -0.5 - valueOf([card]) * 0.8 - risk;
      if (!best || score > best.score) best = { cardIdx: i, captureIdx: 0, score };
    } else {
      for (let j = 0; j < opts.length; j++) {
        const picked = opts[j];
        const isSweep = picked.length === state.table.length && state.table.length > 0;
        const rest = state.table.filter((c) => !picked.some((p) => p.id === c.id));
        const risk = isSweep ? 0 : sweepRisk(rest, remaining);
        const score = 6 + valueOf([...picked, card]) + (isSweep ? 12 : 0) - risk;
        if (!best || score > best.score) best = { cardIdx: i, captureIdx: j, score };
      }
    }
  }
  return best;
}

export function auditPlayerMove(prev: EscobaState, cardIdx: number, captureIdx: number): string[] {
  const tags: string[] = [];
  const card = prev.hands.player[cardIdx];
  if (!card) return tags;
  const options = capturesFor(prev.table, card);

  const sieteOrosInTable = prev.table.some((c) => c.suit === "oros" && c.rank === 7);
  if (sieteOrosInTable && options.length === 0) tags.push("left_siete_oros_on_table");

  if (options.length === 0) {
    const nextTableSum = prev.table.reduce((a, c) => a + c.value, 0) + card.value;
    if (nextTableSum >= 20) tags.push("built_dangerous_table");
  }

  if (options.length > 0) {
    const picked = options[Math.min(captureIdx, options.length - 1)];
    const sweepAvail = options.some((o) => o.length === prev.table.length);
    const isSweep = picked.length === prev.table.length;
    if (sweepAvail && !isSweep) tags.push("cpu_missed_broom_defense");

    const took7oros =
      picked.some((c) => c.suit === "oros" && c.rank === 7) ||
      (card.suit === "oros" && card.rank === 7);
    if (took7oros) tags.push("cpu_lost_siete_oros");

    const orosTaken =
      picked.filter((c) => c.suit === "oros").length + (card.suit === "oros" ? 1 : 0);
    if (orosTaken >= 2) tags.push("cpu_leaked_oros");
  }

  return tags;
}
