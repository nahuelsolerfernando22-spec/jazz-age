import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TOURNEY_FORMAT, tourneyRoundState } from "@/lib/tourney-format";
import {
  TOURNEY_META,
  TOURNEY_REWARDS,
  activeTourneyGame,
  fetchMyTourneyBest,
  fetchMyTourneyRank,
  fetchTourneyTop,
  resolveOfflineTourneyWeeks,
  tourneyPeriodKey,
  tourneyPeriodKeyOffset,
  tourneyWeekEnd,
  tourneyWeekProgress,
  type TourneyRow,
} from "@/lib/daily-tournament";
import { isOfflineDemo } from "@/lib/offline-demo";

interface WeekCell {
  key: number;
  start: Date;
  state: "abierto" | "finalizado";
}

function dateFromKey(key: number): Date {
  return new Date(Math.floor(key / 10000), (Math.floor(key / 100) % 100) - 1, key % 100);
}

function buildWeeks(): WeekCell[] {
  const out: WeekCell[] = [];
  for (let i = 5; i >= 0; i--) {
    const key = tourneyPeriodKeyOffset(i);
    out.push({ key, start: dateFromKey(key), state: i === 0 ? "abierto" : "finalizado" });
  }
  return out;
}

function remaining(): string {
  const ms = tourneyWeekEnd().getTime() - Date.now();
  if (ms <= 0) return "cerrando";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d} d ${h} h` : `${h} h`;
}

export function TorneosTab() {
  const weeks = useMemo(buildWeeks, []);
  const [selected, setSelected] = useState<number>(() => tourneyPeriodKey());
  const [top, setTop] = useState<TourneyRow[]>([]);
  const [mine, setMine] = useState<{ score: number; attempts: number } | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const cell = weeks.find((c) => c.key === selected) ?? weeks[weeks.length - 1];
  const game = activeTourneyGame(selected);
  const meta = TOURNEY_META[game];
  const format = TOURNEY_FORMAT[game];
  const open = cell.state === "abierto";
  const offline = isOfflineDemo();
  const rounds = useMemo(() => tourneyRoundState(game, selected), [game, selected, mine]);

  useEffect(() => {
    if (offline) resolveOfflineTourneyWeeks();
    let alive = true;
    setLoading(true);
    const load = async () => {
      const [rows, best, rank] = await Promise.all([
        fetchTourneyTop(game, selected, 12),
        fetchMyTourneyBest(game, selected),
        fetchMyTourneyRank(game, selected),
      ]);
      if (!alive) return;
      setTop(rows);
      setMine(best);
      setMyRank(rank);
      setLoading(false);
    };
    void load();
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      void load();
    }, 45_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [game, selected, offline]);

  const pct = Math.round(tourneyWeekProgress() * 100);
  void tick;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--oro)]/40 bg-black/60 p-3 shadow-lg">
        <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
          Torneo semanal · últimas 6 semanas
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {weeks.map((c) => {
            const active = c.key === selected;
            const g = activeTourneyGame(c.key);
            return (
              <button
                key={c.key}
                type="button"
                data-haptic="tap"
                aria-pressed={active}
                aria-label={`Semana del ${c.start.toLocaleDateString("es-AR")} · ${TOURNEY_META[g].label} · ${c.state}`}
                onClick={() => setSelected(c.key)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-lg border px-1 py-1 ${
                  active
                    ? "border-[var(--oro)] bg-[var(--oro)]/20 text-[var(--oro-claro)]"
                    : "border-white/10 bg-white/[0.03] text-[var(--marfil)]/80"
                }`}
              >
                <span className="text-[12px] tabular-nums leading-none">
                  {c.start.getDate()}/{c.start.getMonth() + 1}
                </span>
                <span
                  aria-hidden
                  className={`mt-1 h-1.5 w-1.5 rounded-full ${
                    c.state === "abierto" ? "bg-[var(--cd-green-ok)]" : "bg-[var(--marfil)]/25"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--oro)]/40 bg-black/60 p-3 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
              Semana del {cell.start.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
            </p>
            <h3 className="truncate text-lg text-[var(--crema)]">{meta.label}</h3>
            <p className="text-[11px] italic text-[var(--marfil)]/80">{meta.flavor}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
              open ? "bg-[var(--cd-green-ok)]/15 text-[var(--cd-green-ok)]" : "bg-white/[0.06] text-[var(--marfil)]/65"
            }`}
          >
            {cell.state}
          </span>
        </div>

        {open ? (
          <p className="mt-2 text-[11px] text-[var(--marfil)]/80">
            Cierra en <span className="tabular-nums text-[var(--oro-claro)]">{remaining()}</span> ·
            semana al <span className="tabular-nums">{pct} %</span>
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-[var(--marfil)]/65">
            Se guarda tu mejor marca de esa semana aunque estés completamente offline.
          </p>
        )}

        <div className="mt-3 rounded-xl border border-white/20 bg-black/40 p-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--oro)]/80">
            Formato · {format.rounds} {format.roundLabel.toLowerCase()}
            {format.rounds > 1 ? "s" : ""} · {format.scoring}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Rondas jugadas">
            {Array.from({ length: format.rounds }).map((_, i) => {
              const done = rounds ? rounds.attempts[i] >= format.attemptsPerRound : false;
              const score = rounds?.scores[i] ?? 0;
              return (
                <span
                  key={i}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-lg border px-2 text-[11px] tabular-nums ${
                    done
                      ? "border-[var(--oro)]/50 bg-[var(--oro)]/15 text-[var(--oro-claro)]"
                      : "border-white/10 bg-white/[0.02] text-[var(--marfil)]/65"
                  }`}
                >
                  {format.roundLabel} {i + 1}
                  <span className="opacity-70">{done ? score.toLocaleString("es-AR") : "—"}</span>
                </span>
              );
            })}
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-[var(--marfil)]/80">
            {format.rules.map((r) => (
              <li key={r}>· {r}</li>
            ))}
          </ul>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/20 bg-black/40 p-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--marfil)]/65">
              Mi marca
            </p>
            <p className="text-base tabular-nums text-[var(--oro-claro)]">
              {mine ? mine.score.toLocaleString("es-AR") : "Sin participar"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--marfil)]/65">
              Mi puesto
            </p>
            <p className="text-base tabular-nums text-[var(--crema)]">{myRank ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--marfil)]/65">
              Rondas
            </p>
            <p className="text-base tabular-nums text-[var(--crema)]">
              {rounds ? `${rounds.roundsDone}/${format.rounds}` : `0/${format.rounds}`}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-[11px] text-[var(--crema-clara)]/80">
          <span>
            {offline
              ? "La pizarra y tu marca viven en este Android."
              : "La pizarra se sincroniza cuando hay red."}
          </span>
          {open ? (
            <Link
              to={meta.route}
              data-haptic="tap"
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--oro)] px-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--cd-noir-3)]"
            >
              Jugar
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--oro)]/40 bg-black/60 p-3 shadow-lg">
        <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
          Pizarra · premio top 1: {TOURNEY_REWARDS[0].toLocaleString("es-AR")} fichas
        </p>
        {loading ? (
          <p className="py-4 text-center text-[11px] italic text-[var(--marfil)]/65">
            Leyendo la pizarra…
          </p>
        ) : (
          <ol className="space-y-1">
            {top.map((r, i) => {
              const isMe = myRank === i + 1 && mine && r.score === mine.score;
              return (
                <li
                  key={r.device_id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] ${
                    isMe ? "bg-[var(--oro)]/10 ring-1 ring-[var(--oro)]/35" : "bg-white/[0.02]"
                  }`}
                >
                  <span className="w-5 text-right tabular-nums text-[var(--oro)]/80">{i + 1}</span>
                  {r.portrait ? (
                    <img
                      src={r.portrait}
                      alt=""
                      loading="lazy"
                      className="h-7 w-7 shrink-0 rounded-full border border-[var(--oro)]/30 object-cover object-top"
                    />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--oro)]/30 text-[11px] text-[var(--oro)]/80">
                      {r.alias.slice(0, 1)}
                    </span>
                  )}
                  <span className="flex-1 truncate text-[var(--marfil)]/85">{r.alias}</span>
                  <span className="tabular-nums text-[var(--crema)]">
                    {r.score.toLocaleString("es-AR")}
                  </span>
                </li>
              );
            })}
            {top.length === 0 ? (
              <li className="py-3 text-center text-[11px] italic text-[var(--marfil)]/65">
                Nadie anotó esa semana.
              </li>
            ) : null}
          </ol>
        )}
      </section>
    </div>
  );
}
