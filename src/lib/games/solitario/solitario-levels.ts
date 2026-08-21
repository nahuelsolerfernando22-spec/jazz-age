export type SolitarioModifier =
  | { kind: "time-cap"; seconds: number }
  | { kind: "no-undo" }
  | { kind: "draw-3" }
  | { kind: "moves-cap"; max: number };

export interface SolitarioLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  modifiers: SolitarioModifier[];
  starThresholds: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: { one: number; two: number; three: number };
}

type Row = {
  title: string;
  subtitle: string;
  mods: SolitarioModifier[];
  stars: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: [number, number, number];
};

const ROWS: Row[] = [
  {
    title: "Primera Baraja",
    subtitle: "Vita reparte tranquila",
    mods: [],
    stars: [300, 480, 720],
    reward: [250, 400, 600],
  },
  {
    title: "Café Solo",
    subtitle: "sin apuro",
    mods: [],
    stars: [280, 460, 700],
    reward: [280, 440, 680],
  },
  {
    title: "Manos Rápidas",
    subtitle: "un solo redeal",
    mods: [],
    stars: [240, 400, 620],
    reward: [300, 480, 720],
  },
  {
    title: "Sin Vuelta Atrás",
    subtitle: "no se deshace",
    mods: [{ kind: "no-undo" }],
    stars: [300, 480, 720],
    reward: [340, 540, 820],
  },
  {
    title: "Tres del Mazo",
    subtitle: "de a tres",
    mods: [{ kind: "draw-3" }],
    stars: [360, 540, 800],
    reward: [380, 600, 900],
  },

  {
    title: "Reloj de Arena",
    subtitle: "corre el aliento",
    mods: [{ kind: "time-cap", seconds: 720 }],
    stars: [340, 520, 700],
    reward: [420, 660, 1000],
  },
  {
    title: "Frío en las Manos",
    subtitle: "menos jugadas",
    mods: [{ kind: "moves-cap", max: 220 }],
    stars: [340, 520, 780],
    reward: [440, 700, 1060],
  },
  {
    title: "Baraja Sucia",
    subtitle: "3 y sin deshacer",
    mods: [{ kind: "draw-3" }, { kind: "no-undo" }],
    stars: [360, 540, 800],
    reward: [480, 760, 1140],
  },
  {
    title: "Reloj Corto",
    subtitle: "y de a tres",
    mods: [{ kind: "draw-3" }, { kind: "time-cap", seconds: 600 }],
    stars: [320, 480, 600],
    reward: [520, 820, 1240],
  },
  {
    title: "EL NAIPE PERDIDO",
    subtitle: "Vita clava los ojos",
    mods: [{ kind: "draw-3" }, { kind: "no-undo" }, { kind: "time-cap", seconds: 600 }],
    stars: [300, 440, 600],
    boss: true,
    bossQuote: "Faltan cartas donde nadie mira, chico.",
    reward: [900, 1400, 2000],
  },

  {
    title: "Vuelta Prohibida",
    subtitle: "sin deshacer",
    mods: [{ kind: "no-undo" }, { kind: "draw-3" }],
    stars: [340, 500, 720],
    reward: [560, 880, 1320],
  },
  {
    title: "Jugadas Contadas",
    subtitle: "sin desperdicio",
    mods: [{ kind: "moves-cap", max: 180 }, { kind: "no-undo" }],
    stars: [320, 480, 720],
    reward: [600, 940, 1420],
  },
  {
    title: "Última Copa",
    subtitle: "menos tiempo",
    mods: [{ kind: "time-cap", seconds: 480 }, { kind: "no-undo" }],
    stars: [300, 420, 480],
    reward: [640, 1000, 1500],
  },
  {
    title: "Guante Negro",
    subtitle: "3, sin deshacer, corto",
    mods: [{ kind: "draw-3" }, { kind: "no-undo" }, { kind: "time-cap", seconds: 540 }],
    stars: [320, 460, 540],
    reward: [680, 1060, 1600],
  },
  {
    title: "Mano de Piedra",
    subtitle: "150 jugadas",
    mods: [{ kind: "moves-cap", max: 150 }, { kind: "draw-3" }],
    stars: [300, 460, 700],
    reward: [720, 1120, 1680],
  },

  {
    title: "Baraja Muda",
    subtitle: "no se deshace",
    mods: [{ kind: "no-undo" }, { kind: "draw-3" }, { kind: "moves-cap", max: 180 }],
    stars: [320, 460, 700],
    reward: [780, 1200, 1800],
  },
  {
    title: "Reloj Prusiano",
    subtitle: "corto y difícil",
    mods: [{ kind: "draw-3" }, { kind: "no-undo" }, { kind: "time-cap", seconds: 480 }],
    stars: [280, 400, 480],
    reward: [840, 1300, 1940],
  },
  {
    title: "Fichas Contadas",
    subtitle: "muy poco margen",
    mods: [{ kind: "moves-cap", max: 140 }, { kind: "no-undo" }, { kind: "draw-3" }],
    stars: [300, 440, 660],
    reward: [900, 1380, 2060],
  },
  {
    title: "Última Vuelta",
    subtitle: "reloj de 7 minutos",
    mods: [{ kind: "time-cap", seconds: 420 }, { kind: "draw-3" }],
    stars: [260, 360, 420],
    reward: [960, 1480, 2200],
  },
  {
    title: "LA BARAJA ROTA",
    subtitle: "Vita se saca el anillo",
    mods: [
      { kind: "draw-3" },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 140 },
      { kind: "time-cap", seconds: 420 },
    ],
    stars: [280, 380, 420],
    boss: true,
    bossQuote: "Cuando el mazo se rompe, el que pierde ya perdió antes.",
    reward: [1800, 2800, 4000],
  },

  {
    title: "Reloj de Piedra",
    subtitle: "no se para",
    mods: [{ kind: "time-cap", seconds: 360 }, { kind: "draw-3" }],
    stars: [240, 320, 360],
    reward: [1000, 1560, 2340],
  },
  {
    title: "Puño Cerrado",
    subtitle: "120 jugadas",
    mods: [{ kind: "moves-cap", max: 120 }, { kind: "draw-3" }, { kind: "no-undo" }],
    stars: [280, 400, 600],
    reward: [1060, 1640, 2460],
  },
  {
    title: "Frío del Fondo",
    subtitle: "8 min y sin deshacer",
    mods: [
      { kind: "time-cap", seconds: 480 },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 150 },
    ],
    stars: [320, 440, 480],
    reward: [1120, 1720, 2580],
  },
  {
    title: "Guantes Blancos",
    subtitle: "3, 100 jugadas, reloj",
    mods: [
      { kind: "draw-3" },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 110 },
      { kind: "time-cap", seconds: 420 },
    ],
    stars: [280, 380, 420],
    reward: [1180, 1820, 2720],
  },
  {
    title: "Sombra Larga",
    subtitle: "cinco capas",
    mods: [
      { kind: "draw-3" },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 100 },
      { kind: "time-cap", seconds: 360 },
    ],
    stars: [220, 320, 360],
    reward: [1260, 1940, 2900],
  },

  {
    title: "Baraja Fina",
    subtitle: "sin margen",
    mods: [
      { kind: "draw-3" },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 100 },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [200, 260, 300],
    reward: [1340, 2060, 3080],
  },
  {
    title: "Aliento Corto",
    subtitle: "cuatro minutos",
    mods: [
      { kind: "draw-3" },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 110 },
      { kind: "time-cap", seconds: 240 },
    ],
    stars: [160, 210, 240],
    reward: [1420, 2180, 3260],
  },
  {
    title: "Guante Negro",
    subtitle: "sin margen",
    mods: [
      { kind: "draw-3" },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 90 },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [180, 240, 300],
    reward: [1500, 2300, 3440],
  },
  {
    title: "Reloj Roto",
    subtitle: "tres y medio",
    mods: [
      { kind: "draw-3" },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 90 },
      { kind: "time-cap", seconds: 210 },
    ],
    stars: [140, 180, 210],
    reward: [1600, 2460, 3660],
  },
  {
    title: "EL RELOJ DE VITA",
    subtitle: "última mano",
    mods: [
      { kind: "draw-3" },
      { kind: "no-undo" },
      { kind: "moves-cap", max: 80 },
      { kind: "time-cap", seconds: 180 },
    ],
    stars: [120, 160, 180],
    boss: true,
    bossQuote: "Yo cierro el salón, muñeco. Hasta el mazo se cansa.",
    reward: [4000, 6500, 10000],
  },
];

export const SOLITARIO_LEVELS: SolitarioLevelDef[] = ROWS.map((r, i) => {
  const n = (i + 1).toString().padStart(2, "0");
  return {
    id: `SO${n}`,
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

export function findSolitarioLevel(id: string): SolitarioLevelDef | undefined {
  return SOLITARIO_LEVELS.find((l) => l.id === id);
}

export function solitarioLevelLabel(l: SolitarioLevelDef): string {
  const t = l.starThresholds[0];
  const min = Math.floor(t / 60);
  const s = t % 60;
  return `Ganá en ≤ ${min}:${s.toString().padStart(2, "0")} para 3★`;
}

export function solitarioModifierLabel(m: SolitarioModifier): string {
  switch (m.kind) {
    case "time-cap":
      return `${Math.floor(m.seconds / 60)}:${(m.seconds % 60).toString().padStart(2, "0")} máx`;
    case "no-undo":
      return "sin deshacer";
    case "draw-3":
      return "de a 3";
    case "moves-cap":
      return `${m.max} jugadas máx`;
  }
}

export function computeSolitarioStars(l: SolitarioLevelDef, elapsedSec: number): 0 | 1 | 2 | 3 {
  const [t3, t2, t1] = l.starThresholds;
  if (elapsedSec <= t3) return 3;
  if (elapsedSec <= t2) return 2;
  if (elapsedSec <= t1) return 1;
  return 0;
}
