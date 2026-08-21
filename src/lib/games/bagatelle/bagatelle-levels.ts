export type BagatelleObjective =
  | { kind: "score"; target: number }
  | { kind: "jackpots"; count: number }
  | { kind: "combo"; length: number }
  | { kind: "clean"; count: number };

export type BagatelleModifier =
  | { kind: "ball-cap"; balls: number }
  | { kind: "time-cap"; seconds: number }
  | { kind: "curse-penalty"; extra: number }
  | { kind: "min-stake"; min: number }
  | { kind: "cap-jackpot"; max: number }
  | { kind: "heavy-ball"; label: string }
  | { kind: "dark-flippers"; label: string }
  | { kind: "no-safety" };

export interface BagatelleLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  budget: number;
  ballLimit: number;
  objective: BagatelleObjective;
  modifiers: BagatelleModifier[];
  starThresholds: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: { one: number; two: number; three: number };
}

function objLabel(o: BagatelleObjective): string {
  switch (o.kind) {
    case "score":
      return `Ganá ${o.target.toLocaleString("es-AR")} fichas netas`;
    case "jackpots":
      return `Sacá ${o.count} jackpot${o.count === 1 ? "" : "s"}`;
    case "combo":
      return `Encadená ${o.length} bolas ganadoras`;
    case "clean":
      return `${o.count} bolas ganadoras sin maldición`;
  }
}

type Row = {
  title: string;
  subtitle: string;
  obj: BagatelleObjective;
  mods?: BagatelleModifier[];
  budget?: number;
  balls?: number;
  stars: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward?: [number, number, number];
};

const ROWS: Row[] = [
  {
    title: "Primera Bola",
    subtitle: "Lola te guía la mano",
    obj: { kind: "score", target: 250 },
    stars: [4, 6, 10],
  },
  {
    title: "Cebolla Cruda",
    subtitle: "sin pretensiones, sin trampas",
    obj: { kind: "score", target: 400 },
    stars: [5, 7, 12],
  },
  {
    title: "Cuervo Pícaro",
    subtitle: "una bola ganadora, nada más",
    obj: { kind: "combo", length: 2 },
    stars: [4, 6, 10],
  },
  {
    title: "Bumper Suave",
    subtitle: "los bumpers todavía te quieren",
    obj: { kind: "score", target: 600 },
    stars: [6, 8, 12],
  },
  {
    title: "Ronda Corta",
    subtitle: "primer jackpot cantado",
    obj: { kind: "jackpots", count: 1 },
    stars: [5, 8, 12],
  },

  {
    title: "Marea Baja",
    subtitle: "el reloj empieza a correr",
    obj: { kind: "score", target: 900 },
    mods: [{ kind: "time-cap", seconds: 180 }],
    stars: [7, 10, 14],
  },
  {
    title: "Tilt Alegre",
    subtitle: "menos bolas, más cuidado",
    obj: { kind: "score", target: 1100 },
    mods: [{ kind: "ball-cap", balls: 10 }],
    stars: [7, 10, 14],
  },
  {
    title: "Puertas Cerradas",
    subtitle: "apuesta mínima decente",
    obj: { kind: "combo", length: 3 },
    mods: [{ kind: "min-stake", min: 20 }],
    stars: [6, 9, 12],
  },
  {
    title: "Rebote Muerto",
    subtitle: "las maldiciones cobran caro",
    obj: { kind: "score", target: 1400 },
    mods: [{ kind: "curse-penalty", extra: 80 }],
    stars: [8, 11, 15],
  },
  {
    title: "El Basurero",
    subtitle: "vino a llevarse tus fichas",
    obj: { kind: "score", target: 1800 },
    mods: [
      { kind: "curse-penalty", extra: 120 },
      { kind: "ball-cap", balls: 9 },
    ],
    stars: [7, 10, 14],
    boss: true,
    bossQuote: "Yo no juego, encanto. Yo recojo lo que dejás caer.",
    reward: [700, 1400, 2800],
  },

  {
    title: "Doble Bumper",
    subtitle: "los rebotes se aprovechan",
    obj: { kind: "score", target: 2000 },
    mods: [
      { kind: "time-cap", seconds: 200 },
      { kind: "curse-penalty", extra: 100 },
    ],
    stars: [10, 13, 17],
  },
  {
    title: "Calles Ciegas",
    subtitle: "algunos carriles no cuentan",
    obj: { kind: "jackpots", count: 2 },
    mods: [
      { kind: "min-stake", min: 25 },
      { kind: "ball-cap", balls: 12 },
    ],
    stars: [8, 11, 14],
  },
  {
    title: "Gravedad Amiga",
    subtitle: "pero la bola pesa raro",
    obj: { kind: "clean", count: 4 },
    mods: [
      { kind: "heavy-ball", label: "bola pesada" },
      { kind: "time-cap", seconds: 200 },
    ],
    stars: [8, 11, 14],
  },
  {
    title: "Reloj Torcido",
    subtitle: "menos tiempo del que pensás",
    obj: { kind: "score", target: 2600 },
    mods: [
      { kind: "time-cap", seconds: 160 },
      { kind: "curse-penalty", extra: 120 },
    ],
    stars: [10, 13, 17],
  },
  {
    title: "Tres Bolas",
    subtitle: "combo cerrado con estilo",
    obj: { kind: "combo", length: 4 },
    mods: [{ kind: "no-safety" }, { kind: "min-stake", min: 30 }],
    stars: [8, 11, 14],
  },

  {
    title: "Sin Multi",
    subtitle: "el jackpot rinde menos",
    obj: { kind: "score", target: 3200 },
    mods: [
      { kind: "cap-jackpot", max: 250 },
      { kind: "time-cap", seconds: 200 },
      { kind: "curse-penalty", extra: 150 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "Silbato Roto",
    subtitle: "sin red, sin perdón",
    obj: { kind: "jackpots", count: 3 },
    mods: [
      { kind: "no-safety" },
      { kind: "ball-cap", balls: 12 },
      { kind: "curse-penalty", extra: 150 },
    ],
    stars: [10, 13, 16],
  },
  {
    title: "Bumper Zurdo",
    subtitle: "los flippers no responden bien",
    obj: { kind: "score", target: 3800 },
    mods: [
      { kind: "dark-flippers", label: "flippers ciegos" },
      { kind: "time-cap", seconds: 180 },
      { kind: "curse-penalty", extra: 180 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "Fila Sellada",
    subtitle: "combos largos o nada",
    obj: { kind: "combo", length: 5 },
    mods: [{ kind: "no-safety" }, { kind: "min-stake", min: 35 }, { kind: "ball-cap", balls: 14 }],
    stars: [8, 11, 14],
  },
  {
    title: "La Marea",
    subtitle: "sube la gravedad, sube el precio",
    obj: { kind: "score", target: 5000 },
    mods: [
      { kind: "heavy-ball", label: "gravedad alta" },
      { kind: "curse-penalty", extra: 250 },
      { kind: "time-cap", seconds: 180 },
    ],
    stars: [12, 16, 20],
    boss: true,
    bossQuote: "La marea sube. Nadie discute con la marea.",
    reward: [1400, 2800, 5600],
  },

  {
    title: "Gravedad Rota",
    subtitle: "bola pesada, curas caras",
    obj: { kind: "score", target: 6000 },
    mods: [
      { kind: "heavy-ball", label: "gravedad rota" },
      { kind: "curse-penalty", extra: 250 },
      { kind: "time-cap", seconds: 180 },
      { kind: "min-stake", min: 40 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "Bola Pesada",
    subtitle: "el flipper llega tarde",
    obj: { kind: "clean", count: 6 },
    mods: [
      { kind: "heavy-ball", label: "bola pesada" },
      { kind: "no-safety" },
      { kind: "ball-cap", balls: 14 },
      { kind: "curse-penalty", extra: 200 },
    ],
    stars: [10, 13, 16],
  },
  {
    title: "Punta Muerta",
    subtitle: "sin margen para la miss",
    obj: { kind: "score", target: 7000 },
    mods: [
      { kind: "no-safety" },
      { kind: "curse-penalty", extra: 250 },
      { kind: "time-cap", seconds: 180 },
      { kind: "min-stake", min: 45 },
    ],
    stars: [13, 17, 22],
  },
  {
    title: "Multibolar",
    subtitle: "más jackpots, mejor pago",
    obj: { kind: "jackpots", count: 4 },
    mods: [
      { kind: "cap-jackpot", max: 400 },
      { kind: "curse-penalty", extra: 250 },
      { kind: "time-cap", seconds: 200 },
      { kind: "ball-cap", balls: 16 },
    ],
    stars: [12, 15, 18],
  },
  {
    title: "Rejugable",
    subtitle: "ficha mínima alta",
    obj: { kind: "score", target: 8500 },
    mods: [
      { kind: "min-stake", min: 60 },
      { kind: "curse-penalty", extra: 250 },
      { kind: "cap-jackpot", max: 400 },
      { kind: "time-cap", seconds: 200 },
    ],
    stars: [12, 16, 20],
  },

  {
    title: "Sin Piedad",
    subtitle: "todo lo aprendido junto",
    obj: { kind: "score", target: 10000 },
    mods: [
      { kind: "no-safety" },
      { kind: "curse-penalty", extra: 300 },
      { kind: "heavy-ball", label: "gravedad rota" },
      { kind: "min-stake", min: 50 },
      { kind: "time-cap", seconds: 200 },
    ],
    stars: [13, 17, 22],
  },
  {
    title: "Bumper Loco",
    subtitle: "cinco combos limpios",
    obj: { kind: "clean", count: 7 },
    mods: [
      { kind: "no-safety" },
      { kind: "heavy-ball", label: "bola pesada" },
      { kind: "dark-flippers", label: "flippers ciegos" },
      { kind: "min-stake", min: 50 },
      { kind: "ball-cap", balls: 16 },
    ],
    stars: [10, 13, 16],
  },
  {
    title: "Última Bola",
    subtitle: "cinco jackpots, casi nada",
    obj: { kind: "jackpots", count: 5 },
    mods: [
      { kind: "ball-cap", balls: 12 },
      { kind: "cap-jackpot", max: 500 },
      { kind: "curse-penalty", extra: 300 },
      { kind: "time-cap", seconds: 160 },
      { kind: "min-stake", min: 60 },
    ],
    stars: [8, 10, 12],
  },
  {
    title: "Desafío Final",
    subtitle: "el tablero entero contra vos",
    obj: { kind: "score", target: 13000 },
    mods: [
      { kind: "heavy-ball", label: "bola pesada" },
      { kind: "dark-flippers", label: "flippers ciegos" },
      { kind: "curse-penalty", extra: 350 },
      { kind: "no-safety" },
      { kind: "min-stake", min: 60 },
    ],
    stars: [14, 18, 22],
  },
  {
    title: "El Zurdo Ciego",
    subtitle: "sin ver, sin flipper derecho",
    obj: { kind: "score", target: 20000 },
    mods: [
      { kind: "dark-flippers", label: "sin flipper derecho" },
      { kind: "heavy-ball", label: "gravedad rota" },
      { kind: "curse-penalty", extra: 500 },
      { kind: "no-safety" },
      { kind: "min-stake", min: 80 },
      { kind: "time-cap", seconds: 240 },
    ],
    stars: [16, 20, 26],
    boss: true,
    bossQuote: "Cierro los ojos y aún oigo caer tus fichas. Bendito ruido.",
    reward: [5000, 10000, 20000],
  },
];

function budgetFor(o: BagatelleObjective, boss: boolean, i: number): number {
  const base = o.kind === "score" ? Math.round(o.target * 0.7) : 250 + i * 45;
  return boss ? Math.round(base * 1.4) : base;
}
function ballsFor(stars: [number, number, number], mods: BagatelleModifier[]): number {
  const cap = mods.find((m) => m.kind === "ball-cap");
  if (cap && cap.kind === "ball-cap") return cap.balls;
  return Math.round(stars[2] * 1.6);
}
function defaultReward(order: number, boss: boolean): [number, number, number] {
  const base = 100 + order * 40;
  const mult = boss ? 5 : 1;
  return [base * mult, base * 2 * mult, base * 4 * mult];
}

export const BAGATELLE_LEVELS: BagatelleLevelDef[] = ROWS.map((r, i) => {
  const order = i + 1;
  const boss = !!r.boss;
  const mods = r.mods ?? [];
  const [one, two, three] = r.reward ?? defaultReward(order, boss);
  return {
    id: `BG${String(order).padStart(2, "0")}`,
    order,
    title: r.title,
    subtitle: r.subtitle,
    budget: r.budget ?? budgetFor(r.obj, boss, order),
    ballLimit: r.balls ?? ballsFor(r.stars, mods),
    objective: r.obj,
    modifiers: mods,
    starThresholds: r.stars,
    boss,
    bossQuote: r.bossQuote,
    reward: { one, two, three },
  };
});

export function findBagatelleLevel(id: string): BagatelleLevelDef | undefined {
  return BAGATELLE_LEVELS.find((l) => l.id === id);
}

export function bagatelleLevelLabel(l: BagatelleLevelDef): string {
  return objLabel(l.objective);
}

export function bagatelleModifierLabel(m: BagatelleModifier): string {
  switch (m.kind) {
    case "ball-cap":
      return `${m.balls} bolas`;
    case "time-cap":
      return `${m.seconds}s`;
    case "curse-penalty":
      return `maldición -${m.extra}`;
    case "min-stake":
      return `ficha ≥ ${m.min}`;
    case "cap-jackpot":
      return `jackpot ≤ ${m.max}`;
    case "heavy-ball":
      return m.label;
    case "dark-flippers":
      return m.label;
    case "no-safety":
      return "sin red";
  }
}

export function computeBagatelleStars(level: BagatelleLevelDef, ballsUsed: number): 0 | 1 | 2 | 3 {
  const [t3, t2, t1] = level.starThresholds;
  if (ballsUsed <= t3) return 3;
  if (ballsUsed <= t2) return 2;
  if (ballsUsed <= t1) return 1;
  return 1;
}
