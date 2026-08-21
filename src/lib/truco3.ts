import {
  type Card,
  type EnvidoLevel,
  type TrucoLevel,
  calcEnvido,
  cardLabel,
  newDeck,
  shuffle,
  trucoPower,
} from "@/lib/games/truco/truco";

export type Seat = "you" | "host" | "wanderer";
export const SEATS: Seat[] = ["you", "host", "wanderer"];
export type Side = "solo" | "team";

const NEXT: Record<Seat, Seat> = { you: "host", host: "wanderer", wanderer: "you" };

const TRUCO_NEXT: Record<TrucoLevel, TrucoLevel | null> = {
  truco: "retruco",
  retruco: "vale4",
  vale4: null,
};
const TRUCO_POINTS: Record<TrucoLevel, number> = { truco: 2, retruco: 3, vale4: 4 };

export interface Pending3 {
  kind: "envido" | "truco";
  level: EnvidoLevel | TrucoLevel;
  by: Seat;
  bySide: Side;
  chain?: EnvidoLevel[];
}

export interface Hand3 {
  solo: Seat;
  mano: Seat;
  turn: Seat;
  hands: Record<Seat, Card[]>;
  origHands: Record<Seat, Card[]>;
  discard: Card | null;
  table: Record<Seat, Card | null>[];
  trickWinners: (Side | "tie" | null)[];
  trick: number;
  trickLeader: Seat;
  trucoStake: number;
  trucoLevel: TrucoLevel | null;
  trucoLastBy: Side | null;
  envidoResolved: boolean;
  envidoAccepted: boolean;
  pending: Pending3 | null;
  stashedTruco: Pending3 | null;
  log: string[];
  handOver: boolean;
  handResult: Partial<Record<Seat, number>> | null;
  envidoReveal: {
    solo: number;
    team: number;
    teamOwner: Seat;
    winner: Side;
    points: number;
  } | null;
  pieCommittedNoEnvido: boolean;
  manoCommittedNoEnvido: boolean;
}

export interface Game3 {
  hand: Hand3;
  scores: Record<Seat, number>;
  pointGoal: number;
  winner: Seat | null;
  hostName: string;
  wandererName: string;
  hostPortrait: string;
  wandererPortrait: string;
  nextSolo: Seat;
  history: { solo: Seat; winner: Side | null; points: number }[];
}

export function sideOf(hand: Hand3, s: Seat): Side {
  return s === hand.solo ? "solo" : "team";
}
export function alliesOf(hand: Hand3): [Seat, Seat] {
  return SEATS.filter((s) => s !== hand.solo) as [Seat, Seat];
}

function nameOf(g: Game3, s: Seat): string {
  return s === "you" ? "vos" : s === "host" ? g.hostName : g.wandererName;
}

function log(h: Hand3, msg: string) {
  h.log = [...h.log, msg];
}

function deal3(
  rng: () => number,
  solo: Seat,
): {
  hands: Record<Seat, Card[]>;
  orig: Record<Seat, Card[]>;
  discardChoices: Card[];
} {
  const deck = shuffle(newDeck(), rng);
  const solo4 = deck.slice(0, 4);
  const allies = SEATS.filter((s) => s !== solo);
  const a1 = deck.slice(4, 7);
  const a2 = deck.slice(7, 10);
  const hands: Record<Seat, Card[]> = { you: [], host: [], wanderer: [] };
  const orig: Record<Seat, Card[]> = { you: [], host: [], wanderer: [] };
  hands[solo] = solo4;
  hands[allies[0]!] = a1;
  hands[allies[1]!] = a2;
  orig[solo] = [...solo4];
  orig[allies[0]!] = [...a1];
  orig[allies[1]!] = [...a2];
  return { hands, orig, discardChoices: solo4 };
}

export function startHand3(
  prev: Game3 | null,
  opts: {
    pointGoal: number;
    hostName: string;
    wandererName: string;
    hostPortrait: string;
    wandererPortrait: string;
    rng?: () => number;
  },
): Game3 {
  const rng = opts.rng ?? Math.random;
  const solo: Seat = prev ? prev.nextSolo : "you";
  const { hands, orig } = deal3(rng, solo);
  const hand: Hand3 = {
    solo,
    mano: solo,
    turn: solo,
    hands,
    origHands: orig,
    discard: null,
    table: [
      { you: null, host: null, wanderer: null },
      { you: null, host: null, wanderer: null },
      { you: null, host: null, wanderer: null },
    ],
    trickWinners: [],
    trick: 0,
    trickLeader: solo,
    trucoStake: 1,
    trucoLevel: null,
    trucoLastBy: null,
    envidoResolved: false,
    envidoAccepted: false,
    pending: null,
    stashedTruco: null,
    log: [
      `Reparte. Solo: ${solo === "you" ? "vos" : solo === "host" ? opts.hostName : opts.wandererName}. Debe descartar 1 de sus 4 cartas.`,
    ],
    handOver: false,
    handResult: null,
    envidoReveal: null,
    pieCommittedNoEnvido: false,
    manoCommittedNoEnvido: false,
  };
  return {
    hand,
    scores: prev?.scores ?? { you: 0, host: 0, wanderer: 0 },
    pointGoal: prev?.pointGoal ?? opts.pointGoal,
    winner: null,
    hostName: opts.hostName,
    wandererName: opts.wandererName,
    hostPortrait: opts.hostPortrait,
    wandererPortrait: opts.wandererPortrait,
    nextSolo: NEXT[solo],
    history: prev?.history ?? [],
  };
}

export function needsDiscard(g: Game3): boolean {
  return g.hand.discard === null && g.hand.hands[g.hand.solo].length === 4;
}
export function discardCard(g: Game3, who: Seat, cardId: string): Game3 {
  if (g.winner || g.hand.handOver) return g;
  if (!needsDiscard(g)) return g;
  if (who !== g.hand.solo) return g;
  const h: Hand3 = {
    ...g.hand,
    log: [...g.hand.log],
    hands: { ...g.hand.hands },
  };
  const soloHand = [...h.hands[who]];
  const idx = soloHand.findIndex((c) => c.id === cardId);
  if (idx === -1) return g;
  const card = soloHand.splice(idx, 1)[0]!;
  h.hands[who] = soloHand;
  h.discard = card;
  log(h, `${nameOf(g, who)} descarta boca abajo (Solo).`);
  return { ...g, hand: h };
}

export function canPlay(g: Game3, who: Seat): boolean {
  const h = g.hand;
  if (g.winner || h.handOver) return false;
  if (h.pending) return false;
  if (needsDiscard(g)) return false;
  return h.turn === who;
}

export function playCard3(g: Game3, who: Seat, cardId: string): Game3 {
  if (!canPlay(g, who)) return g;
  const h: Hand3 = {
    ...g.hand,
    log: [...g.hand.log],
    hands: { ...g.hand.hands },
    table: g.hand.table.map((t) => ({ ...t })),
    trickWinners: [...g.hand.trickWinners],
  };
  const arr = [...h.hands[who]];
  const idx = arr.findIndex((c) => c.id === cardId);
  if (idx === -1) return g;
  const card = arr.splice(idx, 1)[0]!;
  h.hands[who] = arr;
  h.table[h.trick]![who] = card;
  log(h, `${nameOf(g, who)} juega ${cardLabel(card)}.`);

  if (h.trick === 0 && !h.envidoResolved && !h.pending) {
    if (who === h.mano) h.manoCommittedNoEnvido = true;
    else h.pieCommittedNoEnvido = true;
  }

  const slot = h.table[h.trick]!;
  const played = SEATS.filter((s) => slot[s] !== null);
  if (played.length === 3) {
    let bestSeat: Seat = played[0]!;
    let bestPower = trucoPower(slot[bestSeat]!);
    for (const s of played.slice(1)) {
      const pw = trucoPower(slot[s]!);
      if (pw > bestPower) {
        bestPower = pw;
        bestSeat = s;
      }
    }

    const topSeats = played.filter((s) => trucoPower(slot[s]!) === bestPower);
    let winner: Side | "tie";
    if (topSeats.length === 1) {
      winner = sideOf(h, bestSeat);
    } else {
      const soloInTop = topSeats.includes(h.solo);
      const teamInTop = topSeats.some((s) => s !== h.solo);
      if (soloInTop && teamInTop) winner = "tie";
      else if (teamInTop) winner = "team";
      else winner = "solo";
    }
    h.trickWinners[h.trick] = winner;
    log(
      h,
      winner === "tie"
        ? "Baza parda."
        : `Baza para ${winner === "solo" ? "el Solo" : "el equipo"}.`,
    );

    const result = checkHand3Winner(h);
    if (result) {
      h.handOver = true;
      const stake = h.trucoStake;
      if (result === "solo") {
        const bonus = stake * 2;
        h.handResult = { [h.solo]: bonus } as Partial<Record<Seat, number>>;
        log(h, `Mano para el Solo (${nameOf(g, h.solo)}) +${bonus}.`);
      } else {
        const [a, b] = alliesOf(h);
        h.handResult = { [a]: stake, [b]: stake } as Partial<Record<Seat, number>>;
        log(h, `Mano para el equipo (${nameOf(g, a)} y ${nameOf(g, b)}) +${stake} c/u.`);
      }
    } else {
      h.trick += 1;

      // En baza parda el pie de la baza no cambia: sigue liderando quien ya lideraba.
      if (winner !== "tie") h.trickLeader = bestSeat;
      h.turn = h.trickLeader;
    }
  } else {
    let cursor: Seat = NEXT[who];
    while (slot[cursor] !== null) cursor = NEXT[cursor];
    h.turn = cursor;
  }
  return commit3(g, h);
}

function commit3(g: Game3, h: Hand3, wentToMazo: Seat | null = null): Game3 {
  let scores = g.scores;
  let winner = g.winner;
  let nextSolo = g.nextSolo;
  let history = g.history;
  if (h.handOver && h.handResult) {
    scores = { ...g.scores };
    for (const s of SEATS) {
      scores[s] += h.handResult[s] ?? 0;
    }
    for (const s of SEATS) {
      if (scores[s] >= g.pointGoal) {
        winner = s;
        break;
      }
    }
    nextSolo = NEXT[h.solo];

    const totalSolo = h.handResult[h.solo] ?? 0;
    const [a, b] = alliesOf(h);
    const totalTeam = (h.handResult[a] ?? 0) + (h.handResult[b] ?? 0);
    const side: Side | null =
      totalSolo > 0 && totalTeam === 0 ? "solo" : totalTeam > 0 && totalSolo === 0 ? "team" : null;
    const points = Math.max(totalSolo, totalTeam);
    history = [...g.history, { solo: h.solo, winner: side, points }].slice(-20);
  }
  return { ...g, hand: h, scores, winner, nextSolo, history };
}

function checkHand3Winner(h: Hand3): Side | null {
  const w = h.trickWinners;
  const first = w[0];
  const second = w[1];
  const third = w[2];

  if (!first) return null;

  if (first === "tie") {
    if (second === "solo" || second === "team") return second;
    if (second === "tie") {
      if (third === "solo" || third === "team") return third;
      if (third === "tie") return "solo";
    }
    return null;
  }
  if (first === "solo" || first === "team") {
    if (second === first || second === "tie") return first;
    if (second && third) {
      if (third === "tie") return first;
      return third;
    }
  }
  return null;
}

export function canCantarTruco3(g: Game3, who: Seat): boolean {
  const h = g.hand;
  if (g.winner || h.handOver || h.pending) return false;
  if (needsDiscard(g)) return false;

  if (h.turn !== who) return false;
  if (!h.trucoLevel) return true;

  if (h.trucoLastBy !== sideOf(h, who)) return false;
  return TRUCO_NEXT[h.trucoLevel] !== null;
}

export function cantarTruco3(g: Game3, who: Seat): Game3 {
  if (!canCantarTruco3(g, who)) return g;
  const h: Hand3 = { ...g.hand, log: [...g.hand.log] };
  const next: TrucoLevel = h.trucoLevel ? TRUCO_NEXT[h.trucoLevel]! : "truco";
  h.pending = { kind: "truco", level: next, by: who, bySide: sideOf(h, who) };
  log(h, `${nameOf(g, who)} canta ${next.toUpperCase()}.`);
  return { ...g, hand: h };
}

export function trucoResponder(g: Game3): { side: Side; seats: Seat[] } | null {
  const p = g.hand.pending;
  if (!p || p.kind !== "truco") return null;
  const side: Side = p.bySide === "solo" ? "team" : "solo";
  const seats = SEATS.filter((s) => sideOf(g.hand, s) === side);
  return { side, seats };
}

export function responderTruco3(g: Game3, who: Seat, accept: boolean): Game3 {
  const h: Hand3 = { ...g.hand, log: [...g.hand.log] };
  if (g.winner || h.handOver) return g;
  const p = h.pending;
  if (!p || p.kind !== "truco") return g;
  if (sideOf(h, who) === p.bySide) return g;
  if (needsDiscard(g)) return g;
  if (accept) {
    h.trucoLevel = p.level as TrucoLevel;
    h.trucoStake = TRUCO_POINTS[h.trucoLevel];
    h.trucoLastBy = sideOf(h, who);
    h.pending = null;
    log(h, `${nameOf(g, who)}: ¡Quiero!`);
    return { ...g, hand: h };
  }

  const prev = h.trucoLevel ? TRUCO_POINTS[h.trucoLevel] : 1;
  h.handOver = true;
  h.pending = null;
  if (p.bySide === "solo") {
    h.handResult = { [h.solo]: prev * 2 } as Partial<Record<Seat, number>>;
    log(h, `${nameOf(g, who)}: No quiero. +${prev * 2} para el Solo.`);
  } else {
    const [a, b] = alliesOf(h);
    h.handResult = { [a]: prev, [b]: prev } as Partial<Record<Seat, number>>;
    log(h, `${nameOf(g, who)}: No quiero. +${prev} para cada aliado.`);
  }
  return commit3(g, h);
}

const ENVIDO_NEXT_OK: Record<EnvidoLevel, EnvidoLevel[]> = {
  envido: ["envido", "real", "falta"],
  real: ["falta"],
  falta: [],
};

export function canCantarEnvido3(g: Game3, who: Seat): boolean {
  const h = g.hand;
  if (g.winner || h.handOver) return false;
  if (h.envidoResolved) return false;
  if (h.trick !== 0) return false;
  if (needsDiscard(g)) return false;
  if (h.trucoLevel) return false;
  if (h.manoCommittedNoEnvido) return false;
  if (h.pieCommittedNoEnvido && who !== h.mano) return false;

  if (h.pending?.kind === "envido") {
    if (sideOf(h, who) === h.pending.bySide) return false;
    // Sólo si queda alguna escalación legal (falta envido ya no admite nada).
    return (["envido", "real", "falta"] as EnvidoLevel[]).some((lv) =>
      canCantarEnvidoLevel3(g, who, lv),
    );
  }

  if (h.pending?.kind === "truco") return sideOf(h, who) !== h.pending.bySide;
  if (h.pending) return false;

  if (h.turn !== who) return false;
  return true;
}

/** ¿Es legal este nivel puntual? Evita botones muertos en la mesa. */
export function canCantarEnvidoLevel3(g: Game3, who: Seat, level: EnvidoLevel): boolean {
  const h = g.hand;
  const p = h.pending;
  if (p?.kind === "envido") {
    if (g.winner || h.handOver || h.envidoResolved) return false;
    if (h.trick !== 0 || needsDiscard(g) || h.trucoLevel) return false;
    if (sideOf(h, who) === p.bySide) return false;
    const chain = p.chain ?? [p.level as EnvidoLevel];
    if (!ENVIDO_NEXT_OK[p.level as EnvidoLevel].includes(level)) return false;
    if (level === "envido" && chain.filter((x) => x === "envido").length >= 2) return false;
    return true;
  }
  return canCantarEnvido3(g, who);
}

export function cantarEnvido3(g: Game3, who: Seat, level: EnvidoLevel): Game3 {
  if (!canCantarEnvido3(g, who)) return g;
  const h: Hand3 = { ...g.hand, log: [...g.hand.log] };

  if (h.pending?.kind === "truco") {
    h.stashedTruco = h.pending;
    h.pending = { kind: "envido", level, by: who, bySide: sideOf(h, who), chain: [level] };
    log(h, `${nameOf(g, who)}: «el envido está primero» · ${level.toUpperCase()}.`);
    return { ...g, hand: h };
  }
  if (h.pending?.kind === "envido") {
    if (sideOf(h, who) === h.pending.bySide) return g;
    const prev = h.pending.chain ?? [h.pending.level as EnvidoLevel];
    if (!ENVIDO_NEXT_OK[h.pending.level as EnvidoLevel].includes(level)) return g;
    if (level === "envido" && prev.filter((x) => x === "envido").length >= 2) return g;
    h.pending = { kind: "envido", level, by: who, bySide: sideOf(h, who), chain: [...prev, level] };
  } else {
    h.pending = { kind: "envido", level, by: who, bySide: sideOf(h, who), chain: [level] };
  }
  log(h, `${nameOf(g, who)} canta ${level.toUpperCase()}.`);
  return { ...g, hand: h };
}

function envidoQuieroPoints(chain: EnvidoLevel[]): number {
  let p = 0;
  for (const lv of chain) {
    if (lv === "envido") p += 2;
    else if (lv === "real") p += 3;
    else if (lv === "falta") p = -1;
  }
  return p;
}

export function responderEnvido3(g: Game3, who: Seat, accept: boolean): Game3 {
  const h: Hand3 = { ...g.hand, log: [...g.hand.log] };
  if (g.winner || h.handOver) return g;
  const p = h.pending;
  if (!p || p.kind !== "envido") return g;
  if (sideOf(h, who) === p.bySide) return g;
  if (!accept) {
    const chain = p.chain ?? [p.level as EnvidoLevel];
    let pts: number;
    if (chain.length <= 1) pts = 1;
    else {
      const prev = envidoQuieroPoints(chain.slice(0, -1));
      pts = prev === -1 ? 1 : Math.max(1, prev);
    }
    h.envidoResolved = true;
    h.pending = null;
    if (h.stashedTruco) {
      h.pending = h.stashedTruco;
      h.stashedTruco = null;
      log(h, `Vuelve el truco pendiente: ${(h.pending.level as string).toUpperCase()}.`);
    }
    log(
      h,
      `${nameOf(g, who)}: No quiero envido. +${pts} para ${p.bySide === "solo" ? "el Solo" : "el equipo"}.`,
    );
    return applyEnvidoPoints(g, h, p.bySide, pts, null);
  }

  const chain = p.chain ?? [p.level as EnvidoLevel];
  const hasFalta = chain.includes("falta");
  const soloE = calcEnvido(h.origHands[h.solo]);
  const [a, b] = alliesOf(h);
  const aE = calcEnvido(h.origHands[a]);
  const bE = calcEnvido(h.origHands[b]);
  const teamBest = Math.max(aE, bE);
  const teamOwner: Seat = aE >= bE ? a : b;

  const winner: Side = soloE > teamBest ? "solo" : teamBest > soloE ? "team" : "solo";
  let finalPts: number;
  if (hasFalta) {
    const leaderScore = Math.max(g.scores.you, g.scores.host, g.scores.wanderer);
    finalPts = Math.max(1, g.pointGoal - leaderScore);
  } else {
    finalPts = Math.max(1, envidoQuieroPoints(chain));
  }
  h.envidoResolved = true;
  h.envidoAccepted = true;
  h.envidoReveal = {
    solo: soloE,
    team: teamBest,
    teamOwner,
    winner,
    points: finalPts,
  };
  h.pending = null;
  if (h.stashedTruco) {
    h.pending = h.stashedTruco;
    h.stashedTruco = null;
    log(h, `Vuelve el truco pendiente: ${(h.pending.level as string).toUpperCase()}.`);
  }
  log(
    h,
    `Envido: Solo ${soloE} · Equipo ${teamBest} (${nameOf(g, teamOwner)}). Gana ${winner === "solo" ? "el Solo" : "el equipo"} +${finalPts}.`,
  );
  return applyEnvidoPoints(g, h, winner, finalPts, teamOwner);
}

function applyEnvidoPoints(
  g: Game3,
  h: Hand3,
  winnerSide: Side,
  pts: number,
  teamOwner: Seat | null,
): Game3 {
  const scores = { ...g.scores };
  if (winnerSide === "solo") {
    scores[h.solo] += pts;
  } else {
    const owner = teamOwner ?? alliesOf(h)[0];
    scores[owner] += pts;
  }
  let winner: Seat | null = g.winner;
  for (const s of SEATS)
    if (scores[s] >= g.pointGoal) {
      winner = s;
      break;
    }
  return { ...g, hand: h, scores, winner };
}

export function canIrseAlMazo3(g: Game3, who: Seat): boolean {
  const h = g.hand;
  if (g.winner || h.handOver) return false;
  if (needsDiscard(g)) return false;
  if (h.pending && sideOf(h, who) === h.pending.bySide) return false;
  return true;
}

export function irseAlMazo3(g: Game3, who: Seat): Game3 {
  if (!canIrseAlMazo3(g, who)) return g;
  const h: Hand3 = { ...g.hand, log: [...g.hand.log] };
  const scores = { ...g.scores };
  const mySide = sideOf(h, who);
  const oppSide: Side = mySide === "solo" ? "team" : "solo";

  if (h.pending && h.pending.bySide !== mySide) {
    const p = h.pending;
    if (p.kind === "envido") {
      const chain = p.chain ?? [p.level as EnvidoLevel];
      let pts: number;
      if (chain.length <= 1) pts = 1;
      else {
        const prev = envidoQuieroPoints(chain.slice(0, -1));
        pts = prev === -1 ? 1 : Math.max(1, prev);
      }
      if (p.bySide === "solo") scores[h.solo] += pts;
      else scores[alliesOf(h)[0]] += pts;
      log(
        h,
        `${nameOf(g, who)} no quiere el envido. +${pts} para ${p.bySide === "solo" ? "el Solo" : "el equipo"}.`,
      );
      h.envidoResolved = true;
    }
    h.pending = null;
    h.stashedTruco = null;
  }

  const stake = Math.max(1, h.trucoStake);
  if (oppSide === "solo") {
    scores[h.solo] += stake * 2;
    log(h, `${nameOf(g, who)} se va al mazo. +${stake * 2} para el Solo.`);
  } else {
    const [a, b] = alliesOf(h);
    scores[a] += stake;
    scores[b] += stake;
    log(h, `${nameOf(g, who)} se va al mazo. +${stake} para cada aliado.`);
  }
  h.handOver = true;
  h.handResult = {};
  for (const s of SEATS) {
    const delta = scores[s] - g.scores[s];
    if (delta) h.handResult[s] = delta;
  }
  let winner: Seat | null = null;
  for (const s of SEATS)
    if (scores[s] >= g.pointGoal) {
      winner = s;
      break;
    }
  return {
    ...g,
    hand: h,
    scores,
    winner,
    nextSolo: NEXT[h.solo],
    history: [...g.history, { solo: h.solo, winner: oppSide, points: stake }].slice(-20),
  };
}

export interface Ai3Decision {
  kind: "playCard" | "respond" | "canto" | "discard" | "wait" | "mazo";
  cardId?: string;
  accept?: boolean;
  canto?: { type: "envido" | "real" | "falta" | "truco" | "retruco" | "vale4" };
  thinkMs: number;
}

function handStrength(hand: Card[]): number {
  if (hand.length === 0) return 0;
  return hand.reduce((s, c) => s + trucoPower(c), 0) / (hand.length * 14);
}

export function ai3Decide(g: Game3, seat: Seat, rng: () => number = Math.random): Ai3Decision {
  const h = g.hand;
  const my = h.hands[seat];
  const isSolo = seat === h.solo;

  if (isSolo && needsDiscard(g)) {
    const sorted = [...my].sort((a, b) => trucoPower(a) - trucoPower(b));
    return { kind: "discard", cardId: sorted[0]!.id, thinkMs: 700 };
  }

  if (h.pending && h.pending.bySide !== sideOf(h, seat)) {
    if (h.pending.kind === "envido") {
      const e = calcEnvido(h.origHands[seat]);
      const accept = e >= 27 || (e >= 24 && rng() < 0.55);
      return { kind: "respond", accept, thinkMs: 700 };
    }
    if (h.pending.kind === "truco") {
      // «El envido está primero»: con buen tanto conviene cantarlo antes de
      // responder al truco, igual que puede hacerlo el jugador.
      if (h.trick === 0 && !h.envidoResolved && canCantarEnvido3(g, seat)) {
        const e = calcEnvido(h.origHands[seat]);
        if (e >= 27 && rng() < 0.6) {
          return { kind: "canto", canto: { type: "envido" }, thinkMs: 800 };
        }
      }
      const s = handStrength(my);

      const accept = s > 0.5 || (s > 0.38 && rng() < 0.6);
      return { kind: "respond", accept, thinkMs: 700 };
    }
  }

  if (h.turn === seat && !h.pending) {
    if (canCantarEnvido3(g, seat) && h.trick === 0) {
      const e = calcEnvido(h.origHands[seat]);
      if (e >= 29 && rng() < 0.6) return { kind: "canto", canto: { type: "envido" }, thinkMs: 800 };
    }
    if (canCantarTruco3(g, seat)) {
      const s = handStrength(my);
      if (s > 0.7 && rng() < 0.5) return { kind: "canto", canto: { type: "truco" }, thinkMs: 800 };
    }

    const sorted = [...my].sort((a, b) => trucoPower(b) - trucoPower(a));
    const card = sorted[0]!;
    return { kind: "playCard", cardId: card.id, thinkMs: 800 };
  }
  return { kind: "wait", thinkMs: 400 };
}

export function seatLabel(g: Game3, s: Seat): string {
  if (s === "you") return "Vos";
  if (s === "host") return g.hostName;
  return g.wandererName;
}
