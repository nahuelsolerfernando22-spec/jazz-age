import { getSupabase } from "@/integrations/supabase/lazy";
import { getDeviceId, getStoredAlias } from "@/lib/identity";
import { registerSyncHandler } from "@/lib/sync-queue";
import { dailySeed } from "@/lib/tournament";
import { WANDERERS } from "@/lib/wanderers";
import { isOfflineDemo } from "@/lib/offline-demo";
import {
  TOURNEY_FORMAT,
  TOURNEY_ROTATION,
  recordTourneyRound,
  tourneyRoundState,
  type TourneyGame,
} from "@/lib/tourney-format";

/**
 * Torneo SEMANAL del Cuervo.
 *
 * Antes había un torneo distinto cada día: con 12 juegos, tu juego favorito
 * caía una vez cada dos semanas y el evento se sentía ruido. Ahora hay un solo
 * torneo por semana (lunes 04:00 → lunes 04:00) sobre un juego de puntaje
 * comparable, y la rotación es de 5 semanas.
 *
 * Cada torneo tiene su propio formato (rondas e intentos): ver
 * `@/lib/tourney-format`. El puntaje que va a la pizarra es la suma de las
 * rondas jugadas.
 *
 * Los juegos que NO rotan (ruleta, blackjack, chinchón, escoba,
 * tragaperras) dependen de la banca o del rival: no dan una pizarra justa y
 * viven en las ligas diarias.
 */
export type { TourneyGame };
export { TOURNEY_ROTATION, TOURNEY_FORMAT, tourneyRoundState };

export const TOURNEY_META: Record<
  TourneyGame,
  {
    label: string;
    npc: string;
    route: string;
    flavor: string;
    ready: boolean;
    participationReward: number;
  }
> = {
  bagatelle: {
    label: "Bagatelle de Lola",
    npc: "Lola «La Suerte» Vargas",
    route: "/bagatelle",
    flavor: "Lola unta la palanca. Tres bolas, una sola tirada para la pizarra.",
    ready: true,
    participationReward: 120,
  },
  mahjong: {
    label: "Mahjong de Corvina",
    npc: "Madame Corvina",
    route: "/mahjong",
    flavor: "Doble por cada par limpio. Sin pistas. Sin retroceso.",
    ready: true,
    participationReward: 100,
  },
  truco: {
    label: "Truco de Eulalia",
    npc: "Eulalia «La Muda»",
    route: "/truco",
    flavor: "Eulalia baraja parejo. Gana el que más puntos le saque a la mesa hoy.",
    ready: true,
    participationReward: 160,
  },
  solitario: {
    label: "Solitario de Jade",
    npc: "Jade «La Paciente»",
    route: "/solitario",
    flavor: "Un solo mazo, el mismo para todos. Jade cuenta cada movimiento.",
    ready: true,
    participationReward: 90,
  },
  dados: {
    label: "Cinco Huesos de Zelda",
    npc: "Zelda «Cinco Dados»",
    route: "/dados",
    flavor: "Zelda sopla los dados. Una planilla por partida: manda tu mejor total de la semana.",
    ready: true,
    participationReward: 110,
  },
};

export const TOURNEY_REWARDS: number[] = [
  2000, 1400, 1000, 700, 700, 700, 700, 700, 400, 400, 400, 400, 400, 400, 400, 200, 200, 200, 200,
  200,
];

/** La semana del torneo arranca el lunes a las 04:00 (igual que la jornada de liga). */
export const TOURNEY_CUTOFF_HOUR = 4;
const OFFLINE_ALIAS = "Vos";
const OFFLINE_DEVICE_ID = "offline:player";
const OFFLINE_SCORE_PREFIX = "cuervo:tourney:local";
const OFFLINE_ARCHIVE_PREFIX = "cuervo:tourney:archive";
const OFFLINE_STATE_KEY = "cuervo:tourney:state:v1";

/** Fecha del lunes 04:00 que abrió la semana en curso. */
export function tourneyWeekStart(date = new Date()): Date {
  const d = new Date(date);
  if (d.getHours() < TOURNEY_CUTOFF_HOUR) d.setDate(d.getDate() - 1);
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow);
  d.setHours(TOURNEY_CUTOFF_HOUR, 0, 0, 0);
  return d;
}

export function tourneyWeekEnd(date = new Date()): Date {
  const end = tourneyWeekStart(date);
  end.setDate(end.getDate() + 7);
  return end;
}

/** Clave numérica estable de la semana (YYYYMMDD del lunes). */
export function tourneyPeriodKey(date = new Date()): number {
  const s = tourneyWeekStart(date);
  return s.getFullYear() * 10000 + (s.getMonth() + 1) * 100 + s.getDate();
}

/** Clave de la semana N semanas hacia atrás (para el historial). */
export function tourneyPeriodKeyOffset(weeksBack: number): number {
  const d = tourneyWeekStart();
  d.setDate(d.getDate() - weeksBack * 7);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Progreso de la semana en curso, 0..1 (para simular a los errantes). */
export function tourneyWeekProgress(date = new Date()): number {
  const start = tourneyWeekStart(date).getTime();
  const span = 7 * 24 * 60 * 60 * 1000;
  return Math.min(1, Math.max(0, (date.getTime() - start) / span));
}

/** Juego del torneo de esa semana. */
export function activeTourneyGame(period = tourneyPeriodKey()): TourneyGame {
  const weeks = Math.floor(
    Date.UTC(Math.floor(period / 10000), (Math.floor(period / 100) % 100) - 1, period % 100) /
      (7 * 24 * 60 * 60 * 1000),
  );
  return TOURNEY_ROTATION[Math.abs(weeks) % TOURNEY_ROTATION.length];
}

export function todayTourneySeed(period = tourneyPeriodKey()): number {
  return dailySeed("tourney", period, 0);
}

export interface TourneyRow {
  device_id: string;
  alias: string;
  score: number;
  attempts: number;
  updated_at: string;
  portrait?: string;
}

interface OfflineTourneyState {
  currentWeek: number;
  history: number[];
}

interface OfflineArchiveEntry {
  week: number;
  game: TourneyGame;
  best: number;
  attempts: number;
  rank: number | null;
  total: number;
  resolvedAt: string;
}

function localScoreKey(week: number, game: TourneyGame) {
  return `${OFFLINE_SCORE_PREFIX}:${week}:${game}`;
}

function localAttemptsKey(week: number, game: TourneyGame) {
  return `${OFFLINE_SCORE_PREFIX}:attempts:${week}:${game}`;
}

function localArchiveKey(week: number) {
  return `${OFFLINE_ARCHIVE_PREFIX}:${week}`;
}

function readOfflineState(): OfflineTourneyState {
  const currentWeek = tourneyPeriodKey();
  if (typeof window === "undefined") return { currentWeek, history: [] };
  try {
    const raw = window.localStorage.getItem(OFFLINE_STATE_KEY);
    if (!raw) return { currentWeek, history: [] };
    const parsed = JSON.parse(raw) as Partial<OfflineTourneyState>;
    return {
      currentWeek: typeof parsed.currentWeek === "number" ? parsed.currentWeek : currentWeek,
      history: Array.isArray(parsed.history)
        ? parsed.history.filter((v): v is number => typeof v === "number")
        : [],
    };
  } catch {
    return { currentWeek, history: [] };
  }
}

function writeOfflineState(state: OfflineTourneyState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFFLINE_STATE_KEY, JSON.stringify(state));
  } catch {}
}

function readOfflineArchive(week: number): OfflineArchiveEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localArchiveKey(week));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineArchiveEntry;
    return parsed.week === week ? parsed : null;
  } catch {
    return null;
  }
}

function writeOfflineArchive(entry: OfflineArchiveEntry) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localArchiveKey(entry.week), JSON.stringify(entry));
  } catch {}
}

function readOfflinePlayerWeek(
  week: number,
  game: TourneyGame,
): { score: number; attempts: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const score = Number(localStorage.getItem(localScoreKey(week, game)) ?? 0);
    const attempts = Number(localStorage.getItem(localAttemptsKey(week, game)) ?? 0);
    if (score <= 0 && attempts <= 0) return null;
    return { score: Math.max(0, score), attempts: Math.max(1, attempts) };
  } catch {
    return null;
  }
}

function buildOfflineBoard(
  game: TourneyGame,
  week: number,
  limit = 20,
): { rows: TourneyRow[]; player: { score: number; attempts: number; rank: number | null } | null } {
  const bots = offlineWanderersTop(game, week, 999);
  const mine = readOfflinePlayerWeek(week, game);
  const merged = mine
    ? [
        ...bots,
        {
          device_id: OFFLINE_DEVICE_ID,
          alias: getStoredAlias() || OFFLINE_ALIAS,
          score: mine.score,
          attempts: mine.attempts,
          updated_at: new Date().toISOString(),
        },
      ]
    : bots;

  const rows = merged
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.updated_at.localeCompare(b.updated_at) ||
        a.alias.localeCompare(b.alias),
    )
    .map((row, index) => ({
      ...row,
      attempts: Math.max(1, row.attempts),
      updated_at: row.updated_at || new Date(0).toISOString(),
    }));

  const playerIndex = rows.findIndex((row) => row.device_id === OFFLINE_DEVICE_ID);
  return {
    rows: rows.slice(0, limit),
    player: mine
      ? {
          score: mine.score,
          attempts: mine.attempts,
          rank: playerIndex >= 0 ? playerIndex + 1 : null,
        }
      : null,
  };
}

export function resolveOfflineTourneyWeeks(now = new Date()): number[] {
  if (typeof window === "undefined" || !isOfflineDemo()) return [];
  const currentWeek = tourneyPeriodKey(now);
  const state = readOfflineState();
  if (state.currentWeek === currentWeek) return state.history;

  const resolved: number[] = [];
  let week = state.currentWeek;
  const history = new Set<number>(state.history);

  while (week < currentWeek) {
    const game = activeTourneyGame(week);
    const mine = readOfflinePlayerWeek(week, game);
    if (mine) {
      const board = buildOfflineBoard(game, week, 999);
      const rank = board.player?.rank ?? null;
      writeOfflineArchive({
        week,
        game,
        best: mine.score,
        attempts: mine.attempts,
        rank,
        total: board.rows.length,
        resolvedAt: now.toISOString(),
      });
      // Premio real por posición final: se paga una sola vez por semana.
      void payTourneyPrize(week, game, rank, board.rows.length, mine.score);
    }
    history.add(week);
    resolved.push(week);
    const d = dateFromPeriodKey(week);
    d.setDate(d.getDate() + 7);
    week = tourneyPeriodKey(d);
  }

  writeOfflineState({
    currentWeek,
    history: Array.from(history)
      .sort((a, b) => b - a)
      .slice(0, 24),
  });
  return resolved;
}

/** Paga el premio por puesto final de una semana cerrada (una sola vez). */
async function payTourneyPrize(
  week: number,
  game: TourneyGame,
  rank: number | null,
  total: number,
  best: number,
): Promise<void> {
  if (typeof window === "undefined") return;
  const prize = rank ? (TOURNEY_REWARDS[rank - 1] ?? 0) : 0;
  const { useCasino } = await import("@/store/casino");
  // grantOnce es idempotente: el cierre de una semana paga y se registra una sola vez.
  const paid =
    prize > 0 && useCasino.getState().grantOnce(`tourney:prize:${week}:${game}`, { chips: prize });
  const { logProgress, useProgressLog } = await import("@/store/progress-log");
  const already = useProgressLog
    .getState()
    .entries.some((e) => e.kind === "tourney-close" && e.week === week && e.game === game);
  if (!already) logProgress({ kind: "tourney-close", game, week, rank, total, best, prize, paid });
  if (!paid) return;
  const { toast } = await import("sonner");
  toast.success(`Torneo cerrado: puesto ${rank}`, {
    description: `${TOURNEY_META[game].label} · +${prize} fichas`,
  });
}

function dateFromPeriodKey(period: number): Date {
  return new Date(
    Math.floor(period / 10000),
    (Math.floor(period / 100) % 100) - 1,
    period % 100,
    TOURNEY_CUTOFF_HOUR,
    0,
    0,
    0,
  );
}

export interface TourneySubmitResult {
  ok: boolean;
  /** Puntaje total del torneo (suma de rondas). */
  best: number;
  participationReward: number;
  rewardGranted: boolean;
  /** Ronda en la que entró el puntaje (1-indexed) o null si no entró. */
  round: number | null;
  roundsTotal: number;
  roundsDone: number;
  /** true si el jugador ya gastó todas las rondas de la semana. */
  finished: boolean;
  /** motivo cuando ok = false */
  reason?: "sin-alias" | "sin-rondas" | "error";
}

/**
 * Registra una entrada del torneo semanal.
 *
 * El puntaje cae en la ronda abierta (formato por juego), el total es la suma
 * de las rondas y esa suma es lo que se publica en la pizarra. Todo el
 * registro de rondas es local, así que funciona sin conexión; si hay backend,
 * se sincroniza el total.
 */
export async function submitTourneyScore(
  game: TourneyGame,
  score: number,
): Promise<TourneySubmitResult> {
  const format = TOURNEY_FORMAT[game];
  const alias = getStoredAlias();
  const base = {
    best: 0,
    participationReward: 0,
    rewardGranted: false,
    round: null,
    roundsTotal: format.rounds,
    roundsDone: 0,
    finished: false,
  };
  if (!alias) return { ...base, ok: false, reason: "sin-alias" };

  resolveOfflineTourneyWeeks();
  const week = tourneyPeriodKey();

  const result = recordTourneyRound(game, week, score);
  if (!result.accepted) {
    if (typeof window !== "undefined") {
      const { toast } = await import("sonner");
      toast(`${TOURNEY_META[game].label}: ya usaste tus ${format.rounds} rondas de la semana.`, {
        description: "Tu marca queda firme hasta el lunes.",
      });
    }
    return {
      ...base,
      ok: false,
      reason: "sin-rondas",
      best: result.total,
      roundsDone: result.roundsDone,
      finished: true,
    };
  }

  const next = result.total;
  const attempts = result.attempts.reduce((a, b) => a + b, 0);
  try {
    localStorage.setItem(localScoreKey(week, game), String(next));
    localStorage.setItem(localAttemptsKey(week, game), String(attempts));
  } catch {}

  if (!isOfflineDemo()) {
    // Si no hay red, la marca ya quedó firme en el dispositivo: solo falta
    // publicarla en la pizarra compartida, y de eso se ocupa la cola offline.
    const row = { day: week, game, device_id: getDeviceId(), alias, score: next, attempts };
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("daily_tournament_runs")
        .upsert(row, { onConflict: "day,game,device_id" });
      if (error) throw error;
    } catch {
      const { enqueueSyncOp } = await import("@/lib/sync-queue");
      enqueueSyncOp("tourney-score", `tourney:${week}:${game}`, row);
    }
  }

  const reward = TOURNEY_META[game].participationReward;
  let rewardGranted = false;
  if (typeof window !== "undefined") {
    const { useCasino } = await import("@/store/casino");
    // la recompensa por participar se paga una vez por ronda jugada
    const claimId = `tourney:participation:${week}:${game}:r${result.round}`;
    rewardGranted = useCasino.getState().grantOnce(claimId, { chips: reward });
    useCasino.getState().pushTourneyNotice({
      game,
      score: Math.max(0, Math.floor(score)),
      best: next,
      rewardChips: rewardGranted ? reward : 0,
    });
    const { logProgress } = await import("@/store/progress-log");
    logProgress({
      kind: "tourney-score",
      game,
      week,
      round: (result.round ?? 0) + 1,
      score: Math.max(0, Math.floor(score)),
      total: next,
      rewardChips: rewardGranted ? reward : 0,
    });
    const { notifyTourneyRoomToast } = await import("@/lib/tourney-room-toast");
    notifyTourneyRoomToast({
      game,
      label: TOURNEY_META[game].label,
      score: Math.max(0, Math.floor(score)),
      best: next,
      participationReward: reward,
      rewardGranted,
    });
  }

  return {
    ok: true,
    best: next,
    participationReward: reward,
    rewardGranted,
    round: (result.round ?? 0) + 1,
    roundsTotal: format.rounds,
    roundsDone: result.roundsDone,
    finished: result.finished,
  };
}

export async function fetchTourneyTop(
  game: TourneyGame,
  day = tourneyPeriodKey(),
  limit = 20,
): Promise<TourneyRow[]> {
  if (isOfflineDemo()) {
    resolveOfflineTourneyWeeks();
    return buildOfflineBoard(game, day, limit).rows;
  }
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (!offline) {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("daily_tournament_runs")
        .select("device_id, alias, score, attempts, updated_at")
        .eq("day", day)
        .eq("game", game)
        .order("score", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(limit);
      if (!error && data && data.length > 0) return data as TourneyRow[];
    } catch {}
  }
  return offlineWanderersTop(game, day, limit);
}

/** Fracción [0..1] del día de torneo transcurrida (cierra 04:00). */
export function tourneyDayProgress(now = new Date()): number {
  return tourneyWeekProgress(now);
}

export function offlineWanderersTop(
  game: TourneyGame,
  day = tourneyPeriodKey(),
  limit = 20,
): TourneyRow[] {
  const seed = dailySeed(game, day, 0);
  const rand = mulberry32Local(seed);
  const isToday = day === tourneyPeriodKey();
  const f = isToday ? tourneyDayProgress() : 1;
  const totalRounds = TOURNEY_FORMAT[game].rounds;
  const rows: TourneyRow[] = WANDERERS.map((w) => {
    // los errantes juegan el MISMO formato: una tanda de rondas por semana
    const roundScores: number[] = [];
    for (let i = 0; i < totalRounds; i++) {
      const u1 = Math.max(1e-9, rand());
      const u2 = rand();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const base = Math.exp(6.6 + 0.55 * z) * w.skill;
      roundScores.push(Math.max(60, Math.min(9000, Math.round(base))));
    }

    // cada errante tiene su horario: va cerrando rondas a lo largo de la semana
    const start = rand() * 0.45;
    const end = Math.min(1, start + 0.3 + rand() * 0.6);
    const pace = 0.6 + rand() * 1.6;
    let prog = 0;
    if (f >= end) prog = 1;
    else if (f > start) prog = Math.pow((f - start) / (end - start), pace);
    const roundsPlayed = Math.min(
      totalRounds,
      Math.floor(prog * totalRounds + (prog >= 1 ? 0 : 0.0001)),
    );

    const score = roundScores.slice(0, roundsPlayed).reduce((a, b) => a + b, 0);

    return {
      device_id: `offline:${w.id}`,
      alias: w.alias,
      score,
      attempts: roundsPlayed,
      updated_at: new Date(0).toISOString(),
      portrait: w.portrait,
    };
  });

  return rows
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function mulberry32Local(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function fetchMyTourneyBest(
  game: TourneyGame,
  day = tourneyPeriodKey(),
): Promise<{ score: number; attempts: number } | null> {
  if (isOfflineDemo()) {
    resolveOfflineTourneyWeeks();
    if (day === tourneyPeriodKey()) return readOfflinePlayerWeek(day, game);
    const archived = readOfflineArchive(day);
    if (archived && archived.game === game && archived.best > 0) {
      return { score: archived.best, attempts: archived.attempts };
    }
    return readOfflinePlayerWeek(day, game);
  }
  const device_id = getDeviceId();
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("daily_tournament_runs")
    .select("score, attempts")
    .eq("day", day)
    .eq("game", game)
    .eq("device_id", device_id)
    .maybeSingle();
  if (!data) return null;
  return { score: data.score, attempts: data.attempts };
}

export async function fetchMyTourneyRank(
  game: TourneyGame,
  day = tourneyPeriodKey(),
): Promise<number | null> {
  const me = await fetchMyTourneyBest(game, day);
  if (!me) return null;
  if (isOfflineDemo()) {
    resolveOfflineTourneyWeeks();
    const archived = readOfflineArchive(day);
    if (archived && archived.game === game) return archived.rank;
    return buildOfflineBoard(game, day, 999).player?.rank ?? null;
  }
  const supabase = await getSupabase();
  const { count } = await supabase
    .from("daily_tournament_runs")
    .select("device_id", { count: "exact", head: true })
    .eq("day", day)
    .eq("game", game)
    .gt("score", me.score);
  return (count ?? 0) + 1;
}

// Publicación diferida: cuando el envío del puntaje falla por falta de red se
// encola y se reintenta al volver la conexión o al reanudar la app.
registerSyncHandler("tourney-score", async (op) => {
  if (isOfflineDemo()) return;
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("daily_tournament_runs")
    .upsert(op.payload as never, { onConflict: "day,game,device_id" });
  if (error) throw error;
});
