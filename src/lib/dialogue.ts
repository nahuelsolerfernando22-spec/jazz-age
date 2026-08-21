import { useEffect, useRef, useState } from "react";
import { usePlayerMemory } from "@/store/player-memory";
import { getPlayerAlias } from "@/lib/player-alias";
import { getEventContext } from "@/lib/event-manager";
import { psychologyBias } from "@/lib/hostess-psychology";

export type Situation =
  | "greet"
  | "idle"
  | "win"
  | "lose"
  | "tense"
  | "flirty"
  | "angry"
  | "rumor"
  | "farewell"
  | "welcome"
  | "victory"
  | "defeat"
  | "tilt"
  | "flirty_closed"
  | "first_visit"
  | "return"
  | "regular"
  | "confidence"
  | "secret"
  | "pact";

export interface DialogueContext {
  npcId: string;
  situation: Situation;
  room?: string;
  hour?: number;
  extra?: Record<string, unknown>;
}

export interface DialogueEffects {
  setFlag?: string | string[];
  affinity?: number;
  rumor?: string;
}

export interface DialogueLine {
  id: string;
  text: string;
  when?: (ctx: DialogueContext, mem: ReturnType<typeof usePlayerMemory.getState>) => boolean;
  weight?: number;
  priority?: number;
  effects?: DialogueEffects;
}

interface Pack {
  npcId: string;
  lines: Partial<Record<Situation, DialogueLine[]>>;
}

const REGISTRY = new Map<string, Pack>();

export function registerDialoguePack(pack: Pack) {
  REGISTRY.set(pack.npcId, pack);
}

export function extendDialoguePack(
  npcId: string,
  extra: Partial<Record<Situation, DialogueLine[]>>,
) {
  const pack = REGISTRY.get(npcId);
  if (!pack) {
    REGISTRY.set(npcId, { npcId, lines: extra });
    return;
  }
  for (const [sit, lines] of Object.entries(extra) as [Situation, DialogueLine[]][]) {
    pack.lines[sit] = [...(pack.lines[sit] ?? []), ...lines];
  }
}

export function _resetRegistry() {
  REGISTRY.clear();
}

export function pickLine(ctx: DialogueContext): DialogueLine | null {
  const pack = REGISTRY.get(ctx.npcId);
  if (!pack) return null;
  const pool = pack.lines[ctx.situation] ?? [];
  if (pool.length === 0) return null;

  const mem = usePlayerMemory.getState();
  const hour = ctx.hour ?? new Date().getHours();
  const enrichedCtx: DialogueContext = { ...ctx, hour };

  const eligible = pool.filter((l) => !l.when || l.when(enrichedCtx, mem));
  if (eligible.length === 0) return pool[0] ?? null;

  const maxPrio = Math.max(...eligible.map((l) => l.priority ?? 0));
  const top = eligible.filter((l) => (l.priority ?? 0) === maxPrio);

  const weightOf = (l: DialogueLine) =>
    (l.weight ?? 1) * psychologyBias(ctx.npcId, ctx.situation, l.id);
  const totalW = top.reduce((a, l) => a + weightOf(l), 0);
  let r = Math.random() * totalW;
  for (const l of top) {
    r -= weightOf(l);
    if (r <= 0) return l;
  }
  return top[top.length - 1];
}

export function applyEffects(line: DialogueLine, npcId: string) {
  if (!line.effects) return;
  const mem = usePlayerMemory.getState();
  const { setFlag, affinity, rumor } = line.effects;
  if (setFlag) {
    const flags = Array.isArray(setFlag) ? setFlag : [setFlag];
    flags.forEach((f) => mem.setFlag(f, true));
  }
  if (typeof affinity === "number") mem.bumpAffinity(npcId, affinity);
  if (rumor) mem.hearRumor(rumor);
}

export function useDialogueLine(ctx: DialogueContext): string | null {
  const line = pickLine(ctx);
  return line?.text ?? null;
}

export function speak(ctx: DialogueContext): string | null {
  const line = pickLine(ctx);
  if (!line) return null;
  applyEffects(line, ctx.npcId);
  return interpolate(line.text);
}

export function interpolate(text: string): string {
  if (!text.includes("{")) return text;
  return text.replace(/\{alias\}/g, getPlayerAlias());
}

export function _debugRegistrySize() {
  return REGISTRY.size;
}

export function useNpcSpeak(
  npcId: string,
  trigger: Situation | null,
  opts: { room?: string } = {},
): string | null {
  const lastTriggerRef = useRef<Situation | null>(null);
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!trigger) return;
    if (lastTriggerRef.current === trigger) return;
    lastTriggerRef.current = trigger;
    const evt = getEventContext();
    const line = speak({
      npcId,
      situation: trigger,
      room: opts.room,
      hour: evt.hour,
      extra: { timeBand: evt.timeBand, season: evt.season, featured: evt.featuredHostess },
    });
    setText(line);
  }, [npcId, trigger, opts.room]);
  return text;
}

export function pickConditionalLine(
  npcId: string,
  reputation: number,
  room?: string,
): string | null {
  const tiers: Array<{ min: number; sit: Situation }> = [
    { min: 40, sit: "pact" },
    { min: 25, sit: "secret" },
    { min: 15, sit: "confidence" },
    { min: 5, sit: "regular" },
  ];
  const hour = new Date().getHours();
  for (const { min, sit } of tiers) {
    if (reputation < min) continue;
    const line = pickLine({ npcId, situation: sit, room, hour });
    if (line) return interpolate(line.text);
  }
  return null;
}
