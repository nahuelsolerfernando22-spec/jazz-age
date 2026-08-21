export type BagatelleAchievementId =
  | "first_win"
  | "first_jackpot"
  | "cuervo_letters_1"
  | "cuervo_letters_10"
  | "cuervo_letters_50"
  | "jackpot_x3"
  | "jackpot_x10"
  | "combo_10"
  | "combo_25"
  | "combo_50"
  | "cursed_once"
  | "cursed_10"
  | "cursed_survivor"
  | "bank_1k"
  | "bank_10k"
  | "bank_50k"
  | "score_5k"
  | "score_20k"
  | "score_50k"
  | "session_100k"
  | "session_500k"
  | "daily_beat"
  | "daily_streak_3"
  | "daily_streak_7"
  | "wager_beat_10"
  | "no_curse_run"
  | "night_owl"
  | "early_bird"
  | "loss_comeback"
  | "iron_will"
  | "collector";

export interface BagatelleAchievement {
  id: BagatelleAchievementId;
  title: string;
  desc: string;
  hidden?: boolean;
}

export const ACHIEVEMENTS: BagatelleAchievement[] = [
  { id: "first_win", title: "Primera pluma", desc: "Ganá tu primera bola." },
  { id: "first_jackpot", title: "Cuervo despierto", desc: "Cobrá tu primer JACKPOT ×10." },
  {
    id: "cuervo_letters_1",
    title: "C de Cuervo",
    desc: "Completá la palabra CUERVO por primera vez.",
  },
  { id: "cuervo_letters_10", title: "Coro de cuervos", desc: "Completá CUERVO 10 veces." },
  { id: "cuervo_letters_50", title: "Bandada dorada", desc: "Completá CUERVO 50 veces." },
  { id: "jackpot_x3", title: "Triple sombra", desc: "Cobrá 3 jackpots en la sesión." },
  { id: "jackpot_x10", title: "Cuervo mayor", desc: "Cobrá 10 jackpots totales." },
  { id: "combo_10", title: "En la mano", desc: "Combo de 10 golpes seguidos." },
  { id: "combo_25", title: "Ritmo del tablero", desc: "Combo de 25 golpes." },
  { id: "combo_50", title: "Mano bendita", desc: "Combo de 50 golpes." },
  { id: "cursed_once", title: "Rozado por la mala", desc: "Caíste en una ranura maldita." },
  { id: "cursed_10", title: "Habitué del mal", desc: "10 maldiciones acumuladas." },
  {
    id: "cursed_survivor",
    title: "Superviviente",
    desc: "Ganá una bola justo después de una maldición.",
  },
  { id: "bank_1k", title: "Chapa modesta", desc: "Tu Banca del Cuervo tocó 1.000." },
  { id: "bank_10k", title: "Cofre pesado", desc: "Tu Banca del Cuervo tocó 10.000." },
  { id: "bank_50k", title: "Bóveda del salón", desc: "Tu Banca del Cuervo tocó 50.000." },
  { id: "score_5k", title: "Bola de las buenas", desc: "Sumaste 5.000 en una sola bola." },
  { id: "score_20k", title: "Ala tendida", desc: "Sumaste 20.000 en una sola bola." },
  { id: "score_50k", title: "El máximo tributo", desc: "Sumaste 50.000 en una sola bola." },
  { id: "session_100k", title: "Noche redonda", desc: "100.000 sumados en la sesión." },
  { id: "session_500k", title: "Cabaret hasta el amanecer", desc: "500.000 sumados en la sesión." },
  { id: "daily_beat", title: "Retador", desc: "Superaste el objetivo del Reto del Día." },
  { id: "daily_streak_3", title: "Cita puntual", desc: "3 días seguidos superando el reto." },
  { id: "daily_streak_7", title: "Semana entera", desc: "7 días seguidos con el reto batido." },
  { id: "wager_beat_10", title: "Palabra cumplida", desc: "Ganaste 10 apuestas de anfitriona." },
  { id: "no_curse_run", title: "Manos limpias", desc: "10 bolas seguidas sin caer en maldición." },
  { id: "night_owl", title: "Ave nocturna", desc: "Jugaste después de las 2 AM." },
  { id: "early_bird", title: "Cuervo madrugador", desc: "Jugaste antes de las 6 AM." },
  {
    id: "loss_comeback",
    title: "La vuelta épica",
    desc: "Ganá una bola tras 5 drenajes seguidos.",
  },
  { id: "iron_will", title: "Voluntad de hierro", desc: "Jugaste 100 bolas en total." },
  { id: "collector", title: "Coleccionista", desc: "Desbloqueaste otros 15 logros." },
];

export const ACHIEVEMENTS_BY_ID: Record<BagatelleAchievementId, BagatelleAchievement> =
  Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<
    BagatelleAchievementId,
    BagatelleAchievement
  >;

const KEY = "bagatelle:achievements:v1";
const STATS_KEY = "bagatelle:stats:v1";

export interface BagatelleStats {
  totalBalls: number;
  totalWins: number;
  totalJackpots: number;
  totalCurses: number;
  cuervoCompletes: number;
  wagersBeat: number;
  bestBall: number;
  sessionScore: number;
  currentNoCurseStreak: number;
  currentLossStreak: number;
  bestBank: number;
  lastCurseFollowedByWin: boolean;
}

export function loadStats(): BagatelleStats {
  const empty: BagatelleStats = {
    totalBalls: 0,
    totalWins: 0,
    totalJackpots: 0,
    totalCurses: 0,
    cuervoCompletes: 0,
    wagersBeat: 0,
    bestBall: 0,
    sessionScore: 0,
    currentNoCurseStreak: 0,
    currentLossStreak: 0,
    bestBank: 0,
    lastCurseFollowedByWin: false,
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as Partial<BagatelleStats>) };
  } catch {
    return empty;
  }
}

export function saveStats(stats: BagatelleStats): void {
  if (typeof window === "undefined") return;
  try {
    const { sessionScore: _s, ...persist } = stats;
    void _s;
    window.localStorage.setItem(STATS_KEY, JSON.stringify(persist));
  } catch {}
}

export function loadUnlocked(): Set<BagatelleAchievementId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as BagatelleAchievementId[]);
  } catch {
    return new Set();
  }
}

function saveUnlocked(set: Set<BagatelleAchievementId>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export interface BallEvent {
  outcome: "jackpot10" | "win" | "small" | "barely" | "miss" | "curse";
  totalWin: number;
  cuervoCompleted: boolean;
  comboMax: number;
  bank: number;
  wagerBeaten: boolean;
  daily?: { beat: boolean; streak: number };
}

type Listener = (id: BagatelleAchievementId) => void;
const listeners = new Set<Listener>();
export function subscribeAchievementUnlocks(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function unlock(set: Set<BagatelleAchievementId>, id: BagatelleAchievementId): boolean {
  if (set.has(id)) return false;
  set.add(id);
  for (const l of listeners) {
    try {
      l(id);
    } catch {}
  }
  return true;
}

export function reportBall(ev: BallEvent): BagatelleAchievementId[] {
  const stats = loadStats();
  const unlocked = loadUnlocked();
  const before = unlocked.size;

  stats.totalBalls += 1;
  stats.sessionScore += Math.max(0, ev.totalWin);
  if (ev.totalWin > 0) {
    stats.totalWins += 1;
    stats.currentLossStreak = 0;
  } else {
    stats.currentLossStreak += 1;
  }
  if (ev.outcome === "jackpot10") stats.totalJackpots += 1;
  if (ev.outcome === "curse") {
    stats.totalCurses += 1;
    stats.currentNoCurseStreak = 0;
    stats.lastCurseFollowedByWin = false;
  } else {
    stats.currentNoCurseStreak += 1;
    if (stats.lastCurseFollowedByWin === false && ev.totalWin > 0) {
      unlock(unlocked, "cursed_survivor");
    }
    stats.lastCurseFollowedByWin = true;
  }
  if (ev.cuervoCompleted) stats.cuervoCompletes += 1;
  if (ev.wagerBeaten) stats.wagersBeat += 1;
  if (ev.totalWin > stats.bestBall) stats.bestBall = ev.totalWin;
  if (ev.bank > stats.bestBank) stats.bestBank = ev.bank;

  if (stats.totalWins >= 1) unlock(unlocked, "first_win");
  if (stats.totalJackpots >= 1) unlock(unlocked, "first_jackpot");
  if (stats.totalJackpots >= 3) unlock(unlocked, "jackpot_x3");
  if (stats.totalJackpots >= 10) unlock(unlocked, "jackpot_x10");
  if (stats.cuervoCompletes >= 1) unlock(unlocked, "cuervo_letters_1");
  if (stats.cuervoCompletes >= 10) unlock(unlocked, "cuervo_letters_10");
  if (stats.cuervoCompletes >= 50) unlock(unlocked, "cuervo_letters_50");
  if (ev.comboMax >= 10) unlock(unlocked, "combo_10");
  if (ev.comboMax >= 25) unlock(unlocked, "combo_25");
  if (ev.comboMax >= 50) unlock(unlocked, "combo_50");
  if (ev.outcome === "curse") {
    unlock(unlocked, "cursed_once");
    if (stats.totalCurses >= 10) unlock(unlocked, "cursed_10");
  }
  if (stats.bestBank >= 1000) unlock(unlocked, "bank_1k");
  if (stats.bestBank >= 10000) unlock(unlocked, "bank_10k");
  if (stats.bestBank >= 50000) unlock(unlocked, "bank_50k");
  if (ev.totalWin >= 5000) unlock(unlocked, "score_5k");
  if (ev.totalWin >= 20000) unlock(unlocked, "score_20k");
  if (ev.totalWin >= 50000) unlock(unlocked, "score_50k");
  if (stats.sessionScore >= 100000) unlock(unlocked, "session_100k");
  if (stats.sessionScore >= 500000) unlock(unlocked, "session_500k");
  if (stats.wagersBeat >= 10) unlock(unlocked, "wager_beat_10");
  if (stats.currentNoCurseStreak >= 10) unlock(unlocked, "no_curse_run");

  if (stats.totalBalls >= 100) unlock(unlocked, "iron_will");

  if (ev.daily?.beat) {
    unlock(unlocked, "daily_beat");
    if (ev.daily.streak >= 3) unlock(unlocked, "daily_streak_3");
    if (ev.daily.streak >= 7) unlock(unlocked, "daily_streak_7");
  }

  const hr = new Date().getHours();
  if (hr >= 0 && hr < 4) unlock(unlocked, "night_owl");
  if (hr >= 4 && hr < 7) unlock(unlocked, "early_bird");

  if (unlocked.size >= 16 && !unlocked.has("collector")) unlock(unlocked, "collector");

  saveStats(stats);
  saveUnlocked(unlocked);

  const after = Array.from(unlocked);
  return after.slice(before);
}

export function checkLossComeback(prevLossStreak: number, wonThisBall: boolean): void {
  if (wonThisBall && prevLossStreak >= 5) {
    const unlocked = loadUnlocked();
    if (unlock(unlocked, "loss_comeback")) saveUnlocked(unlocked);
  }
}

export function resetSessionScore(): void {
  const s = loadStats();
  s.sessionScore = 0;
  saveStats(s);
}
