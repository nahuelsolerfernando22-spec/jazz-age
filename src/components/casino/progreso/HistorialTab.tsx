import { useMemo, useState } from "react";
import { useProgressLog, type ProgressLogEntry } from "@/store/progress-log";
import { LEAGUE_GAMES, tierById, type LeagueGameId } from "@/lib/leagues-daily";
import { TOURNEY_META, TOURNEY_REWARDS } from "@/lib/daily-tournament";
import { DAILY_POINT_CAP } from "@/store/league-progress";

type Filter = "todo" | "ligas" | "torneos";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "ligas", label: "Ligas" },
  { id: "torneos", label: "Torneos" },
];

const GAME_LABEL: Record<string, string> = Object.fromEntries([
  ...LEAGUE_GAMES.map((g) => [g.id, g.label]),
  ...Object.entries(TOURNEY_META).map(([id, m]) => [id, m.label]),
]);

function label(id: string): string {
  return GAME_LABEL[id] ?? id;
}

function when(at: number): string {
  return new Date(at).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ e }: { e: ProgressLogEntry }) {
  let title = "";
  let detail = "";
  let accent = "text-[var(--marfil)]/80";

  if (e.kind === "league-points") {
    title = `${label(e.game)} · +${e.points} pts de liga`;
    detail = `${e.before} + ${e.points} = ${e.after}${
      e.capped ? ` (tope diario ${DAILY_POINT_CAP})` : ""
    } · ${e.source} · jornada ${e.dayKey}`;
    accent = "text-[#9fd39f]";
  } else if (e.kind === "league-close") {
    const from = tierById(e.fromTier).name;
    const to = tierById(e.toTier).name;
    title = `${label(e.game)} · jornada ${e.dayKey} cerrada`;
    detail = `Puesto ${e.rank}/${e.total} con ${e.score} pts · ${from} → ${to}${
      e.favors > 0 ? ` · +${e.favors} favores` : ""
    }`;
    accent =
      e.outcome === "promo"
        ? "text-[var(--oro-claro)]"
        : e.outcome === "demote"
          ? "text-[#e08b7a]"
          : "text-[var(--marfil)]/80";
  } else if (e.kind === "tourney-score") {
    title = `${label(e.game)} · ronda ${e.round} enviada`;
    detail = `Puntaje ${e.score} · acumulado ${e.total}${
      e.rewardChips > 0 ? ` · +${e.rewardChips} fichas por participar` : ""
    }`;
  } else {
    title = `${label(e.game)} · torneo cerrado`;
    detail = e.rank
      ? `Puesto ${e.rank}/${e.total} con ${e.best} pts · premio ${e.prize} fichas · ${
          e.paid ? "pagado" : "ya estaba pagado"
        }`
      : `Sin participación registrada · sin premio`;
    accent = e.prize > 0 ? "text-[var(--oro-claro)]" : "text-[var(--marfil)]/80";
  }

  return (
    <li className="border-b border-[var(--oro)]/12 py-2 last:border-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className={`text-[12px] ${accent}`}>{title}</p>
        <span className="shrink-0 text-[11px] tabular-nums text-[var(--marfil)]/65">
          {when(e.at)}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-[var(--marfil)]/65">{detail}</p>
    </li>
  );
}

export function HistorialTab() {
  const entries = useProgressLog((s) => s.entries);
  const [filter, setFilter] = useState<Filter>("todo");

  const list = useMemo(
    () =>
      entries.filter((e) =>
        filter === "todo"
          ? true
          : filter === "ligas"
            ? e.kind.startsWith("league")
            : e.kind.startsWith("tourney"),
      ),
    [entries, filter],
  );

  const pointsByGame = useMemo(() => {
    const acc = new Map<LeagueGameId, number>();
    for (const e of entries) {
      if (e.kind !== "league-points") continue;
      acc.set(e.game, (acc.get(e.game) ?? 0) + e.points);
    }
    return [...acc.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--oro)]/20 bg-black/45 p-3">
        <h2
          className="text-[13px] uppercase tracking-[0.2em] text-[var(--oro-claro)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Premios del torneo por puesto
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TOURNEY_REWARDS.map((prize, i) => (
            <span
              key={i}
              className="rounded-md border border-[var(--oro)]/25 px-2 py-1 text-[11px] tabular-nums text-[var(--marfil)]/80"
            >
              {i + 1}º · {prize}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] italic leading-snug text-[var(--marfil)]/65">
          El premio se acredita una sola vez al cerrar la semana, aunque abras la app varias veces.
        </p>
      </section>

      {pointsByGame.length > 0 ? (
        <section className="rounded-xl border border-[var(--oro)]/20 bg-black/45 p-3">
          <h2
            className="text-[13px] uppercase tracking-[0.2em] text-[var(--oro-claro)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Puntos sumados por juego
          </h2>
          <ul className="mt-2 space-y-1">
            {pointsByGame.map(([game, pts]) => (
              <li key={game} className="flex justify-between text-[12px] text-[var(--marfil)]/80">
                <span>{label(game)}</span>
                <span className="tabular-nums text-[var(--crema)]">{pts} pts</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-[var(--oro)]/20 bg-black/45 p-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            className="text-[13px] uppercase tracking-[0.2em] text-[var(--oro-claro)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Movimientos
          </h2>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                data-haptic="tap"
                onClick={() => setFilter(f.id)}
                className={`min-h-9 rounded-full px-2.5 text-[11px] uppercase tracking-[0.18em] ${
                  filter === f.id
                    ? "bg-[var(--oro)]/25 text-[var(--oro-claro)]"
                    : "text-[var(--marfil)]/65"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <p className="py-6 text-center text-[11px] italic text-[var(--marfil)]/65">
            Todavía no hay movimientos registrados. Jugá una partida y volvé.
          </p>
        ) : (
          <ul className="mt-1">
            {list.slice(0, 120).map((e) => (
              <Row key={e.id} e={e} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
