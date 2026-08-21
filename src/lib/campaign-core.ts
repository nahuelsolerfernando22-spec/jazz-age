export type CampaignObjective =
  | { kind: "chips"; target: number }
  | { kind: "survive"; seconds: number }
  | { kind: "events"; target: number };

export type CampaignModifier =
  | { kind: "time-cap"; seconds: number }
  | { kind: "chip-cap"; loss: number }
  | { kind: "min-bet"; min: number }
  | { kind: "no-safe"; label: string }
  | { kind: "tax"; percent: number }
  | { kind: "sabotage"; everyN: number }
  | { kind: "boss"; quote: string };

export interface CampaignLevelDef {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  objective: CampaignObjective;
  modifiers: CampaignModifier[];
  budget: number;
  starThresholds: [number, number, number];
  boss?: boolean;
  reward: { one: number; two: number; three: number };
}

export interface CampaignTheme {
  gameId: string;
  storageKey: string;
  displayName: string;
  campaignName: string;
  levelPrefix: string;
  titles: readonly string[];
  bossQuotes: Record<number, string>;
  objectiveKind: CampaignObjective["kind"];
  baseTarget: number;
  targetGrowth: number;
  baseBudget: number;
  budgetGrowth: number;
  baseReward: number;
  rewardGrowth: number;
  modifiersAt?: (order: number) => CampaignModifier[];
}

export function buildCampaign(theme: CampaignTheme): CampaignLevelDef[] {
  const out: CampaignLevelDef[] = [];
  for (let i = 0; i < 30; i++) {
    const order = i + 1;
    const isBoss = order === 10 || order === 20 || order === 30;
    const growth = Math.pow(theme.targetGrowth, i);
    const budgetGrowth = Math.pow(theme.budgetGrowth, i);
    const rewardGrowth = Math.pow(theme.rewardGrowth, i);
    const target = Math.round(theme.baseTarget * growth);
    const budget = Math.round(theme.baseBudget * budgetGrowth);
    const rewardBase = Math.round(theme.baseReward * rewardGrowth);

    const objective: CampaignObjective =
      theme.objectiveKind === "chips"
        ? { kind: "chips", target }
        : theme.objectiveKind === "survive"
          ? { kind: "survive", seconds: target }
          : { kind: "events", target };

    const mods: CampaignModifier[] = theme.modifiersAt?.(order) ?? [];
    if (isBoss) {
      const quote = theme.bossQuotes[order] ?? "El Cuervo te mira.";
      mods.push({ kind: "boss", quote });
    }

    const title = theme.titles[i] ?? `Encargo ${order}`;
    const subtitle = isBoss
      ? "JEFE · corta el pescuezo"
      : order <= 5
        ? "iniciación"
        : order <= 15
          ? "presión creciente"
          : "élite del Cuervo";

    const star3 = Math.round(target * 1.5);
    const star2 = Math.round(target * 1.2);
    const star1 = target;

    out.push({
      id: `${theme.levelPrefix}${String(order).padStart(2, "0")}`,
      order,
      title,
      subtitle,
      objective,
      modifiers: mods,
      budget,
      starThresholds: [star3, star2, star1],
      boss: isBoss,
      reward: {
        one: rewardBase,
        two: Math.round(rewardBase * 1.75),
        three: Math.round(rewardBase * 3),
      },
    });
  }
  return out;
}

export function computeCampaignStars(level: CampaignLevelDef, achieved: number): 0 | 1 | 2 | 3 {
  const [s3, s2, s1] = level.starThresholds;
  if (achieved >= s3) return 3;
  if (achieved >= s2) return 2;
  if (achieved >= s1) return 1;
  return 0;
}

export function rewardForCampaignStars(level: CampaignLevelDef, stars: 0 | 1 | 2 | 3): number {
  if (stars <= 0) return 0;
  if (stars === 1) return level.reward.one;
  if (stars === 2) return level.reward.two;
  return level.reward.three;
}

export function campaignObjectiveLabel(o: CampaignObjective): string {
  switch (o.kind) {
    case "chips":
      return `Ganá ${o.target.toLocaleString("es-AR")} fichas netas`;
    case "survive":
      return `Aguantá ${o.seconds}s sin quebrar`;
    case "events":
      return `Cerrá ${o.target} manos ganadas`;
  }
}

export function campaignModifierLabel(m: CampaignModifier): string {
  switch (m.kind) {
    case "time-cap":
      return `${m.seconds}s`;
    case "chip-cap":
      return `-${m.loss} máx`;
    case "min-bet":
      return `min ${m.min}`;
    case "no-safe":
      return m.label;
    case "tax":
      return `-${Math.round(m.percent * 100)}%`;
    case "sabotage":
      return `sabotaje 1/${m.everyN}`;
    case "boss":
      return "JEFE";
  }
}
