export type Suit = "oros" | "copas" | "espadas" | "bastos";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
export const SUITS: Suit[] = ["oros", "copas", "espadas", "bastos"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

import {
  extractCtx as _cfrExtractCtx,
  extractCantoCtx as _cfrExtractCantoCtx,
  cfrBlendedAction as _cfrBlendedAction,
} from "@/lib/ai/truco/cfr";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type Player = "you" | "ai";

export function trucoPower(c: Card): number {
  if (c.rank === 1 && c.suit === "espadas") return 14;
  if (c.rank === 1 && c.suit === "bastos") return 13;
  if (c.rank === 7 && c.suit === "espadas") return 12;
  if (c.rank === 7 && c.suit === "oros") return 11;
  if (c.rank === 3) return 10;
  if (c.rank === 2) return 9;
  if (c.rank === 1) return 8;
  if (c.rank === 12) return 7;
  if (c.rank === 11) return 6;
  if (c.rank === 10) return 5;
  if (c.rank === 7) return 4;
  if (c.rank === 6) return 3;
  if (c.rank === 5) return 2;
  if (c.rank === 4) return 1;
  return 0;
}

export function envidoValue(c: Card): number {
  return c.rank >= 10 ? 0 : c.rank;
}

export function calcEnvido(hand: Card[]): number {
  const bySuit = new Map<Suit, Card[]>();
  for (const c of hand) {
    const arr = bySuit.get(c.suit) ?? [];
    arr.push(c);
    bySuit.set(c.suit, arr);
  }
  let best = 0;
  for (const arr of bySuit.values()) {
    if (arr.length >= 2) {
      const sorted = [...arr].sort((a, b) => envidoValue(b) - envidoValue(a));
      const v = 20 + envidoValue(sorted[0]!) + envidoValue(sorted[1]!);
      if (v > best) best = v;
    } else {
      const v = envidoValue(arr[0]!);
      if (v > best) best = v;
    }
  }
  return best;
}

export function explainEnvido(hand: Card[]): { total: number; text: string } {
  const bySuit = new Map<Suit, Card[]>();
  for (const c of hand) {
    const arr = bySuit.get(c.suit) ?? [];
    arr.push(c);
    bySuit.set(c.suit, arr);
  }
  let best = 0;
  let text = "—";
  const suitEs: Record<Suit, string> = {
    oros: "oros",
    copas: "copas",
    espadas: "espadas",
    bastos: "bastos",
  };
  const rankEs = (r: number) =>
    r >= 10 ? (r === 10 ? "sota" : r === 11 ? "caballo" : "rey") : String(r);
  for (const [suit, arr] of bySuit.entries()) {
    if (arr.length >= 2) {
      const sorted = [...arr].sort((a, b) => envidoValue(b) - envidoValue(a));
      const v = 20 + envidoValue(sorted[0]!) + envidoValue(sorted[1]!);
      if (v > best) {
        best = v;
        text = `${rankEs(sorted[0]!.rank)} + ${rankEs(sorted[1]!.rank)} de ${suitEs[suit]} = 20+${envidoValue(sorted[0]!)}+${envidoValue(sorted[1]!)} = ${v}`;
      }
    } else {
      const v = envidoValue(arr[0]!);
      if (v > best) {
        best = v;
        text = `${rankEs(arr[0]!.rank)} = ${v}`;
      }
    }
  }
  return { total: best, text };
}

export function hasFlor(hand: Card[]): boolean {
  return hand.length === 3 && hand.every((c) => c.suit === hand[0]!.suit);
}

export function calcFlor(hand: Card[]): number {
  if (!hasFlor(hand)) return 0;
  return 20 + hand.reduce((acc, c) => acc + envidoValue(c), 0);
}

export function newDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ id: `${s}-${r}`, suit: s, rank: r });
  return d;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export type TrickWinner = "you" | "ai" | "tie" | null;

export type EnvidoLevel = "envido" | "real" | "falta";
export type TrucoLevel = "truco" | "retruco" | "vale4";
export type FlorLevel = "flor" | "contraflor" | "contrarresto";

export interface PendingCanto {
  kind: "envido" | "truco" | "flor";
  level: EnvidoLevel | TrucoLevel | FlorLevel;

  by: Player;

  chain?: EnvidoLevel[];
}

export interface HandState {
  mano: Player;

  turn: Player;
  yourHand: Card[];
  aiHand: Card[];

  table: { you: Card | null; ai: Card | null }[];

  trickWinners: TrickWinner[];

  trick: number;

  trickLeader: Player;

  trucoStake: number;

  trucoLevel: TrucoLevel | null;

  trucoLastBy: Player | null;

  envidoResolved: boolean;

  envidoAccepted: boolean;

  florResolved: boolean;

  florCalled: boolean;

  pending: PendingCanto | null;

  log: string[];

  handOver: boolean;

  handResult: { you: number; ai: number } | null;

  envidoReveal: {
    you: number;
    ai: number;
    winner: Player;
    points: number;
    yourCards: Card[];
    aiCards: Card[];
  } | null;

  stashedTruco: PendingCanto | null;

  pieCommittedNoEnvido: boolean;

  manoCommittedNoEnvido: boolean;

  origYourHand: Card[];
  origAiHand: Card[];

  envidoActual: { you: number; ai: number } | null;

  envidoDeclared: { you: number | null; ai: number | null };

  envidoChallengeOpen: boolean;

  envidoChallengeUsed: boolean;

  envidoAiLied: boolean;

  envidoDeclaredWinner: Player | null;

  envidoAwardedPoints: number;
}

export interface HandHistoryEntry {
  mano: Player;
  winner: Player | null;
  points: number;
  envido: { you: number; ai: number; winner: Player; points: number } | null;
  wentToMazo: Player | null;
}

export interface GameState {
  hand: HandState;
  scores: { you: number; ai: number };
  florEnabled: boolean;

  nextMano: Player;

  pointGoal: number;

  winner: Player | null;

  aiName: string;

  history: HandHistoryEntry[];

  oppModel: OppModel;
}

export interface OppModel {
  envidoDeclarations: number;

  envidoLiesCaught: number;

  envidoTruthsShown: number;

  envidoDeclaredMinusActualSum: number;

  envidoDeclaredMinusActualN: number;
}

export const EMPTY_OPP_MODEL: OppModel = {
  envidoDeclarations: 0,
  envidoLiesCaught: 0,
  envidoTruthsShown: 0,
  envidoDeclaredMinusActualSum: 0,
  envidoDeclaredMinusActualN: 0,
};

export function oppLieRate(m: OppModel): number {
  const n = m.envidoLiesCaught + m.envidoTruthsShown;

  return (m.envidoLiesCaught + 0.2 * 2) / (n + 2);
}

function deal(rng: () => number): { you: Card[]; ai: Card[] } {
  const deck = shuffle(newDeck(), rng);
  return { you: deck.slice(0, 3), ai: deck.slice(3, 6) };
}

export function startHand(
  prev: GameState | null,
  florEnabled: boolean,
  pointGoal: number = 30,
  rng: () => number = Math.random,
  aiName: string = "Eulalia",
): GameState {
  const mano: Player = prev ? prev.nextMano : "you";
  const ai = prev?.aiName ?? aiName;
  const { you, ai: aiHand } = deal(rng);
  const hand: HandState = {
    mano,
    turn: mano,
    yourHand: you,
    aiHand,
    table: [
      { you: null, ai: null },
      { you: null, ai: null },
      { you: null, ai: null },
    ],
    trickWinners: [],
    trick: 0,
    trickLeader: mano,
    trucoStake: 1,
    trucoLevel: null,
    trucoLastBy: null,
    envidoResolved: false,
    envidoAccepted: false,
    florResolved: !florEnabled,
    florCalled: false,
    pending: null,
    log: [`Reparte ${mano === "you" ? "vos" : ai}. Mano: ${mano === "you" ? "vos" : ai}.`],
    handOver: false,
    handResult: null,
    envidoReveal: null,
    stashedTruco: null,
    pieCommittedNoEnvido: false,
    manoCommittedNoEnvido: false,
    origYourHand: [...you],
    origAiHand: [...aiHand],
    envidoActual: null,
    envidoDeclared: { you: null, ai: null },
    envidoChallengeOpen: false,
    envidoChallengeUsed: false,
    envidoAiLied: false,
    envidoDeclaredWinner: null,
    envidoAwardedPoints: 0,
  };
  return {
    hand,
    scores: prev?.scores ?? { you: 0, ai: 0 },
    florEnabled,
    nextMano: mano === "you" ? "ai" : "you",
    pointGoal: prev?.pointGoal ?? pointGoal,
    winner: null,
    aiName: ai,
    history: prev?.history ?? [],
    oppModel: prev?.oppModel ?? { ...EMPTY_OPP_MODEL },
  };
}

function log(h: HandState, msg: string) {
  h.log = [...h.log, msg];
}

export function playCard(g: GameState, who: Player, cardId: string): GameState {
  if (g.winner || g.hand.handOver) return g;
  if (g.hand.pending) return g;
  if (g.hand.turn !== who) return g;
  const h = {
    ...g.hand,
    log: [...g.hand.log],
    table: g.hand.table.map((t) => ({ ...t })),
    trickWinners: [...g.hand.trickWinners],
  };
  const handArr = who === "you" ? h.yourHand : h.aiHand;
  const card = handArr.find((c) => c.id === cardId);
  if (!card) return g;

  if (h.trick === 0 && !h.envidoResolved && !h.pending) {
    if (who === h.mano) h.manoCommittedNoEnvido = true;
    else h.pieCommittedNoEnvido = true;
  }

  if (who === "you") h.yourHand = h.yourHand.filter((c) => c.id !== cardId);
  else h.aiHand = h.aiHand.filter((c) => c.id !== cardId);

  h.table[h.trick] = { ...h.table[h.trick]!, [who]: card };
  log(h, `${who === "you" ? "Vos" : g.aiName} jugaste ${cardLabel(card)}.`);

  const slot = h.table[h.trick]!;
  if (slot.you && slot.ai) {
    const py = trucoPower(slot.you);
    const pa = trucoPower(slot.ai);
    const w: TrickWinner = py > pa ? "you" : pa > py ? "ai" : "tie";
    h.trickWinners[h.trick] = w;
    log(h, w === "tie" ? "Baza parda." : `Baza para ${w === "you" ? "vos" : g.aiName}.`);

    const result = checkHandWinner(h);
    if (result) {
      h.handOver = true;
      const points = h.trucoStake;
      h.handResult = result === "you" ? { you: points, ai: 0 } : { you: 0, ai: points };
      log(h, `Mano para ${result === "you" ? "vos" : g.aiName} (+${points}).`);
    } else {
      h.trick += 1;

      h.trickLeader = w === "tie" ? h.trickLeader : w;
      h.turn = h.trickLeader;
    }
  } else {
    h.turn = who === "you" ? "ai" : "you";
  }
  return commit(g, h);
}

function commit(g: GameState, h: HandState, wentToMazo: Player | null = null): GameState {
  let scores = g.scores;
  let winner = g.winner;
  let nextMano = g.nextMano;
  let history = g.history;
  if (h.handOver && h.handResult) {
    scores = { you: g.scores.you + h.handResult.you, ai: g.scores.ai + h.handResult.ai };
    if (scores.you >= g.pointGoal) winner = "you";
    else if (scores.ai >= g.pointGoal) winner = "ai";
    nextMano = g.hand.mano === "you" ? "ai" : "you";
    const handWinner: Player | null =
      h.handResult.you > h.handResult.ai ? "you" : h.handResult.ai > h.handResult.you ? "ai" : null;
    const points = Math.max(h.handResult.you, h.handResult.ai);
    const entry: HandHistoryEntry = {
      mano: g.hand.mano,
      winner: handWinner,
      points,
      envido: h.envidoReveal,
      wentToMazo,
    };
    history = [...g.history, entry].slice(-20);
  }
  return { ...g, hand: h, scores, winner, nextMano, history };
}

function checkHandWinner(h: HandState): Player | null {
  const w = h.trickWinners;
  const first = w[0];
  const second = w[1];
  const third = w[2];

  if (first === "tie") {
    if (second === "you" || second === "ai") return second;
    if (second === "tie") {
      if (third === "you" || third === "ai") return third;
      if (third === "tie") return h.mano;
    }
    return null;
  }

  if (first === "you" || first === "ai") {
    if (second === first || second === "tie") return first;
    if (second && third) return third === "tie" ? first : third;
  }

  return null;
}

const TRUCO_NEXT: Record<TrucoLevel, TrucoLevel | null> = {
  truco: "retruco",
  retruco: "vale4",
  vale4: null,
};
export const TRUCO_POINTS: Record<TrucoLevel, number> = { truco: 2, retruco: 3, vale4: 4 };

export function canCantarTruco(g: GameState, who: Player): boolean {
  const h = g.hand;
  if (h.handOver || h.pending || g.winner) return false;
  if (!h.trucoLevel) return true;
  if (h.trucoLastBy !== who) return false;
  return TRUCO_NEXT[h.trucoLevel] !== null;
}

export function cantarTruco(g: GameState, who: Player): GameState {
  if (!canCantarTruco(g, who)) return g;
  const h = { ...g.hand, log: [...g.hand.log] };
  const next: TrucoLevel = h.trucoLevel ? TRUCO_NEXT[h.trucoLevel]! : "truco";

  const oppFour: Player = who === "you" ? "ai" : "you";
  if (h.trick === 2) {
    const oppCard = h.table[2]?.[oppFour];
    if (oppCard && oppCard.rank === 4) {
      const bonus = TRUCO_POINTS[next];
      log(
        h,
        `¡El 4 de la última! ${who === "you" ? "Vos cantás" : `${g.aiName} canta`} ${next.toUpperCase()} pero el rival ya tiró un 4 · +${bonus} para ${oppFour === "you" ? "vos" : g.aiName}.`,
      );
      const nextScores =
        oppFour === "you"
          ? { ...g.scores, you: g.scores.you + bonus }
          : { ...g.scores, ai: g.scores.ai + bonus };
      return checkWinner({ ...g, hand: h, scores: nextScores });
    }
  }
  h.pending = { kind: "truco", level: next, by: who };
  log(h, `${who === "you" ? "Vos" : g.aiName} cantás ${next.toUpperCase()}.`);
  return { ...g, hand: h };
}

export function responderTruco(g: GameState, who: Player, accept: boolean): GameState {
  const h = { ...g.hand, log: [...g.hand.log] };
  const p = h.pending;
  if (!p || p.kind !== "truco" || p.by === who) return g;
  if (accept) {
    h.trucoLevel = p.level as TrucoLevel;
    h.trucoStake = TRUCO_POINTS[h.trucoLevel];
    h.trucoLastBy = who;
    h.pending = null;
    log(h, `${who === "you" ? "Vos" : g.aiName} querés.`);
    return { ...g, hand: h };
  } else {
    const prev = h.trucoLevel ? TRUCO_POINTS[h.trucoLevel] : 1;
    h.handOver = true;
    h.pending = null;
    const winsPlayer = p.by;
    h.handResult = winsPlayer === "you" ? { you: prev, ai: 0 } : { you: 0, ai: prev };
    log(
      h,
      `${who === "you" ? "Vos no querés" : `${g.aiName} no quiere`}. +${prev} para ${winsPlayer === "you" ? "vos" : g.aiName}.`,
    );
    return commit(g, h);
  }
}

const ENVIDO_NEXT_OK: Record<EnvidoLevel, EnvidoLevel[]> = {
  envido: ["envido", "real", "falta"],
  real: ["falta"],
  falta: [],
};

export function canCantarEnvido(g: GameState, who: Player): boolean {
  const h = g.hand;
  if (h.handOver || g.winner) return false;
  if (h.envidoResolved) return false;

  if (h.trick !== 0) return false;

  if (h.manoCommittedNoEnvido) return false;

  if (h.pieCommittedNoEnvido && who !== h.mano) return false;

  if (h.trucoLevel) return false;
  if (h.pending && h.pending.kind === "envido") {
    return h.pending.by !== who;
  }

  if (h.pending && h.pending.kind === "truco") {
    return h.pending.by !== who;
  }
  if (h.pending) return false;
  // La iniciativa es del mano: el pie no puede adelantarse antes de que el
  // mano haya jugado o cantado.
  return h.turn === who;
}

/**
 * ¿Puede `who` cantar exactamente ese nivel de envido ahora mismo?
 * Evita ofrecer botones que el motor rechaza (p. ej. un tercer "envido"
 * sobre una cadena envido-envido), lo que dejaba la mano trabada.
 */
export function canCantarEnvidoLevel(g: GameState, who: Player, level: EnvidoLevel): boolean {
  if (!canCantarEnvido(g, who)) return false;
  const p = g.hand.pending;
  if (!p || p.kind !== "envido") return true;
  if (p.by === who) return false;
  if (!ENVIDO_NEXT_OK[p.level as EnvidoLevel].includes(level)) return false;
  const chain = p.chain ?? [p.level as EnvidoLevel];
  if (level === "envido" && chain.filter((x) => x === "envido").length >= 2) return false;
  return true;
}

export function cantarEnvido(g: GameState, who: Player, level: EnvidoLevel): GameState {
  if (!canCantarEnvido(g, who)) return g;
  const h = { ...g.hand, log: [...g.hand.log] };

  if (h.pending && h.pending.kind === "truco") {
    h.stashedTruco = h.pending;
    h.pending = { kind: "envido", level, by: who, chain: [level] };
    log(
      h,
      `${who === "you" ? "Vos" : g.aiName} decís «el envido está primero» · ${level.toUpperCase()}.`,
    );
    return { ...g, hand: h };
  }
  if (h.pending && h.pending.kind === "envido") {
    if (h.pending.by === who) return g;
    if (!ENVIDO_NEXT_OK[h.pending.level as EnvidoLevel].includes(level)) return g;
    const prevChain = h.pending.chain ?? [h.pending.level as EnvidoLevel];

    if (level === "envido" && prevChain.filter((x) => x === "envido").length >= 2) return g;
    const chain = [...prevChain, level];
    h.pending = { kind: "envido", level, by: who, chain };
  } else {
    h.pending = { kind: "envido", level, by: who, chain: [level] };
  }
  log(h, `${who === "you" ? "Vos" : g.aiName} cantás ${level.toUpperCase()}.`);
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

export interface ResponderEnvidoOpts {
  playerDeclared?: number;

  aiLieRate?: number;

  rng?: () => number;
}

function pickAiDeclared(
  actual: number,
  lieRate: number,
  rng: () => number,
): { value: number; lied: boolean } {
  if (lieRate <= 0 || rng() > lieRate) return { value: actual, lied: false };

  const targetHigh = 28 + Math.floor(rng() * 6);
  if (actual >= 30) return { value: actual, lied: false };
  if (actual >= 27) {
    const bumped = Math.min(33, actual + 2 + Math.floor(rng() * 2));
    return { value: bumped, lied: bumped !== actual };
  }
  return { value: Math.max(actual, targetHigh), lied: true };
}

export function responderEnvido(
  g: GameState,
  who: Player,
  accept: boolean,
  opts?: ResponderEnvidoOpts,
): GameState {
  const h = { ...g.hand, log: [...g.hand.log] };
  const p = h.pending;
  if (!p || p.kind !== "envido" || p.by === who) return g;
  if (!accept) {
    const chain = p.chain ?? [p.level as EnvidoLevel];
    let finalPts: number;
    if (chain.length <= 1) {
      finalPts = 1;
    } else {
      const prev = envidoQuieroPoints(chain.slice(0, -1));
      finalPts = prev === -1 ? 1 : Math.max(1, prev);
    }
    h.envidoResolved = true;
    h.pending = null;

    if (h.stashedTruco) {
      h.pending = h.stashedTruco;
      h.stashedTruco = null;
      log(
        h,
        `Vuelve el truco pendiente: ${(h.pending.level as string).toUpperCase()} — ¿qué decís?`,
      );
    }
    const nextScores =
      p.by === "you"
        ? { ...g.scores, you: g.scores.you + finalPts }
        : { ...g.scores, ai: g.scores.ai + finalPts };
    log(
      h,
      `${who === "you" ? "No querés" : `${g.aiName} no quiere`}. +${finalPts} envido para ${p.by === "you" ? "vos" : g.aiName}.`,
    );
    return checkWinner({ ...g, hand: h, scores: nextScores } as unknown as GameState);
  }

  const chain = p.chain ?? [p.level as EnvidoLevel];
  const hasFalta = chain.includes("falta");
  let pts: number;
  if (hasFalta) {
    pts = 0;
  } else {
    pts = envidoQuieroPoints(chain);
  }

  const youE = calcEnvido(h.origYourHand);
  const aiE = calcEnvido(h.origAiHand);

  const rng = opts?.rng ?? Math.random;
  const lieRate = Math.max(0, Math.min(0.5, opts?.aiLieRate ?? 0));
  const aiPick = pickAiDeclared(aiE, lieRate, rng);
  const declaredAi = aiPick.value;
  const declaredYou = clampDeclared(opts?.playerDeclared, youE);

  const winner: Player =
    declaredYou > declaredAi ? "you" : declaredAi > declaredYou ? "ai" : h.mano;
  let finalPts: number;
  if (hasFalta) {
    const leader: Player =
      g.scores.you > g.scores.ai ? "you" : g.scores.ai > g.scores.you ? "ai" : h.mano;
    const leaderScore = leader === "you" ? g.scores.you : g.scores.ai;
    finalPts = g.pointGoal - leaderScore;
  } else {
    finalPts = pts;
  }
  const safePts = Math.max(1, finalPts);
  h.envidoResolved = true;
  h.envidoAccepted = true;

  h.envidoReveal = {
    you: declaredYou,
    ai: declaredAi,
    winner,
    points: safePts,
    yourCards: [],
    aiCards: [],
  };
  h.envidoActual = { you: youE, ai: aiE };
  h.envidoDeclared = { you: declaredYou, ai: declaredAi };
  h.envidoAiLied = aiPick.lied;
  h.envidoDeclaredWinner = winner;
  h.envidoAwardedPoints = safePts;

  h.envidoChallengeOpen = true;
  h.envidoChallengeUsed = false;
  h.pending = null;
  if (h.stashedTruco) {
    h.pending = h.stashedTruco;
    h.stashedTruco = null;
    log(h, `Vuelve el truco pendiente: ${(h.pending.level as string).toUpperCase()} — ¿qué decís?`);
  }
  log(
    h,
    `Envido: vos decís ${declaredYou} · ${g.aiName} dice ${declaredAi}. Gana ${winner === "you" ? "vos" : g.aiName} +${safePts}.`,
  );
  const nextScores =
    winner === "you"
      ? { ...g.scores, you: g.scores.you + safePts }
      : { ...g.scores, ai: g.scores.ai + safePts };

  const oppModel: OppModel = {
    ...g.oppModel,
    envidoDeclarations: g.oppModel.envidoDeclarations + 1,
  };
  return checkWinner({ ...g, hand: h, scores: nextScores, oppModel });
}

function clampDeclared(v: number | undefined, fallback: number): number {
  if (v === undefined || v === null || Number.isNaN(v)) return fallback;
  return Math.max(0, Math.min(33, Math.round(v)));
}

export function canReclamarEnvido(g: GameState, who: Player): boolean {
  const h = g.hand;
  if (!h.envidoChallengeOpen || h.envidoChallengeUsed) return false;
  if (!h.envidoDeclaredWinner || !h.envidoActual) return false;

  return h.envidoDeclaredWinner !== who;
}

export function reclamarEnvido(g: GameState, who: Player): GameState {
  if (!canReclamarEnvido(g, who)) return g;
  const h: HandState = { ...g.hand, log: [...g.hand.log] };
  const winner = h.envidoDeclaredWinner!;
  const actual = h.envidoActual!;
  const declared = h.envidoDeclared;
  const points = h.envidoAwardedPoints;
  const winnerDeclared = declared[winner] ?? 0;
  const winnerActual = winner === "you" ? actual.you : actual.ai;
  const lied = winnerDeclared !== winnerActual;

  if (h.envidoReveal) {
    h.envidoReveal = {
      ...h.envidoReveal,
      yourCards: [...h.origYourHand],
      aiCards: [...h.origAiHand],
    };
  }
  h.envidoChallengeUsed = true;
  h.envidoChallengeOpen = false;
  let scores = { ...g.scores };
  if (lied) {
    if (winner === "you") scores = { ...scores, you: scores.you - points, ai: scores.ai + points };
    else scores = { ...scores, you: scores.you + points, ai: scores.ai - points };
    h.envidoDeclaredWinner = who;
    log(
      h,
      `¡Cartas! ${winner === "you" ? "Vos mentiste" : `${g.aiName} mintió`} (dijo ${winnerDeclared}, tenía ${winnerActual}). +${points} para ${who === "you" ? "vos" : g.aiName}.`,
    );
  } else {
    log(
      h,
      `Cartas mostradas: ${winner === "you" ? "vos" : g.aiName} dijo la verdad (${winnerActual}). Los puntos quedan firmes.`,
    );
  }

  let oppModel = g.oppModel;
  if (winner === "you") {
    const diff = winnerDeclared - winnerActual;
    oppModel = {
      ...oppModel,
      envidoLiesCaught: oppModel.envidoLiesCaught + (lied ? 1 : 0),
      envidoTruthsShown: oppModel.envidoTruthsShown + (lied ? 0 : 1),
      envidoDeclaredMinusActualSum: oppModel.envidoDeclaredMinusActualSum + (lied ? 0 : diff),
      envidoDeclaredMinusActualN: oppModel.envidoDeclaredMinusActualN + (lied ? 0 : 1),
    };
  }
  return checkWinner({ ...g, hand: h, scores, oppModel });
}

export function pasarReclamoEnvido(g: GameState): GameState {
  const h: HandState = { ...g.hand, log: [...g.hand.log] };
  if (!h.envidoChallengeOpen) return g;
  h.envidoChallengeOpen = false;
  h.envidoChallengeUsed = true;
  return { ...g, hand: h };
}

export function aiShouldReclamar(
  g: GameState,
  rng: () => number = Math.random,
  aggression = 0.5,
  memory = 0.5,
  challengeBias = 0,
): boolean {
  const h = g.hand;
  if (!h.envidoChallengeOpen || !h.envidoDeclaredWinner || !h.envidoActual) return false;
  const rival: Player = h.envidoDeclaredWinner;
  if (rival !== "you") return false;
  const declaredByRival = h.envidoDeclared.you ?? 0;

  const allPlayed = h.table.every((t) => t.you !== null);
  if (allPlayed) {
    const realYou = calcEnvido(h.origYourHand);
    if (realYou !== declaredByRival) return true;
    return false;
  }

  const priorMax = 27;
  const lieRate = oppLieRate(g.oppModel);

  const suspicion = (lieRate - 0.2) * 1.5 + challengeBias;
  if (declaredByRival >= priorMax + 3)
    return rng() < Math.min(0.95, 0.5 + aggression * 0.3 + suspicion);
  if (declaredByRival >= priorMax) return rng() < Math.min(0.85, 0.2 + memory * 0.3 + suspicion);

  if (lieRate > 0.5) return rng() < lieRate - 0.4 + challengeBias;
  return false;
}

function checkWinner(g: GameState): GameState {
  if (g.scores.you >= g.pointGoal) return { ...g, winner: "you" };
  if (g.scores.ai >= g.pointGoal) return { ...g, winner: "ai" };
  return g;
}

const FLOR_POINTS: Record<FlorLevel, number> = { flor: 3, contraflor: 6, contrarresto: 9 };
const FLOR_NEXT: Record<FlorLevel, FlorLevel | null> = {
  flor: "contraflor",
  contraflor: "contrarresto",
  contrarresto: null,
};

export function canCantarFlor(g: GameState, who: Player): boolean {
  const h = g.hand;
  if (!g.florEnabled || h.handOver || h.florResolved || g.winner) return false;
  if (h.trick !== 0) return false;
  if (h.trucoLevel) return false;
  const myHand = who === "you" ? h.yourHand : h.aiHand;
  if (!hasFlor(myHand)) return false;
  if (h.pending && h.pending.kind === "flor") return h.pending.by !== who;

  if (h.pending && h.pending.kind === "envido") return h.pending.by !== who;
  // La flor tapa también un truco cantado: se guarda y vuelve al resolverla.
  if (h.pending && h.pending.kind === "truco") return h.pending.by !== who;
  if (h.pending) return false;
  return true;
}

export function cantarFlor(g: GameState, who: Player, level: FlorLevel = "flor"): GameState {
  if (!canCantarFlor(g, who)) return g;
  const h = { ...g.hand, log: [...g.hand.log] };

  if (h.pending && h.pending.kind === "envido") {
    log(h, `${who === "you" ? "Vos" : g.aiName} tapás el envido con FLOR.`);
    h.envidoResolved = true;
  }
  if (h.pending && h.pending.kind === "truco") {
    h.stashedTruco = h.pending;
    log(h, `${who === "you" ? "Vos" : g.aiName}: la flor es primero.`);
  }
  h.pending = { kind: "flor", level, by: who };
  h.florCalled = true;
  log(h, `${who === "you" ? "¡FLOR!" : `${g.aiName}: ¡FLOR!`}`);
  return { ...g, hand: h };
}

export function responderFlor(
  g: GameState,
  who: Player,
  action: "achicar" | "subir" | "noquiero",
): GameState {
  const h = { ...g.hand, log: [...g.hand.log] };
  const p = h.pending;
  if (!p || p.kind !== "flor" || p.by === who) return g;
  const myHasFlor = who === "you" ? hasFlor(h.yourHand) : hasFlor(h.aiHand);
  const restoreStashed = () => {
    if (h.stashedTruco) {
      h.pending = h.stashedTruco;
      h.stashedTruco = null;
      log(
        h,
        `Vuelve el truco pendiente: ${(h.pending.level as string).toUpperCase()} — ¿qué decís?`,
      );
    }
  };
  if (action === "achicar" || (!myHasFlor && action !== "noquiero")) {
    const pts = FLOR_POINTS[p.level as FlorLevel];
    h.florResolved = true;
    h.pending = null;
    restoreStashed();
    const nextScores =
      p.by === "you"
        ? { ...g.scores, you: g.scores.you + pts }
        : { ...g.scores, ai: g.scores.ai + pts };
    log(
      h,
      `${who === "you" ? "Te achicás" : `${g.aiName} se achica`}. +${pts} para ${p.by === "you" ? "vos" : g.aiName}.`,
    );
    return checkWinner({ ...g, hand: h, scores: nextScores });
  }
  if (action === "noquiero") {
    const pts = FLOR_POINTS[p.level as FlorLevel];
    h.florResolved = true;
    h.pending = null;
    restoreStashed();
    const nextScores =
      p.by === "you"
        ? { ...g.scores, you: g.scores.you + pts }
        : { ...g.scores, ai: g.scores.ai + pts };
    log(h, `No querés. +${pts} para ${p.by === "you" ? "vos" : g.aiName}.`);
    return checkWinner({ ...g, hand: h, scores: nextScores });
  }
  const next = FLOR_NEXT[p.level as FlorLevel];
  if (!next) return g;
  h.pending = { kind: "flor", level: next, by: who };
  log(h, `${who === "you" ? "Subís a" : `${g.aiName} sube a`} ${next.toUpperCase()}.`);
  return { ...g, hand: h };
}

export function canIrseAlMazo(g: GameState, who: Player): boolean {
  const h = g.hand;
  if (h.handOver || g.winner) return false;

  if (h.pending && h.pending.by === who) return false;
  return true;
}

export function irseAlMazo(g: GameState, who: Player): GameState {
  if (!canIrseAlMazo(g, who)) return g;
  const h: HandState = { ...g.hand, log: [...g.hand.log] };
  const scores = { ...g.scores };
  const opp: Player = who === "you" ? "ai" : "you";
  const whoName = who === "you" ? "Vos" : g.aiName;
  const oppName = opp === "you" ? "vos" : g.aiName;

  if (h.pending && h.pending.by !== who) {
    const p = h.pending;
    if (p.kind === "envido") {
      const chain = p.chain ?? [p.level as EnvidoLevel];
      let pts: number;
      if (chain.length <= 1) pts = 1;
      else {
        const prev = envidoQuieroPoints(chain.slice(0, -1));
        pts = prev === -1 ? 1 : Math.max(1, prev);
      }
      if (p.by === "you") scores.you += pts;
      else scores.ai += pts;
      log(h, `${whoName} no quiere el envido. +${pts} para ${p.by === "you" ? "vos" : g.aiName}.`);
      h.envidoResolved = true;
    } else if (p.kind === "flor") {
      const pts = FLOR_POINTS[p.level as FlorLevel];
      if (p.by === "you") scores.you += pts;
      else scores.ai += pts;
      log(h, `${whoName} no quiere la flor. +${pts} para ${p.by === "you" ? "vos" : g.aiName}.`);
      h.florResolved = true;
    }
    h.pending = null;
    if (h.stashedTruco) {
      h.stashedTruco = null;
    }
  }

  const mazoPts = Math.max(1, h.trucoStake);
  if (opp === "you") scores.you += mazoPts;
  else scores.ai += mazoPts;
  log(h, `${whoName} se va al mazo. +${mazoPts} para ${oppName}.`);
  h.handOver = true;
  h.handResult = { you: scores.you - g.scores.you, ai: scores.ai - g.scores.ai };
  const nextG: GameState = { ...g, hand: h, scores: g.scores };
  return commit(nextG, h, who);
}

const RANK_NAME: Record<number, string> = {
  1: "as",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  10: "sota",
  11: "caballo",
  12: "rey",
};
export function cardLabel(c: Card): string {
  return `${RANK_NAME[c.rank]} de ${c.suit}`;
}

export interface AiDecision {
  kind: "playCard" | "respond" | "canto" | "wait" | "mazo";
  cardId?: string;
  accept?: boolean;
  florAction?: "achicar" | "subir" | "noquiero";
  canto?: {
    type:
      | "envido"
      | "real"
      | "falta"
      | "truco"
      | "retruco"
      | "vale4"
      | "flor"
      | "contraflor"
      | "contrarresto";
  };
  thinkMs: number;
}

export function handStrength(hand: Card[]): number {
  return hand.reduce((s, c) => s + trucoPower(c), 0) / (hand.length * 14);
}

export interface AiProfile {
  skill: number;
  aggression: number;
  bluff: number;
  patience: number;
  memory?: number;

  depth?: number;

  weights?: {
    envidoAcceptOffset?: number;
    trucoAcceptOffset?: number;
    envidoCantoBias?: number;
    trucoValueOffset?: number;
    bluffCantoMult?: number;
    reraiseMult?: number;
    foldMazoThreshold?: number;
    foldMazoPatienceMult?: number;
    oppEnvidoPriorMax?: number;
    envidoWindowLow?: number;
    envidoWindowHigh?: number;
    envidoRealEscalationBase?: number;
    envidoRealEscalationAggr?: number;
    chooseCardMedianBias?: number;
    saveHighFor3rdMemory?: number;
    envidoLieRate?: number;
    envidoChallengeBias?: number;
    cfrBlend?: number;
  };
}

const DEFAULT_AI: AiProfile = {
  skill: 0.7,
  aggression: 0.55,
  bluff: 0.3,
  patience: 0.5,
  memory: 0.5,
  depth: 0,
};

export interface PlayerBehavior {
  envidoCallRate: number;
  envidoAcceptRate: number;
  envidoAvgCalled: number;
  envidoAvgAccepted: number;
  trucoAcceptRate: number;
  retrucoAcceptRate: number;
  vale4AcceptRate: number;
  bluffRate: number;
  hands: number;
}

const DEFAULT_PLAYER: PlayerBehavior = {
  envidoCallRate: 0.45,
  envidoAcceptRate: 0.55,
  envidoAvgCalled: 27,
  envidoAvgAccepted: 26,
  trucoAcceptRate: 0.6,
  retrucoAcceptRate: 0.45,
  vale4AcceptRate: 0.35,
  bluffRate: 0.15,
  hands: 0,
};

function modelWeight(pm: PlayerBehavior): number {
  return Math.min(1, pm.hands / 25);
}

export interface BeliefConstraints {
  oppMinEnvido?: number;

  oppMaxEnvido?: number;

  softWeight?: number;
}

export function estimateOppEnvido(
  myHand: Card[],
  samples: number,
  rng: () => number = Math.random,
  constraints: BeliefConstraints = {},
): { mean: number; probGte: (target: number) => number } {
  if (samples <= 0) {
    return {
      mean: 24,
      probGte: (t) => (t <= 20 ? 1 : t >= 33 ? 0.05 : Math.max(0, (33 - t) / 13)),
    };
  }
  const usedIds = new Set(myHand.map((c) => c.id));
  const pool = newDeck().filter((c) => !usedIds.has(c.id));
  const scores: number[] = [];
  const soft = constraints.softWeight ?? 0.25;
  const maxAttempts = samples * 6;
  let attempts = 0;
  while (scores.length < samples && attempts < maxAttempts) {
    attempts += 1;

    const idxs = new Set<number>();
    while (idxs.size < 3) idxs.add(Math.floor(rng() * pool.length));
    const hand = Array.from(idxs).map((i) => pool[i]!);
    const e = calcEnvido(hand);

    if (constraints.oppMinEnvido !== undefined && e < constraints.oppMinEnvido) continue;

    if (constraints.oppMaxEnvido !== undefined && e > constraints.oppMaxEnvido) {
      if (rng() > soft) continue;
    }
    scores.push(e);
  }
  if (scores.length === 0) {
    return {
      mean: constraints.oppMinEnvido ?? 24,
      probGte: (t) => (t <= (constraints.oppMinEnvido ?? 0) ? 1 : 0.15),
    };
  }
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return {
    mean,
    probGte: (target: number) => scores.filter((s) => s >= target).length / scores.length,
  };
}

export function estimateHandEquity(
  h: HandState,
  samples: number,
  rng: () => number = Math.random,
  constraints: BeliefConstraints = {},
): number {
  if (samples <= 0) return handStrength(h.aiHand);
  const seenIds = new Set<string>();
  for (const c of h.aiHand) seenIds.add(c.id);
  for (const slot of h.table) {
    if (slot?.you) seenIds.add(slot.you.id);
    if (slot?.ai) seenIds.add(slot.ai.id);
  }
  const remaining = newDeck().filter((c) => !seenIds.has(c.id));
  const oppNeeds = h.yourHand.length;
  if (oppNeeds <= 0) return 1;

  const oppPlayed: Card[] = [];
  for (const slot of h.table) {
    if (slot?.you) oppPlayed.push(slot.you);
  }
  let wins = 0;
  let taken = 0;
  const maxAttempts = samples * 6;
  let attempts = 0;
  while (taken < samples && attempts < maxAttempts) {
    attempts += 1;
    const idxs = new Set<number>();
    while (idxs.size < oppNeeds) idxs.add(Math.floor(rng() * remaining.length));
    const oppHand = Array.from(idxs).map((i) => remaining[i]!);

    if (constraints.oppMinEnvido !== undefined || constraints.oppMaxEnvido !== undefined) {
      const orig = [...oppPlayed, ...oppHand];
      const e = calcEnvido(orig);
      if (constraints.oppMinEnvido !== undefined && e < constraints.oppMinEnvido) continue;
      if (constraints.oppMaxEnvido !== undefined && e > constraints.oppMaxEnvido) {
        if (rng() > (constraints.softWeight ?? 0.25)) continue;
      }
    }
    if (simulateHand(h, oppHand)) wins++;
    taken += 1;
  }
  return taken > 0 ? wins / taken : handStrength(h.aiHand);
}

function simulateHand(h: HandState, oppHand: Card[]): boolean {
  let myCards = [...h.aiHand];
  let opp = [...oppHand];
  const winners: TrickWinner[] = [...h.trickWinners];
  let trick = h.trick;
  let leader: Player = h.trickLeader;

  const slot = h.table[trick];
  let pendingYouCard: Card | null = slot?.you ?? null;
  let pendingAiCard: Card | null = slot?.ai ?? null;
  while (trick < 3) {
    if (pendingYouCard && pendingAiCard) {
      const w: TrickWinner =
        trucoPower(pendingAiCard) > trucoPower(pendingYouCard)
          ? "ai"
          : trucoPower(pendingYouCard) > trucoPower(pendingAiCard)
            ? "you"
            : "tie";
      winners[trick] = w;
      pendingYouCard = null;
      pendingAiCard = null;
      trick += 1;
      if (w !== "tie") leader = w;
      continue;
    }

    if (leader === "you" && !pendingYouCard) {
      const c = pickLowest(opp);
      pendingYouCard = c;
      opp = opp.filter((x) => x.id !== c.id);
      continue;
    }
    if (leader === "ai" && !pendingAiCard) {
      const c = pickHighest(myCards);
      pendingAiCard = c;
      myCards = myCards.filter((x) => x.id !== c.id);
      continue;
    }

    if (pendingYouCard && !pendingAiCard) {
      const c = pickJustAbove(myCards, trucoPower(pendingYouCard)) ?? pickLowest(myCards);
      pendingAiCard = c;
      myCards = myCards.filter((x) => x.id !== c.id);
    } else if (pendingAiCard && !pendingYouCard) {
      const c = pickJustAbove(opp, trucoPower(pendingAiCard)) ?? pickLowest(opp);
      pendingYouCard = c;
      opp = opp.filter((x) => x.id !== c.id);
    }
  }
  const fakeH: HandState = { ...h, trickWinners: winners };
  return checkHandWinner(fakeH) === "ai";
}

function pickLowest(hand: Card[]): Card {
  return [...hand].sort((a, b) => trucoPower(a) - trucoPower(b))[0]!;
}
function pickHighest(hand: Card[]): Card {
  return [...hand].sort((a, b) => trucoPower(b) - trucoPower(a))[0]!;
}
function pickJustAbove(hand: Card[], target: number): Card | null {
  const winners = hand
    .filter((c) => trucoPower(c) > target)
    .sort((a, b) => trucoPower(a) - trucoPower(b));
  return winners[0] ?? null;
}

export function aiDecide(
  g: GameState,
  rng: () => number = Math.random,
  profile: AiProfile = DEFAULT_AI,
  player: PlayerBehavior = DEFAULT_PLAYER,
): AiDecision {
  const h = g.hand;
  const { skill, aggression, bluff, patience } = profile;

  const depth = Math.max(0, Math.min(10, profile.depth ?? 0));
  const mcSamples =
    depth === 0 ? 0 : Math.min(720, Math.round(24 * Math.pow(1.55, Math.max(0, depth - 1))));
  const pWeight = modelWeight(player);

  const w = profile.weights ?? {};
  const W = {
    envidoAcceptOffset: w.envidoAcceptOffset ?? 0,
    trucoAcceptOffset: w.trucoAcceptOffset ?? 0,
    envidoCantoBias: w.envidoCantoBias ?? 0,
    trucoValueOffset: w.trucoValueOffset ?? 0,
    bluffCantoMult: w.bluffCantoMult ?? 1,
    reraiseMult: w.reraiseMult ?? 1,
    foldMazoThreshold: w.foldMazoThreshold ?? 0.18,
    foldMazoPatienceMult: w.foldMazoPatienceMult ?? 1,
    oppEnvidoPriorMax: w.oppEnvidoPriorMax ?? 27,
    envidoWindowLow: w.envidoWindowLow ?? 3,
    envidoWindowHigh: w.envidoWindowHigh ?? 6,
    envidoRealEscalationBase: w.envidoRealEscalationBase ?? 0.35,
    envidoRealEscalationAggr: w.envidoRealEscalationAggr ?? 0.5,
    chooseCardMedianBias: w.chooseCardMedianBias ?? 0,
    saveHighFor3rdMemory: w.saveHighFor3rdMemory ?? 0.4,
    envidoLieRate: w.envidoLieRate ?? 0.15,
    envidoChallengeBias: w.envidoChallengeBias ?? 0,
    cfrBlend: w.cfrBlend ?? 0,
  };

  const oppWasMano = h.mano === "you";
  const oppWindowClosedByPlay = oppWasMano && h.manoCommittedNoEnvido && !h.envidoResolved;
  const envidoConstraints: BeliefConstraints = oppWindowClosedByPlay
    ? { oppMaxEnvido: Math.round(W.oppEnvidoPriorMax), softWeight: 0.2 }
    : {};

  if (h.envidoAccepted) {
    envidoConstraints.oppMinEnvido = Math.max(20, Math.round(player.envidoAvgAccepted - 3));
  }

  const declaredByOpp = h.envidoDeclared.you;
  if (h.envidoAccepted && declaredByOpp !== null) {
    const lieRate = oppLieRate(g.oppModel);
    const window = 2 + Math.round(lieRate * 8);
    envidoConstraints.oppMinEnvido = Math.max(20, declaredByOpp - window);
    envidoConstraints.oppMaxEnvido = Math.min(33, declaredByOpp + Math.round(window * 0.5));
    envidoConstraints.softWeight = 0.3 + lieRate * 0.4;
  }

  if (h.pending && h.pending.by === "you") {
    if (h.pending.kind === "envido") {
      if (g.florEnabled && !h.florResolved && hasFlor(h.aiHand)) {
        return { kind: "canto", canto: { type: "flor" }, thinkMs: 800 };
      }
      const e = calcEnvido(h.origAiHand);

      const beliefCall: BeliefConstraints = {
        oppMinEnvido: Math.max(20, Math.round(player.envidoAvgCalled - W.envidoWindowLow)),
        oppMaxEnvido: Math.round(player.envidoAvgCalled + W.envidoWindowHigh),
        softWeight: 0.35,
      };
      const oppE =
        mcSamples > 0 ? estimateOppEnvido(h.origAiHand, mcSamples, rng, beliefCall) : null;
      const winProb = oppE
        ? 1 - oppE.probGte(e + 1) - 0.5 * (oppE.probGte(e) - oppE.probGte(e + 1))
        : null;

      const evThreshold = 0.32 - skill * 0.1 + W.envidoAcceptOffset;
      const stretch = 0.05 + bluff * 0.15;
      const accept =
        winProb !== null
          ? winProb >= evThreshold || (winProb >= evThreshold - 0.1 && rng() < stretch)
          : e >= 27 - skill * 3 ||
            (e >= 24 - aggression * 3 && rng() < 0.4 + aggression * 0.4) ||
            (e >= 20 - aggression * 2 && rng() < 0.05 + bluff * 0.3);
      if (
        accept &&
        e >= 30 &&
        canCantarEnvidoLevel(g, "ai", "real") &&
        rng() < W.envidoRealEscalationBase + aggression * W.envidoRealEscalationAggr
      ) {
        return { kind: "canto", canto: { type: "real" }, thinkMs: 900 };
      }

      if (W.cfrBlend > 0) {
        const ctx = _cfrExtractCtx(g, "ai", rng, 0);
        if (ctx) {
          const heurAction = accept ? "accept" : "fold";
          const cfrAct = _cfrBlendedAction(ctx, heurAction, W.cfrBlend, rng);
          if (cfrAct === "escalate" && canCantarEnvidoLevel(g, "ai", "real")) {
            return { kind: "canto", canto: { type: "real" }, thinkMs: 900 };
          }
          if (cfrAct === "accept") return { kind: "respond", accept: true, thinkMs: 700 };
          if (cfrAct === "fold") return { kind: "respond", accept: false, thinkMs: 700 };
        }
      }
      return { kind: "respond", accept, thinkMs: 700 };
    }
    if (h.pending.kind === "flor") {
      const aiFlor = hasFlor(h.aiHand);
      if (!aiFlor) return { kind: "respond", florAction: "achicar", thinkMs: 600 };
      const f = calcFlor(h.aiHand);
      if (f >= 32 && FLOR_NEXT[h.pending.level as FlorLevel] && rng() < 0.25 + aggression * 0.5) {
        return { kind: "respond", florAction: "subir", thinkMs: 800 };
      }
      return { kind: "respond", florAction: "achicar", thinkMs: 600 };
    }
    if (h.pending.kind === "truco") {
      if (h.trick === 0 && !h.envidoResolved && canCantarEnvido(g, "ai")) {
        const e = calcEnvido(h.origAiHand);
        if (e >= 28 - aggression * 2 && rng() < 0.55 + aggression * 0.3) {
          return { kind: "canto", canto: { type: "envido" }, thinkMs: 900 };
        }
        if (e >= 31 && rng() < 0.35 + aggression * 0.3) {
          return { kind: "canto", canto: { type: "real" }, thinkMs: 900 };
        }
      }
      const s =
        mcSamples > 0
          ? estimateHandEquity(h, mcSamples, rng, envidoConstraints)
          : handStrength(h.aiHand);

      const bluffAdjust = pWeight * (0.1 - player.bluffRate * 0.4);

      const level = h.pending.level as TrucoLevel;
      const stake = h.trucoStake;
      const next = TRUCO_POINTS[level];
      const evThreshold = Math.max(0.1, (next - stake) / (2 * next) + bluffAdjust);
      const acceptThreshold = evThreshold - aggression * 0.05 + W.trucoAcceptOffset;

      if (
        s < W.foldMazoThreshold &&
        (level === "retruco" || level === "vale4") &&
        rng() < (0.4 + patience * 0.2) * W.foldMazoPatienceMult
      ) {
        return { kind: "mazo", thinkMs: 900 };
      }
      const stretchThreshold = acceptThreshold - 0.1 - bluff * 0.1;
      const accept =
        s > acceptThreshold || (s > stretchThreshold && rng() < 0.3 + aggression * 0.4);

      const nextLvl = TRUCO_NEXT[level];
      const nextAcceptRate =
        nextLvl === "retruco"
          ? player.retrucoAcceptRate
          : nextLvl === "vale4"
            ? player.vale4AcceptRate
            : 1;
      const reraise =
        accept &&
        s > 0.7 - skill * 0.1 &&
        nextLvl &&
        rng() < (0.2 + aggression * 0.4 + pWeight * (0.3 - nextAcceptRate * 0.3)) * W.reraiseMult;
      if (reraise) {
        return { kind: "canto", canto: { type: nextLvl! }, thinkMs: 900 };
      }

      if (W.cfrBlend > 0) {
        const ctx = _cfrExtractCtx(g, "ai", rng, 0);
        if (ctx) {
          const heurAction = reraise ? "escalate" : accept ? "accept" : "fold";
          const cfrAct = _cfrBlendedAction(ctx, heurAction, W.cfrBlend, rng);
          if (cfrAct === "escalate" && nextLvl) {
            return { kind: "canto", canto: { type: nextLvl! }, thinkMs: 900 };
          }
          if (cfrAct === "accept") return { kind: "respond", accept: true, thinkMs: 700 };
          if (cfrAct === "fold") {
            if ((level === "retruco" || level === "vale4") && s < W.foldMazoThreshold) {
              return { kind: "mazo", thinkMs: 900 };
            }
            return { kind: "respond", accept: false, thinkMs: 700 };
          }
        }
      }
      return { kind: "respond", accept, thinkMs: 700 };
    }
  }

  if (h.turn === "ai" && !h.pending) {
    if (g.florEnabled && !h.florResolved && h.trick === 0 && hasFlor(h.aiHand)) {
      return { kind: "canto", canto: { type: "flor" }, thinkMs: 800 };
    }
    if (canCantarEnvido(g, "ai") && !h.envidoResolved && h.trick === 0) {
      const e = calcEnvido(h.origAiHand);
      const envidoT = 28 - aggression * 3;
      const realT = 31 - aggression * 2;

      const oppE =
        mcSamples > 0 ? estimateOppEnvido(h.origAiHand, mcSamples, rng, envidoConstraints) : null;
      const iWinProb = oppE ? 1 - oppE.probGte(e + 1) : null;

      const pa = player.envidoAcceptRate;
      const pWin = iWinProb ?? 0.5;
      const evCanto = pa * (4 * pWin - 2) + (1 - pa) * 1;
      const okCanto =
        iWinProb !== null ? evCanto > 0.2 - aggression * 0.4 - W.envidoCantoBias : e >= envidoT;

      let heurCanto: "pass" | "canto-lo" | "canto-hi" = "pass";
      if (okCanto && rng() < 0.45 + aggression * 0.4) heurCanto = "canto-lo";
      else if (e >= realT && (iWinProb ?? 0) >= 0.65 && rng() < 0.2 + aggression * 0.4)
        heurCanto = "canto-hi";

      let finalCanto: "pass" | "canto-lo" | "canto-hi" = heurCanto;
      if (W.cfrBlend > 0) {
        const ctx = _cfrExtractCantoCtx(g, "ai", "envido-canto");
        if (ctx) {
          const a = _cfrBlendedAction(ctx, heurCanto, W.cfrBlend, rng);
          if (a === "pass" || a === "canto-lo" || a === "canto-hi") finalCanto = a;
        }
      }
      if (finalCanto === "canto-lo")
        return { kind: "canto", canto: { type: "envido" }, thinkMs: 800 };
      if (finalCanto === "canto-hi")
        return { kind: "canto", canto: { type: "real" }, thinkMs: 800 };
    }
    if (canCantarTruco(g, "ai")) {
      const s =
        mcSamples > 0
          ? estimateHandEquity(h, mcSamples, rng, envidoConstraints)
          : handStrength(h.aiHand);
      const valueT = 0.72 - aggression * 0.12 + W.trucoValueOffset;

      const pa = player.trucoAcceptRate;
      const evCanto = pa * (4 * s - 2) + (1 - pa) * 1;

      let heurCantoT: "pass" | "canto-lo" = "pass";

      if (s > valueT && rng() < 0.3 + aggression * 0.4) heurCantoT = "canto-lo";
      else {
        const foldPremium = pWeight * (0.55 - pa) * 0.5;
        const bluffRate = Math.max(
          0,
          (bluff * (1 - patience) * 0.35 + foldPremium) * W.bluffCantoMult,
        );
        if (s < 0.35 && evCanto > 0 && rng() < bluffRate) heurCantoT = "canto-lo";
      }

      let finalCantoT: "pass" | "canto-lo" = heurCantoT;
      if (W.cfrBlend > 0) {
        const ctx = _cfrExtractCantoCtx(g, "ai", "truco-canto");
        if (ctx) {
          const a = _cfrBlendedAction(ctx, heurCantoT, W.cfrBlend, rng);
          if (a === "pass" || a === "canto-lo") finalCantoT = a;
        }
      }
      if (finalCantoT === "canto-lo") {
        const cantoLvl: TrucoLevel = !h.trucoLevel
          ? "truco"
          : h.trucoLevel === "truco"
            ? "retruco"
            : "vale4";
        return { kind: "canto", canto: { type: cantoLvl }, thinkMs: 900 };
      }
    }

    // Defensa: sin cartas no hay jugada posible (evita crash y mano trabada).
    if (h.aiHand.length === 0) return { kind: "wait", thinkMs: 400 };
    const card =
      mcSamples >= 48
        ? chooseCardMC(h, Math.min(96, Math.floor(mcSamples / 2)), rng, skill, envidoConstraints, {
            medianBias: W.chooseCardMedianBias,
            saveHighFor3rdMemory: W.saveHighFor3rdMemory,
            memory: profile.memory ?? 0.5,
          })
        : chooseCard(h, skill, rng, profile.memory ?? 0.5, {
            medianBias: W.chooseCardMedianBias,
            saveHighFor3rdMemory: W.saveHighFor3rdMemory,
          });
    if (!card) return { kind: "wait", thinkMs: 400 };
    return { kind: "playCard", cardId: card.id, thinkMs: 800 };
  }
  return { kind: "wait", thinkMs: 400 };
}

function inferOppRemaining(h: HandState, memory: number): { known: Card[]; unknownCount: number } {
  const played: Card[] = [];
  for (let i = 0; i < h.table.length; i++) {
    const s = h.table[i];
    if (s?.you) played.push(s.you);
  }

  const known = played.filter((_, i) => i === h.trick || Math.random() < memory);
  const totalOrig = 3;
  const unknownCount = Math.max(0, totalOrig - played.length);
  return { known, unknownCount };
}

interface ChooseCardWeights {
  medianBias?: number;
  saveHighFor3rdMemory?: number;
}

export function chooseCard(
  h: HandState,
  skill = 0.7,
  rng: () => number = Math.random,
  memory = 0.5,
  cw: ChooseCardWeights = {},
): Card {
  const myHand = h.aiHand;
  const opp = h.table[h.trick]!.you;
  const sortedAsc = [...myHand].sort((a, b) => trucoPower(a) - trucoPower(b));
  const errorRate = (1 - skill) * 0.4;
  const medianBias = cw.medianBias ?? 0;
  const saveMemT = cw.saveHighFor3rdMemory ?? 0.4;

  if (h.trick === 0) {
    if (rng() < errorRate) return sortedAsc[sortedAsc.length - 1]!;

    if (medianBias > 0 && rng() < medianBias * 2.5) {
      return sortedAsc[sortedAsc.length - 1]!;
    }
    if (medianBias < 0 && rng() < -medianBias * 2.5) {
      return sortedAsc[0]!;
    }
    return sortedAsc[Math.floor(sortedAsc.length / 2)] ?? sortedAsc[0]!;
  }

  if (h.trick === 2 && sortedAsc.length === 1) {
    return sortedAsc[0]!;
  }
  if (opp) {
    const oppPower = trucoPower(opp);
    const winners = sortedAsc.filter((c) => trucoPower(c) > oppPower);
    if (winners.length > 0) {
      if (rng() < errorRate) return winners[winners.length - 1]!;
      return winners[0]!;
    }

    if (rng() < errorRate && sortedAsc.length > 1) return sortedAsc[1]!;
    return sortedAsc[0]!;
  }

  const { known } = inferOppRemaining(h, memory);
  const maxKnown = known.length > 0 ? Math.max(...known.map(trucoPower)) : 0;
  const myTop = sortedAsc[sortedAsc.length - 1]!;

  const wonFirst = h.trickWinners[0] === "ai";
  if (memory > saveMemT && wonFirst && trucoPower(myTop) - maxKnown >= 4 && sortedAsc.length > 1) {
    return sortedAsc[sortedAsc.length - 2]!;
  }

  if (
    h.trick === 1 &&
    h.trickWinners[0] === "tie" &&
    sortedAsc.length > 1 &&
    memory > saveMemT &&
    trucoPower(myTop) - trucoPower(sortedAsc[sortedAsc.length - 2]!) >= 3
  ) {
    return sortedAsc[sortedAsc.length - 2]!;
  }
  if (rng() < errorRate && sortedAsc.length > 1) return sortedAsc[sortedAsc.length - 2]!;
  return myTop;
}

export function chooseCardMC(
  h: HandState,
  samples: number,
  rng: () => number = Math.random,
  skill = 0.9,
  constraints: BeliefConstraints = {},
  cw: ChooseCardWeights & { memory?: number } = {},
): Card {
  const myHand = h.aiHand;
  if (myHand.length === 1) return myHand[0]!;

  const seenIds = new Set<string>();
  for (const c of h.aiHand) seenIds.add(c.id);
  for (const slot of h.table) {
    if (slot?.you) seenIds.add(slot.you.id);
    if (slot?.ai) seenIds.add(slot.ai.id);
  }
  const remaining = newDeck().filter((c) => !seenIds.has(c.id));
  const oppPlayed: Card[] = [];
  for (const slot of h.table) if (slot?.you) oppPlayed.push(slot.you);
  const oppNeeds = h.yourHand.length;
  if (oppNeeds <= 0) {
    return myHand.sort((a, b) => trucoPower(b) - trucoPower(a))[0]!;
  }

  const worlds: Card[][] = [];
  const maxAttempts = samples * 6;
  let attempts = 0;
  while (worlds.length < samples && attempts < maxAttempts) {
    attempts += 1;
    const idxs = new Set<number>();
    while (idxs.size < oppNeeds) idxs.add(Math.floor(rng() * remaining.length));
    const oppHand = Array.from(idxs).map((i) => remaining[i]!);
    if (constraints.oppMinEnvido !== undefined || constraints.oppMaxEnvido !== undefined) {
      const orig = [...oppPlayed, ...oppHand];
      const e = calcEnvido(orig);
      if (constraints.oppMinEnvido !== undefined && e < constraints.oppMinEnvido) continue;
      if (constraints.oppMaxEnvido !== undefined && e > constraints.oppMaxEnvido) {
        if (rng() > (constraints.softWeight ?? 0.25)) continue;
      }
    }
    worlds.push(oppHand);
  }
  if (worlds.length === 0) {
    return chooseCard(h, skill, rng, cw.memory ?? 0.5, cw);
  }
  let bestCard: Card = myHand[0]!;
  let bestScore = -Infinity;
  const medianBias = cw.medianBias ?? 0;
  for (const cand of myHand) {
    let wins = 0;
    for (const world of worlds) {
      const nextHand: HandState = {
        ...h,
        aiHand: myHand.filter((c) => c.id !== cand.id),
        table: h.table.map((t) => ({ ...t })),
        trickWinners: [...h.trickWinners],
      };
      nextHand.table[nextHand.trick] = { ...nextHand.table[nextHand.trick]!, ai: cand };
      if (simulateHand(nextHand, world)) wins += 1;
    }

    const noise = (1 - skill) * 0.15 * (rng() - 0.5);

    const tiebreak = (-1 + medianBias * 4) * trucoPower(cand) * 0.0005;
    const score = wins / worlds.length + noise + tiebreak;
    if (score > bestScore) {
      bestScore = score;
      bestCard = cand;
    }
  }
  return bestCard;
}
