export type GeneralaAiSkill = "rookie" | "normal" | "sharp";

export interface GeneralaLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  blurb: string;
  wagerChips: number[];
  aiSkill: GeneralaAiSkill;
  payoutMult: number;
  xpMult: number;
  starThresholds: [number, number, number];
  rewards: [number, number, number];
}

export const GENERALA_LEVELS: GeneralaLevelDef[] = [
  {
    id: "g1",
    order: 1,
    title: "Mesa del Velorio",
    subtitle: "iniciación · 6 contratos",
    blurb: "Zelda apenas mira los dados. Aprendé el ritmo, cobrá despacio.",
    wagerChips: [25, 50, 100],
    aiSkill: "rookie",
    payoutMult: 2,
    xpMult: 1.0,
    starThresholds: [3, 8, 18],
    rewards: [250, 600, 1300],
  },
  {
    id: "g2",
    order: 2,
    title: "Mesa de la Bruja",
    subtitle: "clásica · pagos altos",
    blurb: "La adivina empieza a leerte la mano. Servida vale el doble del orgullo.",
    wagerChips: [50, 100, 200, 400],
    aiSkill: "normal",
    payoutMult: 2.2,
    xpMult: 1.4,
    starThresholds: [4, 10, 22],
    rewards: [500, 1200, 2600],
  },
  {
    id: "g3",
    order: 3,
    title: "Mesa del Trance",
    subtitle: "Zelda afinada · 6 contratos",
    blurb: "Cierra los ojos y los dados le obedecen. No perdona escalera fácil.",
    wagerChips: [100, 250, 500, 1000],
    aiSkill: "sharp",
    payoutMult: 2.4,
    xpMult: 1.8,
    starThresholds: [5, 12, 25],
    rewards: [900, 2100, 4500],
  },
  {
    id: "g4",
    order: 4,
    title: "Salón Pitonisa",
    subtitle: "Apuesta alta · sin techo",
    blurb: "Ficha alta, dos servidas seguidas decidieron rangos enteros. Acá se cuentan leyendas.",
    wagerChips: [500, 1000, 2500, 5000],
    aiSkill: "sharp",
    payoutMult: 2.6,
    xpMult: 2.4,
    starThresholds: [6, 15, 30],
    rewards: [1600, 3800, 8200],
  },
];

export function getGeneralaLevel(id: string): GeneralaLevelDef {
  const lv = GENERALA_LEVELS.find((l) => l.id === id);
  if (!lv) throw new Error(`Mesa de generala desconocida: ${id}`);
  return lv;
}

export function computeGeneralaStars(level: GeneralaLevelDef, matchesWon: number): 0 | 1 | 2 | 3 {
  const [s1, s2, s3] = level.starThresholds;
  if (matchesWon >= s3) return 3;
  if (matchesWon >= s2) return 2;
  if (matchesWon >= s1) return 1;
  return 0;
}
