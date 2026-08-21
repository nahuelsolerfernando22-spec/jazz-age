export type TrucoModifier =
  | { kind: "time-cap"; seconds: number }
  | { kind: "point-goal"; target: 15 | 30 }
  | { kind: "no-envido" }
  | { kind: "no-flor" }
  | { kind: "cpu-headstart"; points: number };

export interface TrucoLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  modifiers: TrucoModifier[];
  starThresholds: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: { one: number; two: number; three: number };
}

type Row = {
  title: string;
  subtitle: string;
  mods: TrucoModifier[];
  stars: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: [number, number, number];
};

const ROWS: Row[] = [
  {
    title: "Primera Mano",
    subtitle: "la Parda te enseña",
    mods: [{ kind: "point-goal", target: 15 }],
    stars: [300, 480, 720],
    reward: [250, 400, 600],
  },
  {
    title: "Envido de Barrio",
    subtitle: "clásico",
    mods: [{ kind: "point-goal", target: 15 }],
    stars: [320, 500, 760],
    reward: [280, 440, 680],
  },
  {
    title: "Sin Envido",
    subtitle: "puro truco",
    mods: [{ kind: "point-goal", target: 15 }, { kind: "no-envido" }],
    stars: [280, 440, 660],
    reward: [320, 500, 760],
  },
  {
    title: "Sin Flor",
    subtitle: "no hay flor",
    mods: [{ kind: "point-goal", target: 15 }, { kind: "no-flor" }],
    stars: [300, 460, 700],
    reward: [360, 560, 840],
  },
  {
    title: "Reloj Corto",
    subtitle: "con apuro",
    mods: [
      { kind: "point-goal", target: 15 },
      { kind: "time-cap", seconds: 420 },
    ],
    stars: [280, 380, 420],
    reward: [400, 620, 940],
  },

  {
    title: "Mano Larga",
    subtitle: "a 30 puntos",
    mods: [{ kind: "point-goal", target: 30 }],
    stars: [520, 760, 1100],
    reward: [460, 720, 1080],
  },
  {
    title: "Casa Adelantada",
    subtitle: "la Parda arranca +6",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 6 },
    ],
    stars: [500, 720, 1040],
    reward: [500, 780, 1160],
  },
  {
    title: "Puro Truco",
    subtitle: "sin envidos",
    mods: [{ kind: "point-goal", target: 30 }, { kind: "no-envido" }],
    stars: [500, 720, 1040],
    reward: [540, 840, 1260],
  },
  {
    title: "Reloj de Cantina",
    subtitle: "12 minutos",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "time-cap", seconds: 720 },
    ],
    stars: [480, 620, 720],
    reward: [580, 900, 1340],
  },
  {
    title: "LA PARDA",
    subtitle: "canta y no perdona",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 10 },
      { kind: "no-flor" },
      { kind: "time-cap", seconds: 720 },
    ],
    stars: [480, 600, 720],
    boss: true,
    bossQuote: "Vale cuatro. Y en mi mesa no hay reto que valga.",
    reward: [900, 1400, 2000],
  },

  {
    title: "Sin Ceremonia",
    subtitle: "ni envido ni flor",
    mods: [{ kind: "point-goal", target: 30 }, { kind: "no-envido" }, { kind: "no-flor" }],
    stars: [460, 660, 940],
    reward: [620, 960, 1440],
  },
  {
    title: "Cuero Duro",
    subtitle: "+8 de arranque",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 8 },
    ],
    stars: [500, 720, 1040],
    reward: [660, 1020, 1520],
  },
  {
    title: "Reloj Prusiano",
    subtitle: "10 minutos",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "time-cap", seconds: 600 },
    ],
    stars: [420, 520, 600],
    reward: [700, 1080, 1620],
  },
  {
    title: "Mesa Marcada",
    subtitle: "+10 de arranque",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 10 },
      { kind: "no-envido" },
    ],
    stars: [460, 640, 900],
    reward: [740, 1140, 1720],
  },
  {
    title: "Fría Como Piedra",
    subtitle: "corto y sin flor",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "time-cap", seconds: 540 },
      { kind: "no-flor" },
    ],
    stars: [380, 460, 540],
    reward: [780, 1200, 1800],
  },

  {
    title: "Cuenta Cerrada",
    subtitle: "sin envido ni flor",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "no-envido" },
      { kind: "no-flor" },
      { kind: "cpu-headstart", points: 6 },
    ],
    stars: [440, 620, 880],
    reward: [820, 1260, 1900],
  },
  {
    title: "Barra de Boliche",
    subtitle: "ambiente pesado",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 12 },
    ],
    stars: [500, 720, 1040],
    reward: [860, 1320, 1980],
  },
  {
    title: "Sombra de la Casa",
    subtitle: "+14 y sin envido",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 14 },
      { kind: "no-envido" },
    ],
    stars: [500, 700, 1000],
    reward: [900, 1380, 2060],
  },
  {
    title: "Guante Corto",
    subtitle: "9 minutos",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "time-cap", seconds: 540 },
      { kind: "no-flor" },
      { kind: "cpu-headstart", points: 8 },
    ],
    stars: [400, 480, 540],
    reward: [940, 1440, 2160],
  },
  {
    title: "EL VALE CUATRO",
    subtitle: "la Parda saca la voz",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 16 },
      { kind: "no-envido" },
      { kind: "no-flor" },
      { kind: "time-cap", seconds: 600 },
    ],
    stars: [400, 500, 600],
    boss: true,
    bossQuote: "Vale cuatro y mano. Andá pagando, criatura.",
    reward: [1800, 2800, 4000],
  },

  {
    title: "Aliento Corto",
    subtitle: "ocho minutos",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "time-cap", seconds: 480 },
      { kind: "no-flor" },
    ],
    stars: [340, 420, 480],
    reward: [980, 1500, 2260],
  },
  {
    title: "Baraja Sucia",
    subtitle: "+16 de arranque",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 16 },
      { kind: "no-envido" },
    ],
    stars: [420, 580, 820],
    reward: [1040, 1600, 2400],
  },
  {
    title: "Reloj Roto",
    subtitle: "siete minutos",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "time-cap", seconds: 420 },
    ],
    stars: [300, 380, 420],
    reward: [1120, 1720, 2560],
  },
  {
    title: "Cuenta Prusiana",
    subtitle: "corto y sin nada",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "no-envido" },
      { kind: "no-flor" },
      { kind: "time-cap", seconds: 420 },
      { kind: "cpu-headstart", points: 10 },
    ],
    stars: [300, 380, 420],
    reward: [1200, 1840, 2740],
  },
  {
    title: "Guante Blanco",
    subtitle: "una mano decide",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 20 },
      { kind: "no-flor" },
    ],
    stars: [400, 540, 760],
    reward: [1280, 1960, 2920],
  },

  {
    title: "Sombra Larga",
    subtitle: "reloj de 6",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "time-cap", seconds: 360 },
      { kind: "no-envido" },
    ],
    stars: [260, 320, 360],
    reward: [1360, 2080, 3100],
  },
  {
    title: "Baraja Fina",
    subtitle: "sin margen",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 20 },
      { kind: "no-envido" },
      { kind: "no-flor" },
      { kind: "time-cap", seconds: 420 },
    ],
    stars: [280, 360, 420],
    reward: [1440, 2200, 3280],
  },
  {
    title: "Aliento del Cuervo",
    subtitle: "cinco minutos",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "time-cap", seconds: 300 },
      { kind: "no-flor" },
    ],
    stars: [220, 260, 300],
    reward: [1520, 2320, 3460],
  },
  {
    title: "Guante Negro",
    subtitle: "sin misericordia",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 24 },
      { kind: "no-envido" },
      { kind: "no-flor" },
      { kind: "time-cap", seconds: 360 },
    ],
    stars: [240, 300, 360],
    reward: [1600, 2440, 3640],
  },
  {
    title: "EL RELOJ DE LA PARDA",
    subtitle: "última mano",
    mods: [
      { kind: "point-goal", target: 30 },
      { kind: "cpu-headstart", points: 28 },
      { kind: "no-envido" },
      { kind: "no-flor" },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [200, 260, 300],
    boss: true,
    bossQuote: "La noche es mía y hasta el reloj me acompaña.",
    reward: [4000, 6500, 10000],
  },
];

export const TRUCO_LEVELS: TrucoLevelDef[] = ROWS.map((r, i) => {
  const n = (i + 1).toString().padStart(2, "0");
  return {
    id: `TR${n}`,
    order: i + 1,
    title: r.title,
    subtitle: r.subtitle,
    modifiers: r.mods,
    starThresholds: r.stars,
    boss: r.boss,
    bossQuote: r.bossQuote,
    reward: { one: r.reward[0], two: r.reward[1], three: r.reward[2] },
  };
});

export function findTrucoLevel(id: string): TrucoLevelDef | undefined {
  return TRUCO_LEVELS.find((l) => l.id === id);
}

export function trucoLevelLabel(l: TrucoLevelDef): string {
  const t = l.starThresholds[0];
  const min = Math.floor(t / 60);
  const s = t % 60;
  return `Ganá la partida en ≤ ${min}:${s.toString().padStart(2, "0")} para 3★`;
}

export function trucoModifierLabel(m: TrucoModifier): string {
  switch (m.kind) {
    case "time-cap":
      return `${Math.floor(m.seconds / 60)}:${(m.seconds % 60).toString().padStart(2, "0")} máx`;
    case "point-goal":
      return `a ${m.target}`;
    case "no-envido":
      return "sin envido";
    case "no-flor":
      return "sin flor";
    case "cpu-headstart":
      return `CPU +${m.points}`;
  }
}

export function computeTrucoStars(l: TrucoLevelDef, elapsedSec: number): 0 | 1 | 2 | 3 {
  const [t3, t2, t1] = l.starThresholds;
  if (elapsedSec <= t3) return 3;
  if (elapsedSec <= t2) return 2;
  if (elapsedSec <= t1) return 1;
  return 0;
}
