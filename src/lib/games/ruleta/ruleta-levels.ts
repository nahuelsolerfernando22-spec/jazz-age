export type RuletaObjective =
  | { kind: "bankroll"; target: number }
  | { kind: "full-hits"; count: number }
  | { kind: "outside-streak"; count: number };

export type RuletaModifier =
  | { kind: "spin-cap"; spins: number }
  | { kind: "time-cap"; seconds: number }
  | { kind: "zero-penalty"; extra: number }
  | { kind: "hot-cold"; label: string }
  | { kind: "bet-cap"; max: number }
  | { kind: "dealer-nudge"; color: "red" | "black" };

export interface RuletaLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  budget: number;
  spinLimit: number;
  objective: RuletaObjective;
  modifiers: RuletaModifier[];
  starThresholds: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: { one: number; two: number; three: number };
}

function objLabel(o: RuletaObjective): string {
  switch (o.kind) {
    case "bankroll":
      return `Ganá ${o.target.toLocaleString("es-AR")} fichas netas`;
    case "full-hits":
      return `Acertá ${o.count} pleno${o.count === 1 ? "" : "s"}`;
    case "outside-streak":
      return `${o.count} externas seguidas`;
  }
}

type Row = {
  title: string;
  subtitle: string;
  obj: RuletaObjective;
  mods?: RuletaModifier[];
  budget?: number;
  spins?: number;
  stars: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward?: [number, number, number];
};

const ROWS: Row[] = [
  {
    title: "Rojo o Negro",
    subtitle: "la casa te deja tantear",
    obj: { kind: "bankroll", target: 200 },
    stars: [8, 12, 18],
  },
  {
    title: "Docena Baja",
    subtitle: "una fila fácil",
    obj: { kind: "bankroll", target: 350 },
    stars: [10, 14, 20],
  },
  {
    title: "Par o Impar",
    subtitle: "cara o ceca de terciopelo",
    obj: { kind: "outside-streak", count: 3 },
    stars: [8, 12, 18],
  },
  {
    title: "Columna Simple",
    subtitle: "elegí bien la línea",
    obj: { kind: "bankroll", target: 500 },
    stars: [10, 15, 22],
  },
  {
    title: "Pleno Suerte",
    subtitle: "un solo número, un solo tiro",
    obj: { kind: "full-hits", count: 1 },
    stars: [8, 14, 20],
  },

  {
    title: "Voisins Cortos",
    subtitle: "el croupier apura las apuestas",
    obj: { kind: "bankroll", target: 700 },
    mods: [{ kind: "time-cap", seconds: 240 }],
    stars: [12, 18, 24],
  },
  {
    title: "Orphelins Sueltos",
    subtitle: "los huérfanos no perdonan",
    obj: { kind: "full-hits", count: 2 },
    mods: [{ kind: "spin-cap", spins: 25 }],
    stars: [12, 18, 25],
  },
  {
    title: "Tiers Ajustado",
    subtitle: "límite de ficha por giro",
    obj: { kind: "bankroll", target: 900 },
    mods: [{ kind: "bet-cap", max: 50 }],
    stars: [14, 20, 28],
  },
  {
    title: "Doble Cero",
    subtitle: "el cero cobra caro",
    obj: { kind: "bankroll", target: 1100 },
    mods: [{ kind: "zero-penalty", extra: 80 }],
    stars: [16, 22, 30],
  },
  {
    title: "El Croupier Ciego",
    subtitle: "paga con la mano cerrada",
    obj: { kind: "bankroll", target: 1600 },
    mods: [
      { kind: "zero-penalty", extra: 120 },
      { kind: "bet-cap", max: 100 },
    ],
    stars: [18, 25, 34],
    boss: true,
    bossQuote: "Yo no miro la rueda, encanto. Yo cobro y ya.",
    reward: [600, 1200, 2400],
  },

  {
    title: "Rueda Torcida",
    subtitle: "los frets crujen distinto",
    obj: { kind: "bankroll", target: 1800 },
    mods: [
      { kind: "time-cap", seconds: 220 },
      { kind: "zero-penalty", extra: 100 },
    ],
    stars: [18, 26, 36],
  },
  {
    title: "Chip Bajo",
    subtitle: "ficha máxima por tirada",
    obj: { kind: "full-hits", count: 3 },
    mods: [
      { kind: "bet-cap", max: 75 },
      { kind: "spin-cap", spins: 22 },
    ],
    stars: [16, 22, 30],
  },
  {
    title: "Números Fríos",
    subtitle: "hay un número que quema",
    obj: { kind: "bankroll", target: 2200 },
    mods: [
      { kind: "hot-cold", label: "número frío" },
      { kind: "time-cap", seconds: 200 },
    ],
    stars: [20, 28, 38],
  },
  {
    title: "Vecinos Muertos",
    subtitle: "cinco vecinos no responden",
    obj: { kind: "outside-streak", count: 4 },
    mods: [
      { kind: "spin-cap", spins: 20 },
      { kind: "dealer-nudge", color: "black" },
    ],
    stars: [14, 20, 26],
  },
  {
    title: "Pleno Encadenado",
    subtitle: "dos plenos sin fallar",
    obj: { kind: "full-hits", count: 3 },
    mods: [
      { kind: "hot-cold", label: "número frío" },
      { kind: "bet-cap", max: 60 },
    ],
    stars: [18, 25, 34],
  },

  {
    title: "Docena Prohibida",
    subtitle: "una docena está fuera",
    obj: { kind: "bankroll", target: 2800 },
    mods: [
      { kind: "hot-cold", label: "número frío" },
      { kind: "zero-penalty", extra: 150 },
      { kind: "time-cap", seconds: 220 },
    ],
    stars: [22, 30, 40],
  },
  {
    title: "Rueda Lenta",
    subtitle: "la rueda se resiste",
    obj: { kind: "bankroll", target: 3200 },
    mods: [
      { kind: "spin-cap", spins: 18 },
      { kind: "bet-cap", max: 100 },
      { kind: "zero-penalty", extra: 150 },
    ],
    stars: [16, 22, 30],
  },
  {
    title: "Sesgo Rojo",
    subtitle: "la casa sueña en rojo",
    obj: { kind: "outside-streak", count: 5 },
    mods: [
      { kind: "dealer-nudge", color: "red" },
      { kind: "hot-cold", label: "número frío" },
      { kind: "time-cap", seconds: 200 },
    ],
    stars: [18, 25, 34],
  },
  {
    title: "Sesgo Negro",
    subtitle: "el crupier prefiere las sombras",
    obj: { kind: "bankroll", target: 3800 },
    mods: [
      { kind: "dealer-nudge", color: "black" },
      { kind: "bet-cap", max: 100 },
      { kind: "zero-penalty", extra: 180 },
    ],
    stars: [22, 30, 42],
  },
  {
    title: "La Rueda Trucada",
    subtitle: "el cero cae dos veces por hora",
    obj: { kind: "bankroll", target: 5000 },
    mods: [
      { kind: "zero-penalty", extra: 250 },
      { kind: "hot-cold", label: "número frío" },
      { kind: "time-cap", seconds: 180 },
    ],
    stars: [24, 32, 44],
    boss: true,
    bossQuote: "Esta rueda la calibré yo con un martillo. No falla.",
    reward: [1200, 2400, 5000],
  },

  {
    title: "Pleno Doble",
    subtitle: "cuatro plenos, sin margen",
    obj: { kind: "full-hits", count: 4 },
    mods: [
      { kind: "bet-cap", max: 100 },
      { kind: "hot-cold", label: "número frío" },
      { kind: "time-cap", seconds: 200 },
      { kind: "zero-penalty", extra: 200 },
    ],
    stars: [22, 30, 40],
  },
  {
    title: "Bola Fría",
    subtitle: "la bola prefiere el hielo",
    obj: { kind: "bankroll", target: 6000 },
    mods: [
      { kind: "hot-cold", label: "número frío" },
      { kind: "zero-penalty", extra: 250 },
      { kind: "spin-cap", spins: 18 },
      { kind: "bet-cap", max: 120 },
    ],
    stars: [20, 28, 38],
  },
  {
    title: "Encadenar 3",
    subtitle: "tres externas seguidas o nada",
    obj: { kind: "outside-streak", count: 6 },
    mods: [
      { kind: "dealer-nudge", color: "red" },
      { kind: "hot-cold", label: "número frío" },
      { kind: "time-cap", seconds: 180 },
      { kind: "zero-penalty", extra: 200 },
    ],
    stars: [22, 30, 40],
  },
  {
    title: "Máximo Rígido",
    subtitle: "ficha máxima muy chica",
    obj: { kind: "bankroll", target: 7000 },
    mods: [
      { kind: "bet-cap", max: 80 },
      { kind: "zero-penalty", extra: 250 },
      { kind: "time-cap", seconds: 200 },
      { kind: "spin-cap", spins: 22 },
    ],
    stars: [24, 32, 44],
  },
  {
    title: "Cero Frecuente",
    subtitle: "sale más seguido de lo justo",
    obj: { kind: "bankroll", target: 8500 },
    mods: [
      { kind: "zero-penalty", extra: 350 },
      { kind: "hot-cold", label: "número frío" },
      { kind: "bet-cap", max: 120 },
      { kind: "spin-cap", spins: 20 },
    ],
    stars: [22, 30, 42],
  },

  {
    title: "Sin Externas",
    subtitle: "sólo plenos cuentan",
    obj: { kind: "full-hits", count: 6 },
    mods: [
      { kind: "bet-cap", max: 100 },
      { kind: "hot-cold", label: "número frío" },
      { kind: "time-cap", seconds: 220 },
      { kind: "zero-penalty", extra: 250 },
      { kind: "spin-cap", spins: 26 },
    ],
    stars: [24, 32, 44],
  },
  {
    title: "Desafío Ruleta",
    subtitle: "todo lo aprendido de una",
    obj: { kind: "bankroll", target: 10000 },
    mods: [
      { kind: "spin-cap", spins: 20 },
      { kind: "bet-cap", max: 120 },
      { kind: "zero-penalty", extra: 300 },
      { kind: "hot-cold", label: "número frío" },
      { kind: "dealer-nudge", color: "black" },
    ],
    stars: [22, 30, 40],
  },
  {
    title: "Última Bola",
    subtitle: "un solo tiro cuenta",
    obj: { kind: "full-hits", count: 5 },
    mods: [
      { kind: "spin-cap", spins: 15 },
      { kind: "hot-cold", label: "número frío" },
      { kind: "bet-cap", max: 100 },
      { kind: "time-cap", seconds: 150 },
      { kind: "zero-penalty", extra: 300 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "Silencio del Croupier",
    subtitle: "no anuncia el número",
    obj: { kind: "bankroll", target: 13000 },
    mods: [
      { kind: "zero-penalty", extra: 400 },
      { kind: "hot-cold", label: "número frío" },
      { kind: "bet-cap", max: 120 },
      { kind: "time-cap", seconds: 200 },
      { kind: "spin-cap", spins: 22 },
    ],
    stars: [22, 30, 42],
  },
  {
    title: "La Mano de Rosa",
    subtitle: "Rosa mira desde la barra",
    obj: { kind: "bankroll", target: 20000 },
    mods: [
      { kind: "zero-penalty", extra: 500 },
      { kind: "hot-cold", label: "número frío" },
      { kind: "bet-cap", max: 150 },
      { kind: "dealer-nudge", color: "red" },
      { kind: "time-cap", seconds: 240 },
      { kind: "spin-cap", spins: 28 },
    ],
    stars: [26, 34, 46],
    boss: true,
    bossQuote: "Rosa dice que ganes. Rosa nunca dice que sea gratis.",
    reward: [5000, 10000, 20000],
  },
];

function budgetFor(o: RuletaObjective, boss: boolean, i: number): number {
  const base = o.kind === "bankroll" ? Math.round(o.target * 0.9) : 400 + i * 60;
  return boss ? Math.round(base * 1.4) : base;
}
function spinsFor(stars: [number, number, number], mods: RuletaModifier[]): number {
  const cap = mods.find((m) => m.kind === "spin-cap");
  if (cap && cap.kind === "spin-cap") return cap.spins;
  return Math.round(stars[2] * 1.5);
}
function defaultReward(order: number, boss: boolean): [number, number, number] {
  const base = 120 + order * 40;
  const mult = boss ? 5 : 1;
  return [base * mult, base * 2 * mult, base * 4 * mult];
}

export const RULETA_LEVELS: RuletaLevelDef[] = ROWS.map((r, i) => {
  const order = i + 1;
  const boss = !!r.boss;
  const mods = r.mods ?? [];
  const [one, two, three] = r.reward ?? defaultReward(order, boss);
  return {
    id: `RU${String(order).padStart(2, "0")}`,
    order,
    title: r.title,
    subtitle: r.subtitle,
    budget: r.budget ?? budgetFor(r.obj, boss, order),
    spinLimit: r.spins ?? spinsFor(r.stars, mods),
    objective: r.obj,
    modifiers: mods,
    starThresholds: r.stars,
    boss,
    bossQuote: r.bossQuote,
    reward: { one, two, three },
  };
});

export function findRuletaLevel(id: string): RuletaLevelDef | undefined {
  return RULETA_LEVELS.find((l) => l.id === id);
}

export function ruletaLevelLabel(l: RuletaLevelDef): string {
  return objLabel(l.objective);
}

export function ruletaModifierLabel(m: RuletaModifier): string {
  switch (m.kind) {
    case "spin-cap":
      return `${m.spins} giros`;
    case "time-cap":
      return `${m.seconds}s`;
    case "zero-penalty":
      return `cero -${m.extra}`;
    case "hot-cold":
      return m.label;
    case "bet-cap":
      return `ficha ≤ ${m.max}`;
    case "dealer-nudge":
      return `sesgo ${m.color === "red" ? "rojo" : "negro"}`;
  }
}

export function computeRuletaStars(level: RuletaLevelDef, spinsUsed: number): 0 | 1 | 2 | 3 {
  const [t3, t2, t1] = level.starThresholds;
  if (spinsUsed <= t3) return 3;
  if (spinsUsed <= t2) return 2;
  if (spinsUsed <= t1) return 1;
  return 1;
}
