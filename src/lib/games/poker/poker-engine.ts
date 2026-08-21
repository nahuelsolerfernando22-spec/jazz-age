// Motor de Texas Hold'em de límite fijo para la sala de póker del Cuervo Dorado.
// Es puro: no toca React ni el almacenamiento. Tres asientos, ciegas fijas y
// como máximo cuatro subidas por calle, que es la variante más fácil de leer en
// pantalla chica y la que evita que la IA se descontrole.

export type Suit = "♠" | "♥" | "♦" | "♣";

export interface Card {
  /** 2..14 (14 = as) */
  r: number;
  s: Suit;
}

export type Seat = "you" | "lola" | "bruno";

export const SEATS: Seat[] = ["you", "lola", "bruno"];

export const SEAT_NAME: Record<Seat, string> = {
  you: "Vos",
  lola: "Lola «La Sombra»",
  bruno: "Bruno «El Cuervo»",
};

export const SEAT_SHORT: Record<Seat, string> = {
  you: "Vos",
  lola: "Lola",
  bruno: "Bruno",
};

export type Stage = "espera" | "preflop" | "flop" | "turn" | "river" | "showdown";

export type ActionKind = "pasar" | "ver" | "apostar" | "subir" | "retirarse";

export interface Action {
  kind: ActionKind;
  /** Fichas que agrega el asiento al bote con esta acción. */
  amount: number;
}

export interface PokerState {
  hand: number;
  /** Índice en SEATS del botón repartidor. */
  button: number;
  deck: Card[];
  hole: Record<Seat, Card[]>;
  board: Card[];
  stacks: Record<Seat, number>;
  /** Apostado en la calle en curso. */
  bets: Record<Seat, number>;
  /** Apostado en toda la mano. */
  committed: Record<Seat, number>;
  folded: Record<Seat, boolean>;
  acted: Record<Seat, boolean>;
  lastAction: Partial<Record<Seat, string>>;
  pot: number;
  stage: Stage;
  toAct: Seat | null;
  currentBet: number;
  raises: number;
  smallBlind: number;
  bigBlind: number;
  log: string[];
  winners: Seat[];
  /** Resumen de la mano cerrada, listo para mostrar. */
  result: string | null;
  /** Si hubo que mostrar cartas al final. */
  showdown: boolean;
}

export const HAND_NAMES = [
  "carta alta",
  "par",
  "doble par",
  "trío",
  "escalera",
  "color",
  "full",
  "póker",
  "escalera de color",
] as const;

export interface HandValue {
  /** 0 = carta alta … 8 = escalera de color. */
  cat: number;
  /** Desempates de mayor a menor. */
  ranks: number[];
  name: string;
  /** Las cinco cartas que forman la jugada. */
  cards: Card[];
}

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];

export function freshDeck(rng: () => number): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) for (let r = 2; r <= 14; r++) deck.push({ r, s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function rankLabel(r: number): string {
  if (r === 14) return "A";
  if (r === 13) return "K";
  if (r === 12) return "Q";
  if (r === 11) return "J";
  if (r === 10) return "10";
  return String(r);
}

export function cardLabel(c: Card): string {
  return `${rankLabel(c.r)}${c.s}`;
}

export function isRed(c: Card): boolean {
  return c.s === "♥" || c.s === "♦";
}

/** Mejor jugada de cinco cartas entre las siete disponibles. */
export function evaluate(cards: Card[]): HandValue {
  if (cards.length < 5) throw new Error("hacen falta al menos cinco cartas");
  let best: HandValue | null = null;
  const n = cards.length;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            const five = [cards[a], cards[b], cards[c], cards[d], cards[e]];
            const v = evaluate5(five);
            if (!best || compareValues(v, best) > 0) best = v;
          }
  return best!;
}

function evaluate5(five: Card[]): HandValue {
  const sorted = [...five].sort((x, y) => y.r - x.r);
  const ranks = sorted.map((c) => c.r);
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = [...counts.entries()].sort((x, y) => y[1] - x[1] || y[0] - x[0]);
  const flush = sorted.every((c) => c.s === sorted[0].s);

  const uniq = [...new Set(ranks)].sort((x, y) => y - x);
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
    // La rueda: A-5-4-3-2 cuenta como escalera al 5.
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHigh = 5;
  }

  const mk = (cat: number, tie: number[]): HandValue => ({
    cat,
    ranks: tie,
    name: HAND_NAMES[cat],
    cards: sorted,
  });

  if (flush && straightHigh) return mk(8, [straightHigh]);
  if (groups[0][1] === 4) return mk(7, [groups[0][0], groups[1][0]]);
  if (groups[0][1] === 3 && groups[1][1] === 2) return mk(6, [groups[0][0], groups[1][0]]);
  if (flush) return mk(5, ranks);
  if (straightHigh) return mk(4, [straightHigh]);
  if (groups[0][1] === 3) return mk(3, [groups[0][0], ...groups.slice(1).map((g) => g[0])]);
  if (groups[0][1] === 2 && groups[1][1] === 2)
    return mk(2, [
      Math.max(groups[0][0], groups[1][0]),
      Math.min(groups[0][0], groups[1][0]),
      groups[2][0],
    ]);
  if (groups[0][1] === 2) return mk(1, [groups[0][0], ...groups.slice(1).map((g) => g[0])]);
  return mk(0, ranks);
}

export function compareValues(a: HandValue, b: HandValue): number {
  if (a.cat !== b.cat) return a.cat - b.cat;
  const len = Math.max(a.ranks.length, b.ranks.length);
  for (let i = 0; i < len; i++) {
    const x = a.ranks[i] ?? 0;
    const y = b.ranks[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

export function betSize(s: PokerState): number {
  return s.stage === "preflop" || s.stage === "flop" ? s.bigBlind : s.bigBlind * 2;
}

export const MAX_RAISES = 4;

export function newTable(buyIn: number, smallBlind = 5): PokerState {
  const zero = () => ({ you: 0, lola: 0, bruno: 0 });
  return {
    hand: 0,
    button: 2,
    deck: [],
    hole: { you: [], lola: [], bruno: [] },
    board: [],
    stacks: { you: buyIn, lola: buyIn, bruno: buyIn },
    bets: zero(),
    committed: zero(),
    folded: { you: false, lola: false, bruno: false },
    acted: { you: false, lola: false, bruno: false },
    lastAction: {},
    pot: 0,
    stage: "espera",
    toAct: null,
    currentBet: 0,
    raises: 0,
    smallBlind,
    bigBlind: smallBlind * 2,
    log: [],
    winners: [],
    result: null,
    showdown: false,
  };
}

function seatAfter(idx: number, offset: number): number {
  return (idx + offset) % SEATS.length;
}

/** Reparte una mano nueva. Devuelve un estado nuevo, sin mutar el anterior. */
export function startHand(prev: PokerState, rng: () => number = Math.random): PokerState {
  const deck = freshDeck(rng);
  const button = prev.hand === 0 ? prev.button : seatAfter(prev.button, 1);
  const sbSeat = SEATS[seatAfter(button, 1)];
  const bbSeat = SEATS[seatAfter(button, 2)];

  const s: PokerState = {
    ...prev,
    hand: prev.hand + 1,
    button,
    deck,
    hole: { you: [], lola: [], bruno: [] },
    board: [],
    bets: { you: 0, lola: 0, bruno: 0 },
    committed: { you: 0, lola: 0, bruno: 0 },
    folded: { you: false, lola: false, bruno: false },
    acted: { you: false, lola: false, bruno: false },
    lastAction: {},
    pot: 0,
    stage: "preflop",
    currentBet: 0,
    raises: 0,
    winners: [],
    result: null,
    showdown: false,
    log: [`Mano ${prev.hand + 1} · reparte ${SEAT_SHORT[SEATS[button]]}`],
    stacks: { ...prev.stacks },
    toAct: null,
  };

  for (let i = 0; i < 2; i++) for (const seat of SEATS) s.hole[seat].push(s.deck.pop()!);

  post(s, sbSeat, Math.min(s.smallBlind, s.stacks[sbSeat]), "ciega chica");
  post(s, bbSeat, Math.min(s.bigBlind, s.stacks[bbSeat]), "ciega grande");
  s.currentBet = s.bigBlind;
  s.raises = 1; // la ciega grande ocupa la primera subida del tope
  s.toAct = SEATS[seatAfter(button, 3 % SEATS.length)]; // con tres asientos, actúa el botón
  return s;
}

function post(s: PokerState, seat: Seat, amount: number, label: string) {
  s.stacks[seat] -= amount;
  s.bets[seat] += amount;
  s.committed[seat] += amount;
  s.pot += amount;
  s.lastAction[seat] = label;
}

export function activeSeats(s: PokerState): Seat[] {
  return SEATS.filter((x) => !s.folded[x]);
}

export function toCall(s: PokerState, seat: Seat): number {
  return Math.min(Math.max(0, s.currentBet - s.bets[seat]), s.stacks[seat]);
}

export function legalActions(s: PokerState, seat: Seat): Action[] {
  if (s.toAct !== seat || s.stage === "espera" || s.stage === "showdown") return [];
  const need = toCall(s, seat);
  const out: Action[] = [];
  if (need > 0) {
    out.push({ kind: "retirarse", amount: 0 });
    out.push({ kind: "ver", amount: need });
  } else {
    out.push({ kind: "pasar", amount: 0 });
  }
  const size = betSize(s);
  const canRaise = s.raises < MAX_RAISES && s.stacks[seat] > need;
  if (canRaise) {
    const amount = Math.min(need + size, s.stacks[seat]);
    out.push({ kind: need > 0 ? "subir" : "apostar", amount });
  }
  return out;
}

/** Aplica la acción del asiento en turno y avanza la mano. */
export function act(
  prev: PokerState,
  seat: Seat,
  kind: ActionKind,
  rng: () => number = Math.random,
): PokerState {
  const s: PokerState = {
    ...prev,
    deck: [...prev.deck],
    board: [...prev.board],
    hole: { you: [...prev.hole.you], lola: [...prev.hole.lola], bruno: [...prev.hole.bruno] },
    stacks: { ...prev.stacks },
    bets: { ...prev.bets },
    committed: { ...prev.committed },
    folded: { ...prev.folded },
    acted: { ...prev.acted },
    lastAction: { ...prev.lastAction },
    log: [...prev.log],
    winners: [...prev.winners],
  };
  const legal = legalActions(s, seat);
  const chosen = legal.find((a) => a.kind === kind);
  if (!chosen) return prev;

  s.acted[seat] = true;
  if (chosen.kind === "retirarse") {
    s.folded[seat] = true;
    s.lastAction[seat] = "se retira";
    s.log.push(`${SEAT_SHORT[seat]} se retira`);
  } else if (chosen.kind === "pasar") {
    s.lastAction[seat] = "pasa";
    s.log.push(`${SEAT_SHORT[seat]} pasa`);
  } else if (chosen.kind === "ver") {
    post(s, seat, chosen.amount, `ve ${chosen.amount}`);
    s.log.push(`${SEAT_SHORT[seat]} ve ${chosen.amount}`);
  } else {
    post(
      s,
      seat,
      chosen.amount,
      `${chosen.kind === "subir" ? "sube" : "apuesta"} ${chosen.amount}`,
    );
    s.currentBet = s.bets[seat];
    s.raises += 1;
    for (const other of SEATS) if (other !== seat && !s.folded[other]) s.acted[other] = false;
    s.log.push(
      `${SEAT_SHORT[seat]} ${chosen.kind === "subir" ? "sube a" : "apuesta"} ${s.currentBet}`,
    );
  }

  return advance(s, rng);
}

function advance(s: PokerState, rng: () => number): PokerState {
  const alive = activeSeats(s);
  if (alive.length === 1) return settle(s, alive, false);

  const pending = alive.filter((x) => s.stacks[x] > 0 && (!s.acted[x] || s.bets[x] < s.currentBet));
  if (pending.length > 0) {
    s.toAct = nextToAct(s, pending);
    return s;
  }

  // Calle cerrada: se reparte cartón o se va al showdown.
  for (const seat of SEATS) {
    s.bets[seat] = 0;
    s.acted[seat] = false;
    if (!s.folded[seat]) s.lastAction[seat] = undefined;
  }
  s.currentBet = 0;
  s.raises = 0;

  if (s.stage === "preflop") {
    s.stage = "flop";
    s.deck.pop();
    s.board.push(s.deck.pop()!, s.deck.pop()!, s.deck.pop()!);
    s.log.push(`Flop: ${s.board.map(cardLabel).join(" ")}`);
  } else if (s.stage === "flop") {
    s.stage = "turn";
    s.deck.pop();
    s.board.push(s.deck.pop()!);
    s.log.push(`Turn: ${cardLabel(s.board[3])}`);
  } else if (s.stage === "turn") {
    s.stage = "river";
    s.deck.pop();
    s.board.push(s.deck.pop()!);
    s.log.push(`River: ${cardLabel(s.board[4])}`);
  } else {
    return settle(s, alive, true);
  }

  const canAct = alive.filter((x) => s.stacks[x] > 0);
  if (canAct.length <= 1) {
    // Nadie puede apostar más: se corren las calles hasta el final.
    while (s.board.length < 5) {
      s.deck.pop();
      s.board.push(s.deck.pop()!);
    }
    return settle(s, alive, true);
  }
  s.toAct = nextToAct(s, canAct, seatAfter(s.button, 1));
  return s;
}

function nextToAct(s: PokerState, pending: Seat[], fromIdx?: number): Seat {
  const start = fromIdx ?? seatAfter(SEATS.indexOf(s.toAct ?? SEATS[s.button]), 1);
  for (let i = 0; i < SEATS.length; i++) {
    const seat = SEATS[(start + i) % SEATS.length];
    if (pending.includes(seat)) return seat;
  }
  return pending[0];
}

function settle(s: PokerState, alive: Seat[], showdown: boolean): PokerState {
  s.stage = "showdown";
  s.toAct = null;
  s.showdown = showdown;

  if (!showdown || alive.length === 1) {
    const w = alive[0];
    s.stacks[w] += s.pot;
    s.winners = [w];
    s.result = `${SEAT_SHORT[w]} se lleva ${s.pot} sin mostrar cartas`;
    s.log.push(s.result);
    return s;
  }

  const scored = alive.map((seat) => ({ seat, value: evaluate([...s.hole[seat], ...s.board]) }));
  scored.sort((a, b) => compareValues(b.value, a.value));
  const top = scored.filter((x) => compareValues(x.value, scored[0].value) === 0);
  const share = Math.floor(s.pot / top.length);
  let rest = s.pot - share * top.length;
  for (const w of top) {
    s.stacks[w.seat] += share + (rest > 0 ? 1 : 0);
    if (rest > 0) rest -= 1;
  }
  s.winners = top.map((x) => x.seat);
  s.result =
    top.length === 1
      ? `${SEAT_SHORT[top[0].seat]} gana ${s.pot} con ${top[0].value.name}`
      : `Bote dividido (${top.map((x) => SEAT_SHORT[x.seat]).join(" y ")}) con ${top[0].value.name}`;
  s.log.push(s.result);
  return s;
}

/** Descripción de la jugada actual del jugador, para el panel de ayuda. */
export function describeHand(hole: Card[], board: Card[]): string | null {
  const cards = [...hole, ...board];
  if (cards.length < 5) return null;
  return evaluate(cards).name;
}
