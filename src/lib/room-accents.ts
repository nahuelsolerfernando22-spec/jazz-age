export type FloorAccent = "attic" | "upstairs" | "ground" | "cantina" | "basement";

export interface AccentTokens {
  glow: string;
  glowAlt: string;
  title: string;
  label: string;
}

const ACCENT_BY_FLOOR: Record<FloorAccent, AccentTokens> = {
  attic: {
    glow: "oklch(0.45 0.13 320 / 0.18)",
    glowAlt: "oklch(0.65 0.14 80 / 0.10)",
    title: "oklch(0.72 0.20 28)",
    label: "humo violeta",
  },

  upstairs: {
    glow: "oklch(0.42 0.12 260 / 0.20)",
    glowAlt: "oklch(0.80 0.04 240 / 0.10)",
    title: "oklch(0.74 0.18 30)",
    label: "medianoche",
  },

  ground: {
    glow: "oklch(0.32 0.18 25 / 0.16)",
    glowAlt: "oklch(0.65 0.14 80 / 0.10)",
    title: "oklch(0.70 0.22 24)",
    label: "burdeos clásico",
  },

  cantina: {
    glow: "oklch(0.52 0.13 145 / 0.20)",
    glowAlt: "oklch(0.68 0.15 55 / 0.16)",
    title: "oklch(0.74 0.18 45)",
    label: "absenta y ron",
  },

  basement: {
    glow: "oklch(0.45 0.10 130 / 0.22)",
    glowAlt: "oklch(0.55 0.14 75 / 0.14)",
    title: "oklch(0.68 0.20 22)",
    label: "mesa sucia",
  },
};

const ROOM_TO_FLOOR: Record<string, FloorAccent> = {
  despacho: "attic",

  "despacho-antesala": "attic",
  "despacho-privado": "attic",
  "despacho-lounge": "attic",
  retrete: "attic",
  "despacho-archivo": "attic",

  camerinos: "attic",
  terraza: "attic",

  tables: "upstairs",
  solitario: "upstairs",

  ruleta: "ground",
  salon: "ground",
  blackjack: "ground",
  ranking: "ground",
  ligas: "ground",

  slots: "cantina",
  bagatelle: "cantina",
  trastienda: "cantina",
  muelle: "cantina",
  pasadizo: "basement",

  dados: "basement",
  chinchon: "basement",
  mahjong: "basement",
};

export function accentFor(room: string | undefined): AccentTokens {
  if (!room) return ACCENT_BY_FLOOR.ground;
  const key = room.toLowerCase();
  const floor = ROOM_TO_FLOOR[key] ?? "ground";
  return ACCENT_BY_FLOOR[floor];
}
