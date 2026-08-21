import {
  aiDecide,
  cantarEnvido,
  cantarFlor,
  cantarTruco,
  irseAlMazo,
  responderEnvido,
  responderTruco,
  responderFlor,
  playCard,
  startHand,
  hasFlor,
  canCantarEnvido,
  canCantarTruco,
  chooseCard,
  chooseCardMC,
  type AiDecision,
  type AiProfile,
  type GameState,
  type Player,
} from "@/lib/games/truco/truco";
import {
  CfrTable,
  extractCtx,
  extractCantoCtx,
  cfrCantoActionToType,
  type CfrAction,
  type DecisionCtx,
} from "./cfr";

function swapP<T extends Player | null | undefined>(p: T): T {
  if (p === "you") return "ai" as T;
  if (p === "ai") return "you" as T;
  return p;
}
function mirrorGame(g: GameState): GameState {
  const h = g.hand;
  return {
    ...g,
    hand: {
      ...h,
      mano: swapP(h.mano),
      turn: swapP(h.turn),
      trickLeader: swapP(h.trickLeader),
      yourHand: h.aiHand,
      aiHand: h.yourHand,
      origYourHand: h.origAiHand,
      origAiHand: h.origYourHand,
      table: h.table.map((t) => ({ you: t.ai, ai: t.you })) as typeof h.table,
      trickWinners: h.trickWinners.map((w) => (w === "you" ? "ai" : w === "ai" ? "you" : w)),
      trucoLastBy: swapP(h.trucoLastBy),
      pending: h.pending ? { ...h.pending, by: swapP(h.pending.by) } : null,
      stashedTruco: h.stashedTruco ? { ...h.stashedTruco, by: swapP(h.stashedTruco.by) } : null,
      handResult: h.handResult ? { you: h.handResult.ai, ai: h.handResult.you } : null,
      envidoReveal: h.envidoReveal
        ? {
            you: h.envidoReveal.ai,
            ai: h.envidoReveal.you,
            winner: swapP(h.envidoReveal.winner) as Player,
            points: h.envidoReveal.points,
            yourCards: h.envidoReveal.aiCards,
            aiCards: h.envidoReveal.yourCards,
          }
        : null,
    },
    scores: { you: g.scores.ai, ai: g.scores.you },
    nextMano: swapP(g.nextMano),
    winner: swapP(g.winner),
  };
}

function apply(
  g: GameState,
  who: Player,
  d: AiDecision,
  rng: () => number,
  aiLieRate: number,
): GameState {
  switch (d.kind) {
    case "playCard":
      return d.cardId ? playCard(g, who, d.cardId) : g;
    case "mazo":
      return irseAlMazo(g, who);
    case "respond": {
      const k = g.hand.pending?.kind;
      if (k === "envido") return responderEnvido(g, who, !!d.accept, { aiLieRate, rng });
      if (k === "truco") return responderTruco(g, who, !!d.accept);
      if (k === "flor" && d.florAction) return responderFlor(g, who, d.florAction);
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

function cfrActionToDecision(ctx: DecisionCtx, a: CfrAction, g: GameState, me: Player): AiDecision {
  const h = g.hand;
  if (ctx.kind === "envido-respond") {
    if (a === "accept") return { kind: "respond", accept: true, thinkMs: 0 };
    if (a === "fold") return { kind: "respond", accept: false, thinkMs: 0 };
    return { kind: "canto", canto: { type: "real" }, thinkMs: 0 };
  }
  if (a === "accept") return { kind: "respond", accept: true, thinkMs: 0 };
  if (a === "fold") {
    const lvl = h.pending?.level;
    if (lvl === "retruco" || lvl === "vale4") return { kind: "mazo", thinkMs: 0 };
    return { kind: "respond", accept: false, thinkMs: 0 };
  }
  const lvl = h.pending?.level as string | undefined;
  const next = lvl === "truco" ? "retruco" : lvl === "retruco" ? "vale4" : null;
  if (!next) return { kind: "respond", accept: true, thinkMs: 0 };
  return { kind: "canto", canto: { type: next as "retruco" | "vale4" }, thinkMs: 0 };
  void me;
}

interface TrajectoryStep {
  owner: Player;
  kind: DecisionCtx["kind"];
  key: string;
  legal: CfrAction[];
  chosen: CfrAction;
  pi: number[];
}

export interface TrainCfrOpts {
  iters: number;
  aiProfile: AiProfile;
  oppProfile: AiProfile;
  rng?: () => number;
  pointGoal?: number;
  maxHands?: number;
  onProgress?: (iter: number, table: CfrTable) => void;
  progressEvery?: number;
  epsilon?: number;
  seedTable?: CfrTable;
  opponents?: AiProfile[];
  discount?: number;
}

export interface TrainCfrResult {
  table: CfrTable;
  iters: number;
  hands: number;
  visitedNodes: number;
  totalVisits: number;
  aiWinRate: number;
  decisionsByKind: Record<DecisionCtx["kind"], number>;
}

export function trainCfr(opts: TrainCfrOpts): TrainCfrResult {
  const rng = opts.rng ?? Math.random;
  const goal = opts.pointGoal ?? 30;
  const maxHands = opts.maxHands ?? 4;
  const epsilon = opts.epsilon ?? 0.05;
  const discount = Math.max(0, Math.min(1, opts.discount ?? 0));
  const opponents = opts.opponents && opts.opponents.length > 0 ? opts.opponents : null;
  const table = opts.seedTable ?? new CfrTable();
  const aiLieAi = opts.aiProfile.weights?.envidoLieRate ?? 0.15;
  const aiLieOpDefault = opts.oppProfile.weights?.envidoLieRate ?? 0.15;
  let hands = 0;
  let wins = 0;
  let matches = 0;
  const decisionsByKind: Record<DecisionCtx["kind"], number> = {
    "envido-respond": 0,
    "truco-respond": 0,
    "envido-canto": 0,
    "truco-canto": 0,
  };

  const baseline = new Map<string, { mean: number; n: number }>();
  const baselineUpdate = (k: string, u: number) => {
    const b = baseline.get(k) ?? { mean: 0, n: 0 };
    b.n += 1;
    b.mean += (u - b.mean) / b.n;
    baseline.set(k, b);
  };

  for (let it = 0; it < opts.iters; it++) {
    const oppThis = opponents ? opponents[it % opponents.length]! : opts.oppProfile;
    const aiLieOp = oppThis.weights?.envidoLieRate ?? aiLieOpDefault;

    let g = startHand(null, true, goal, rng, "CPU");
    let stepsByHand: TrajectoryStep[] = [];

    const allSteps: Array<TrajectoryStep & { handIdx: number; duHand: number }> = [];
    let scoresAtHandStart = { you: g.scores.you, ai: g.scores.ai };
    let handIdx = 0;
    let guard = 0;
    const HARD_STOP = maxHands * 60;

    while (!g.winner && handIdx < maxHands && guard < HARD_STOP) {
      guard++;
      if (g.hand.handOver) {
        const dYou = g.scores.you - scoresAtHandStart.you;
        const dAi = g.scores.ai - scoresAtHandStart.ai;
        for (const step of stepsByHand) {
          const du = step.owner === "ai" ? dAi - dYou : dYou - dAi;
          allSteps.push({ ...step, handIdx, duHand: du });
        }
        stepsByHand = [];
        handIdx++;
        hands++;
        scoresAtHandStart = { you: g.scores.you, ai: g.scores.ai };
        g = startHand(g, true, goal, rng, "CPU");
        continue;
      }
      const actor: Player = g.hand.pending
        ? g.hand.pending.by === "you"
          ? "ai"
          : "you"
        : g.hand.turn;
      const lie = actor === "ai" ? aiLieAi : aiLieOp;
      const gPersp = actor === "ai" ? g : mirrorGame(g);
      const decision = pickTrainingDecision({
        g,
        gPersp,
        actor,
        table,
        rng,
        epsilon,
        stepsByHand,
        decisionsByKind,
        aiProfile: opts.aiProfile,
        oppProfile: oppThis,
      });
      const next = apply(g, actor, decision, rng, lie);
      if (next === g) g = irseAlMazo(g, actor);
      else g = next;
    }

    if (stepsByHand.length) {
      const dYou = g.scores.you - scoresAtHandStart.you;
      const dAi = g.scores.ai - scoresAtHandStart.ai;
      for (const step of stepsByHand) {
        const du = step.owner === "ai" ? dAi - dYou : dYou - dAi;
        allSteps.push({ ...step, handIdx, duHand: du });
      }
      handIdx++;
      hands++;
    }

    const totalHands = handIdx;
    const matchDiffAi = g.scores.ai - g.scores.you;
    for (const s of allSteps) {
      const k = Math.max(0, totalHands - 1 - s.handIdx);
      const matchU = s.owner === "ai" ? matchDiffAi : -matchDiffAi;
      const u = s.duHand + (discount > 0 ? Math.pow(discount, k) * matchU : 0);
      const bl = baseline.get(s.key)?.mean ?? 0;
      table.update(s.key, s.legal, s.chosen, u - bl, s.pi);
      baselineUpdate(s.key, u);
    }
    matches++;
    if (g.winner === "ai" || (!g.winner && g.scores.ai > g.scores.you)) wins++;
    if (opts.onProgress && opts.progressEvery && (it + 1) % opts.progressEvery === 0) {
      opts.onProgress(it + 1, table);
    }
  }

  return {
    table,
    iters: opts.iters,
    hands,
    visitedNodes: table.size(),
    totalVisits: table.totalVisits(),
    aiWinRate: matches ? wins / matches : 0,
    decisionsByKind,
  };
}

interface PickArgs {
  g: GameState;
  gPersp: GameState;
  actor: Player;
  table: CfrTable;
  rng: () => number;
  epsilon: number;
  stepsByHand: TrajectoryStep[];
  decisionsByKind: Record<DecisionCtx["kind"], number>;
  aiProfile: AiProfile;
  oppProfile: AiProfile;
}

function sampleAction(
  table: CfrTable,
  ctx: DecisionCtx,
  rng: () => number,
  epsilon: number,
): { chosen: CfrAction; pi: number[] } {
  const pi = table.strategy(ctx.key, ctx.legal);
  const useUniform = rng() < epsilon;
  const dist = useUniform ? ctx.legal.map(() => 1 / ctx.legal.length) : pi;
  let r = rng();
  let ix = 0;
  for (let i = 0; i < ctx.legal.length; i++) {
    r -= dist[i]!;
    if (r <= 0) {
      ix = i;
      break;
    }
  }
  return { chosen: ctx.legal[ix]!, pi };
}

function pickTrainingDecision(a: PickArgs): AiDecision {
  const { g, gPersp, actor, table, rng, epsilon, stepsByHand, decisionsByKind } = a;
  const h = g.hand;

  if (h.pending && h.pending.by !== actor) {
    if (h.pending.kind === "flor") {
      return actor === "ai" ? aiDecide(g, rng, a.aiProfile) : aiDecide(gPersp, rng, a.oppProfile);
    }
    const ctx = extractCtx(gPersp, "ai", rng, 0);
    if (ctx && ctx.legal.length >= 2) {
      const { chosen, pi } = sampleAction(table, ctx, rng, epsilon);
      stepsByHand.push({
        owner: actor,
        kind: ctx.kind,
        key: ctx.key,
        legal: ctx.legal,
        chosen,
        pi,
      });
      decisionsByKind[ctx.kind]++;
      return cfrActionToDecision(ctx, chosen, gPersp, "ai");
    }
    return actor === "ai" ? aiDecide(g, rng, a.aiProfile) : aiDecide(gPersp, rng, a.oppProfile);
  }

  if (!h.pending && h.turn === actor) {
    const myHand = actor === "ai" ? h.aiHand : h.yourHand;
    if (g.florEnabled && !h.florResolved && h.trick === 0 && hasFlor(myHand)) {
      return actor === "ai" ? aiDecide(g, rng, a.aiProfile) : aiDecide(gPersp, rng, a.oppProfile);
    }

    if (canCantarEnvido(g, actor) && !h.envidoResolved && h.trick === 0) {
      const ctx = extractCantoCtx(gPersp, "ai", "envido-canto");
      if (ctx) {
        const { chosen, pi } = sampleAction(table, ctx, rng, epsilon);
        stepsByHand.push({
          owner: actor,
          kind: ctx.kind,
          key: ctx.key,
          legal: ctx.legal,
          chosen,
          pi,
        });
        decisionsByKind[ctx.kind]++;
        const cantoT = cfrCantoActionToType(ctx, chosen, gPersp);
        if (cantoT) {
          return { kind: "canto", canto: { type: cantoT.canto as "envido" | "real" }, thinkMs: 0 };
        }
      }
    }

    if (canCantarTruco(g, actor)) {
      const ctx = extractCantoCtx(gPersp, "ai", "truco-canto");
      if (ctx) {
        const { chosen, pi } = sampleAction(table, ctx, rng, epsilon);
        stepsByHand.push({
          owner: actor,
          kind: ctx.kind,
          key: ctx.key,
          legal: ctx.legal,
          chosen,
          pi,
        });
        decisionsByKind[ctx.kind]++;
        const cantoT = cfrCantoActionToType(ctx, chosen, gPersp);
        if (cantoT) {
          return {
            kind: "canto",
            canto: { type: cantoT.canto as "truco" | "retruco" | "vale4" },
            thinkMs: 0,
          };
        }
      }
    }

    const handPersp = actor === "ai" ? h : gPersp.hand;
    const skill = (actor === "ai" ? a.aiProfile.skill : a.oppProfile.skill) ?? 0.7;
    const memory = (actor === "ai" ? a.aiProfile.memory : a.oppProfile.memory) ?? 0.5;

    const card = chooseCard(handPersp, skill, rng, memory, {
      medianBias: 0,
      saveHighFor3rdMemory: 0.4,
    });

    void chooseCardMC;
    return { kind: "playCard", cardId: card.id, thinkMs: 0 };
  }

  return actor === "ai" ? aiDecide(g, rng, a.aiProfile) : aiDecide(gPersp, rng, a.oppProfile);
}
