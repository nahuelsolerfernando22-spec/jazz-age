export type ChinchonModifier =
  | { kind: "time-cap"; seconds: number }
  | { kind: "point-goal"; target: number }
  | { kind: "no-second-life" }
  | { kind: "cpu-headstart"; points: number };

export interface ChinchonLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  modifiers: ChinchonModifier[];
  starThresholds: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: { one: number; two: number; three: number };
}

type Row = {
  title: string;
  subtitle: string;
  mods: ChinchonModifier[];
  stars: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: [number, number, number];
};

const ROWS: Row[] = [
  {
    title: "Primera Mano",
    subtitle: "Pilar acomoda la baraja",
    mods: [{ kind: "point-goal", target: 50 }],
    stars: [300, 480, 720],
    reward: [250, 400, 600],
  },
  {
    title: "Café con Naipes",
    subtitle: "sin apuro",
    mods: [{ kind: "point-goal", target: 60 }],
    stars: [340, 520, 780],
    reward: [280, 440, 680],
  },
  {
    title: "La Baraja Corta",
    subtitle: "clásico de casa",
    mods: [{ kind: "point-goal", target: 80 }],
    stars: [420, 620, 900],
    reward: [320, 500, 760],
  },
  {
    title: "Cierre Justo",
    subtitle: "sin segunda vida",
    mods: [{ kind: "point-goal", target: 80 }, { kind: "no-second-life" }],
    stars: [420, 600, 880],
    reward: [360, 560, 840],
  },
  {
    title: "Reloj de Mesa",
    subtitle: "con apuro",
    mods: [
      { kind: "point-goal", target: 80 },
      { kind: "time-cap", seconds: 600 },
    ],
    stars: [360, 500, 600],
    reward: [400, 620, 940],
  },

  {
    title: "Pilar Sonríe",
    subtitle: "empieza a apretar",
    mods: [{ kind: "point-goal", target: 100 }],
    stars: [520, 740, 1080],
    reward: [460, 720, 1080],
  },
  {
    title: "Ventaja de la Casa",
    subtitle: "ella arranca arriba",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "cpu-headstart", points: 20 },
    ],
    stars: [500, 700, 1000],
    reward: [500, 780, 1160],
  },
  {
    title: "Sin Rescate",
    subtitle: "una sola vida",
    mods: [{ kind: "point-goal", target: 100 }, { kind: "no-second-life" }],
    stars: [500, 700, 1000],
    reward: [540, 840, 1260],
  },
  {
    title: "Reloj Corto",
    subtitle: "diez minutos",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "time-cap", seconds: 600 },
      { kind: "no-second-life" },
    ],
    stars: [420, 540, 600],
    reward: [580, 900, 1340],
  },
  {
    title: "LA BARAJA",
    subtitle: "Pilar afila la mirada",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "cpu-headstart", points: 30 },
      { kind: "no-second-life" },
      { kind: "time-cap", seconds: 720 },
    ],
    stars: [420, 560, 720],
    boss: true,
    bossQuote: "Chinchón, muñeco. Y no me hagas repetirlo.",
    reward: [900, 1400, 2000],
  },

  {
    title: "Cuero Duro",
    subtitle: "primera venta",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "cpu-headstart", points: 15 },
    ],
    stars: [500, 700, 1000],
    reward: [620, 960, 1440],
  },
  {
    title: "Sin Descanso",
    subtitle: "sin segunda vida",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "no-second-life" },
      { kind: "cpu-headstart", points: 20 },
    ],
    stars: [480, 680, 960],
    reward: [660, 1020, 1520],
  },
  {
    title: "Salón Vacío",
    subtitle: "reloj corto",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "time-cap", seconds: 540 },
    ],
    stars: [380, 480, 540],
    reward: [700, 1080, 1620],
  },
  {
    title: "Baraja Marcada",
    subtitle: "empieza perdiendo",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "cpu-headstart", points: 40 },
    ],
    stars: [500, 700, 1000],
    reward: [740, 1140, 1720],
  },
  {
    title: "Fría Como el Hielo",
    subtitle: "una vida, corto",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "no-second-life" },
      { kind: "time-cap", seconds: 540 },
    ],
    stars: [380, 480, 540],
    reward: [780, 1200, 1800],
  },

  {
    title: "Cuenta Cerrada",
    subtitle: "sin rescates",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "no-second-life" },
      { kind: "cpu-headstart", points: 30 },
    ],
    stars: [460, 640, 900],
    reward: [820, 1260, 1900],
  },
  {
    title: "Mesa Larga",
    subtitle: "120 puntos",
    mods: [{ kind: "point-goal", target: 120 }],
    stars: [560, 780, 1140],
    reward: [860, 1320, 1980],
  },
  {
    title: "Sombra de la Casa",
    subtitle: "arranca +40",
    mods: [
      { kind: "point-goal", target: 120 },
      { kind: "cpu-headstart", points: 40 },
    ],
    stars: [540, 760, 1060],
    reward: [900, 1380, 2060],
  },
  {
    title: "Guante Corto",
    subtitle: "reloj de 9",
    mods: [
      { kind: "point-goal", target: 120 },
      { kind: "time-cap", seconds: 540 },
      { kind: "no-second-life" },
    ],
    stars: [380, 480, 540],
    reward: [940, 1440, 2160],
  },
  {
    title: "EL CHINCHÓN",
    subtitle: "Pilar se saca los anillos",
    mods: [
      { kind: "point-goal", target: 120 },
      { kind: "cpu-headstart", points: 50 },
      { kind: "no-second-life" },
      { kind: "time-cap", seconds: 660 },
    ],
    stars: [420, 540, 660],
    boss: true,
    bossQuote: "Cerrá o pagá. En mi mesa no hay término medio.",
    reward: [1800, 2800, 4000],
  },

  {
    title: "Aliento Corto",
    subtitle: "ocho minutos",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "time-cap", seconds: 480 },
      { kind: "no-second-life" },
    ],
    stars: [340, 420, 480],
    reward: [980, 1500, 2260],
  },
  {
    title: "Baraja Sucia",
    subtitle: "+50 de arranque",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "cpu-headstart", points: 50 },
      { kind: "no-second-life" },
    ],
    stars: [420, 580, 820],
    reward: [1040, 1600, 2400],
  },
  {
    title: "Reloj Roto",
    subtitle: "siete minutos",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "time-cap", seconds: 420 },
    ],
    stars: [300, 380, 420],
    reward: [1120, 1720, 2560],
  },
  {
    title: "Cuenta Prusiana",
    subtitle: "corto y sin vida",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "no-second-life" },
      { kind: "time-cap", seconds: 420 },
      { kind: "cpu-headstart", points: 30 },
    ],
    stars: [300, 380, 420],
    reward: [1200, 1840, 2740],
  },
  {
    title: "Guante Blanco",
    subtitle: "una mano decide",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "no-second-life" },
      { kind: "cpu-headstart", points: 60 },
    ],
    stars: [380, 520, 720],
    reward: [1280, 1960, 2920],
  },

  {
    title: "Sombra Larga",
    subtitle: "reloj de 6",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "time-cap", seconds: 360 },
      { kind: "no-second-life" },
    ],
    stars: [260, 320, 360],
    reward: [1360, 2080, 3100],
  },
  {
    title: "Baraja Fina",
    subtitle: "sin margen",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "no-second-life" },
      { kind: "cpu-headstart", points: 60 },
      { kind: "time-cap", seconds: 420 },
    ],
    stars: [280, 360, 420],
    reward: [1440, 2200, 3280],
  },
  {
    title: "Aliento del Cuervo",
    subtitle: "cinco minutos",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "time-cap", seconds: 300 },
      { kind: "no-second-life" },
    ],
    stars: [220, 260, 300],
    reward: [1520, 2320, 3460],
  },
  {
    title: "Guante Negro",
    subtitle: "sin misericordia",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "no-second-life" },
      { kind: "cpu-headstart", points: 70 },
      { kind: "time-cap", seconds: 360 },
    ],
    stars: [240, 300, 360],
    reward: [1600, 2440, 3640],
  },
  {
    title: "EL RELOJ DE PILAR",
    subtitle: "última mano",
    mods: [
      { kind: "point-goal", target: 100 },
      { kind: "no-second-life" },
      { kind: "cpu-headstart", points: 80 },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [200, 260, 300],
    boss: true,
    bossQuote: "El chinchón se canta una sola vez. Hoy me toca a mí.",
    reward: [4000, 6500, 10000],
  },
];

export const CHINCHON_LEVELS: ChinchonLevelDef[] = ROWS.map((r, i) => {
  const n = (i + 1).toString().padStart(2, "0");
  return {
    id: `CH${n}`,
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

export function findChinchonLevel(id: string): ChinchonLevelDef | undefined {
  return CHINCHON_LEVELS.find((l) => l.id === id);
}

export function chinchonLevelLabel(l: ChinchonLevelDef): string {
  const t = l.starThresholds[0];
  const min = Math.floor(t / 60);
  const s = t % 60;
  return `Ganá el match en ≤ ${min}:${s.toString().padStart(2, "0")} para 3★`;
}

export function chinchonModifierLabel(m: ChinchonModifier): string {
  switch (m.kind) {
    case "time-cap":
      return `${Math.floor(m.seconds / 60)}:${(m.seconds % 60).toString().padStart(2, "0")} máx`;
    case "point-goal":
      return `a ${m.target} puntos`;
    case "no-second-life":
      return "sin 2da vida";
    case "cpu-headstart":
      return `CPU +${m.points}`;
  }
}

export function computeChinchonStars(l: ChinchonLevelDef, elapsedSec: number): 0 | 1 | 2 | 3 {
  const [t3, t2, t1] = l.starThresholds;
  if (elapsedSec <= t3) return 3;
  if (elapsedSec <= t2) return 2;
  if (elapsedSec <= t1) return 1;
  return 0;
}
