import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  competitionDayKey,
  resolveDay,
  botsFor,
  FIRST_TIER,
  tierById,
  type DailyResolution,
  type LeagueGameId,
  type LeagueTierId,
} from "@/lib/leagues-daily";
import { useFavors } from "@/store/favors";
import { useLeagueSnapshots } from "@/store/league-snapshots";
import { logProgress } from "@/store/progress-log";

interface GameProgress {
  tier: LeagueTierId;
  dayKey: string;
  todayScore: number;
}

/**
 * Tope diario por juego. Sin tope, una sola noche de suerte en la ruleta
 * decide la liga entera y el resto de la semana no importa. Con tope, para
 * subir de liga hay que jugar varias mesas distintas.
 */
export const DAILY_POINT_CAP = 1500;

interface LeagueProgressState {
  byGame: Partial<Record<LeagueGameId, GameProgress>>;
  inbox: DailyResolution[];

  addPoints: (game: LeagueGameId, points: number, source?: string) => void;
  getProgress: (game: LeagueGameId) => GameProgress;
  resolveStaleDays: () => DailyResolution[];
  consumeInbox: () => DailyResolution[];
}

function freshProgress(): GameProgress {
  return { tier: FIRST_TIER, dayKey: competitionDayKey(), todayScore: 0 };
}

/**
 * Aviso local de ascenso: una sola notificación por jornada, aunque hayas
 * subido en varios juegos. Se puede apagar en Ajustes.
 */
function notifyPromotions(results: DailyResolution[], dayKey: string) {
  if (typeof window === "undefined") return;
  const promos = results.filter((r) => r.outcome === "promo");
  if (promos.length === 0) return;
  void (async () => {
    const { useSettings } = await import("@/store/settings");
    if (!useSettings.getState().leagueNotifications) return;
    const { notifyLocal } = await import("@/lib/notifications/local-notifications");
    const first = promos[0];
    const tier = tierById(first.newTier);
    const body =
      promos.length === 1
        ? `Subiste a ${tier.fullName} en ${first.game}. Te esperan en la mesa nueva.`
        : `Subiste de división en ${promos.length} juegos. El salón toma nota.`;
    await notifyLocal({
      title: "Ascendiste de liga",
      body,
      tag: `league-promo:${dayKey}`,
    });
  })();
}

export const useLeagueProgress = create<LeagueProgressState>()(
  persist(
    (set, get) => ({
      byGame: {},
      inbox: [],

      getProgress: (game) => get().byGame[game] ?? freshProgress(),

      addPoints: (game, points, source = "partida") => {
        if (points <= 0) return;
        get().resolveStaleDays();
        const today = competitionDayKey();
        const prev = get().byGame[game] ?? freshProgress();
        const base = prev.dayKey === today ? prev.todayScore : 0;
        const next: GameProgress = {
          tier: prev.tier,
          dayKey: today,
          todayScore: Math.min(DAILY_POINT_CAP, base + points),
        };
        set({ byGame: { ...get().byGame, [game]: next } });
        logProgress({
          kind: "league-points",
          game,
          dayKey: today,
          points,
          before: base,
          after: next.todayScore,
          capped: base + points > DAILY_POINT_CAP,
          source,
        });
      },

      resolveStaleDays: () => {
        const today = competitionDayKey();
        const out: DailyResolution[] = [];
        const updated: Partial<Record<LeagueGameId, GameProgress>> = { ...get().byGame };
        const snaps = useLeagueSnapshots.getState();
        for (const [gameKey, prog] of Object.entries(updated) as [LeagueGameId, GameProgress][]) {
          if (!prog || prog.dayKey === today) continue;

          const res = resolveDay(gameKey, prog.tier, prog.todayScore, prog.dayKey);

          const bots = botsFor(gameKey, prog.tier, prog.dayKey, {
            playerScore: prog.todayScore,
            final: true,
          });

          const rows = [
            ...bots.map((b) => ({ name: b.name, score: b.score, isPlayer: false })),
            { name: "Vos", score: prog.todayScore, isPlayer: true },
          ]
            .sort((a, b) => b.score - a.score)
            .map((r, i) => ({ rank: i + 1, ...r }));
          snaps.save({ game: gameKey, dayKey: prog.dayKey, tier: prog.tier, rows });
          logProgress({
            kind: "league-close",
            game: gameKey,
            dayKey: prog.dayKey,
            score: prog.todayScore,
            rank: res.rank,
            total: res.total,
            fromTier: prog.tier,
            toTier: res.newTier,
            outcome: res.outcome,
            favors: res.favors,
          });
          out.push(res);
          updated[gameKey] = { tier: res.newTier, dayKey: today, todayScore: 0 };
          if (res.favors > 0) useFavors.getState().add(res.favors);
        }

        if (out.length > 0) {
          set({
            byGame: updated,
            inbox: [...out, ...get().inbox].slice(0, 20),
          });
          notifyPromotions(out, today);
        }
        return out;
      },

      consumeInbox: () => {
        const cur = get().inbox;
        set({ inbox: [] });
        return cur;
      },
    }),
    {
      name: "speakeasy:leagues:v1",
      partialize: (s) => ({ byGame: s.byGame, inbox: s.inbox }),
    },
  ),
);

export function awardLeaguePoints(game: LeagueGameId, points: number, source?: string) {
  useLeagueProgress.getState().addPoints(game, points, source);
}
