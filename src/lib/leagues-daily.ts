export type LeagueTierId =
  | "vagabundos"
  | "parroquianos"
  | "conocidas"
  | "manofirme"
  | "bronce"
  | "plata"
  | "oro"
  | "circulo"
  | "cuervoDorado";

export interface LeagueTier {
  id: LeagueTierId;
  rank: number;
  name: string;
  fullName: string;
  botTargetMedian: number;
  color: string;
  glow: string;
  favorReward: number;
}

export const LEAGUE_TIERS: readonly LeagueTier[] = [
  {
    id: "vagabundos",
    rank: 1,
    name: "Vagabundos",
    fullName: "Vagabundos del Callejón",
    botTargetMedian: 250,
    color: "oklch(0.45 0.06 40)",
    glow: "oklch(0.62 0.10 45)",
    favorReward: 1,
  },
  {
    id: "parroquianos",
    rank: 2,
    name: "Parroquianos",
    fullName: "Parroquianos de la Cantina",
    botTargetMedian: 600,
    color: "oklch(0.55 0.10 45)",
    glow: "oklch(0.70 0.13 50)",
    favorReward: 2,
  },
  {
    id: "conocidas",
    rank: 3,
    name: "Caras Conocidas",
    fullName: "Caras Conocidas",
    botTargetMedian: 1_200,
    color: "oklch(0.62 0.13 55)",
    glow: "oklch(0.78 0.15 60)",
    favorReward: 3,
  },
  {
    id: "manofirme",
    rank: 4,
    name: "Mano Firme",
    fullName: "Mano Firme",
    botTargetMedian: 2_400,
    color: "oklch(0.55 0.12 30)",
    glow: "oklch(0.72 0.16 35)",
    favorReward: 5,
  },
  {
    id: "bronce",
    rank: 5,
    name: "Pluma de Bronce",
    fullName: "Pluma de Bronce",
    botTargetMedian: 4_500,
    color: "oklch(0.58 0.14 45)",
    glow: "oklch(0.74 0.17 50)",
    favorReward: 8,
  },
  {
    id: "plata",
    rank: 6,
    name: "Pluma de Plata",
    fullName: "Pluma de Plata",
    botTargetMedian: 8_000,
    color: "oklch(0.78 0.03 240)",
    glow: "oklch(0.92 0.04 245)",
    favorReward: 12,
  },
  {
    id: "oro",
    rank: 7,
    name: "Pluma de Oro",
    fullName: "Pluma de Oro",
    botTargetMedian: 14_000,
    color: "oklch(0.78 0.16 85)",
    glow: "oklch(0.92 0.20 90)",
    favorReward: 20,
  },
  {
    id: "circulo",
    rank: 8,
    name: "Círculo del Cuervo",
    fullName: "Círculo del Cuervo",
    botTargetMedian: 24_000,
    color: "oklch(0.45 0.10 25)",
    glow: "oklch(0.72 0.18 30)",
    favorReward: 35,
  },
  {
    id: "cuervoDorado",
    rank: 9,
    name: "Cuervo Dorado",
    fullName: "Cuervo Dorado",
    botTargetMedian: 42_000,
    color: "oklch(0.72 0.20 30)",
    glow: "oklch(0.92 0.22 70)",
    favorReward: 60,
  },
] as const;

export const FIRST_TIER: LeagueTierId = "vagabundos";
export const TOP_TIER: LeagueTierId = "cuervoDorado";

export function tierByRank(rank: number): LeagueTier {
  const r = Math.max(1, Math.min(9, rank));
  return LEAGUE_TIERS[r - 1];
}
export function tierById(id: LeagueTierId): LeagueTier {
  return LEAGUE_TIERS.find((t) => t.id === id) ?? LEAGUE_TIERS[0];
}

export const LEAGUE_GAMES = [
  { id: "truco", label: "Mentira Criolla" },
  { id: "chinchon", label: "El Corte Sucio" },
  { id: "mahjong", label: "Marfil Paciente" },
  { id: "ruleta", label: "La Rueda del Cuervo" },
  { id: "solitario", label: "La Mano Muerta" },
  { id: "blackjack", label: "Filo de Veintiuno" },
  { id: "bagatelle", label: "Clavo y Suerte" },
  { id: "slots", label: "La Palanca del Milagro" },
  { id: "escoba", label: "Barrido de Quince" },
  { id: "dados", label: "Cinco Huesos" },
  { id: "sindicato", label: "El Sindicato" },
] as const;

export type LeagueGameId = (typeof LEAGUE_GAMES)[number]["id"];

const DAY_CUTOFF_HOUR = 4;

export function competitionDayKey(date = new Date()): string {
  const d = new Date(date);
  if (d.getHours() < DAY_CUTOFF_HOUR) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function msUntilNextCutoff(date = new Date()): number {
  const next = new Date(date);
  if (next.getHours() >= DAY_CUTOFF_HOUR) next.setDate(next.getDate() + 1);
  next.setHours(DAY_CUTOFF_HOUR, 0, 0, 0);
  return Math.max(0, next.getTime() - date.getTime());
}

export function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const BOT_NAMES = [
  "Mickey «Botones»",
  "Sal «el Cura»",
  "Lou «Doblefichas»",
  "Hank «Tres Dedos»",
  "Tessa «la Lengua»",
  "Rita «Mediasrotas»",
  "Don «el Húngaro»",
  "Vinnie «Pespunte»",
  "Margot «la Húngara»",
  "Eddie «Coñac»",
  "Sandy «Sevillana»",
  "Polack Jim",
  "Bessie «Lápiz»",
  "Kid «Sietevidas»",
  "Mama Lulú",
  "Ozzie «Carbón»",
  "Babs «la Sirena»",
  "Frenchie LaPorte",
  "Otto «Bigotes»",
  "Lila «Manodura»",
  "Carmine «el Reloj»",
  "Pearl «Espejito»",
  "Dutch Schmidt",
  "Gypsy Joe",
  "Wanda «Tres Cartas»",
  "Bruno «Linterna»",
  "Sissy «Mancha»",
];

function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BotEntry {
  name: string;
  score: number;
  /** Puntaje al que llegará al cierre de la jornada (04:00). */
  finalScore: number;
  /** true si el rival sigue jugando ahora mismo. */
  active: boolean;
}

const BOTS_PER_TABLE = 19;

/** Mesa completa: vos + los 19 rivales simulados. */
export const TABLE_SIZE = BOTS_PER_TABLE + 1;
/** Ascienden los primeros 4 de la mesa. */
export const PROMO_SLOTS = 4;
/** Descienden los últimos 4 de la mesa. */
export const RELEGATION_SLOTS = 4;

/** Fracción [0..1] de la jornada transcurrida (cierra 04:00). */
export function dayProgress(dayKey: string, now = new Date()): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return 1;
  const start = new Date(y, m - 1, d, DAY_CUTOFF_HOUR, 0, 0, 0).getTime();
  const end = start + 24 * 3600 * 1000;
  const t = now.getTime();
  if (t <= start) return 0;
  if (t >= end) return 1;
  return (t - start) / (end - start);
}

interface Persona {
  /** cuándo se sienta a la mesa */
  start: number;
  /** cuándo se levanta */
  end: number;
  /** ritmo: <1 arranca fuerte, >1 remonta sobre el final */
  pace: number;
  /** cantidad de sesiones (escalones) */
  sessions: number;
}

function persona(r: () => number): Persona {
  const start = r() * 0.45;
  const end = Math.min(1, start + 0.35 + r() * 0.6);
  return {
    start,
    end,
    pace: 0.6 + r() * 1.6,
    sessions: 3 + Math.floor(r() * 7),
  };
}

function progressOf(p: Persona, f: number): number {
  if (f <= p.start) return 0;
  if (f >= p.end) return 1;
  const raw = (f - p.start) / (p.end - p.start);
  const curved = Math.pow(raw, p.pace);
  // escalones: los rivales suman de a partidas, no de forma continua
  return Math.min(1, Math.ceil(curved * p.sessions) / p.sessions);
}

export interface BotsOptions {
  /** puntaje actual del jugador: los punteros aprietan si vas muy arriba */
  playerScore?: number;
  /** momento a simular (por defecto, ahora) */
  now?: Date;
  /** ignorar el reloj y devolver el resultado del cierre */
  final?: boolean;
}

export function botsFor(
  game: LeagueGameId,
  tier: LeagueTierId,
  dayKey: string,
  opts: BotsOptions = {},
): BotEntry[] {
  const r = rng(hashSeed(game, tier, dayKey));
  const median = tierById(tier).botTargetMedian;
  const pool = [...BOT_NAMES];
  const f = opts.final ? 1 : dayProgress(dayKey, opts.now ?? new Date());
  const player = Math.max(0, opts.playerScore ?? 0);

  const raw: { name: string; final: number; p: Persona }[] = [];
  for (let i = 0; i < BOTS_PER_TABLE; i++) {
    const idx = Math.floor(r() * pool.length);
    const name = pool.splice(idx, 1)[0] ?? `Don Nadie ${i}`;
    // dispersión más ancha: hay pescados y hay tiburones
    const skill = 0.35 + Math.pow(r(), 0.75) * 1.75;
    const luck = 0.85 + r() * 0.3;
    raw.push({ name, final: Math.max(1, Math.round(median * skill * luck)), p: persona(r) });
  }

  // Presión: si el jugador se escapa, los 3 punteros se estiran (sin superarlo siempre)
  raw.sort((a, b) => b.final - a.final);
  if (player > raw[0].final) {
    const chase = [0.98, 0.92, 0.84];
    for (let i = 0; i < chase.length && i < raw.length; i++) {
      const target = Math.round(player * chase[i] * (0.94 + r() * 0.12));
      raw[i].final = Math.max(raw[i].final, target);
    }
  }

  return raw
    .map((b) => {
      const prog = progressOf(b.p, f);
      return {
        name: b.name,
        score: Math.round(b.final * prog),
        finalScore: b.final,
        active: f > b.p.start && f < b.p.end,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export type DayOutcome = "promo" | "stay" | "demote";

export interface DailyResolution {
  game: LeagueGameId;
  tier: LeagueTierId;
  newTier: LeagueTierId;
  outcome: DayOutcome;
  rank: number;
  total: number;
  playerScore: number;
  favors: number;
}

export function resolveDay(
  game: LeagueGameId,
  tier: LeagueTierId,
  playerScore: number,
  dayKey: string,
): DailyResolution {
  const bots = botsFor(game, tier, dayKey, { playerScore, final: true });
  const all = [...bots.map((b) => b.score), playerScore].sort((a, b) => b - a);
  const total = all.length;

  const rank = all.indexOf(playerScore) + 1;

  const promoCut = Math.max(1, Math.min(PROMO_SLOTS, total - 1));
  const demoteCut = total - Math.min(RELEGATION_SLOTS, total - 1);

  const t = tierById(tier);
  let outcome: DayOutcome;
  if (rank <= promoCut && t.rank < 9) outcome = "promo";
  else if (rank > demoteCut && t.rank > 1) outcome = "demote";
  else outcome = "stay";

  const newRank = outcome === "promo" ? t.rank + 1 : outcome === "demote" ? t.rank - 1 : t.rank;
  const newTier = tierByRank(newRank).id;

  const favors =
    outcome === "promo"
      ? tierByRank(newRank).favorReward
      : outcome === "stay"
        ? Math.ceil(t.favorReward / 2)
        : 0;

  return { game, tier, newTier, outcome, rank, total, playerScore, favors };
}
