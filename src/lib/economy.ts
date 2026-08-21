import {
  getAffinity,
  getLevel,
  awardAffectionOnWin,
  registerHostessLoss,
  type WinMagnitude,
} from "./affinity";
import { useLives } from "@/store/lives";
import { useMembership } from "@/store/membership";
import { recordMatch } from "./hostess-learning";
import { bumpRivalry } from "./hostess-rivalry";

export function awardLifeOnWin(): boolean {
  const member = useMembership.getState().member;
  if (member) return false;
  useLives.getState().award();
  return true;
}

export function registerHostessMatchResult(
  npcId: string | undefined,
  outcome: { won: boolean; magnitude?: WinMagnitude; skipNemesis?: boolean; tag?: string },
) {
  if (!npcId) return null;
  const magnitude = outcome.magnitude ?? "normal";
  if (!outcome.skipNemesis) {
    const hostessWon = !outcome.won;
    const margin = magnitude === "big" ? 20 : 8;
    try {
      recordMatch(npcId, { hostessWon });
      bumpRivalry(npcId, {
        hostessWon,
        margin,
        dominantTag: outcome.tag ?? null,
      });
    } catch {
      // Nemesis es opcional: si falla no debe cortar el cierre de partida.
    }
  }
  if (!outcome.won) {
    registerHostessLoss(npcId);
    return null;
  }
  return awardAffectionOnWin(npcId, magnitude);
}

export type GameTone = "street" | "salon" | "alto";

export type GameKey =
  | "ruleta"
  | "tables"
  | "mahjong"
  | "dados"
  | "bagatelle"
  | "chinchon"
  | "truco"
  | "escoba"
  | "solitario";

export const GAME_TONE: Record<GameKey, GameTone> = {
  bagatelle: "street",
  escoba: "street",

  ruleta: "salon",
  tables: "salon",
  chinchon: "salon",
  dados: "salon",
  truco: "salon",

  mahjong: "alto",
  solitario: "alto",
};

export const GAME_HOSTESS: Partial<Record<GameKey, string>> = {
  ruleta: "clara",
  tables: "vita",
  mahjong: "lin",
  dados: "zelda",
  bagatelle: "lola",
  chinchon: "luisa",
  truco: "eulalia",
  escoba: "bettie",
  solitario: "jade",
};

export const HIGH_STAKES_ENTRY_COST = 5;

export const TONE_BASE_ANTE: Record<GameTone, number> = {
  street: 10,
  salon: 50,
  alto: 200,
};

export interface TableEconomy {
  game: GameKey;
  tone: GameTone;
  hostess: string | undefined;
  baseAnte: number;
  ante: number;
  discountPct: number;
  highStakesEntry: number;
  affinityLevel: number;
}

export function getTableEconomy(game: GameKey, overrideAnte?: number): TableEconomy {
  const tone = GAME_TONE[game];
  const hostess = GAME_HOSTESS[game];
  const baseAnte = overrideAnte ?? TONE_BASE_ANTE[tone];
  return {
    game,
    tone,
    hostess,
    baseAnte,
    ante: discountedAnte(baseAnte, hostess),
    discountPct: Math.round(getAnteDiscount(hostess) * 100),

    highStakesEntry: 0,
    affinityLevel: hostess ? getLevel(hostess) : 0,
  };
}

const ANTE_DISCOUNT_BY_LEVEL: readonly number[] = [0, 0.05, 0.1, 0.18, 0.3, 0.45, 0.6, 0.75];

export function getAnteDiscount(npcId: string | undefined): number {
  if (!npcId) return 0;
  const lvl = getLevel(npcId);
  return ANTE_DISCOUNT_BY_LEVEL[lvl] ?? 0;
}

export function discountedAnte(baseAnte: number, npcId: string | undefined): number {
  const d = getAnteDiscount(npcId);
  if (d <= 0) return Math.max(1, Math.floor(baseAnte));
  return Math.max(1, Math.floor(baseAnte * (1 - d)));
}

export function getHighStakesEntryCost(npcId: string | undefined): number {
  if (!npcId) return HIGH_STAKES_ENTRY_COST;
  const lvl = getLevel(npcId);
  if (lvl >= 5 && !highStakesWaiverUsedToday(npcId)) return 0;
  return HIGH_STAKES_ENTRY_COST;
}

export function socialRewardOnWin(game: GameKey): number {
  const tone = GAME_TONE[game];
  if (tone === "alto") return 3;
  if (tone === "salon") return 1;
  return 0;
}

const META_KEY = "speakeasy:economy:meta:v1";

interface EconomyMeta {
  lastStipend?: string;
  lastTip: Record<string, string>;
  lastWaiver: Record<string, string>;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadMeta(): EconomyMeta {
  if (typeof window === "undefined") return { lastTip: {}, lastWaiver: {} };
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return { lastTip: {}, lastWaiver: {} };
    const parsed = JSON.parse(raw);
    return {
      lastStipend: parsed.lastStipend,
      lastTip: parsed.lastTip ?? {},
      lastWaiver: parsed.lastWaiver ?? {},
    };
  } catch {
    return { lastTip: {}, lastWaiver: {} };
  }
}
function saveMeta(m: EconomyMeta) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {}
}

export interface StipendOffer {
  chips: number;
  favors: number;
  available: boolean;
}

export function previewStipend(level: number): { chips: number; favors: number } {
  const safe = Math.max(1, level | 0);
  return {
    chips: 500 + (safe - 1) * 250,
    favors: Math.floor((safe - 1) / 5) + 1,
  };
}

export function stipendOffer(level: number): StipendOffer {
  const { chips, favors } = previewStipend(level);
  const meta = loadMeta();
  return { chips, favors, available: meta.lastStipend !== todayKey() };
}

export function claimStipend(level: number): { chips: number; favors: number } | null {
  const meta = loadMeta();
  if (meta.lastStipend === todayKey()) return null;
  const out = previewStipend(level);
  meta.lastStipend = todayKey();
  saveMeta(meta);
  return out;
}

const TIP_BY_LEVEL: readonly number[] = [0, 1, 1, 2, 3, 5, 8, 13];
export function tipForLevel(level: number): number {
  return TIP_BY_LEVEL[level] ?? 0;
}

export interface NpcTipOffer {
  npcId: string;
  level: number;
  amount: number;
  available: boolean;
}

export function npcTipOffer(npcId: string): NpcTipOffer {
  const level = getLevel(npcId);
  const amount = tipForLevel(level);
  const meta = loadMeta();
  return {
    npcId,
    level,
    amount,
    available: amount > 0 && meta.lastTip[npcId] !== todayKey(),
  };
}

export function claimNpcTip(npcId: string): number {
  const offer = npcTipOffer(npcId);
  if (!offer.available || offer.amount <= 0) return 0;
  const meta = loadMeta();
  meta.lastTip[npcId] = todayKey();
  saveMeta(meta);
  return offer.amount;
}

export function pendingTips(npcIds: string[]): NpcTipOffer[] {
  return npcIds.map((id) => npcTipOffer(id)).filter((o) => o.available && o.amount > 0);
}

export function highStakesWaiverUsedToday(npcId: string): boolean {
  return loadMeta().lastWaiver[npcId] === todayKey();
}

export function markHighStakesWaiverUsed(npcId: string) {
  const meta = loadMeta();
  meta.lastWaiver[npcId] = todayKey();
  saveMeta(meta);
}

export interface FormatEconomyLineOptions {
  hostessLabel?: string;
  prefix?: string;
  showBaseAnte?: boolean;
}

export function formatEconomyLine(econ: TableEconomy, opts: FormatEconomyLineOptions = {}): string {
  const { hostessLabel, prefix = "Mesa alta", showBaseAnte = true } = opts;
  const parts: string[] = [prefix];
  if (showBaseAnte) parts.push(`ante base ${econ.baseAnte}¢`);
  if (econ.discountPct > 0) {
    parts.push(
      hostessLabel
        ? `−${econ.discountPct}% por afecto con ${hostessLabel}`
        : `−${econ.discountPct}% por afecto`,
    );
  }
  parts.push(
    econ.highStakesEntry > 0 ? `entrada ${econ.highStakesEntry}🪶` : "entrada gratis hoy 🪶",
  );
  return parts.join(" · ");
}

export const TIPPABLE_NPCS: string[] = [
  "corvina",
  "daphne",
  "vita",
  "zulme",
  "perla",
  "zelda",
  "lola",
  "pilar",
  "eloise",
  "yolanda",
  "remedios",
  "crescencia",
  "jade",
  "anahit",
  "mirla",
  "madge",
  "luciera",
  "bettie",
  "eulalia",
  "may",
];

export function tippableActive(): string[] {
  return TIPPABLE_NPCS.filter((id) => getAffinity(id) > 0);
}
