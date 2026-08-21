import {
  calcEnvido,
  handStrength,
  estimateHandEquity,
  canCantarEnvido,
  canCantarTruco,
  trucoPower,
  type Card,
  type EnvidoLevel,
  type GameState,
  type Player,
  type TrucoLevel,
} from "@/lib/games/truco/truco";

export type CfrAction = "fold" | "accept" | "escalate" | "pass" | "canto-lo" | "canto-hi";

export interface DecisionCtx {
  kind: "truco-respond" | "envido-respond" | "envido-canto" | "truco-canto";
  key: string;
  legal: CfrAction[];
}

export const CFR_ABSTRACTION_VERSION = 3;

function cardBucket(c: Card): number {
  const p = trucoPower(c);
  if (p <= 5) return 0;
  if (p <= 10) return 1;
  return 2;
}
function cardBucketOrDash(c: Card | null | undefined): string {
  return c ? String(cardBucket(c)) : "-";
}
function topBravaBurned(g: GameState): 0 | 1 {
  const h = g.hand;
  for (let i = 0; i < h.trick; i++) {
    const row = h.table[i];
    if (!row) continue;
    if (row.you && trucoPower(row.you) >= 12) return 1;
    if (row.ai && trucoPower(row.ai) >= 12) return 1;
  }
  return 0;
}
function tableObs(g: GameState, me: Player): { opP: string; burn: 0 | 1 } {
  const row = g.hand.table[g.hand.trick];
  const opp = me === "ai" ? (row?.you ?? null) : (row?.ai ?? null);
  return { opP: cardBucketOrDash(opp), burn: topBravaBurned(g) };
}

const KIND_PREFIX: Record<DecisionCtx["kind"], string> = {
  "envido-canto": "Ce",
  "truco-canto": "Ct",
  "envido-respond": "E",
  "truco-respond": "T",
};
function kindOfKey(key: string): DecisionCtx["kind"] | null {
  if (key.startsWith("Ce")) return "envido-canto";
  if (key.startsWith("Ct")) return "truco-canto";
  if (key.startsWith("E")) return "envido-respond";
  if (key.startsWith("T")) return "truco-respond";
  return null;
}

const TARGET_KIND_VISITS = 40_000;
const TARGET_NODE_VISITS = 24;

export interface KindStats {
  nodes: number;
  visits: number;
  confidence: number;
}

function bucketDiff(diff: number): string {
  if (diff <= -10) return "--";
  if (diff <= -4) return "-";
  if (diff < 4) return "0";
  if (diff < 10) return "+";
  return "++";
}
function bucketGoal(remaining: number): string {
  if (remaining <= 5) return "n";
  if (remaining <= 20) return "m";
  return "f";
}
function bucketEquity(eq: number): number {
  return Math.max(0, Math.min(5, Math.floor(eq * 6)));
}
function bucketEnvido(e: number): number {
  if (e <= 21) return 0;
  if (e <= 24) return 1;
  if (e <= 26) return 2;
  if (e <= 28) return 3;
  if (e <= 30) return 4;
  return 5;
}
function trickState(g: GameState, me: Player): string {
  const h = g.hand;
  if (h.trick === 0) return "n";
  const last = h.trickWinners[h.trick - 1];
  if (last === "tie") return "t";
  if (last === me) return "w";
  return "l";
}

function trickHistory(g: GameState, me: Player): string {
  const h = g.hand;
  if (h.trick === 0) return "n";
  const parts: string[] = [];
  for (let i = 0; i < h.trick; i++) {
    const w = h.trickWinners[i];
    parts.push(w === "tie" ? "t" : w === me ? "w" : "l");
  }
  return parts.join("");
}

export function extractCtx(
  g: GameState,
  me: Player,
  rng: () => number = Math.random,
  mcSamples = 0,
): DecisionCtx | null {
  const h = g.hand;
  if (!h.pending) return null;
  if (h.pending.by === me) return null;
  const myHand = me === "ai" ? h.origAiHand : h.origYourHand;
  const myScore = me === "ai" ? g.scores.ai : g.scores.you;
  const oppScore = me === "ai" ? g.scores.you : g.scores.ai;
  const goal = g.pointGoal;
  const diff = myScore - oppScore;
  const remMe = Math.max(0, goal - myScore);
  const remOpp = Math.max(0, goal - oppScore);
  const dBkt = bucketDiff(diff);
  const gMe = bucketGoal(remMe);
  const gOpp = bucketGoal(remOpp);

  if (h.pending.kind === "truco") {
    const level = h.pending.level as TrucoLevel;
    const lvlIx = level === "truco" ? 0 : level === "retruco" ? 1 : 2;

    const eq = mcSamples > 0 ? estimateHandEquity(h, mcSamples, rng, {}) : handStrength(myHand);
    const eBkt = bucketEquity(eq);
    const hist = trickHistory(g, me);
    const isMano = h.mano === me ? "M" : "P";
    const envR = h.envidoResolved ? 1 : 0;
    const legal: CfrAction[] = ["fold", "accept"];
    const nextLvl: TrucoLevel | null =
      level === "truco" ? "retruco" : level === "retruco" ? "vale4" : null;
    if (nextLvl) legal.push("escalate");
    const obs = tableObs(g, me);
    const key = `T${lvlIx}${eBkt}${h.trick}${hist}${isMano}${envR}${dBkt}${gMe}${gOpp}${obs.opP}${obs.burn}`;
    return { kind: "truco-respond", key, legal };
  }

  if (h.pending.kind === "envido") {
    const level = h.pending.level as EnvidoLevel;
    const lvlIx = level === "envido" ? 0 : level === "real" ? 1 : 2;
    const myE = calcEnvido(myHand);
    const eBkt = bucketEnvido(myE);
    const isMano = h.mano === me ? "M" : "P";
    const legal: CfrAction[] = ["fold", "accept"];

    if (level === "envido") legal.push("escalate");
    const key = `E${lvlIx}${eBkt}${isMano}${dBkt}${gMe}${gOpp}`;
    return { kind: "envido-respond", key, legal };
  }

  return null;
}

export function extractCantoCtx(
  g: GameState,
  me: Player,
  phase: "envido-canto" | "truco-canto",
): DecisionCtx | null {
  const h = g.hand;
  if (h.pending) return null;
  if (g.winner || h.handOver) return null;

  const myHand = me === "ai" ? h.origAiHand : h.origYourHand;
  const myScore = me === "ai" ? g.scores.ai : g.scores.you;
  const oppScore = me === "ai" ? g.scores.you : g.scores.ai;
  const dBkt = bucketDiff(myScore - oppScore);
  const gMe = bucketGoal(Math.max(0, g.pointGoal - myScore));
  const gOpp = bucketGoal(Math.max(0, g.pointGoal - oppScore));
  const isMano = h.mano === me ? "M" : "P";

  if (phase === "envido-canto") {
    if (!canCantarEnvido(g, me)) return null;
    if (h.envidoResolved) return null;
    if (h.trick !== 0) return null;
    const myE = calcEnvido(myHand);
    const eBkt = bucketEnvido(myE);

    const legal: CfrAction[] = ["pass", "canto-lo"];
    legal.push("canto-hi");
    const key = `Ce${eBkt}${isMano}${dBkt}${gMe}${gOpp}`;
    return { kind: "envido-canto", key, legal };
  }

  if (!canCantarTruco(g, me)) return null;
  const eq = handStrength(myHand);
  const eBkt = bucketEquity(eq);

  const lvl = !h.trucoLevel ? 0 : h.trucoLevel === "truco" ? 1 : 2;
  const hist = trickHistory(g, me);
  const envR = h.envidoResolved ? 1 : 0;
  const obs = tableObs(g, me);
  const key = `Ct${lvl}${eBkt}${h.trick}${hist}${isMano}${envR}${dBkt}${gMe}${gOpp}${obs.opP}${obs.burn}`;
  const legal: CfrAction[] = ["pass", "canto-lo"];
  return { kind: "truco-canto", key, legal };
}

void trickState;

export function cfrCantoActionToType(
  ctx: DecisionCtx,
  action: CfrAction,
  g: GameState,
): { canto: "envido" | "real" | "truco" | "retruco" | "vale4" } | null {
  if (action === "pass") return null;
  const h = g.hand;
  if (ctx.kind === "envido-canto") {
    if (action === "canto-lo") return { canto: "envido" };
    if (action === "canto-hi") return { canto: "real" };
    return null;
  }
  if (ctx.kind === "truco-canto") {
    if (action !== "canto-lo") return null;
    const next = !h.trucoLevel
      ? "truco"
      : h.trucoLevel === "truco"
        ? "retruco"
        : h.trucoLevel === "retruco"
          ? "vale4"
          : null;
    if (!next) return null;
    return { canto: next };
  }
  return null;
}

interface CfrNode {
  legal: CfrAction[];
  regretSum: number[];
  strategySum: number[];
  n: number;
}

export class CfrTable {
  private nodes = new Map<string, CfrNode>();
  private kindStatsCache: Record<DecisionCtx["kind"], KindStats> | null = null;
  private invalidateStats() {
    this.kindStatsCache = null;
  }

  size(): number {
    return this.nodes.size;
  }
  totalVisits(): number {
    let t = 0;
    for (const n of this.nodes.values()) t += n.n;
    return t;
  }

  clear(): void {
    this.nodes.clear();
    this.invalidateStats();
  }
  mergeFrom(other: CfrTable): void {
    for (const [k, v] of other.nodes.entries()) {
      this.nodes.set(k, {
        legal: [...v.legal],
        regretSum: [...v.regretSum],
        strategySum: [...v.strategySum],
        n: v.n,
      });
    }
    this.invalidateStats();
  }

  prune(minVisits: number): number {
    let removed = 0;
    for (const [k, v] of this.nodes) {
      if (v.n < minVisits) {
        this.nodes.delete(k);
        removed++;
      }
    }
    if (removed) this.invalidateStats();
    return removed;
  }

  nodeVisits(key: string): number {
    return this.nodes.get(key)?.n ?? 0;
  }

  kindStats(): Record<DecisionCtx["kind"], KindStats> {
    if (this.kindStatsCache) return this.kindStatsCache;
    const out: Record<DecisionCtx["kind"], KindStats> = {
      "envido-respond": { nodes: 0, visits: 0, confidence: 0 },
      "truco-respond": { nodes: 0, visits: 0, confidence: 0 },
      "envido-canto": { nodes: 0, visits: 0, confidence: 0 },
      "truco-canto": { nodes: 0, visits: 0, confidence: 0 },
    };
    for (const [k, v] of this.nodes.entries()) {
      const kind = kindOfKey(k);
      if (!kind) continue;
      out[kind].nodes += 1;
      out[kind].visits += v.n;
    }
    for (const kind of Object.keys(out) as DecisionCtx["kind"][]) {
      out[kind].confidence = Math.min(1, out[kind].visits / TARGET_KIND_VISITS);
    }
    this.kindStatsCache = out;
    return out;
  }

  private getOrCreate(key: string, legal: CfrAction[]): CfrNode {
    let node = this.nodes.get(key);
    if (!node) {
      node = {
        legal: [...legal],
        regretSum: legal.map(() => 0),
        strategySum: legal.map(() => 0),
        n: 0,
      };
      this.nodes.set(key, node);
    }

    for (const a of legal) {
      if (!node.legal.includes(a)) {
        node.legal.push(a);
        node.regretSum.push(0);
        node.strategySum.push(0);
      }
    }
    return node;
  }

  strategy(key: string, legal: CfrAction[]): number[] {
    const node = this.getOrCreate(key, legal);
    const pos = node.regretSum.map((r) => (r > 0 ? r : 0));
    let sum = 0;
    for (let i = 0; i < node.legal.length; i++) {
      if (legal.includes(node.legal[i]!)) sum += pos[i]!;
    }
    const s = new Array(legal.length).fill(0);
    if (sum <= 0) {
      for (let i = 0; i < legal.length; i++) s[i] = 1 / legal.length;
      return s;
    }
    for (let i = 0; i < legal.length; i++) {
      const ix = node.legal.indexOf(legal[i]!);
      s[i] = pos[ix]! / sum;
    }
    return s;
  }

  averageStrategy(key: string, legal: CfrAction[]): number[] | null {
    const node = this.nodes.get(key);
    if (!node || node.n === 0) return null;
    let sum = 0;
    for (let i = 0; i < node.legal.length; i++) {
      if (legal.includes(node.legal[i]!)) sum += node.strategySum[i]!;
    }
    if (sum <= 0) return null;
    const s = new Array(legal.length).fill(0);
    for (let i = 0; i < legal.length; i++) {
      const ix = node.legal.indexOf(legal[i]!);
      s[i] = node.strategySum[ix]! / sum;
    }
    return s;
  }

  update(key: string, legal: CfrAction[], chosen: CfrAction, u: number, pi: number[]): void {
    const node = this.getOrCreate(key, legal);
    node.n += 1;
    const chosenLocal = legal.indexOf(chosen);
    if (chosenLocal < 0) return;
    const piChosen = Math.max(1e-4, pi[chosenLocal]!);
    for (let i = 0; i < legal.length; i++) {
      const ix = node.legal.indexOf(legal[i]!);
      const p = pi[i]!;
      const delta = i === chosenLocal ? u * (1 - piChosen) : -u * p;
      node.regretSum[ix] = (node.regretSum[ix] ?? 0) + delta;
      node.strategySum[ix] = (node.strategySum[ix] ?? 0) + p;
    }
    this.invalidateStats();
  }

  toJSON(): string {
    const obj: Record<string, [CfrAction[], number[], number[], number]> = {};
    for (const [k, v] of this.nodes.entries()) {
      const r = v.regretSum.map((x) => Math.round(x * 1e4) / 1e4);
      const s = v.strategySum.map((x) => Math.round(x * 1e4) / 1e4);
      obj[k] = [v.legal, r, s, v.n];
    }
    const wrapped = {
      v: CFR_ABSTRACTION_VERSION,
      generatedAt: Date.now(),
      nodes: obj,
    };
    return JSON.stringify(wrapped);
  }

  static fromJSON(s: string): CfrTable {
    const t = new CfrTable();
    t.loadInfo = { status: "empty", version: null, expected: CFR_ABSTRACTION_VERSION, nodes: 0 };
    try {
      const raw = JSON.parse(s) as unknown;
      const isWrapped =
        raw !== null &&
        typeof raw === "object" &&
        "v" in (raw as Record<string, unknown>) &&
        "nodes" in (raw as Record<string, unknown>);
      if (isWrapped) {
        const w = raw as {
          v: number;
          nodes: Record<string, [CfrAction[], number[], number[], number]>;
        };
        if (w.v !== CFR_ABSTRACTION_VERSION) {
          t.loadInfo = {
            status: "incompatible",
            version: w.v,
            expected: CFR_ABSTRACTION_VERSION,
            nodes: 0,
          };
          return t;
        }
        for (const [k, [legal, rs, ss, n]] of Object.entries(w.nodes)) {
          t.nodes.set(k, { legal, regretSum: rs, strategySum: ss, n });
        }
        t.loadInfo = {
          status: "ok",
          version: w.v,
          expected: CFR_ABSTRACTION_VERSION,
          nodes: t.nodes.size,
        };
      } else {
        if ((CFR_ABSTRACTION_VERSION as number) !== 1) {
          t.loadInfo = {
            status: "incompatible",
            version: 1,
            expected: CFR_ABSTRACTION_VERSION,
            nodes: 0,
          };
          return t;
        }
        const obj = raw as Record<string, [CfrAction[], number[], number[], number]>;
        for (const [k, [legal, rs, ss, n]] of Object.entries(obj)) {
          t.nodes.set(k, { legal, regretSum: rs, strategySum: ss, n });
        }
        t.loadInfo = {
          status: "legacy",
          version: null,
          expected: CFR_ABSTRACTION_VERSION,
          nodes: t.nodes.size,
        };
      }
    } catch {}
    return t;
  }

  loadInfo: {
    status: "ok" | "legacy" | "empty" | "incompatible";
    version: number | null;
    expected: number;
    nodes: number;
  } = { status: "empty", version: null, expected: CFR_ABSTRACTION_VERSION, nodes: 0 };
}

import cfrData from "@/lib/ai/truco/cfr-table.json";

export const globalCfr: CfrTable = CfrTable.fromJSON(
  typeof cfrData === "string" ? cfrData : JSON.stringify(cfrData ?? {}),
);

export function cfrEffectiveBlend(
  ctx: DecisionCtx,
  baseBlend: number,
  table: CfrTable = globalCfr,
): number {
  const b = Math.max(0, Math.min(1, baseBlend));
  if (b === 0) return 0;
  const kindConf = table.kindStats()[ctx.kind]?.confidence ?? 0;
  if (kindConf === 0) return 0;
  const nodeVisits = table.nodeVisits(ctx.key);
  const nodeConf = Math.min(1, nodeVisits / TARGET_NODE_VISITS);
  if (nodeConf === 0) return 0;
  return b * kindConf * nodeConf;
}

export function cfrPickAction(
  ctx: DecisionCtx,
  rng: () => number = Math.random,
  table: CfrTable = globalCfr,
): { action: CfrAction; strategy: number[] } | null {
  const avg = table.averageStrategy(ctx.key, ctx.legal);
  if (!avg) return null;

  const r = rng();
  let acc = 0;
  for (let i = 0; i < ctx.legal.length; i++) {
    acc += avg[i]!;
    if (r < acc) return { action: ctx.legal[i]!, strategy: avg };
  }
  return { action: ctx.legal[ctx.legal.length - 1]!, strategy: avg };
}

export function cfrBlendedAction(
  ctx: DecisionCtx,
  heuristicAction: CfrAction,
  blend: number,
  rng: () => number = Math.random,
  table: CfrTable = globalCfr,
): CfrAction | null {
  const avg = table.averageStrategy(ctx.key, ctx.legal);
  if (!avg) return null;

  const b = cfrEffectiveBlend(ctx, blend, table);
  if (b === 0) return heuristicAction;
  const mixed = ctx.legal.map((a, i) => {
    const cfrP = avg[i]!;
    const heurP = a === heuristicAction ? 1 : 0;
    return b * cfrP + (1 - b) * heurP;
  });

  const sum = mixed.reduce((a, b2) => a + b2, 0) || 1;
  const r = rng();
  let acc = 0;
  for (let i = 0; i < ctx.legal.length; i++) {
    acc += mixed[i]! / sum;
    if (r < acc) return ctx.legal[i]!;
  }
  return ctx.legal[ctx.legal.length - 1]!;
}
