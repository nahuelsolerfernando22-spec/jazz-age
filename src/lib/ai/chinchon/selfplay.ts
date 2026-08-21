import {
  aiDecide,
  applyResult,
  discard,
  drawFromDeck,
  drawFromPile,
  resolveRound,
  startMatch,
  type MatchState,
  type PlayerId,
  type Card,
} from "@/lib/games/chinchon/chinchon";
import { DEFAULT_WEIGHTS, clampWeights, mutateWeights, type ChinchonWeights } from "./weights";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Trackers {
  userDiscards: Card[];
  aiDiscards: Card[];
  userPilePicks: Card[];
  aiPilePicks: Card[];
}

function newTrackers(): Trackers {
  return { userDiscards: [], aiDiscards: [], userPilePicks: [], aiPilePicks: [] };
}

function stepAi(
  m: MatchState,
  weights: ChinchonWeights,
  who: PlayerId,
  rnd: () => number,
  tr: Trackers,
): MatchState {
  if (m.over) return m;
  const r = m.round;
  if (r.turn !== who) return m;

  const roundView = who === "ai" ? r : { ...r, hands: { ai: r.hands.user, user: r.hands.ai } };
  const opp: PlayerId = who === "ai" ? "user" : "ai";
  const rivalPicks = who === "ai" ? tr.userPilePicks : tr.aiPilePicks;
  const rivalDiscards = who === "ai" ? tr.userDiscards : tr.aiDiscards;
  const decision = aiDecide(roundView, rnd, {
    weights,
    difficulty: 2,
    depth: 1,
    rivalPilePicks: rivalPicks,
    rivalDiscards,
  });
  const pileTopCard = r.pile[r.pile.length - 1] ?? null;
  const afterDraw = decision.draw === "pile" ? drawFromPile(r) : drawFromDeck(r);
  if (decision.draw === "pile" && pileTopCard) {
    if (who === "ai") tr.aiPilePicks.push(pileTopCard);
    else tr.userPilePicks.push(pileTopCard);
  }
  const discardCard = afterDraw.hands[who].find((c) => c.id === decision.discardId);
  const res = discard(afterDraw, decision.discardId, decision.close);
  if (discardCard) {
    if (who === "ai") tr.aiDiscards.push(discardCard);
    else tr.userDiscards.push(discardCard);
  }
  let next: MatchState = { ...m, round: res.round };
  if (res.closed) {
    const rr = resolveRound(res.round, res.closed);
    next = applyResult(next, rr);

    tr.userDiscards.length = 0;
    tr.aiDiscards.length = 0;
    tr.userPilePicks.length = 0;
    tr.aiPilePicks.length = 0;
  }

  return next;
}

export interface MatchOutcome {
  winner: PlayerId;
  scores: Record<PlayerId, number>;
  rounds: number;
}

export function runOneMatch(
  championW: ChinchonWeights,
  challengerW: ChinchonWeights,
  seed: number,
  swap = false,
  maxRounds = 60,
): MatchOutcome {
  const rnd = mulberry32(seed);
  let m = startMatch("user", rnd);
  const tr = newTrackers();

  let guard = 0;
  while (!m.over && guard < maxRounds * 12) {
    guard++;
    const turn = m.round.turn;
    const weights = (turn === "ai") === !swap ? championW : challengerW;
    m = stepAi(m, weights, turn, rnd, tr);
  }
  if (!m.over) {
    const winner: PlayerId = m.scores.user <= m.scores.ai ? "user" : "ai";
    return { winner, scores: m.scores, rounds: m.roundNo };
  }
  return { winner: m.over.winner, scores: m.scores, rounds: m.roundNo };
}

export function championWinRate(
  championW: ChinchonWeights,
  challengerW: ChinchonWeights,
  matches: number,
  baseSeed = 1,
): number {
  let champWins = 0;
  for (let i = 0; i < matches; i++) {
    const swap = i % 2 === 1;
    const out = runOneMatch(championW, challengerW, baseSeed + i * 37, swap);
    const championIsAi = !swap;
    const championWon = (out.winner === "ai") === championIsAi;
    if (championWon) champWins++;
  }
  return champWins / matches;
}

export interface TrainReport {
  generation: number;
  championWinRateVsDefault: number;
  adoptions: number;
  weights: ChinchonWeights;
}

export function trainChinchon(opts: {
  generations: number;
  matchesPerGen: number;
  startFrom?: ChinchonWeights;
  seed?: number;
  log?: (msg: string) => void;
}): TrainReport {
  const log = opts.log ?? (() => {});
  let champion = clampWeights(opts.startFrom ?? DEFAULT_WEIGHTS);
  let adoptions = 0;
  const baseSeed = opts.seed ?? 42;
  const rnd = mulberry32(baseSeed);
  for (let g = 0; g < opts.generations; g++) {
    const challenger = mutateWeights(champion, 0.28, rnd);
    const wr = championWinRate(champion, challenger, opts.matchesPerGen, baseSeed + g * 1013);
    log(`gen ${g}: champWR ${(wr * 100).toFixed(1)}% (challenger ${(100 - wr * 100).toFixed(1)}%)`);
    if (wr < 0.47) {
      champion = challenger;
      adoptions++;
      log(`  → adopta challenger (gen ${g})`);
    }
  }
  const wrVsDefault = championWinRate(
    champion,
    DEFAULT_WEIGHTS,
    Math.max(20, opts.matchesPerGen),
    baseSeed + 9999,
  );
  return {
    generation: opts.generations,
    championWinRateVsDefault: wrVsDefault,
    adoptions,
    weights: champion,
  };
}
