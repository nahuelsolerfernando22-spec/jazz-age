export type LeagueTierId = "cobre" | "laton" | "plata" | "oro" | "esmeralda" | "cuervo";

export interface LeagueTier {
  id: LeagueTierId;
  name: string;
  rewardMult: number;
  color: string;
  glow: string;
}

export const LEAGUE_TIERS: LeagueTier[] = [
  {
    id: "cobre",
    name: "Cobre",
    rewardMult: 1.0,
    color: "oklch(0.62 0.13 50)",
    glow: "oklch(0.75 0.15 55)",
  },
  {
    id: "laton",
    name: "Latón",
    rewardMult: 1.5,
    color: "oklch(0.72 0.14 80)",
    glow: "oklch(0.85 0.18 85)",
  },
  {
    id: "plata",
    name: "Plata",
    rewardMult: 2.2,
    color: "oklch(0.82 0.02 240)",
    glow: "oklch(0.95 0.02 240)",
  },
  {
    id: "oro",
    name: "Oro",
    rewardMult: 3.5,
    color: "oklch(0.80 0.17 85)",
    glow: "oklch(0.92 0.20 90)",
  },
  {
    id: "esmeralda",
    name: "Esmeralda",
    rewardMult: 5.5,
    color: "oklch(0.58 0.18 155)",
    glow: "oklch(0.78 0.22 155)",
  },
  {
    id: "cuervo",
    name: "Cuervo Dorado",
    rewardMult: 9.0,
    color: "oklch(0.72 0.20 30)",
    glow: "oklch(0.90 0.22 65)",
  },
];

export function tierIndex(id: LeagueTierId): number {
  return LEAGUE_TIERS.findIndex((t) => t.id === id);
}

export function tierAt(idx: number): LeagueTier {
  const clamped = Math.max(0, Math.min(LEAGUE_TIERS.length - 1, idx));
  return LEAGUE_TIERS[clamped];
}

const BOT_NAMES = [
  "Mickey «Botones»",
  "Sal «el Cura»",
  "Lou «Doblefichas»",
  "Hank «Tres Dedos»",
  "Tessa «la Lengua»",
  "Rita «Mediasrotas»",
  "Don «el Húngaro»",
  "Vinnie «Pespunte»",
  "Margot «la Húngara»",
  "Eddie «Coñac»",
  "Sandy «Sevillana»",
  "Polack Jim",
  "Bessie «Lápiz»",
  "Kid «Sietevidas»",
  "Mama Lulú",
  "Ozzie «Carbón»",
  "Babs «la Sirena»",
  "Frenchie LaPorte",
  "Otto «Bigotes»",
  "Lila «Manodura»",
  "Carmine «el Reloj»",
  "Pearl «Espejito»",
  "Dutch Schmidt",
  "Gypsy Joe",
  "Wanda «Tres Cartas»",
  "Bruno «Linterna»",
  "Sissy «Mancha»",
];

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LeagueBot {
  name: string;
  target: number;
  pace: number;
}

const BASE_TARGET_BY_TIER: Record<LeagueTierId, number> = {
  cobre: 800,
  laton: 1500,
  plata: 2800,
  oro: 4800,
  esmeralda: 8000,
  cuervo: 14000,
};

export function generateBots(daySeed: number, tier: LeagueTierId): LeagueBot[] {
  const r = rng(daySeed ^ (tierIndex(tier) * 9176));
  const base = BASE_TARGET_BY_TIER[tier];
  const pool = [...BOT_NAMES];
  const out: LeagueBot[] = [];
  for (let i = 0; i < 9; i++) {
    const idx = Math.floor(r() * pool.length);
    const name = pool.splice(idx, 1)[0] ?? `Don Nadie ${i}`;
    const variance = 0.55 + r() * 0.9;
    const pace = 0.5 + r() * 0.95;
    out.push({
      name,
      target: Math.round(base * variance),
      pace,
    });
  }
  return out;
}

export function botPointsAt(bot: LeagueBot, dayProgress: number): number {
  const t = Math.min(1, Math.max(0, dayProgress));

  const eased = Math.pow(t, 1 / (0.6 + bot.pace * 0.8));
  return Math.round(bot.target * eased);
}

export function dayKey(date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function dayProgress(date = new Date()): number {
  const ms = date.getHours() * 3600_000 + date.getMinutes() * 60_000 + date.getSeconds() * 1000;
  return ms / 86_400_000;
}

export type LeagueOutcome = "promo" | "stay" | "demote";

export function resolveOutcome(playerRank: number, totalPlayers: number): LeagueOutcome {
  const topCut = Math.ceil(totalPlayers * 0.25);
  const bottomCut = totalPlayers - Math.floor(totalPlayers * 0.25);
  if (playerRank <= topCut) return "promo";
  if (playerRank > bottomCut) return "demote";
  return "stay";
}
