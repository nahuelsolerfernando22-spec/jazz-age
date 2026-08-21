import { getRivalry } from "./hostess-rivalry";

export type LadderTier = "desconocida" | "curiosa" | "rival" | "nemesis" | "archienemiga";

export interface TierMeta {
  id: LadderTier;
  label: string;
  glyph: string;
  color: string;
}

export const TIER_META: Record<LadderTier, TierMeta> = {
  desconocida: {
    id: "desconocida",
    label: "Desconocida",
    glyph: "·",
    color: "var(--smoke)",
  },
  curiosa: {
    id: "curiosa",
    label: "Curiosa",
    glyph: "·",
    color: "var(--brass)",
  },
  rival: {
    id: "rival",
    label: "Rival",
    glyph: "★",
    color: "var(--brass-bright)",
  },
  nemesis: {
    id: "nemesis",
    label: "Némesis",
    glyph: "🔥",
    color: "var(--oxblood)",
  },
  archienemiga: {
    id: "archienemiga",
    label: "Archienemiga",
    glyph: "🩸",
    color: "var(--blood)",
  },
};

const ORDER: LadderTier[] = ["desconocida", "curiosa", "rival", "nemesis", "archienemiga"];

export function tierOf(hostessId: string | null | undefined): LadderTier {
  if (!hostessId) return "desconocida";
  const r = getRivalry(hostessId);
  const total = r.wins + r.losses;
  if (r.wins >= 12 || r.humiliations >= 5) return "archienemiga";
  if (r.wins >= 5 || r.humiliations >= 2) return "nemesis";
  if (total >= 3) return "rival";
  if (total >= 1) return "curiosa";
  return "desconocida";
}

export function tierIsVisible(tier: LadderTier): boolean {
  return ORDER.indexOf(tier) >= ORDER.indexOf("rival");
}

export function tierBoostFor(hostessId: string | null | undefined): {
  aggressionBoost: number;
  errorRate: number;
  callBluffMargin: number;
} {
  const t = tierOf(hostessId);
  switch (t) {
    case "rival":
      return { aggressionBoost: 0.03, errorRate: -0.01, callBluffMargin: -0.03 };
    case "nemesis":
      return { aggressionBoost: 0.06, errorRate: -0.03, callBluffMargin: -0.08 };
    case "archienemiga":
      return { aggressionBoost: 0.1, errorRate: -0.05, callBluffMargin: -0.14 };
    default:
      return { aggressionBoost: 0, errorRate: 0, callBluffMargin: 0 };
  }
}
