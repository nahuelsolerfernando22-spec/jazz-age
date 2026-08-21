export type BagatelleRank = {
  tier: number;
  name: string;
  threshold: number;
  perks: {
    cashoutMul: number;
    magnetBonusMs: number;
    starLitBoost: number;
  };
};

export const BAGATELLE_RANKS: BagatelleRank[] = [
  {
    tier: 0,
    name: "Grumete",
    threshold: 0,
    perks: { cashoutMul: 1.0, magnetBonusMs: 0, starLitBoost: 0.0 },
  },
  {
    tier: 1,
    name: "Marinero de Cubierta",
    threshold: 5,
    perks: { cashoutMul: 1.03, magnetBonusMs: 300, starLitBoost: 0.02 },
  },
  {
    tier: 2,
    name: "Bandolero del Muelle",
    threshold: 12,
    perks: { cashoutMul: 1.06, magnetBonusMs: 500, starLitBoost: 0.04 },
  },
  {
    tier: 3,
    name: "Timonel del Cuervo",
    threshold: 22,
    perks: { cashoutMul: 1.09, magnetBonusMs: 700, starLitBoost: 0.06 },
  },
  {
    tier: 4,
    name: "Contramaestre",
    threshold: 35,
    perks: { cashoutMul: 1.12, magnetBonusMs: 900, starLitBoost: 0.08 },
  },
  {
    tier: 5,
    name: "Segundo de a Bordo",
    threshold: 55,
    perks: { cashoutMul: 1.15, magnetBonusMs: 1100, starLitBoost: 0.1 },
  },
  {
    tier: 6,
    name: "Capitán del Sur",
    threshold: 80,
    perks: { cashoutMul: 1.18, magnetBonusMs: 1300, starLitBoost: 0.12 },
  },
  {
    tier: 7,
    name: "Corsario Coronado",
    threshold: 115,
    perks: { cashoutMul: 1.21, magnetBonusMs: 1500, starLitBoost: 0.15 },
  },
  {
    tier: 8,
    name: "Almirante del Cuervo",
    threshold: 160,
    perks: { cashoutMul: 1.25, magnetBonusMs: 1800, starLitBoost: 0.18 },
  },
];

export const RANK_STORAGE_KEY = "bagatelle:missions:v1";

export function getRankForMissions(missions: number): BagatelleRank {
  let current = BAGATELLE_RANKS[0];
  for (const r of BAGATELLE_RANKS) {
    if (missions >= r.threshold) current = r;
    else break;
  }
  return current;
}

export function getNextRank(missions: number): BagatelleRank | null {
  for (const r of BAGATELLE_RANKS) {
    if (missions < r.threshold) return r;
  }
  return null;
}

export function loadMissionsCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(RANK_STORAGE_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function saveMissionsCount(n: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RANK_STORAGE_KEY, String(Math.max(0, Math.floor(n))));
  } catch {}
}

export type BankModeId =
  "lluvia-oro" | "vigilia" | "portal-cuervo" | "casa-nerviosa" | "lento-y-firme";

export type BankMode = {
  id: BankModeId;
  name: string;
  hint: string;
  color: string;
  scoreMul: number;
  gravityMul: number;
  bumperKickMul: number;
  portalOnGong: boolean;
};

export const BANK_MODES: BankMode[] = [
  {
    id: "lluvia-oro",
    name: "Lluvia de Oro",
    hint: "todos los bumpers y targets pagan doble",
    color: "oklch(0.86 0.18 78)",
    scoreMul: 2.0,
    gravityMul: 1.0,
    bumperKickMul: 1.0,
    portalOnGong: false,
  },
  {
    id: "vigilia",
    name: "Vigilia del Cuervo",
    hint: "gravedad baja, la bola flota más",
    color: "oklch(0.82 0.14 210)",
    scoreMul: 1.0,
    gravityMul: 0.72,
    bumperKickMul: 1.0,
    portalOnGong: false,
  },
  {
    id: "portal-cuervo",
    name: "Portal del Cuervo",
    hint: "el gong te teletransporta al jackpot",
    color: "oklch(0.55 0.22 330)",
    scoreMul: 1.0,
    gravityMul: 1.0,
    bumperKickMul: 1.0,
    portalOnGong: true,
  },
  {
    id: "casa-nerviosa",
    name: "Casa Nerviosa",
    hint: "bumpers golpean fuerte y pagan quíntuple",
    color: "oklch(0.75 0.20 30)",
    scoreMul: 5.0,
    gravityMul: 1.0,
    bumperKickMul: 1.35,
    portalOnGong: false,
  },
  {
    id: "lento-y-firme",
    name: "Lento y Firme",
    hint: "todo va al ralentí, mejor control",
    color: "oklch(0.70 0.14 155)",
    scoreMul: 1.5,
    gravityMul: 0.55,
    bumperKickMul: 0.85,
    portalOnGong: false,
  },
];

export const BANK_MODE_DURATION_MS = 20_000;

export function rollBankMode(): BankMode {
  return BANK_MODES[Math.floor(Math.random() * BANK_MODES.length)];
}
