import {
  aiDecide,
  cantarEnvido,
  cantarFlor,
  cantarTruco,
  irseAlMazo,
  playCard,
  responderEnvido,
  responderFlor,
  responderTruco,
  startHand,
  type AiDecision,
  type AiProfile,
  type Card,
  type GameState,
  type HandState,
  type PendingCanto,
  type Player,
  type PlayerBehavior,
  type TrickWinner,
} from "@/lib/games/truco/truco";

function swapP<T extends Player | null | undefined>(p: T): T {
  if (p === "you") return "ai" as T;
  if (p === "ai") return "you" as T;
  return p;
}
function swapW(w: TrickWinner): TrickWinner {
  return w === "you" ? "ai" : w === "ai" ? "you" : w;
}

function mirrorPending(p: PendingCanto | null): PendingCanto | null {
  if (!p) return null;
  return { ...p, by: swapP(p.by) };
}

function mirrorHand(h: HandState): HandState {
  return {
    ...h,
    mano: swapP(h.mano),
    turn: swapP(h.turn),
    trickLeader: swapP(h.trickLeader),
    yourHand: h.aiHand,
    aiHand: h.yourHand,
    origYourHand: h.origAiHand,
    origAiHand: h.origYourHand,
    table: h.table.map((t) => ({ you: t.ai, ai: t.you })) as HandState["table"],
    trickWinners: h.trickWinners.map(swapW),
    trucoLastBy: swapP(h.trucoLastBy),
    pending: mirrorPending(h.pending),
    stashedTruco: mirrorPending(h.stashedTruco),
    handResult: h.handResult ? { you: h.handResult.ai, ai: h.handResult.you } : null,
    envidoReveal: h.envidoReveal
      ? {
          you: h.envidoReveal.ai,
          ai: h.envidoReveal.you,
          winner: swapP(h.envidoReveal.winner) as Player,
          points: h.envidoReveal.points,
          yourCards: h.envidoReveal.aiCards as Card[],
          aiCards: h.envidoReveal.yourCards as Card[],
        }
      : null,
  };
}

function mirrorGame(g: GameState): GameState {
  return {
    ...g,
    hand: mirrorHand(g.hand),
    scores: { you: g.scores.ai, ai: g.scores.you },
    nextMano: swapP(g.nextMano),
    winner: swapP(g.winner),
    history: g.history.map((h) => ({
      ...h,
      mano: swapP(h.mano) as Player,
      winner: swapP(h.winner),
      envido: h.envido
        ? {
            ...h.envido,
            you: h.envido.ai,
            ai: h.envido.you,
            winner: swapP(h.envido.winner) as Player,
          }
        : null,
      wentToMazo: swapP(h.wentToMazo),
    })),
  };
}

export interface ApplyDecisionOpts {
  aiLieRate?: number;
  rng?: () => number;
}
export function applyDecision(
  g: GameState,
  who: Player,
  d: AiDecision,
  opts: ApplyDecisionOpts = {},
): GameState {
  switch (d.kind) {
    case "playCard":
      return d.cardId ? playCard(g, who, d.cardId) : g;
    case "mazo":
      return irseAlMazo(g, who);
    case "respond": {
      const kind = g.hand.pending?.kind;
      if (kind === "envido")
        return responderEnvido(g, who, !!d.accept, {
          aiLieRate: opts.aiLieRate,
          rng: opts.rng,
        });
      if (kind === "truco") return responderTruco(g, who, !!d.accept);
      if (kind === "flor" && d.florAction) return responderFlor(g, who, d.florAction);
      return g;
    }
    case "canto": {
      const c = d.canto?.type;
      if (!c) return g;
      if (c === "truco" || c === "retruco" || c === "vale4") return cantarTruco(g, who);
      if (c === "envido" || c === "real" || c === "falta") return cantarEnvido(g, who, c);
      if (c === "flor") return cantarFlor(g, who, "flor");
      if (c === "contraflor") return cantarFlor(g, who, "contraflor");
      if (c === "contrarresto") return cantarFlor(g, who, "contrarresto");
      return g;
    }
    default:
      return g;
  }
}

export interface SelfplayOptions {
  aiProfile: AiProfile;
  opponentProfile: AiProfile | (() => AiProfile);
  playerModel?: PlayerBehavior;
  florEnabled?: boolean;
  pointGoal?: number;
  maxHands?: number;
  rng?: () => number;
}

export interface SelfplayResult {
  winner: Player;
  scores: { you: number; ai: number };
  hands: number;
  spread: number;
}

export function simulateMatch(opts: SelfplayOptions): SelfplayResult {
  const rng = opts.rng ?? Math.random;
  const florEnabled = opts.florEnabled ?? true;
  const goal = opts.pointGoal ?? 30;
  const maxHands = opts.maxHands ?? 80;
  const opp: AiProfile =
    typeof opts.opponentProfile === "function" ? opts.opponentProfile() : opts.opponentProfile;
  let g = startHand(null, florEnabled, goal, rng, "CPU-A");
  let hands = 0;
  let guard = 0;
  const HARD_STOP = maxHands * 60;
  while (!g.winner && hands < maxHands && guard < HARD_STOP) {
    guard += 1;
    if (g.hand.handOver) {
      hands += 1;
      g = startHand(g, florEnabled, goal, rng, "CPU-A");
      continue;
    }
    const actor: Player = g.hand.pending
      ? g.hand.pending.by === "you"
        ? "ai"
        : "you"
      : g.hand.turn;

    let decision: AiDecision;
    const actorProfile = actor === "ai" ? opts.aiProfile : opp;
    if (actor === "ai") {
      decision = aiDecide(g, rng, opts.aiProfile, opts.playerModel);
    } else {
      const mg = mirrorGame(g);
      decision = aiDecide(mg, rng, opp, opts.playerModel);
    }
    const next = applyDecision(g, actor, decision, {
      aiLieRate: actorProfile.weights?.envidoLieRate ?? 0.15,
      rng,
    });
    if (next === g) {
      g = irseAlMazo(g, actor);
    } else {
      g = next;
    }
  }
  const winner: Player = g.winner ?? (g.scores.ai >= g.scores.you ? "ai" : "you");
  // La mano que cierra la partida termina el bucle antes de contarse: si el
  // juego quedó con la mano terminada, la sumamos acá (si no, una partida
  // decidida en la primera mano reportaba `hands: 0`).
  if (g.hand.handOver) hands += 1;
  return {
    winner,
    scores: g.scores,
    hands,
    spread: Math.abs(g.scores.you - g.scores.ai),
  };
}
