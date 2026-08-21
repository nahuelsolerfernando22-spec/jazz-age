export type BlackjackObjective =
  | { kind: "wins"; count: number }
  | { kind: "profit"; target: number }
  | { kind: "blackjacks"; count: number }
  | { kind: "streak"; length: number }
  | { kind: "clean"; count: number };

export type BlackjackModifier =
  | { kind: "hand-cap"; hands: number }
  | { kind: "time-cap"; seconds: number }
  | { kind: "min-bet"; min: number }
  | { kind: "cap-payout"; max: number }
  | { kind: "house-edge"; extra: number }
  | { kind: "dealer-h17"; label: string }
  | { kind: "no-insurance" }
  | { kind: "short-pay"; label: string }
  | { kind: "no-split" }
  | { kind: "no-double" }
  | { kind: "loss-tax"; percent: number };

export interface BlackjackLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  budget: number;
  handLimit: number;
  objective: BlackjackObjective;
  modifiers: BlackjackModifier[];
  starThresholds: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward: { one: number; two: number; three: number };
}

function objLabel(o: BlackjackObjective): string {
  switch (o.kind) {
    case "wins":
      return `Ganá ${o.count} manos`;
    case "profit":
      return `Sacá ${o.target.toLocaleString("es-AR")} fichas netas`;
    case "blackjacks":
      return `Sacá ${o.count} blackjack${o.count === 1 ? "" : "s"}`;
    case "streak":
      return `Encadená ${o.length} manos ganadas`;
    case "clean":
      return `${o.count} manos ganadas sin doblar ni dividir`;
  }
}

type Row = {
  title: string;
  subtitle: string;
  obj: BlackjackObjective;
  mods?: BlackjackModifier[];
  budget?: number;
  hands?: number;
  stars: [number, number, number];
  boss?: boolean;
  bossQuote?: string;
  reward?: [number, number, number];
};

const ROWS: Row[] = [
  {
    title: "Casino Vacío",
    subtitle: "el crupier todavía sonríe",
    obj: { kind: "wins", count: 3 },
    stars: [4, 6, 10],
  },
  {
    title: "Mesa Baja",
    subtitle: "fichas chicas, riesgo chico",
    obj: { kind: "profit", target: 200 },
    stars: [5, 8, 12],
  },
  {
    title: "Crupier Distraído",
    subtitle: "mira más el reloj que las cartas",
    obj: { kind: "wins", count: 4 },
    stars: [5, 7, 10],
  },
  {
    title: "Manos Cortas",
    subtitle: "primer natural cantado",
    obj: { kind: "blackjacks", count: 1 },
    stars: [6, 10, 15],
  },
  {
    title: "Doblá y Ganá",
    subtitle: "sin miedo al 11",
    obj: { kind: "profit", target: 350 },
    stars: [6, 9, 13],
  },

  {
    title: "Zapato Fino",
    subtitle: "el reloj empieza a correr",
    obj: { kind: "profit", target: 500 },
    mods: [{ kind: "time-cap", seconds: 240 }],
    stars: [7, 10, 14],
  },
  {
    title: "Split Prohibido",
    subtitle: "arreglate con una sola mano",
    obj: { kind: "wins", count: 5 },
    mods: [{ kind: "no-split" }],
    stars: [7, 10, 14],
  },
  {
    title: "Sin Rendirse",
    subtitle: "ficha mínima decente",
    obj: { kind: "profit", target: 600 },
    mods: [{ kind: "min-bet", min: 25 }],
    stars: [7, 10, 14],
  },
  {
    title: "Ojo del Crupier",
    subtitle: "cada pérdida cobra impuesto",
    obj: { kind: "wins", count: 5 },
    mods: [{ kind: "house-edge", extra: 20 }],
    stars: [7, 10, 14],
  },
  {
    title: "Ley 6:5",
    subtitle: "«los naturales pagan menos, cielo»",
    obj: { kind: "profit", target: 800 },
    mods: [
      { kind: "short-pay", label: "BJ paga 6:5" },
      { kind: "hand-cap", hands: 14 },
    ],
    stars: [7, 10, 14],
    boss: true,
    bossQuote:
      "Bienvenido a la mesa vieja. Acá los blackjacks pagan seis a cinco. Y los que lloran, no vuelven.",
    reward: [700, 1400, 2800],
  },

  {
    title: "Zapato Cargado",
    subtitle: "las diez brillan poco",
    obj: { kind: "profit", target: 1000 },
    mods: [
      { kind: "time-cap", seconds: 260 },
      { kind: "house-edge", extra: 25 },
    ],
    stars: [10, 13, 17],
  },
  {
    title: "Diez Escaso",
    subtitle: "menos naturales, más nervio",
    obj: { kind: "streak", length: 3 },
    mods: [
      { kind: "min-bet", min: 30 },
      { kind: "hand-cap", hands: 16 },
    ],
    stars: [8, 11, 14],
  },
  {
    title: "Mano Blanda",
    subtitle: "sin seguro contra el as",
    obj: { kind: "wins", count: 6 },
    mods: [{ kind: "no-insurance" }, { kind: "time-cap", seconds: 260 }],
    stars: [8, 11, 14],
  },
  {
    title: "Sin Doblar",
    subtitle: "sin la muleta del 11",
    obj: { kind: "profit", target: 1300 },
    mods: [{ kind: "no-double" }, { kind: "house-edge", extra: 25 }],
    stars: [10, 13, 17],
  },
  {
    title: "Rondas Rápidas",
    subtitle: "menos manos, más pulso",
    obj: { kind: "clean", count: 4 },
    mods: [
      { kind: "hand-cap", hands: 14 },
      { kind: "time-cap", seconds: 220 },
    ],
    stars: [8, 11, 14],
  },

  {
    title: "As Traidor",
    subtitle: "el crupier pide en soft 17",
    obj: { kind: "profit", target: 1700 },
    mods: [
      { kind: "dealer-h17", label: "H17" },
      { kind: "house-edge", extra: 30 },
      { kind: "time-cap", seconds: 260 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "Torneo del Sótano",
    subtitle: "reloj corto y ficha alta",
    obj: { kind: "wins", count: 8 },
    mods: [
      { kind: "time-cap", seconds: 200 },
      { kind: "min-bet", min: 40 },
      { kind: "hand-cap", hands: 18 },
    ],
    stars: [10, 13, 16],
  },
  {
    title: "Sin Seguro",
    subtitle: "el crupier muestra as y sonríe",
    obj: { kind: "blackjacks", count: 2 },
    mods: [
      { kind: "no-insurance" },
      { kind: "dealer-h17", label: "H17" },
      { kind: "house-edge", extra: 30 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "Corte Sesgada",
    subtitle: "pagos truncos",
    obj: { kind: "profit", target: 2100 },
    mods: [
      { kind: "cap-payout", max: 250 },
      { kind: "loss-tax", percent: 0.1 },
      { kind: "time-cap", seconds: 240 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "El Contador",
    subtitle: "sabe qué carta viene",
    obj: { kind: "profit", target: 2800 },
    mods: [
      { kind: "dealer-h17", label: "H17" },
      { kind: "no-insurance" },
      { kind: "house-edge", extra: 40 },
      { kind: "hand-cap", hands: 18 },
    ],
    stars: [12, 16, 20],
    boss: true,
    bossQuote:
      "Sé qué carta tenés. Sé cuál va a caer. Pero jugá, corazón. Alguien tiene que pagar la banca.",
    reward: [1400, 2800, 5600],
  },

  {
    title: "Zapato de Piedra",
    subtitle: "todo endurecido",
    obj: { kind: "profit", target: 3500 },
    mods: [
      { kind: "dealer-h17", label: "H17" },
      { kind: "cap-payout", max: 300 },
      { kind: "loss-tax", percent: 0.15 },
      { kind: "time-cap", seconds: 260 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "Solo Face Cards",
    subtitle: "sin dividir, sin dudar",
    obj: { kind: "streak", length: 4 },
    mods: [
      { kind: "no-split" },
      { kind: "min-bet", min: 50 },
      { kind: "hand-cap", hands: 16 },
      { kind: "house-edge", extra: 35 },
    ],
    stars: [8, 11, 14],
  },
  {
    title: "Mesa Corrupta",
    subtitle: "sin doblar y con impuesto",
    obj: { kind: "profit", target: 4200 },
    mods: [
      { kind: "no-double" },
      { kind: "loss-tax", percent: 0.2 },
      { kind: "time-cap", seconds: 240 },
      { kind: "min-bet", min: 50 },
    ],
    stars: [13, 17, 22],
  },
  {
    title: "Pagos Cortos",
    subtitle: "tope duro por mano",
    obj: { kind: "wins", count: 10 },
    mods: [
      { kind: "cap-payout", max: 200 },
      { kind: "hand-cap", hands: 20 },
      { kind: "house-edge", extra: 40 },
      { kind: "min-bet", min: 40 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "Mano Muerta",
    subtitle: "sin seguro, sin split",
    obj: { kind: "clean", count: 6 },
    mods: [
      { kind: "no-insurance" },
      { kind: "no-split" },
      { kind: "dealer-h17", label: "H17" },
      { kind: "time-cap", seconds: 240 },
    ],
    stars: [10, 13, 16],
  },

  {
    title: "Sabotaje Suave",
    subtitle: "todo lo aprendido junto",
    obj: { kind: "profit", target: 5500 },
    mods: [
      { kind: "dealer-h17", label: "H17" },
      { kind: "house-edge", extra: 50 },
      { kind: "cap-payout", max: 350 },
      { kind: "min-bet", min: 60 },
      { kind: "time-cap", seconds: 260 },
    ],
    stars: [13, 17, 22],
  },
  {
    title: "Desafío 21",
    subtitle: "diez blackjacks casi imposibles",
    obj: { kind: "blackjacks", count: 4 },
    mods: [
      { kind: "short-pay", label: "BJ paga 6:5" },
      { kind: "no-insurance" },
      { kind: "dealer-h17", label: "H17" },
      { kind: "hand-cap", hands: 22 },
      { kind: "min-bet", min: 60 },
    ],
    stars: [12, 16, 20],
  },
  {
    title: "La Ruleta del As",
    subtitle: "cada as es una moneda al aire",
    obj: { kind: "streak", length: 5 },
    mods: [
      { kind: "dealer-h17", label: "H17" },
      { kind: "no-insurance" },
      { kind: "loss-tax", percent: 0.25 },
      { kind: "min-bet", min: 60 },
      { kind: "hand-cap", hands: 20 },
    ],
    stars: [8, 11, 14],
  },
  {
    title: "Doble Naipe",
    subtitle: "sin doblar, sin dividir",
    obj: { kind: "profit", target: 7500 },
    mods: [
      { kind: "no-double" },
      { kind: "no-split" },
      { kind: "dealer-h17", label: "H17" },
      { kind: "loss-tax", percent: 0.25 },
      { kind: "min-bet", min: 75 },
    ],
    stars: [14, 18, 22],
  },
  {
    title: "El Crupier Ciego",
    subtitle: "no ve, pero nunca pierde",
    obj: { kind: "profit", target: 12000 },
    mods: [
      { kind: "dealer-h17", label: "sin mirar" },
      { kind: "short-pay", label: "BJ 6:5" },
      { kind: "no-insurance" },
      { kind: "cap-payout", max: 500 },
      { kind: "loss-tax", percent: 0.3 },
      { kind: "min-bet", min: 100 },
      { kind: "time-cap", seconds: 360 },
    ],
    stars: [16, 20, 26],
    boss: true,
    bossQuote: "No necesito ver tus cartas, cielo. Ya oigo cómo tiemblan.",
    reward: [5000, 10000, 20000],
  },
];

function budgetFor(o: BlackjackObjective, boss: boolean, i: number): number {
  const base = o.kind === "profit" ? Math.round(o.target * 0.8) : 400 + i * 60;
  return boss ? Math.round(base * 1.4) : base;
}
function handsFor(stars: [number, number, number], mods: BlackjackModifier[]): number {
  const cap = mods.find((m) => m.kind === "hand-cap");
  if (cap && cap.kind === "hand-cap") return cap.hands;
  return Math.round(stars[2] * 1.6);
}
function defaultReward(order: number, boss: boolean): [number, number, number] {
  const base = 150 + order * 50;
  const mult = boss ? 5 : 1;
  return [base * mult, base * 2 * mult, base * 4 * mult];
}

export const BLACKJACK_LEVELS: BlackjackLevelDef[] = ROWS.map((r, i) => {
  const order = i + 1;
  const boss = !!r.boss;
  const mods = r.mods ?? [];
  const [one, two, three] = r.reward ?? defaultReward(order, boss);
  return {
    id: `BJ${String(order).padStart(2, "0")}`,
    order,
    title: r.title,
    subtitle: r.subtitle,
    budget: r.budget ?? budgetFor(r.obj, boss, order),
    handLimit: r.hands ?? handsFor(r.stars, mods),
    objective: r.obj,
    modifiers: mods,
    starThresholds: r.stars,
    boss,
    bossQuote: r.bossQuote,
    reward: { one, two, three },
  };
});

export function findBlackjackLevel(id: string): BlackjackLevelDef | undefined {
  return BLACKJACK_LEVELS.find((l) => l.id === id);
}

export function blackjackLevelLabel(l: BlackjackLevelDef): string {
  return objLabel(l.objective);
}

export function blackjackModifierLabel(m: BlackjackModifier): string {
  switch (m.kind) {
    case "hand-cap":
      return `${m.hands} manos`;
    case "time-cap":
      return `${m.seconds}s`;
    case "min-bet":
      return `ficha ≥ ${m.min}`;
    case "cap-payout":
      return `pago ≤ ${m.max}`;
    case "house-edge":
      return `impuesto -${m.extra}`;
    case "dealer-h17":
      return m.label;
    case "no-insurance":
      return "sin seguro";
    case "short-pay":
      return m.label;
    case "no-split":
      return "sin dividir";
    case "no-double":
      return "sin doblar";
    case "loss-tax":
      return `pérdida ×${(1 + m.percent).toFixed(2)}`;
  }
}

export function computeBlackjackStars(level: BlackjackLevelDef, handsUsed: number): 0 | 1 | 2 | 3 {
  const [t3, t2, t1] = level.starThresholds;
  if (handsUsed <= t3) return 3;
  if (handsUsed <= t2) return 2;
  if (handsUsed <= t1) return 1;
  return 1;
}
