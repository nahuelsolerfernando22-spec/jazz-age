export type EscobaObjective =
  | { kind: "rounds"; count: number }
  | { kind: "sweeps"; count: number }
  | { kind: "captures"; count: number }
  | { kind: "oros"; count: number }
  | { kind: "siete"; count: number }
  | { kind: "points"; target: number };

export type EscobaModifier =
  | { kind: "round-cap"; rounds: number }
  | { kind: "time-cap"; seconds: number }
  | { kind: "min-capture"; min: number }
  | { kind: "no-sweep-bonus" }
  | { kind: "weak-hand"; label: string }
  | { kind: "cpu-headstart"; points: number }
  | { kind: "tax-cpu-sweep"; extra: number }
  | { kind: "hard-target"; extra: number }
  | { kind: "min-round-points"; min: number };

export interface EscobaLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  budget: number;
  roundLimit: number;
  objective: EscobaObjective;
  modifiers: EscobaModifier[];
  starThresholds: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: { one: number; two: number; three: number };
}

function objLabel(o: EscobaObjective): string {
  switch (o.kind) {
    case "rounds":
      return `Ganá ${o.count} rondas`;
    case "sweeps":
      return `Hacé ${o.count} escoba${o.count === 1 ? "" : "s"}`;
    case "captures":
      return `Capturá ${o.count} cartas`;
    case "oros":
      return `Capturá ${o.count} oros`;
    case "siete":
      return `Llevate el 7 de oros ${o.count} vez${o.count === 1 ? "" : "es"}`;
    case "points":
      return `Sacá ${o.target} puntos netos`;
  }
}

type Row = {
  title: string;
  subtitle: string;
  obj: EscobaObjective;
  mods?: EscobaModifier[];
  budget?: number;
  rounds?: number;
  stars: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward?: [number, number, number];
};

const ROWS: Row[] = [
  {
    title: "Primera Barrida",
    subtitle: "la mesa te sonríe",
    obj: { kind: "rounds", count: 1 },
    stars: [1, 2, 3],
  },
  {
    title: "Sietes Sueltos",
    subtitle: "un oro cae al piso",
    obj: { kind: "oros", count: 3 },
    stars: [2, 3, 5],
  },
  {
    title: "Oros al Rincón",
    subtitle: "cuatro cartas, ni una más",
    obj: { kind: "captures", count: 8 },
    stars: [2, 3, 5],
  },
  {
    title: "Suma 15",
    subtitle: "la escoba primera",
    obj: { kind: "sweeps", count: 1 },
    stars: [2, 3, 5],
  },
  {
    title: "Contando Cartas",
    subtitle: "dos rondas prolijas",
    obj: { kind: "rounds", count: 2 },
    stars: [3, 4, 6],
  },

  {
    title: "Doña Beata",
    subtitle: "el reloj empieza a rezar",
    obj: { kind: "rounds", count: 2 },
    mods: [{ kind: "time-cap", seconds: 300 }],
    stars: [3, 4, 6],
  },
  {
    title: "El Contador Chico",
    subtitle: "la casa cuenta cada oro",
    obj: { kind: "oros", count: 6 },
    mods: [{ kind: "tax-cpu-sweep", extra: 5 }],
    stars: [3, 5, 7],
  },
  {
    title: "Cortas Rápidas",
    subtitle: "menos rondas, más nervio",
    obj: { kind: "sweeps", count: 2 },
    mods: [{ kind: "round-cap", rounds: 4 }],
    stars: [3, 4, 5],
  },
  {
    title: "Mesa Corta",
    subtitle: "capturas chicas no cuentan",
    obj: { kind: "captures", count: 12 },
    mods: [{ kind: "min-capture", min: 2 }],
    stars: [3, 4, 6],
  },
  {
    title: "La Beata",
    subtitle: "reza mientras te lleva los oros",
    obj: { kind: "points", target: 8 },
    mods: [
      { kind: "cpu-headstart", points: 5 },
      { kind: "round-cap", rounds: 5 },
    ],
    stars: [3, 4, 6],
    boss: true,
    bossQuote: "Rezaré por vos, cielo. Mientras me quedo con los oros.",
    reward: [700, 1400, 2800],
  },

  {
    title: "Oro Quema",
    subtitle: "el 7 pesa el doble",
    obj: { kind: "siete", count: 2 },
    mods: [
      { kind: "time-cap", seconds: 280 },
      { kind: "tax-cpu-sweep", extra: 8 },
    ],
    stars: [4, 6, 8],
  },
  {
    title: "Contador Lento",
    subtitle: "cada oro es sagrado",
    obj: { kind: "oros", count: 10 },
    mods: [
      { kind: "cpu-headstart", points: 6 },
      { kind: "min-capture", min: 2 },
    ],
    stars: [4, 6, 8],
  },
  {
    title: "Rival Lector",
    subtitle: "sabe qué carta tenés",
    obj: { kind: "rounds", count: 3 },
    mods: [
      { kind: "weak-hand", label: "mano mocha" },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [4, 5, 7],
  },
  {
    title: "Escoba Doble",
    subtitle: "sin bonus por barrer",
    obj: { kind: "sweeps", count: 3 },
    mods: [{ kind: "no-sweep-bonus" }, { kind: "round-cap", rounds: 6 }],
    stars: [4, 5, 7],
  },
  {
    title: "Ronda Ciega",
    subtitle: "cortita y sin margen",
    obj: { kind: "points", target: 12 },
    mods: [
      { kind: "cpu-headstart", points: 8 },
      { kind: "time-cap", seconds: 240 },
    ],
    stars: [4, 5, 6],
  },

  {
    title: "Sietes Marcados",
    subtitle: "el oro cuesta caro perderlo",
    obj: { kind: "siete", count: 3 },
    mods: [
      { kind: "tax-cpu-sweep", extra: 10 },
      { kind: "min-capture", min: 2 },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [5, 7, 10],
  },
  {
    title: "Palo Prohibido",
    subtitle: "sin escobas contadas",
    obj: { kind: "captures", count: 24 },
    mods: [
      { kind: "no-sweep-bonus" },
      { kind: "min-capture", min: 3 },
      { kind: "round-cap", rounds: 6 },
    ],
    stars: [5, 7, 9],
  },
  {
    title: "Cartas Cortadas",
    subtitle: "mano mocha, reloj corto",
    obj: { kind: "rounds", count: 4 },
    mods: [
      { kind: "weak-hand", label: "mano mocha" },
      { kind: "time-cap", seconds: 260 },
      { kind: "cpu-headstart", points: 6 },
    ],
    stars: [5, 7, 9],
  },
  {
    title: "Mesa Trucada",
    subtitle: "capturas mínimas, sin errores",
    obj: { kind: "sweeps", count: 4 },
    mods: [
      { kind: "min-capture", min: 2 },
      { kind: "tax-cpu-sweep", extra: 10 },
      { kind: "round-cap", rounds: 7 },
    ],
    stars: [5, 7, 9],
  },
  {
    title: "El Contador",
    subtitle: "sabe qué carta viene",
    obj: { kind: "points", target: 20 },
    mods: [
      { kind: "weak-hand", label: "mano mocha" },
      { kind: "cpu-headstart", points: 10 },
      { kind: "tax-cpu-sweep", extra: 12 },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [6, 8, 10],
    boss: true,
    bossQuote: "Sé qué carta jugás antes que la levantes, cielo. Jugala igual.",
    reward: [1400, 2800, 5600],
  },

  {
    title: "Oro Sagrado",
    subtitle: "cada oro vale el triple",
    obj: { kind: "oros", count: 16 },
    mods: [
      { kind: "tax-cpu-sweep", extra: 15 },
      { kind: "min-capture", min: 2 },
      { kind: "time-cap", seconds: 320 },
      { kind: "cpu-headstart", points: 8 },
    ],
    stars: [6, 8, 10],
  },
  {
    title: "Setenta Duro",
    subtitle: "las rondas cortas no cuentan",
    obj: { kind: "rounds", count: 5 },
    mods: [
      { kind: "min-round-points", min: 3 },
      { kind: "cpu-headstart", points: 8 },
      { kind: "weak-hand", label: "mano mocha" },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [7, 9, 11],
  },
  {
    title: "Sin Escobas",
    subtitle: "barrer no paga nada",
    obj: { kind: "points", target: 30 },
    mods: [
      { kind: "no-sweep-bonus" },
      { kind: "cpu-headstart", points: 10 },
      { kind: "min-capture", min: 3 },
      { kind: "time-cap", seconds: 300 },
    ],
    stars: [7, 9, 12],
  },
  {
    title: "Rival Perfecto",
    subtitle: "sin margen, sin misericordia",
    obj: { kind: "sweeps", count: 5 },
    mods: [
      { kind: "weak-hand", label: "mano mocha" },
      { kind: "min-capture", min: 2 },
      { kind: "tax-cpu-sweep", extra: 15 },
      { kind: "round-cap", rounds: 8 },
    ],
    stars: [6, 8, 10],
  },
  {
    title: "Cartas Nubladas",
    subtitle: "capturas chicas se anulan",
    obj: { kind: "captures", count: 40 },
    mods: [
      { kind: "min-capture", min: 3 },
      { kind: "cpu-headstart", points: 12 },
      { kind: "tax-cpu-sweep", extra: 12 },
      { kind: "time-cap", seconds: 320 },
    ],
    stars: [7, 9, 11],
  },

  {
    title: "Doble Beata",
    subtitle: "todo lo aprendido junto",
    obj: { kind: "points", target: 45 },
    mods: [
      { kind: "cpu-headstart", points: 12 },
      { kind: "tax-cpu-sweep", extra: 15 },
      { kind: "min-capture", min: 2 },
      { kind: "weak-hand", label: "mano mocha" },
      { kind: "time-cap", seconds: 320 },
    ],
    stars: [8, 10, 12],
  },
  {
    title: "Desafío Escoba",
    subtitle: "seis escobas casi imposibles",
    obj: { kind: "sweeps", count: 6 },
    mods: [
      { kind: "no-sweep-bonus" },
      { kind: "min-capture", min: 2 },
      { kind: "cpu-headstart", points: 12 },
      { kind: "round-cap", rounds: 9 },
      { kind: "time-cap", seconds: 340 },
    ],
    stars: [7, 9, 11],
  },
  {
    title: "Última Mano",
    subtitle: "cinco rondas, corte cero",
    obj: { kind: "rounds", count: 6 },
    mods: [
      { kind: "min-round-points", min: 4 },
      { kind: "weak-hand", label: "mano mocha" },
      { kind: "cpu-headstart", points: 10 },
      { kind: "tax-cpu-sweep", extra: 15 },
      { kind: "time-cap", seconds: 340 },
    ],
    stars: [8, 10, 12],
  },
  {
    title: "Silencio de Fichas",
    subtitle: "capturas grandes o nada",
    obj: { kind: "captures", count: 56 },
    mods: [
      { kind: "min-capture", min: 3 },
      { kind: "no-sweep-bonus" },
      { kind: "cpu-headstart", points: 14 },
      { kind: "tax-cpu-sweep", extra: 18 },
      { kind: "time-cap", seconds: 340 },
    ],
    stars: [8, 10, 12],
  },
  {
    title: "El Cuervo Escobista",
    subtitle: "el maestro barre a ciegas",
    obj: { kind: "points", target: 70 },
    mods: [
      { kind: "weak-hand", label: "mano mocha" },
      { kind: "cpu-headstart", points: 15 },
      { kind: "tax-cpu-sweep", extra: 20 },
      { kind: "no-sweep-bonus" },
      { kind: "min-capture", min: 3 },
      { kind: "time-cap", seconds: 380 },
    ],
    stars: [10, 12, 14],
    boss: true,
    bossQuote: "Barrí mesas mejores que esta, cielo. Y sin abrir los ojos.",
    reward: [5000, 10000, 20000],
  },
];

function budgetFor(o: EscobaObjective, boss: boolean, i: number): number {
  const base = o.kind === "points" ? Math.round(o.target * 0.7) : 10 + i * 2;
  return boss ? Math.round(base * 1.4) : base;
}
function roundsFor(stars: [number, number, number], mods: EscobaModifier[]): number {
  const cap = mods.find((m) => m.kind === "round-cap");
  if (cap && cap.kind === "round-cap") return cap.rounds;
  return Math.max(3, Math.round(stars[2] * 1.4));
}
function defaultReward(order: number, boss: boolean): [number, number, number] {
  const base = 150 + order * 45;
  const mult = boss ? 5 : 1;
  return [base * mult, base * 2 * mult, base * 4 * mult];
}

export const ESCOBA_LEVELS: EscobaLevelDef[] = ROWS.map((r, i) => {
  const order = i + 1;
  const boss = !!r.boss;
  const mods = r.mods ?? [];
  const [one, two, three] = r.reward ?? defaultReward(order, boss);
  return {
    id: `ES${String(order).padStart(2, "0")}`,
    order,
    title: r.title,
    subtitle: r.subtitle,
    budget: r.budget ?? budgetFor(r.obj, boss, order),
    roundLimit: r.rounds ?? roundsFor(r.stars, mods),
    objective: r.obj,
    modifiers: mods,
    starThresholds: r.stars,
    boss,
    bossQuote: r.bossQuote,
    reward: { one, two, three },
  };
});

export function findEscobaLevel(id: string): EscobaLevelDef | undefined {
  return ESCOBA_LEVELS.find((l) => l.id === id);
}

export function escobaLevelLabel(l: EscobaLevelDef): string {
  return objLabel(l.objective);
}

export function escobaModifierLabel(m: EscobaModifier): string {
  switch (m.kind) {
    case "round-cap":
      return `${m.rounds} rondas`;
    case "time-cap":
      return `${m.seconds}s`;
    case "min-capture":
      return `captura ≥ ${m.min}`;
    case "no-sweep-bonus":
      return "sin bonus escoba";
    case "weak-hand":
      return m.label;
    case "cpu-headstart":
      return `casa +${m.points}`;
    case "tax-cpu-sweep":
      return `escoba casa -${m.extra}`;
    case "hard-target":
      return `meta +${m.extra}`;
    case "min-round-points":
      return `ronda ≥ ${m.min}`;
  }
}

export function computeEscobaStars(level: EscobaLevelDef, roundsUsed: number): 0 | 1 | 2 | 3 {
  const [t3, t2, t1] = level.starThresholds;
  if (roundsUsed <= t3) return 3;
  if (roundsUsed <= t2) return 2;
  if (roundsUsed <= t1) return 1;
  return 1;
}
