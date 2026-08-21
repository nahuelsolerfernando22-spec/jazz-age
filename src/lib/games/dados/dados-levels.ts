export type DadosObjective =
  | { kind: "matches"; count: number }
  | { kind: "score"; target: number }
  | { kind: "generala"; count: number }
  | { kind: "servida"; count: number }
  | { kind: "streak"; count: number }
  | { kind: "margin"; target: number };

export type DadosModifier =
  | { kind: "match-cap"; matches: number }
  | { kind: "time-cap"; seconds: number }
  | { kind: "cpu-headstart"; points: number }
  | { kind: "min-margin"; min: number }
  | { kind: "no-servida-bonus" }
  | { kind: "tax-loss"; extra: number }
  | { kind: "weak-hand"; label: string }
  | { kind: "min-score"; min: number };

export interface DadosLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  budget: number;
  matchLimit: number;
  objective: DadosObjective;
  modifiers: DadosModifier[];
  starThresholds: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: { one: number; two: number; three: number };
}

function objLabel(o: DadosObjective): string {
  switch (o.kind) {
    case "matches":
      return `Ganá ${o.count} partida${o.count === 1 ? "" : "s"}`;
    case "score":
      return `Sumá ${o.target} puntos`;
    case "generala":
      return `Anotá ${o.count} generala${o.count === 1 ? "" : "s"}`;
    case "servida":
      return `Anotá ${o.count} figura${o.count === 1 ? "" : "s"} servida`;
    case "streak":
      return `Racha de ${o.count} victorias`;
    case "margin":
      return `Margen neto de ${o.target} puntos`;
  }
}

type Row = {
  title: string;
  subtitle: string;
  obj: DadosObjective;
  mods?: DadosModifier[];
  budget?: number;
  matches?: number;
  stars: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward?: [number, number, number];
};

const ROWS: Row[] = [
  {
    title: "Primer Cubilete",
    subtitle: "los dados te sonríen",
    obj: { kind: "matches", count: 1 },
    stars: [1, 2, 3],
  },
  {
    title: "Suerte Novata",
    subtitle: "una figura servida cae sola",
    obj: { kind: "servida", count: 1 },
    stars: [2, 3, 5],
  },
  {
    title: "Sumar Números",
    subtitle: "trescientos puntos limpios",
    obj: { kind: "score", count: 300 } as unknown as DadosObjective,
    stars: [2, 3, 5],
  },
  {
    title: "Dos Manos",
    subtitle: "encadená dos partidas",
    obj: { kind: "streak", count: 2 },
    stars: [2, 3, 4],
  },
  {
    title: "Generala Chica",
    subtitle: "cinco iguales al menos una vez",
    obj: { kind: "generala", count: 1 },
    stars: [3, 4, 6],
  },

  {
    title: "Cubilete Cronómetro",
    subtitle: "zelda mide el tiempo",
    obj: { kind: "matches", count: 2 },
    mods: [{ kind: "time-cap", seconds: 480 }],
    stars: [3, 4, 6],
  },
  {
    title: "Adivina Ventajera",
    subtitle: "arranca con crédito",
    obj: { kind: "matches", count: 2 },
    mods: [{ kind: "cpu-headstart", points: 30 }],
    stars: [3, 4, 6],
  },
  {
    title: "Margen Justo",
    subtitle: "ganás por poco o no ganás",
    obj: { kind: "matches", count: 3 },
    mods: [{ kind: "min-margin", min: 20 }],
    stars: [4, 5, 7],
  },
  {
    title: "Cinco del Rincón",
    subtitle: "dos servidas de fila",
    obj: { kind: "servida", count: 3 },
    mods: [{ kind: "match-cap", matches: 5 }],
    stars: [4, 5, 7],
  },
  {
    title: "Zelda La Adivina",
    subtitle: "te lee la muñeca",
    obj: { kind: "margin", target: 60 },
    mods: [
      { kind: "cpu-headstart", points: 40 },
      { kind: "match-cap", matches: 5 },
    ],
    stars: [4, 5, 7],
    boss: true,
    bossQuote: "Te leí antes de que agites, cielo. Igual jugalos.",
    reward: [700, 1400, 2800],
  },

  {
    title: "Reloj y Humo",
    subtitle: "reloj corto, humo espeso",
    obj: { kind: "matches", count: 3 },
    mods: [
      { kind: "time-cap", seconds: 480 },
      { kind: "cpu-headstart", points: 25 },
    ],
    stars: [5, 7, 9],
  },
  {
    title: "Servidas Marcadas",
    subtitle: "sin chispa por servir",
    obj: { kind: "servida", count: 4 },
    mods: [{ kind: "no-servida-bonus" }, { kind: "match-cap", matches: 6 }],
    stars: [5, 6, 8],
  },
  {
    title: "Adivina Fija",
    subtitle: "cada derrota cobra caro",
    obj: { kind: "matches", count: 3 },
    mods: [
      { kind: "tax-loss", extra: 25 },
      { kind: "cpu-headstart", points: 30 },
    ],
    stars: [5, 6, 8],
  },
  {
    title: "Doble Generala",
    subtitle: "dos veces cinco iguales",
    obj: { kind: "generala", count: 2 },
    mods: [
      { kind: "match-cap", matches: 7 },
      { kind: "time-cap", seconds: 600 },
    ],
    stars: [5, 7, 9],
  },
  {
    title: "Ronda Ciega",
    subtitle: "cortita y sin margen",
    obj: { kind: "margin", target: 80 },
    mods: [
      { kind: "cpu-headstart", points: 40 },
      { kind: "time-cap", seconds: 480 },
    ],
    stars: [5, 7, 9],
  },

  {
    title: "Rachita Fina",
    subtitle: "tres seguidas o nada",
    obj: { kind: "streak", count: 3 },
    mods: [
      { kind: "cpu-headstart", points: 25 },
      { kind: "min-margin", min: 15 },
      { kind: "time-cap", seconds: 540 },
    ],
    stars: [6, 8, 10],
  },
  {
    title: "Adivina Cerrada",
    subtitle: "menos partidas, más chispa",
    obj: { kind: "matches", count: 4 },
    mods: [
      { kind: "match-cap", matches: 6 },
      { kind: "cpu-headstart", points: 35 },
      { kind: "min-margin", min: 20 },
    ],
    stars: [6, 7, 9],
  },
  {
    title: "Sombra Servida",
    subtitle: "servidas sin bonus",
    obj: { kind: "servida", count: 5 },
    mods: [
      { kind: "no-servida-bonus" },
      { kind: "cpu-headstart", points: 30 },
      { kind: "time-cap", seconds: 600 },
    ],
    stars: [6, 8, 10],
  },
  {
    title: "Suma Cerrada",
    subtitle: "puntaje limpio",
    obj: { kind: "score", target: 1200 } as unknown as DadosObjective,
    mods: [
      { kind: "min-score", min: 200 },
      { kind: "cpu-headstart", points: 30 },
      { kind: "match-cap", matches: 8 },
    ],
    stars: [6, 8, 10],
  },
  {
    title: "Salomé del Sótano",
    subtitle: "otra piel, la misma trampa",
    obj: { kind: "margin", target: 120 },
    mods: [
      { kind: "cpu-headstart", points: 50 },
      { kind: "tax-loss", extra: 20 },
      { kind: "weak-hand", label: "cubilete cortado" },
      { kind: "time-cap", seconds: 600 },
    ],
    stars: [7, 9, 11],
    boss: true,
    bossQuote: "Zelda me presta la mesa cuando huele a fichas frescas, cielo.",
    reward: [1400, 2800, 5600],
  },

  {
    title: "Cubilete Trucado",
    subtitle: "cada cubilete pesa distinto",
    obj: { kind: "matches", count: 5 },
    mods: [
      { kind: "cpu-headstart", points: 35 },
      { kind: "min-margin", min: 20 },
      { kind: "weak-hand", label: "cubilete cortado" },
      { kind: "time-cap", seconds: 660 },
    ],
    stars: [7, 9, 11],
  },
  {
    title: "Racha de Zelda",
    subtitle: "cuatro seguidas o al mazo",
    obj: { kind: "streak", count: 4 },
    mods: [
      { kind: "cpu-headstart", points: 30 },
      { kind: "min-margin", min: 20 },
      { kind: "tax-loss", extra: 25 },
      { kind: "time-cap", seconds: 600 },
    ],
    stars: [7, 9, 11],
  },
  {
    title: "Fila de Servidas",
    subtitle: "seis figuras sin repetir",
    obj: { kind: "servida", count: 7 },
    mods: [
      { kind: "no-servida-bonus" },
      { kind: "cpu-headstart", points: 35 },
      { kind: "match-cap", matches: 9 },
      { kind: "time-cap", seconds: 660 },
    ],
    stars: [7, 9, 11],
  },
  {
    title: "Contador Rápido",
    subtitle: "puntaje bajo presión",
    obj: { kind: "score", target: 2000 } as unknown as DadosObjective,
    mods: [
      { kind: "min-score", min: 220 },
      { kind: "cpu-headstart", points: 35 },
      { kind: "tax-loss", extra: 20 },
      { kind: "time-cap", seconds: 660 },
    ],
    stars: [8, 10, 12],
  },
  {
    title: "Generala Triple",
    subtitle: "tres veces la ganadora",
    obj: { kind: "generala", count: 3 },
    mods: [
      { kind: "cpu-headstart", points: 40 },
      { kind: "min-margin", min: 15 },
      { kind: "match-cap", matches: 10 },
      { kind: "time-cap", seconds: 720 },
    ],
    stars: [8, 10, 12],
  },

  {
    title: "Cubilete Doble",
    subtitle: "todo aprendido a la vez",
    obj: { kind: "margin", target: 200 },
    mods: [
      { kind: "cpu-headstart", points: 45 },
      { kind: "min-margin", min: 20 },
      { kind: "tax-loss", extra: 25 },
      { kind: "weak-hand", label: "cubilete cortado" },
      { kind: "time-cap", seconds: 720 },
    ],
    stars: [9, 11, 13],
  },
  {
    title: "Racha Imposible",
    subtitle: "cinco victorias sin fallar",
    obj: { kind: "streak", count: 5 },
    mods: [
      { kind: "cpu-headstart", points: 40 },
      { kind: "min-margin", min: 20 },
      { kind: "tax-loss", extra: 30 },
      { kind: "time-cap", seconds: 720 },
    ],
    stars: [8, 10, 12],
  },
  {
    title: "Última Mano",
    subtitle: "seis partidas o al piso",
    obj: { kind: "matches", count: 6 },
    mods: [
      { kind: "min-margin", min: 25 },
      { kind: "cpu-headstart", points: 45 },
      { kind: "weak-hand", label: "cubilete cortado" },
      { kind: "tax-loss", extra: 25 },
      { kind: "time-cap", seconds: 780 },
    ],
    stars: [9, 11, 13],
  },
  {
    title: "Silencio del Sótano",
    subtitle: "puntaje alto o mesa fría",
    obj: { kind: "score", target: 3200 } as unknown as DadosObjective,
    mods: [
      { kind: "min-score", min: 260 },
      { kind: "cpu-headstart", points: 45 },
      { kind: "tax-loss", extra: 25 },
      { kind: "weak-hand", label: "cubilete cortado" },
      { kind: "time-cap", seconds: 780 },
    ],
    stars: [10, 12, 14],
  },
  {
    title: "El Cuervo Adivino",
    subtitle: "el maestro lee los dados",
    obj: { kind: "margin", target: 350 },
    mods: [
      { kind: "weak-hand", label: "cubilete cortado" },
      { kind: "cpu-headstart", points: 60 },
      { kind: "tax-loss", extra: 35 },
      { kind: "min-margin", min: 25 },
      { kind: "no-servida-bonus" },
      { kind: "time-cap", seconds: 840 },
    ],
    stars: [11, 13, 15],
    boss: true,
    bossQuote: "Los cubiletes me obedecen, cielo. Y hoy el suyo se equivoca.",
    reward: [5000, 10000, 20000],
  },
];

function scoreTarget(o: DadosObjective): number | null {
  if (o.kind === "score") return o.target;
  return null;
}

function budgetFor(o: DadosObjective, boss: boolean, i: number): number {
  const base =
    o.kind === "margin"
      ? Math.round(o.target * 0.6)
      : o.kind === "score"
        ? Math.round(o.target * 0.35)
        : 60 + i * 8;
  return boss ? Math.round(base * 1.4) : base;
}
function matchesFor(stars: [number, number, number], mods: DadosModifier[]): number {
  const cap = mods.find((m) => m.kind === "match-cap");
  if (cap && cap.kind === "match-cap") return cap.matches;
  return Math.max(3, Math.round(stars[2] * 1.5));
}
function defaultReward(order: number, boss: boolean): [number, number, number] {
  const base = 160 + order * 48;
  const mult = boss ? 5 : 1;
  return [base * mult, base * 2 * mult, base * 4 * mult];
}

export const DADOS_LEVELS: DadosLevelDef[] = ROWS.map((r, i) => {
  const order = i + 1;
  const boss = !!r.boss;
  const mods = r.mods ?? [];
  const [one, two, three] = r.reward ?? defaultReward(order, boss);

  let obj = r.obj;
  const rawCount = (r.obj as unknown as { count?: number }).count;
  if (r.obj.kind === "score" && typeof rawCount === "number" && !("target" in r.obj)) {
    obj = { kind: "score", target: rawCount };
  }
  return {
    id: `DA${String(order).padStart(2, "0")}`,
    order,
    title: r.title,
    subtitle: r.subtitle,
    budget: r.budget ?? budgetFor(obj, boss, order),
    matchLimit: r.matches ?? matchesFor(r.stars, mods),
    objective: obj,
    modifiers: mods,
    starThresholds: r.stars,
    boss,
    bossQuote: r.bossQuote,
    reward: { one, two, three },
  };
});

export function findDadosLevel(id: string): DadosLevelDef | undefined {
  return DADOS_LEVELS.find((l) => l.id === id);
}

export function dadosLevelLabel(l: DadosLevelDef): string {
  return objLabel(l.objective);
}

export function dadosModifierLabel(m: DadosModifier): string {
  switch (m.kind) {
    case "match-cap":
      return `${m.matches} partidas`;
    case "time-cap":
      return `${m.seconds}s`;
    case "cpu-headstart":
      return `casa +${m.points}`;
    case "min-margin":
      return `margen ≥ ${m.min}`;
    case "no-servida-bonus":
      return "sin bonus servida";
    case "tax-loss":
      return `derrota -${m.extra}`;
    case "weak-hand":
      return m.label;
    case "min-score":
      return `partida ≥ ${m.min}`;
  }
}

export function computeDadosStars(level: DadosLevelDef, matchesUsed: number): 0 | 1 | 2 | 3 {
  const [t3, t2, t1] = level.starThresholds;
  if (matchesUsed <= t3) return 3;
  if (matchesUsed <= t2) return 2;
  if (matchesUsed <= t1) return 1;
  return 1;
}

export { scoreTarget };
