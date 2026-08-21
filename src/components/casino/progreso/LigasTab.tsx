import { useEffect, useMemo, useState } from "react";
import { LeagueTable, type LeagueRow } from "@/components/casino/leagues/LeagueTable";
import { LeagueBadge } from "@/components/casino/leagues/LeagueBadge";
import {
  LEAGUE_GAMES,
  botsFor,
  competitionDayKey,
  dayProgress,
  PROMO_SLOTS,
  RELEGATION_SLOTS,
  TABLE_SIZE,
  tierById,
  type LeagueGameId,
  type LeagueTierId,
} from "@/lib/leagues-daily";
import { useLeagueProgress } from "@/store/league-progress";
import { useLeagueSnapshots } from "@/store/league-snapshots";

const TOTAL = TABLE_SIZE;
const PROMO_CUT = PROMO_SLOTS;
const RELEG_CUT = RELEGATION_SLOTS;

function buildTodayRows(
  game: LeagueGameId,
  tier: LeagueTierId,
  score: number,
): { rows: LeagueRow[]; active: number } {
  const bots = botsFor(game, tier, competitionDayKey(), { playerScore: score });
  const rows = [
    ...bots.map((b) => ({ name: b.name, score: b.score, isPlayer: false })),
    { name: "Vos", score, isPlayer: true },
  ]
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ rank: i + 1, ...r }));
  return { rows, active: bots.filter((b) => b.active).length };
}

export function LigasTab() {
  const byGame = useLeagueProgress((s) => s.byGame);
  const snapshots = useLeagueSnapshots((s) => s.byKey);

  const playedGames = useMemo(() => {
    return LEAGUE_GAMES.filter((g) => byGame[g.id as LeagueGameId]);
  }, [byGame]);

  const hasLeagues = playedGames.length > 0;

  const [game, setGame] = useState<LeagueGameId>(
    (playedGames[0]?.id ?? LEAGUE_GAMES[0].id) as LeagueGameId,
  );
  const [season, setSeason] = useState<string>("hoy");

  const prog = byGame[game] ?? {
    tier: "vagabundos" as LeagueTierId,
    dayKey: competitionDayKey(),
    todayScore: 0,
  };

  const seasons = useMemo(
    () =>
      Object.values(snapshots)
        .filter((s) => s.game === game)
        .map((s) => s.dayKey)
        .sort((a, b) => (a < b ? 1 : -1))
        .slice(0, 14),
    [snapshots, game],
  );

  const snap =
    season === "hoy"
      ? null
      : Object.values(snapshots).find((s) => s.game === game && s.dayKey === season);

  // refresco en vivo: los rivales siguen jugando durante la jornada
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const tier: LeagueTierId = snap ? snap.tier : prog.tier;
  const live = useMemo(
    () => (snap ? null : buildTodayRows(game, tier, prog.todayScore)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snap, game, tier, prog.todayScore, tick],
  );
  const rows: LeagueRow[] = snap ? snap.rows : (live?.rows ?? []);
  const myRow = rows.find((r) => r.isPlayer);
  const t = tierById(tier);
  const jornadaPct = Math.round(dayProgress(competitionDayKey()) * 100);

  const best = useMemo(() => {
    let top = tierById("vagabundos");
    for (const g of Object.values(byGame)) {
      if (!g) continue;
      const cur = tierById(g.tier);
      if (cur.rank > top.rank) top = cur;
    }
    return top;
  }, [byGame]);

  const totalToday = useMemo(
    () =>
      Object.values(byGame).reduce(
        (acc, g) => acc + (g && g.dayKey === competitionDayKey() ? g.todayScore : 0),
        0,
      ),
    [byGame],
  );

  if (!hasLeagues) {
    // Sin partidas no hay liga: mostrar una mesa fantasma con 19 bots y al
    // jugador último con 0 puntos es mentira y desanima.
    return (
      <section className="space-y-3 rounded-2xl border border-[var(--oro)]/25 bg-black/35 p-5 text-center">
        <p
          className="text-lg uppercase tracking-[0.12em] text-[var(--crema)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Todavía no estás en ninguna mesa
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--marfil)]/80">
          Jugá una partida y entrás a la liga de ese juego. Cada juego tiene su propia mesa de{" "}
          {TOTAL}: el top {PROMO_CUT} asciende y los últimos {RELEG_CUT} bajan al cierre de las
          04:00.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen: nivel actual y puntos */}
      <section className="flex items-center gap-4 rounded-2xl border border-[var(--oro)]/40 bg-black/60 p-3 shadow-lg">
        <LeagueBadge tier={best.id} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
            Nivel actual
          </p>
          <p className="truncate text-lg text-[var(--crema)]">{best.fullName}</p>
          <p className="text-[11px] text-[var(--marfil)]/80">
            Liga {best.rank}/9 · {totalToday.toLocaleString("es-AR")} pts hoy ·{" "}
            <span className="text-[var(--oro-claro)] font-bold">¡Ascenso posible!</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--marfil)]/65">
            Mi puesto
          </p>
          <p className="text-2xl tabular-nums text-[var(--oro-claro)]">{myRow?.rank ?? "—"}</p>
        </div>
      </section>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Juego">
          {playedGames.map((g) => {
            const active = g.id === game;
            return (
              <button
                key={g.id}
                type="button"
                data-haptic="tap"
                aria-pressed={active}
                onClick={() => {
                  setGame(g.id as LeagueGameId);
                  setSeason("hoy");
                }}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-[11px] uppercase tracking-[0.18em] ${
                  active
                    ? "border-[var(--oro)] bg-[var(--oro)] text-[#14100a]"
                    : "border-white/15 bg-white/[0.03] text-[var(--marfil)]/80"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Temporada">
          {["hoy", ...seasons].map((s) => {
            const active = s === season;
            return (
              <button
                key={s}
                type="button"
                data-haptic="tap"
                aria-pressed={active}
                onClick={() => setSeason(s)}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-[11px] uppercase tracking-[0.18em] ${
                  active
                    ? "border-[var(--oro)]/70 bg-[var(--oro)]/15 text-[var(--oro-claro)]"
                    : "border-white/10 bg-white/[0.02] text-[var(--marfil)]/65"
                }`}
              >
                {s === "hoy" ? "Jornada de hoy" : s}
              </button>
            );
          })}
        </div>
      </div>

      {!snap && (
        <div className="flex items-center gap-2 px-1 text-[11px] text-[var(--marfil)]/80">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#7fd18a]" />
          <span className="min-w-0 truncate">
            {live?.active ?? 0} rivales jugando ahora · jornada {jornadaPct}%
          </span>
        </div>
      )}

      <LeagueTable tier={tier} rows={rows} promoCut={PROMO_CUT} relegCut={RELEG_CUT} />

      <p className="px-1 text-[11px] leading-relaxed text-[var(--marfil)]/65">
        Sumás puntos de liga jugando. La jornada cierra a las 04:00: el{" "}
        <span className="text-[var(--oro-claro)] font-bold">top {PROMO_CUT} asciende</span> y los
        últimos {RELEG_CUT} descienden. Ascender en {t.fullName} paga {t.favorReward} 🪶. Los
        rivales suman durante todo el día: una marca temprana no alcanza.
      </p>
    </div>
  );
}
