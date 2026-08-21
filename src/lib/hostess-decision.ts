import type { HostessAiProfile } from "./hostess-ai";
import { getHostessPlaystyle, type HostessPlaystyle } from "./hostess-playstyle";
import { traitOf, weaknessOf } from "./hostess-rivalry";
import { tierBoostFor } from "./hostess-ladder";
import { dominantPattern } from "./hostess-episodic";
import { getLevelInfo, MAX_AFFECTION_LEVEL } from "./affinity";

function affectionAdaptScale(hostessId: string): number {
  try {
    const info = getLevelInfo(hostessId);
    const t = info.level / MAX_AFFECTION_LEVEL;
    return 0.7 + 0.6 * t;
  } catch {
    return 1;
  }
}

function applyCounterAdapt(
  curves: DecisionCurves,
  hostessId: string | null | undefined,
): DecisionCurves {
  if (!hostessId) return curves;
  const dom = dominantPattern(hostessId);
  if (!dom) return curves;
  const scale = affectionAdaptScale(hostessId);
  const w = Math.min(1, (dom.ratio - 0.4) / 0.5) * scale;
  const tag = dom.tag;
  const out = { ...curves };

  if (tag.startsWith("bluff:")) {
    out.trustThreshold = clamp01(out.trustThreshold - 0.18 * w);
    out.callBluffMargin = Math.max(0, out.callBluffMargin - 0.22 * w);
    out.errorRate = Math.max(0, out.errorRate - 0.04 * w);
  } else if (tag.startsWith("raise:") || tag.startsWith("all-in")) {
    out.aggressionBoost *= 1 + 0.18 * w;
    out.errorRate = Math.max(0, out.errorRate - 0.05 * w);
    out.callBluffMargin = Math.max(0, out.callBluffMargin - 0.1 * w);
  } else if (tag.startsWith("opening:")) {
    out.errorRate = Math.max(0, out.errorRate - 0.06 * w);
    out.bluffChance = clamp01(out.bluffChance - 0.1 * w);
    out.thinkingMs = Math.max(200, Math.round(out.thinkingMs * (1 - 0.15 * w)));
  } else if (tag.startsWith("capture-lost:") || tag.startsWith("capture:")) {
    out.memoryWeight = clamp01(out.memoryWeight + 0.12 * w);
    out.errorRate = Math.max(0, out.errorRate - 0.03 * w);
  } else if (tag === "long-turn" || tag === "long-turn:auto") {
    out.aggressionBoost *= 1 + 0.1 * w;
    out.thinkingMs = Math.max(200, Math.round(out.thinkingMs * (1 - 0.25 * w)));
  } else if (tag.startsWith("insult")) {
    out.bluffChance = clamp01(out.bluffChance + 0.1 * w);
    out.aggressionBoost *= 1 + 0.08 * w;
  } else {
    out.errorRate = Math.max(0, out.errorRate - 0.02 * w);
    out.memoryWeight = clamp01(out.memoryWeight + 0.05 * w);
  }
  return out;
}

function sigmoid(x: number, k = 6): number {
  return 1 / (1 + Math.exp(-k * (x - 0.5)));
}
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export interface DecisionCurves {
  bluffChance: number;
  aggressionBoost: number;
  trustThreshold: number;
  thinkingMs: number;
  errorRate: number;
  memoryWeight: number;
  callBluffMargin: number;
}

export function decisionCurves(p: HostessAiProfile): DecisionCurves {
  return {
    bluffChance: 0.05 + 0.65 * sigmoid(p.bluff),
    aggressionBoost: 0.75 + 1.0 * sigmoid(p.aggression),
    trustThreshold: 0.85 - 0.6 * sigmoid(p.memory),
    thinkingMs: Math.round(400 + 1000 * sigmoid(p.patience) + 300 * (1 - p.skill)),
    errorRate: 0.22 * (1 - sigmoid(p.skill, 10)),
    memoryWeight: sigmoid(p.memory),
    callBluffMargin: 0.5 - 0.45 * sigmoid(p.memory),
  };
}

export interface DecisionContext {
  phase?: number;
  behind?: number;
}

export function decisionCurvesFor(
  profile: HostessAiProfile,
  hostessId: string | null | undefined,
  ctx: DecisionContext = {},
): DecisionCurves {
  const style: HostessPlaystyle = getHostessPlaystyle(hostessId);
  const phase = clamp01(ctx.phase ?? 0.5);
  const behind = Math.max(-1, Math.min(1, ctx.behind ?? 0));
  const base = decisionCurves(profile);

  const endgameKick = 1 + 0.35 * style.endgamePush * phase;

  const comebackKick = behind > 0 ? behind * style.comebackFactor : 0;

  const bluffPhase = (style.bluffTiming - 0.5) * 2 * (phase - 0.5) * 2;

  const openingSafety = (1 - phase) * style.openingBook;

  const counterSharp = behind > 0.3 ? style.counterPunch * 0.15 : 0;

  const curves: DecisionCurves = {
    ...base,
    bluffChance: clamp01(base.bluffChance * (1 + 0.4 * bluffPhase)),
    aggressionBoost: base.aggressionBoost * endgameKick * (1 + 0.25 * comebackKick),
    errorRate: Math.max(
      0,
      base.errorRate * (1 - 0.5 * openingSafety) * (1 - 0.6 * comebackKick) * (1 - counterSharp),
    ),
    trustThreshold: clamp01(base.trustThreshold - 0.15 * phase),
    callBluffMargin: Math.max(0, base.callBluffMargin - 0.2 * phase),
    thinkingMs: Math.max(250, Math.round(base.thinkingMs * (1 - 0.3 * Math.max(0, behind)))),
  };

  if (hostessId && weaknessOf(hostessId)) {
    curves.callBluffMargin = Math.max(0, curves.callBluffMargin - 0.15);
    curves.aggressionBoost *= 1.08;
    curves.errorRate = Math.max(0, curves.errorRate - 0.03);
  }

  const trait = hostessId ? traitOf(hostessId) : null;
  if (trait) {
    const m = trait.modifier;
    if (m.aggressionBoost) curves.aggressionBoost *= 1 + m.aggressionBoost;
    if (m.errorRate) curves.errorRate = Math.max(0, curves.errorRate + m.errorRate);
    if (m.bluffChance) curves.bluffChance = clamp01(curves.bluffChance + m.bluffChance);
    if (m.callBluffMargin)
      curves.callBluffMargin = Math.max(0, curves.callBluffMargin + m.callBluffMargin);
    if (m.thinkingMs) curves.thinkingMs = Math.max(200, curves.thinkingMs + m.thinkingMs);
  }

  if (hostessId) {
    const boost = tierBoostFor(hostessId);
    if (boost.aggressionBoost) curves.aggressionBoost *= 1 + boost.aggressionBoost;
    if (boost.errorRate) curves.errorRate = Math.max(0, curves.errorRate + boost.errorRate);
    if (boost.callBluffMargin)
      curves.callBluffMargin = Math.max(0, curves.callBluffMargin + boost.callBluffMargin);
  }

  return applyCounterAdapt(curves, hostessId);
}
