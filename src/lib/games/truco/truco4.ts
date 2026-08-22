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

/** Truco 2 vs 2 (parejas). Vos + tu socio contra dos rivales. */
export type Seat4 = "you" | "socio" | "rivalA" | "rivalB";
export const SEATS4: Seat4[] = ["you", "rivalA", "socio", "rivalB"];
export type Team = "nos" | "ellos";

/** Orden de juego cruzado: siempre alterna equipo. */
const NEXT4: Record<Seat4, Seat4> = {
  you: "rivalA",
  rivalA: "socio",
  socio: "rivalB",
  rivalB: "you",
};

export const TEAM_OF: Record<Seat4, Team> = {
  you: "nos",
  socio: "nos",
  rivalA: "ellos",
  rivalB: "ellos",
};

const TRUCO_NEXT: Record<TrucoLevel, TrucoLevel | null> = {
  truco: "retruco",
  retruco: "vale4",
  vale4: null,
};
const TRUCO_POINTS: Record<TrucoLevel, number> = { truco: 2, retruco: 3, vale4: 4 };

/** Señas clásicas de truco en parejas. */
export type SenaId = "ancho-espada" | "ancho-basto" | "siete-espada" | "siete-oro" | "buen-envido" | "soy-malo";

export interface SenaDef {
  id: SenaId;
  label: string;
  gesto: string;
  hint: string;
}

export const SENAS: SenaDef[] = [
  { id: "ancho-espada", label: "Ancho de espada", gesto: "Torcer la boca a la izquierda", hint: "Tengo la carta más brava." },
  { id: "ancho-basto", label: "Ancho de basto", gesto: "Torcer la boca a la derecha", hint: "Tengo la segunda más brava." },
  { id: "siete-espada", label: "Siete de espada", gesto: "Levantar el hombro derecho", hint: "Carta de peso." },
  { id: "siete-oro", label: "Siete de oro", gesto: "Levantar el hombro izquierdo", hint: "Carta de peso." },
  { id: "buen-envido", label: "Buen envido", gesto: "Guiñar un ojo", hint: "Tengo 29 o más de tanto." },
  { id: "soy-malo", label: "Soy malo", gesto: "Mirar el techo", hint: "No tengo nada, jugá vos." },
];

export interface SenaEvent {
  id: SenaId;
  by: Seat4;
  /** El equipo rival la cazó y sabe lo que dijiste. */
  cazada: boolean;
  /** Mentira: el jugador señó algo que no tiene. */
  falsa: boolean;
}

export interface Pending4 {
  kind: "envido" | "truco";
  level: EnvidoLevel | TrucoLevel;
  by: Seat4;
  byTeam: Team;
  chain?: EnvidoLevel[];
}

export interface Hand4 {
  mano: Seat4;
  turn: Seat4;
  hands: Record<Seat4, Card[]>;
  origHands: Record<Seat4, Card[]>;
  table: Record<Seat4, Card | null>[];
  trickWinners: (Team | "tie" | null)[];
  trick: number;
  trickLeader: Seat4;
  trucoStake: number;
  trucoLevel: TrucoLevel | null;
  trucoLastBy: Team | null;
  envidoResolved: boolean;
  pending: Pending4 | null;
  stashedTruco: Pending4 | null;
  log: string[];
  handOver: boolean;
  handResult: { team: Team; points: number } | null;
  envidoReveal: { nos: number; ellos: number; nosOwner: Seat4; ellosOwner: Seat4; winner: Team; points: number } | null;
  senas: SenaEvent[];
  manoCommittedNoEnvido: boolean;
}

export interface Game4 {
  hand: Hand4;
  scores: Record<Team, number>;
  pointGoal: number;
  winner: Team | null;
  names: Record<Seat4, string>;
  nextMano: Seat4;
  history: { mano: Seat4; winner: Team; points: number }[];
}

export function teamOf(s: Seat4): Team {
  return TEAM_OF[s];
}
export function partnerOf(s: Seat4): Seat4 {
  return s === "you" ? "socio" : s === "socio" ? "you" : s === "rivalA" ? "rivalB" : "rivalA";
}
export function seatsOfTeam(t: Team): Seat4[] {
  return SEATS4.filter((s) => TEAM_OF[s] === t);
}
export function other(t: Team): Team {
  return t === "nos" ? "ellos" : "nos";
}

function nameOf(g: Game4, s: Seat4): string {
  return g.names[s];
}
function log(h: Hand4, msg: string) {
  h.log = [...h.log, msg];
}

export function startHand4(
  prev: Game4 | null,
  opts: { pointGoal: number; names: Record<Seat4, string>; rng?: () => number },
): Game4 {
  const rng = opts.rng ?? Math.random;
  const mano: Seat4 = prev ? prev.nextMano : "you";
  const deck = shuffle(newDeck(), rng);
  const hands = {} as Record<Seat4, Card[]>;
  const orig = {} as Record<Seat4, Card[]>;
  // Reparte en orden desde el pie hacia la mano, como en la mesa.
  SEATS4.forEach((s, i) => {
    const cards = deck.slice(i * 3, i * 3 + 3);
    hands[s] = cards;
    orig[s] = [...cards];
  });
  const hand: Hand4 = {
    mano,
    turn: mano,
    hands,
    origHands: orig,
    table: [
      { you: null, socio: null, rivalA: null, rivalB: null },
      { you: null, socio: null, rivalA: null, rivalB: null },
      { you: null, socio: null, rivalA: null, rivalB: null },
    ],
    trickWinners: [],
    trick: 0,
    trickLeader: mano,
    trucoStake: 1,
    trucoLevel: null,
    trucoLastBy: null,
    envidoResolved: false,
    pending: null,
    stashedTruco: null,
    log: [`Reparte. Es mano ${opts.names[mano]}.`],
    handOver: false,
    handResult: null,
    envidoReveal: null,
    senas: [],
    manoCommittedNoEnvido: false,
  };
  return {
    hand,
    scores: prev?.scores ?? { nos: 0, ellos: 0 },
    pointGoal: prev?.pointGoal ?? opts.pointGoal,
    winner: null,
    names: opts.names,
    nextMano: NEXT4[mano],
    history: prev?.history ?? [],
  };
}

export function canPlay4(g: Game4, who: Seat4): boolean {
  const h = g.hand;
  if (g.winner || h.handOver || h.pending) return false;
  return h.turn === who;
}

function commit4(g: Game4, h: Hand4): Game4 {
  let scores = g.scores;
  let winner = g.winner;
  let nextMano = g.nextMano;
  let history = g.history;
  if (h.handOver && h.handResult) {
    scores = { ...g.scores };
    scores[h.handResult.team] += h.handResult.points;
    if (scores.nos >= g.pointGoal) winner = "nos";
    else if (scores.ellos >= g.pointGoal) winner = "ellos";
    nextMano = NEXT4[h.mano];
    history = [...g.history, { mano: h.mano, winner: h.handResult.team, points: h.handResult.points }].slice(-20);
  }
  return { ...g, hand: h, scores, winner, nextMano, history };
}

function finishHand(g: Game4, h: Hand4, team: Team, points: number, why: string): Game4 {
  h.handOver = true;
  h.pending = null;
  h.handResult = { team, points };
  log(h, `${why} +${points} para ${team === "nos" ? "nosotros" : "ellos"}.`);
  return commit4(g, h);
}

function checkHand4Winner(h: Hand4): Team | null {
  const [a, b, c] = h.trickWinners;
  const manoTeam = TEAM_OF[h.mano];
  if (!a) return null;
  if (a === "tie") {
    if (b === "nos" || b === "ellos") return b;
    if (b === "tie") {
      if (c === "nos" || c === "ellos") return c;
      if (c === "tie") return manoTeam;
    }
    return null;
  }
  if (b === a) return a;
  if (b === "tie") return a;
  if (b && c) {
    if (c === "tie") return a;
    return c;
  }
  return null;
}

export function playCard4(g: Game4, who: Seat4, cardId: string): Game4 {
  if (!canPlay4(g, who)) return g;
  const h: Hand4 = {
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

  if (h.trick === 0 && !h.envidoResolved && who === h.mano) h.manoCommittedNoEnvido = true;

  const slot = h.table[h.trick]!;
  const played = SEATS4.filter((s) => slot[s] !== null);
  if (played.length === 4) {
    let bestPower = -1;
    for (const s of played) bestPower = Math.max(bestPower, trucoPower(slot[s]!));
    const top = played.filter((s) => trucoPower(slot[s]!) === bestPower);
    const teams = new Set(top.map((s) => TEAM_OF[s]));
    const winner: Team | "tie" = teams.size === 2 ? "tie" : (top[0] ? TEAM_OF[top[0]] : "tie");
    h.trickWinners[h.trick] = winner;
    log(h, winner === "tie" ? "Baza parda." : `Baza para ${winner === "nos" ? "nosotros" : "ellos"}.`);

    const res = checkHand4Winner(h);
    if (res) return finishHand(g, h, res, h.trucoStake, "Se acabó la mano.");
    h.trick += 1;
    if (winner !== "tie") {
      // Lidera el que puso la carta más alta del equipo ganador.
      const leader = top.find((s) => TEAM_OF[s] === winner)!;
      h.trickLeader = leader;
    }
    h.turn = h.trickLeader;
  } else {
    let cursor: Seat4 = NEXT4[who];
    while (slot[cursor] !== null) cursor = NEXT4[cursor];
    h.turn = cursor;
  }
  return commit4(g, h);
}

/* ---------------- Truco ---------------- */

export function canCantarTruco4(g: Game4, who: Seat4): boolean {
  const h = g.hand;
  if (g.winner || h.handOver || h.pending) return false;
  if (h.turn !== who) return false;
  if (!h.trucoLevel) return true;
  if (h.trucoLastBy !== TEAM_OF[who]) return false;
  return TRUCO_NEXT[h.trucoLevel] !== null;
}

export function cantarTruco4(g: Game4, who: Seat4): Game4 {
  if (!canCantarTruco4(g, who)) return g;
  const h: Hand4 = { ...g.hand, log: [...g.hand.log] };
  const next: TrucoLevel = h.trucoLevel ? TRUCO_NEXT[h.trucoLevel]! : "truco";
  h.pending = { kind: "truco", level: next, by: who, byTeam: TEAM_OF[who] };
  log(h, `${nameOf(g, who)} canta ${next.toUpperCase()}.`);
  return { ...g, hand: h };
}

export function responderTruco4(g: Game4, who: Seat4, accept: boolean): Game4 {
  const h: Hand4 = { ...g.hand, log: [...g.hand.log] };
  if (g.winner || h.handOver) return g;
  const p = h.pending;
  if (!p || p.kind !== "truco" || TEAM_OF[who] === p.byTeam) return g;
  if (accept) {
    h.trucoLevel = p.level as TrucoLevel;
    h.trucoStake = TRUCO_POINTS[h.trucoLevel];
    h.trucoLastBy = TEAM_OF[who];
    h.pending = null;
    log(h, `${nameOf(g, who)}: ¡Quiero!`);
    return { ...g, hand: h };
  }
  const prev = h.trucoLevel ? TRUCO_POINTS[h.trucoLevel] : 1;
  return finishHand(g, h, p.byTeam, prev, `${nameOf(g, who)}: No quiero.`);
}

/* ---------------- Envido ---------------- */

const ENVIDO_NEXT_OK: Record<EnvidoLevel, EnvidoLevel[]> = {
  envido: ["envido", "real", "falta"],
  real: ["falta"],
  falta: [],
};

export function canCantarEnvido4(g: Game4, who: Seat4): boolean {
  const h = g.hand;
  if (g.winner || h.handOver || h.envidoResolved) return false;
  if (h.trick !== 0 || h.trucoLevel) return false;
  if (h.manoCommittedNoEnvido) return false;
  if (h.pending?.kind === "envido") return TEAM_OF[who] !== h.pending.byTeam;
  if (h.pending?.kind === "truco") return TEAM_OF[who] !== h.pending.byTeam;
  if (h.pending) return false;
  return h.turn === who;
}

export function canCantarEnvidoLevel4(g: Game4, who: Seat4, level: EnvidoLevel): boolean {
  const h = g.hand;
  const p = h.pending;
  if (!canCantarEnvido4(g, who)) return false;
  if (p?.kind === "envido") {
    const chain = p.chain ?? [p.level as EnvidoLevel];
    if (!ENVIDO_NEXT_OK[p.level as EnvidoLevel].includes(level)) return false;
    if (level === "envido" && chain.filter((x) => x === "envido").length >= 2) return false;
  }
  return true;
}

export function cantarEnvido4(g: Game4, who: Seat4, level: EnvidoLevel): Game4 {
  if (!canCantarEnvidoLevel4(g, who, level)) return g;
  const h: Hand4 = { ...g.hand, log: [...g.hand.log] };
  if (h.pending?.kind === "truco") {
    h.stashedTruco = h.pending;
    h.pending = { kind: "envido", level, by: who, byTeam: TEAM_OF[who], chain: [level] };
    log(h, `${nameOf(g, who)}: «el envido está primero» · ${level.toUpperCase()}.`);
    return { ...g, hand: h };
  }
  const prev = h.pending?.kind === "envido" ? (h.pending.chain ?? [h.pending.level as EnvidoLevel]) : [];
  h.pending = { kind: "envido", level, by: who, byTeam: TEAM_OF[who], chain: [...prev, level] };
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

function bestEnvido(h: Hand4, team: Team): { value: number; owner: Seat4 } {
  const seats = seatsOfTeam(team);
  const a = { value: calcEnvido(h.origHands[seats[0]!]), owner: seats[0]! };
  const b = { value: calcEnvido(h.origHands[seats[1]!]), owner: seats[1]! };
  return a.value >= b.value ? a : b;
}

function applyPoints(g: Game4, h: Hand4, team: Team, pts: number): Game4 {
  const scores = { ...g.scores };
  scores[team] += pts;
  let winner: Team | null = g.winner;
  if (scores.nos >= g.pointGoal) winner = "nos";
  else if (scores.ellos >= g.pointGoal) winner = "ellos";
  return { ...g, hand: h, scores, winner };
}

export function responderEnvido4(g: Game4, who: Seat4, accept: boolean): Game4 {
  const h: Hand4 = { ...g.hand, log: [...g.hand.log] };
  if (g.winner || h.handOver) return g;
  const p = h.pending;
  if (!p || p.kind !== "envido" || TEAM_OF[who] === p.byTeam) return g;
  const chain = p.chain ?? [p.level as EnvidoLevel];

  const restoreTruco = () => {
    if (h.stashedTruco) {
      h.pending = h.stashedTruco;
      h.stashedTruco = null;
      log(h, `Vuelve el truco pendiente: ${(h.pending.level as string).toUpperCase()}.`);
    }
  };

  if (!accept) {
    let pts: number;
    if (chain.length <= 1) pts = 1;
    else {
      const prev = envidoQuieroPoints(chain.slice(0, -1));
      pts = prev === -1 ? 1 : Math.max(1, prev);
    }
    h.envidoResolved = true;
    h.pending = null;
    restoreTruco();
    log(h, `${nameOf(g, who)}: No quiero el envido. +${pts} para ${p.byTeam === "nos" ? "nosotros" : "ellos"}.`);
    return applyPoints(g, h, p.byTeam, pts);
  }

  const nos = bestEnvido(h, "nos");
  const ellos = bestEnvido(h, "ellos");
  const manoTeam = TEAM_OF[h.mano];
  const winner: Team =
    nos.value > ellos.value ? "nos" : ellos.value > nos.value ? "ellos" : manoTeam;
  const pts = chain.includes("falta")
    ? Math.max(1, g.pointGoal - Math.max(g.scores.nos, g.scores.ellos))
    : Math.max(1, envidoQuieroPoints(chain));
  h.envidoResolved = true;
  h.envidoReveal = {
    nos: nos.value,
    ellos: ellos.value,
    nosOwner: nos.owner,
    ellosOwner: ellos.owner,
    winner,
    points: pts,
  };
  h.pending = null;
  restoreTruco();
  log(
    h,
    `Envido: nosotros ${nos.value} · ellos ${ellos.value}. Gana ${winner === "nos" ? "nuestro" : "su"} lado +${pts}.`,
  );
  return applyPoints(g, h, winner, pts);
}

export function canIrseAlMazo4(g: Game4, who: Seat4): boolean {
  const h = g.hand;
  if (g.winner || h.handOver) return false;
  if (h.pending && TEAM_OF[who] === h.pending.byTeam) return false;
  return true;
}

export function irseAlMazo4(g: Game4, who: Seat4): Game4 {
  if (!canIrseAlMazo4(g, who)) return g;
  let base: Game4 = g;
  const h: Hand4 = { ...g.hand, log: [...g.hand.log] };
  const p = h.pending;
  if (p && p.byTeam !== TEAM_OF[who] && p.kind === "envido") {
    const chain = p.chain ?? [p.level as EnvidoLevel];
    const prev = chain.length <= 1 ? 1 : Math.max(1, envidoQuieroPoints(chain.slice(0, -1)));
    h.envidoResolved = true;
    h.pending = null;
    base = applyPoints(g, h, p.byTeam, prev === -1 ? 1 : prev);
    log(h, `${nameOf(g, who)} no quiere el envido. +${prev} para ${p.byTeam === "nos" ? "nosotros" : "ellos"}.`);
  }
  h.pending = null;
  h.stashedTruco = null;
  const stake = Math.max(1, h.trucoStake);
  return finishHand(base, h, other(TEAM_OF[who]), stake, `${nameOf(g, who)} se va al mazo.`);
}

/* ---------------- Señas ---------------- */

const SENA_CARD: Partial<Record<SenaId, { suit: string; rank: number }>> = {
  "ancho-espada": { suit: "espadas", rank: 1 },
  "ancho-basto": { suit: "bastos", rank: 1 },
  "siete-espada": { suit: "espadas", rank: 7 },
  "siete-oro": { suit: "oros", rank: 7 },
};

export function senaEsVerdad(h: Hand4, seat: Seat4, id: SenaId): boolean {
  const cards = h.origHands[seat];
  const target = SENA_CARD[id];
  if (target) return cards.some((c) => c.suit === target.suit && c.rank === target.rank);
  if (id === "buen-envido") return calcEnvido(cards) >= 29;
  return handStrength(cards) < 0.36;
}

/** Hacer una seña al socio. Los rivales pueden cazarla. */
export function hacerSena(g: Game4, seat: Seat4, id: SenaId, rng: () => number = Math.random): Game4 {
  const h: Hand4 = { ...g.hand, log: [...g.hand.log], senas: [...g.hand.senas] };
  if (g.winner || h.handOver) return g;
  if (h.senas.some((s) => s.by === seat)) return g; // una seña por jugador y por mano
  const falsa = !senaEsVerdad(h, seat, id);
  const cazada = rng() < (falsa ? 0.18 : 0.24);
  h.senas.push({ id, by: seat, cazada, falsa });
  const def = SENAS.find((s) => s.id === id)!;
  log(h, cazada ? `${nameOf(g, seat)} hace una seña… y se la cazan.` : `${nameOf(g, seat)} hace una seña al socio.`);
  if (cazada) log(h, `Los rivales leen: «${def.label}».`);
  return { ...g, hand: h };
}

export function senaDe(h: Hand4, seat: Seat4): SenaEvent | null {
  return h.senas.find((s) => s.by === seat) ?? null;
}

/* ---------------- IA ---------------- */

export interface Ai4Decision {
  kind: "playCard" | "respond" | "canto" | "wait" | "mazo";
  cardId?: string;
  accept?: boolean;
  canto?: { type: EnvidoLevel | TrucoLevel };
  thinkMs: number;
}

function handStrength(hand: Card[]): number {
  if (hand.length === 0) return 0;
  return hand.reduce((s, c) => s + trucoPower(c), 0) / (hand.length * 14);
}

/** Info que un asiento tiene sobre su socio a partir de las señas. */
function readPartnerSignal(h: Hand4, seat: Seat4): { strong: boolean; weak: boolean; goodEnvido: boolean } {
  const s = senaDe(h, partnerOf(seat));
  if (!s) return { strong: false, weak: false, goodEnvido: false };
  return {
    strong: s.id === "ancho-espada" || s.id === "ancho-basto" || s.id === "siete-espada" || s.id === "siete-oro",
    weak: s.id === "soy-malo",
    goodEnvido: s.id === "buen-envido",
  };
}

/** Info robada: señas del equipo rival que fueron cazadas. */
function readStolenSignals(h: Hand4, seat: Seat4): { rivalStrong: boolean; rivalEnvido: boolean } {
  const rivals = seatsOfTeam(other(TEAM_OF[seat]));
  const caught = h.senas.filter((s) => s.cazada && rivals.includes(s.by) && !s.falsa);
  return {
    rivalStrong: caught.some((s) => s.id !== "soy-malo" && s.id !== "buen-envido"),
    rivalEnvido: caught.some((s) => s.id === "buen-envido"),
  };
}

export function ai4Decide(
  g: Game4,
  seat: Seat4,
  difficulty: number = 0.5,
  rng: () => number = Math.random,
): Ai4Decision {
  const h = g.hand;
  const my = h.hands[seat];
  const strength = handStrength(my);
  const partner = readPartnerSignal(h, seat);
  const stolen = readStolenSignals(h, seat);
  const envido = calcEnvido(h.origHands[seat]);
  const think = 550 + Math.floor(rng() * 500);

  if (h.pending && h.pending.byTeam !== TEAM_OF[seat]) {
    if (h.pending.kind === "envido") {
      const partnerBoost = partner.goodEnvido ? 3 : 0;
      const rivalPenalty = stolen.rivalEnvido ? 3 : 0;
      const score = envido + partnerBoost - rivalPenalty;
      return { kind: "respond", accept: score >= 26 + (1 - difficulty) * 3, thinkMs: think };
    }
    if (h.trick === 0 && !h.envidoResolved && envido >= 28 && canCantarEnvido4(g, seat) && rng() < 0.55) {
      return { kind: "canto", canto: { type: "envido" }, thinkMs: think };
    }
    const eff = strength + (partner.strong ? 0.12 : 0) - (partner.weak ? 0.08 : 0) - (stolen.rivalStrong ? 0.1 : 0);
    return { kind: "respond", accept: eff > 0.46 - difficulty * 0.08, thinkMs: think };
  }

  if (h.turn === seat && !h.pending) {
    if (canCantarEnvido4(g, seat) && h.trick === 0) {
      const eff = envido + (partner.goodEnvido ? 4 : 0);
      if (eff >= 27 && rng() < 0.35 + difficulty * 0.35) {
        return { kind: "canto", canto: { type: envido >= 31 ? "real" : "envido" }, thinkMs: think };
      }
    }
    if (canCantarTruco4(g, seat)) {
      const eff = strength + (partner.strong ? 0.14 : 0) - (partner.weak ? 0.1 : 0);
      const winningTricks = h.trickWinners.filter((w) => w === TEAM_OF[seat]).length;
      if ((eff > 0.62 || winningTricks >= 1) && rng() < 0.3 + difficulty * 0.35) {
        return { kind: "canto", canto: { type: "truco" }, thinkMs: think };
      }
    }

    const sorted = [...my].sort((a, b) => trucoPower(b) - trucoPower(a));
    const slot = h.table[h.trick]!;
    const partnerCard = slot[partnerOf(seat)];
    const rivalCards = seatsOfTeam(other(TEAM_OF[seat]))
      .map((s) => slot[s])
      .filter((c): c is Card => !!c);
    const bestRival = rivalCards.length ? Math.max(...rivalCards.map(trucoPower)) : -1;
    const partnerWinning =
      !!partnerCard && trucoPower(partnerCard) > bestRival && rivalCards.length === 2;

    // Si el socio ya está ganando la baza, guardá las bravas.
    if (partnerWinning && sorted.length > 1) {
      return { kind: "playCard", cardId: sorted[sorted.length - 1]!.id, thinkMs: think };
    }
    // Ganar barato: la carta más baja que supere al rival.
    const cheapWin = [...my].sort((a, b) => trucoPower(a) - trucoPower(b)).find((c) => trucoPower(c) > bestRival);
    if (bestRival >= 0 && cheapWin && rng() < 0.5 + difficulty * 0.4) {
      return { kind: "playCard", cardId: cheapWin.id, thinkMs: think };
    }
    return { kind: "playCard", cardId: sorted[0]!.id, thinkMs: think };
  }

  return { kind: "wait", thinkMs: 320 };
}

/** ¿Le conviene a este asiento hacer una seña ahora? */
export function ai4Sena(g: Game4, seat: Seat4, rng: () => number = Math.random): SenaId | null {
  const h = g.hand;
  if (h.trick !== 0 || senaDe(h, seat)) return null;
  if (rng() > 0.5) return null;
  const cards = h.origHands[seat];
  const candidates: SenaId[] = [];
  for (const id of Object.keys(SENA_CARD) as SenaId[]) if (senaEsVerdad(h, seat, id)) candidates.push(id);
  if (calcEnvido(cards) >= 29) candidates.push("buen-envido");
  if (handStrength(cards) < 0.34) candidates.push("soy-malo");
  if (!candidates.length) return null;
  return candidates[Math.floor(rng() * candidates.length)]!;
}

export function seatLabel4(g: Game4, s: Seat4): string {
  return g.names[s];
}
