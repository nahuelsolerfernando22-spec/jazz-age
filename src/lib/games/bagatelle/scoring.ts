// Bagatelle scoring — apuestas, multiplicadores, mods, misiones y reacciones.
// Todo pure (sin dependencias de React ni assets).

export const SLOTS = 13;

// Payout multipliers por slot (13 slots). El pico está en JACKPOT_SLOT=7.
// RTP teórico ≈ 1.01 bajo la distribución SLOT_WEIGHTS (Σm·w / Σw = 25.8/25.6).
export const MULTIPLIERS = [0, -1, 0, 0.5, 1, 1.5, 2, 3, 1.5, 1, 0.5, -1, 0] as const;
export const STAKES = [10, 25, 50, 100, 250] as const;
export const JACKPOT_SLOT = 7;

export const SLOT_LABELS = MULTIPLIERS.map((value, i) => {
  if (i === 7) return `★${value}`;
  if (value === 0) return "✕";
  return `${value}x`;
});

export const SLOT_WEIGHTS: number[] = MULTIPLIERS.map((_, i) => 1 + (6 - Math.abs(i - 6)) * 0.35);
export const SLOT_WEIGHT_TOTAL = SLOT_WEIGHTS.reduce((a, b) => a + b, 0);
export const SLOT_PROBS = SLOT_WEIGHTS.map((w) => w / SLOT_WEIGHT_TOTAL);

export const CARGA_MAX = 100;
export const CARGA_INDULTO = 30;
export const CARGA_BENDICION = 60;
export const CARGA_PLUMAS = 90;

export const MULTIBALL_DURATION_MS = 15_000;

export type ModId = "blessing" | "hunger" | "heavy" | "saints" | "dust";
export interface Mod {
  id: ModId;
  name: string;
  blurb: string;
}
export const MODS: Mod[] = [
  { id: "blessing", name: "Bendición de Lola", blurb: "ganancias × 1.5" },
  { id: "hunger", name: "Cuervo Hambriento", blurb: "maldiciones × 2" },
  { id: "heavy", name: "Bola de Plomo", blurb: "cae más fuerte" },
  { id: "saints", name: "Noche de Santos", blurb: "½x se vuelve 1x" },
  { id: "dust", name: "Polvo de Oro", blurb: "un ✕ secreto paga 1x" },
];
export const rollMod = () => MODS[Math.floor(Math.random() * MODS.length)];

export type MissionKind = "bumpers" | "combo" | "lit" | "cuervo";
export interface Mission {
  kind: MissionKind;
  label: string;
  hint: string;
  target: number;
  reward: number;
}
export const MISSIONS: Omit<Mission, "reward">[] = [
  { kind: "bumpers", label: "Castigo de Bumpers", hint: "pegá 6 veces a bumpers o ★", target: 6 },
  { kind: "combo", label: "Cadena Maldita", hint: "alcanzá combo x4", target: 4 },
  { kind: "lit", label: "Luz de Lola", hint: "encendé y caé en una ranura iluminada", target: 1 },
  { kind: "cuervo", label: "Plumas Negras", hint: "pegá 2 veces al CUERVO", target: 2 },
];
export const rollMission = (stake: number): Mission => {
  const base = MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
  return { ...base, reward: Math.max(15, Math.round(stake * 1.6)) };
};

export type Outcome = "jackpot10" | "win" | "small" | "barely" | "miss" | "curse";

export function effectiveMult(
  slot: number,
  mod: ModId,
  dustSlot: number,
  carga: number,
  litSlot: number | null,
) {
  let mult: number = MULTIPLIERS[slot];
  if (mod === "saints" && mult === 0.5) mult = 1;
  if (mod === "dust" && mult === 0 && slot === dustSlot) mult = 1;
  if (carga >= CARGA_INDULTO && mult === -1) mult = 0;
  if (carga >= CARGA_BENDICION && mult === 0.5) mult = 1;
  if (carga >= CARGA_PLUMAS && mult === 10) mult = 15;
  if (mod === "hunger" && mult < 0) mult *= 2;
  if (litSlot === slot && mult > 0) mult += 2;
  return mult;
}

export function resolvePayout(
  slot: number,
  stake: number,
  mod: ModId,
  dustSlot: number,
  carga: number,
  litSlot: number | null,
) {
  const mult = effectiveMult(slot, mod, dustSlot, carga, litSlot);
  let won = Math.round(stake * mult);
  if (mod === "blessing" && won > 0) won = Math.round(won * 1.5);

  let outcome: Outcome;
  if (mult >= 10) outcome = "jackpot10";
  else if (mult < 0) outcome = "curse";
  else if (mult === 0)
    outcome = slot === JACKPOT_SLOT - 1 || slot === JACKPOT_SLOT + 1 ? "barely" : "miss";
  else if (mult >= 2) outcome = "win";
  else outcome = "small";

  return { mult, won, outcome };
}

export const GREETING = {
  pose: "front" as const,
  mood: "coqueta" as const,
  line: "«Esto sí es un tablero de clavos de verdad. Lanzá la bola y domá los flippers.»",
};
export const PLAYING = {
  pose: "back" as const,
  mood: "sorprendida" as const,
  line: "«Arriba hay clavos, bumpers y slings por todas partes. No me la dejes morir.»",
};

export function reactionFor(outcome: Outcome, streakLoss: number) {
  switch (outcome) {
    case "jackpot10":
      return {
        pose: "front" as const,
        mood: "triunfante" as const,
        line: "«¡El Cuervo te abrió las alas! Diez veces la apuesta, corazón.»",
      };
    case "win":
      return {
        pose: "front" as const,
        mood: "seductora" as const,
        line: "«Así me gusta. Seguí pegándole a los bumpers, mi vida.»",
      };
    case "small":
      return {
        pose: "front" as const,
        mood: "coqueta" as const,
        line: "«Poquito, pero con estilo. La mesa ya te está mirando mejor.»",
      };
    case "barely":
      return {
        pose: "front" as const,
        mood: "sorprendida" as const,
        line: "«Rozaste la gloria. Una más y la rompés toda, bombón.»",
      };
    case "curse":
      return {
        pose: "front" as const,
        mood: "enfadada" as const,
        line: "«Mala ranura. Te mordió la casa y encima le gustó.»",
      };
    case "miss":
    default:
      return streakLoss >= 3
        ? {
            pose: "front" as const,
            mood: "enfadada" as const,
            line: "«Tres vacías seguidas. Enderezá esa mano antes de que me ofenda.»",
          }
        : {
            pose: "front" as const,
            mood: "triste" as const,
            line: "«Se te fue por el outlane, mi cielo. Otra bola y a seguir.»",
          };
  }
}

export function phaseBadge(phase: "idle" | "playing" | "result") {
  if (phase === "playing") return "bola viva";
  if (phase === "result") return "cobrando";
  return "lista";
}

export function shortModName(mod: ModId) {
  switch (mod) {
    case "blessing":
      return "LOLA";
    case "hunger":
      return "HAMBRE";
    case "heavy":
      return "PLOMO";
    case "saints":
      return "SANTOS";
    case "dust":
    default:
      return "POLVO";
  }
}

export function slotTone(mult: number, isLit: boolean, isDust: boolean) {
  if (isLit) {
    return "border-[var(--brass-bright)] bg-[var(--brass)]/25 text-[var(--noir)]";
  }
  if (mult >= 10)
    return "border-[var(--brass-bright)] bg-[var(--brass)]/15 text-[var(--brass-bright)]";
  if (mult < 0) return "border-[var(--blood)] bg-[var(--blood)]/20 text-[var(--ivory)]";
  if (mult === 0 && isDust)
    return "border-[var(--brass)] bg-[var(--brass)]/15 text-[var(--brass-bright)]";
  if (mult === 0) return "border-[var(--oxblood)]/70 bg-[var(--noir)]/85 text-[var(--oxblood)]";
  return "border-[var(--brass)]/45 bg-[var(--noir)]/75 text-[var(--brass)]";
}

// ============= Selección de zona previa al lanzamiento =============
// El jugador elige una zona del tablero antes de tirar; si la bola cae ahí
// se paga con bonus, si cae en otra zona se paga con una leve merma.
export type Zone = "izquierda" | "centro" | "derecha";
export const ZONES: Zone[] = ["izquierda", "centro", "derecha"];
export const ZONE_LABELS: Record<Zone, string> = {
  izquierda: "Izquierda",
  centro: "Centro",
  derecha: "Derecha",
};
// Rangos de slot [inicio, fin] inclusive sobre los 13 slots (0..12).
export const ZONE_RANGES: Record<Zone, [number, number]> = {
  izquierda: [0, 3],
  centro: [4, 8],
  derecha: [9, 12],
};
export const ZONE_BONUS_MULT = 1.25;
export const ZONE_PENALTY_MULT = 0.85;

export function zoneForSlot(slot: number): Zone {
  for (const z of ZONES) {
    const [lo, hi] = ZONE_RANGES[z];
    if (slot >= lo && slot <= hi) return z;
  }
  return "centro";
}

export function applyZoneMult(won: number, slot: number, chosenZone: Zone | null) {
  if (!chosenZone || won <= 0) return { won, zoneHit: false };
  const zoneHit = zoneForSlot(slot) === chosenZone;
  const scaled = Math.round(won * (zoneHit ? ZONE_BONUS_MULT : ZONE_PENALTY_MULT));
  return { won: scaled, zoneHit };
}
