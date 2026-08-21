import { dailySeed, hashSeed, mulberry32, rngPick, rngInt } from "@/lib/rng";

const KEY = "bagatelle:daily:v1";

export interface DailyChallenge {
  dateKey: string;
  seed: string;
  modId: string;
  target: number;
  title: string;
  desc: string;
}

export interface DailyProgress {
  dateKey: string;
  best: number;
  beat: boolean;
  streak: number;
  lastBeatDate: string | null;
}

const TITLES = [
  "Cita con el Cuervo",
  "Pluma del Alba",
  "Sombra de las Cinco",
  "Cuervo de Guardia",
  "Vuelo Nocturno",
  "Cantar del Bumper",
  "Ronda del Salón",
  "Contrato Diario",
];

const MODS_POOL = ["hot", "cold", "cursed", "lucky", "double", "reverse"] as const;

function targetForSeed(rng: () => number, dateKey: string): number {
  const week = Math.min(52, Math.max(0, weekOfYear(dateKey)));
  const base = 3000 + Math.floor(rng() * 4000);
  const growth = Math.min(15000, week * 250);
  return base + growth;
}

function weekOfYear(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return 0;
  const utc = Date.UTC(y, m - 1, d);
  const start = Date.UTC(y, 0, 1);
  return Math.max(0, Math.floor((utc - start) / (7 * 86400_000)));
}

export function todayDateKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getDailyChallenge(): DailyChallenge {
  const dateKey = todayDateKey();
  const seed = dailySeed("bagatelle");
  const rng = mulberry32(hashSeed(seed));
  const modId = rngPick(rng, MODS_POOL as unknown as string[]);
  const title = rngPick(rng, TITLES);
  const target = targetForSeed(rng, dateKey);
  const desc = `Alcanzá ${target.toLocaleString("es-AR")} en una sola bola con el mod "${modId}".`;

  void rngInt(rng, 0, 100);
  return { dateKey, seed, modId, target, title, desc };
}

export function loadDailyProgress(): DailyProgress {
  const today = todayDateKey();
  const empty: DailyProgress = {
    dateKey: today,
    best: 0,
    beat: false,
    streak: 0,
    lastBeatDate: null,
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<DailyProgress>;

    const safe: DailyProgress = {
      dateKey: typeof parsed.dateKey === "string" ? parsed.dateKey : today,
      best: Number.isFinite(parsed.best) ? Math.max(0, parsed.best as number) : 0,
      beat: Boolean(parsed.beat),
      streak: Number.isFinite(parsed.streak) ? Math.max(0, parsed.streak as number) : 0,
      lastBeatDate: typeof parsed.lastBeatDate === "string" ? parsed.lastBeatDate : null,
    };

    if (safe.dateKey > today) {
      const yest = yesterdayKey(today);
      const keepStreak =
        safe.lastBeatDate === today || safe.lastBeatDate === yest ? safe.streak : 0;
      const rolled: DailyProgress = {
        dateKey: today,
        best: 0,
        beat: false,
        streak: keepStreak,
        lastBeatDate: safe.lastBeatDate,
      };
      save(rolled);
      return rolled;
    }

    if (safe.dateKey !== today) {
      const yest = yesterdayKey(today);
      const keepStreak = safe.lastBeatDate === yest ? safe.streak : 0;
      const rolled: DailyProgress = {
        dateKey: today,
        best: 0,
        beat: false,
        streak: keepStreak,
        lastBeatDate: safe.lastBeatDate,
      };
      save(rolled);
      return rolled;
    }
    return safe;
  } catch {
    return empty;
  }
}

function yesterdayKey(today: string): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function save(p: DailyProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function reportDailyBall(ballScore: number): DailyProgress {
  const p = loadDailyProgress();
  const ch = getDailyChallenge();
  if (ballScore > p.best) p.best = ballScore;
  if (!p.beat && p.best >= ch.target) {
    p.beat = true;

    const yest = yesterdayKey(p.dateKey);
    p.streak = p.lastBeatDate === yest ? p.streak + 1 : 1;
    p.lastBeatDate = p.dateKey;
  }
  save(p);
  return p;
}
