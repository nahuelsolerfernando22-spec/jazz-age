import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { NoirBackdrop } from "@/components/single/NoirBackdrop";
import { useRouteVeil } from "@/hooks/use-route-veil";
import {
  CUP_GAMES,
  CUP_GAME_BY_ID,
  CUP_ROUNDS,
  CUP_ROUND_REWARDS,
  CUP_SWEEP_BONUS,
  CUP_TOTAL_ROUNDS,
  CUP_BUYIN,
  buildStandings,
  cupCountdown,
  cupPozo,
  matchesAt,
  participantsAt,
  rivalAt,
  cupRoundName,
  cupSchedule,
  cupDivision,
  garraLabel,
} from "@/lib/cup";
import { useCup } from "@/store/cup";

export const Route = createFileRoute("/torneo")({
  head: () => ({
    meta: [
      { title: "Torneos del Cuervo — cuadro, posiciones e historial" },
      {
        name: "description",
        content:
          "Elegí mesa, mirá el próximo torneo programado, tus cupos y reintentos, la tabla de posiciones y el historial de campeones del Cuervo Dorado.",
      },
      { property: "og:title", content: "Torneos del Cuervo — cuadro, posiciones e historial" },
      {
        property: "og:description",
        content:
          "Cuatro rondas de eliminación directa, recompensas acumulables y rivales que se adaptan a cómo venís jugando.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TorneoPage,
});

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function useTick(ms = 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

type Tab = "mesas" | "posiciones" | "historial";

const TABS: { id: Tab; label: string }[] = [
  { id: "mesas", label: "Mesas" },
  { id: "posiciones", label: "Posiciones" },
  { id: "historial", label: "Historial" },
];

const card = "rounded-sm border border-[var(--oro)]/30 bg-black/45 p-3 backdrop-blur-sm";
const btn =
  "cd-hit-44 rounded-sm border border-[var(--oro)]/60 bg-[var(--oro)]/15 px-3 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-[var(--oro)] transition active:scale-[0.97] disabled:opacity-40";

function TorneoPage() {
  useRouteVeil("none");
  const hydrated = useHydrated();
  const [tab, setTab] = useState<Tab>("mesas");
  const [mesa, setMesa] = useState<string>(CUP_GAMES[0].id);

  return (
    <main
      className="relative min-h-dvh px-4 py-10 text-[var(--crema)]"
      style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
    >
      <NoirBackdrop variant="logros" />

      <div className="mx-auto max-w-3xl" style={{ paddingBottom: "calc(var(--app-tabbar-h, 74px) + 32px)" }}>
        <header className="mb-5">
          <p className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--oro)]/70">
            Trastienda del salón
          </p>
          <h1 className="font-display text-3xl uppercase tracking-[0.14em] text-[var(--oro)]">
            Torneos del Cuervo
          </h1>
          <p className="mt-2 max-w-prose text-sm text-[var(--crema)]/75">
            Cuatro rondas, eliminación directa. Cada ronda ganada paga y deja algo en la vitrina;
            barrer el cuadro suma la corona y ¢{CUP_SWEEP_BONUS} extra.
          </p>
        </header>

        <div className="mb-4 flex gap-1 rounded-sm border border-[var(--oro)]/25 bg-black/40 p-1" role="tablist">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`cd-hit-44 flex-1 rounded-sm py-2 font-display text-[11px] uppercase tracking-[0.22em] transition ${
                  active
                    ? "bg-[var(--oro)]/20 text-[var(--oro)]"
                    : "text-[var(--crema)]/60 hover:text-[var(--crema)]/85"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "mesas" ? (
          <MesasTab hydrated={hydrated} />
        ) : tab === "posiciones" ? (
          <PosicionesTab hydrated={hydrated} mesa={mesa} setMesa={setMesa} />
        ) : (
          <HistorialTab hydrated={hydrated} />
        )}

        <div className="mt-8">
          <Link
            to="/single"
            className="font-display text-[11px] uppercase tracking-[0.24em] text-[var(--crema)]/60 underline-offset-4 hover:underline"
          >
            ← Volver al salón
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ───────────────────────────────  Mesas  ─────────────────────────────── */

function MesasTab({ hydrated }: { hydrated: boolean }) {
  useTick(1000);
  const active = useCup((s) => s.active);
  const scores = useCup((s) => s.scores);
  const start = useCup((s) => s.start);
  const abandon = useCup((s) => s.abandon);
  const retry = useCup((s) => s.retry);
  const cupos = useCup((s) => s.cupos)();
  const reserved = useCup((s) => s.reserved);
  const reserve = useCup((s) => s.reserve);
  const cancelReserve = useCup((s) => s.cancelReserve);
  const navigate = useNavigate();
  const agenda = useMemo(() => cupSchedule(Date.now(), 3), []);

  const enCurso = Boolean(active && active.status === "jugando");
  const onEntrar = (gameId: string) => {
    if (!start(gameId)) {
      void import("sonner").then(({ toast }) => toast.error("No pudiste entrar: revisá cupo y fichas."));
    }
  };

  return (
    <>
      <section className={`${card} mb-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
              Tus cupos de hoy
            </h2>
            <p className="mt-1 text-sm text-[var(--crema)]/80">
              {hydrated ? (
                <>
                  <strong>{cupos.entradas}</strong> anotadas ·{" "}
                  <strong>{cupos.reintentos}</strong> reintentos
                </>
              ) : (
                "…"
              )}
            </p>
            <p className="mt-1 text-[11px] text-[var(--crema)]/55">
              Entrada ¢{CUP_BUYIN} · pozo ¢{cupPozo()}
            </p>
          </div>
          <div className="text-right">
            <h2 className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
              Próximo llamado
            </h2>
            <p className="mt-1 text-sm text-[var(--crema)]/80">
              {CUP_GAME_BY_ID[agenda[0].gameId]?.nombre} · en {cupCountdown(agenda[0].at)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {hydrated && reserved ? (
            <>
              <p className="flex-1 text-xs text-[var(--crema)]/70">
                Tenés lugar guardado en {CUP_GAME_BY_ID[reserved.gameId]?.nombre} — abre en{" "}
                {cupCountdown(reserved.at)}.
              </p>
              {Date.now() >= reserved.at ? (
                <button type="button" className={btn} onClick={() => onEntrar(reserved.gameId)}>
                  Entrar
                </button>
              ) : (
                <button type="button" className={btn} onClick={cancelReserve}>
                  Soltar lugar
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className={btn}
              onClick={() => reserve(agenda[0].gameId, agenda[0].at)}
            >
              Reservar lugar
            </button>
          )}
        </div>
        <ul className="mt-3 space-y-1 text-xs text-[var(--crema)]/60">
          {agenda.slice(1).map((s) => (
            <li key={s.at}>
              {CUP_GAME_BY_ID[s.gameId]?.nombre} — en {cupCountdown(s.at)}
            </li>
          ))}
        </ul>
      </section>

      {hydrated && active ? (
        <CuadroActivo
          onJugar={() => {
            const juego = CUP_GAME_BY_ID[active.gameId];
            if (juego) void navigate({ to: juego.ruta });
          }}
          onCerrar={abandon}
          onReintentar={retry}
          reintentos={cupos.reintentos}
        />
      ) : null}

      <section className="mt-5">
        <h2 className="font-display text-sm uppercase tracking-[0.28em] text-[var(--oro)]/80">
          {enCurso ? "Otras mesas" : "Elegí la mesa"}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {CUP_GAMES.map((g) => {
            const esta = active?.gameId === g.id && active.status === "jugando";
            const sc = scores[g.id];
            return (
              <li key={g.id} className={card}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base uppercase tracking-[0.12em] text-[var(--oro)]">
                    {g.nombre}
                  </h3>
                  {hydrated && sc?.titulos ? (
                    <span
                      className="font-display text-[11px] uppercase tracking-[0.2em] text-[var(--oro)]/80"
                      title="Títulos ganados en esta mesa"
                    >
                      ★ {sc.titulos}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-[var(--crema)]/70">{g.criterio}</p>
                {hydrated && sc ? (
                  <p className="mt-1 text-[11px] text-[var(--crema)]/50">
                    {sc.puntos} pts · {sc.torneos} torneos · mejor: {sc.mejorRonda}/
                    {CUP_TOTAL_ROUNDS} rondas
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={esta || enCurso || (hydrated && cupos.entradas === 0)}
                    onClick={() => {
                      if (!start(g.id)) {
                        void import("sonner").then(({ toast }) =>
                          toast.error(
                            cupos.entradas === 0
                              ? "No te quedan anotadas por hoy."
                              : `Te faltan fichas: la entrada sale ¢${CUP_BUYIN}.`,
                          ),
                        );
                      }
                    }}
                    className={btn}
                  >
                    {esta
                      ? "En curso"
                      : hydrated && cupos.entradas === 0
                        ? "Sin cupo"
                        : `Anotarse ¢${CUP_BUYIN}`}
                  </button>
                  <Link
                    to={g.ruta}
                    className="cd-hit-44 rounded-sm px-2 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--crema)]/60 underline-offset-4 hover:underline"
                  >
                    Ver mesa
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-sm border border-[var(--oro)]/25 bg-black/40 p-4 text-xs text-[var(--crema)]/70">
        <h2 className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
          Lo que paga cada ronda
        </h2>
        <ul className="mt-2 space-y-1">
          {CUP_ROUNDS.map((r, i) => (
            <li key={r.id}>
              <span className="text-[var(--oro)]/90">{r.nombre}</span> — ¢
              {CUP_ROUND_REWARDS[i].fichas} · {CUP_ROUND_REWARDS[i].extra} ·{" "}
              {CUP_ROUND_REWARDS[i].puntos} pts
            </li>
          ))}
          <li>Barrer las cuatro suma ¢{CUP_SWEEP_BONUS} y la corona.</li>
          <li>
            Se anotan 16: entrada ¢{CUP_BUYIN} cada uno, pozo ¢{cupPozo()}. Los otros cruces se
            juegan en las mesas de al lado mientras vos jugás la tuya.
          </li>
          <li>Un empate no cierra la ronda: se vuelve a jugar.</li>
          <li>Los rivales suben o bajan la garra según cómo venís en esa mesa.</li>
        </ul>
      </section>
    </>
  );
}

function CuadroActivo({
  onJugar,
  onCerrar,
  onReintentar,
  reintentos,
}: {
  onJugar: () => void;
  onCerrar: () => void;
  onReintentar: () => boolean;
  reintentos: number;
}) {
  const active = useCup((s) => s.active)!;
  const juego = CUP_GAME_BY_ID[active.gameId];
  const rival = active.rivals[active.round];
  const rivalInfo = active.bracket ? rivalAt(active.bracket, active.round) : null;
  const terminado = active.status !== "jugando";

  return (
    <section className="rounded-sm border border-[var(--oro)]/45 bg-black/60 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-[var(--oro)]/70">
            Cuadro abierto
          </p>
          <h2 className="font-display text-xl uppercase tracking-[0.12em] text-[var(--oro)]">
            {juego?.nombre ?? active.gameId}
          </h2>
        </div>
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-[var(--crema)]/70">
          Bolsa ¢{active.purse} · {active.puntos} pts
        </p>
      </div>

      <BracketView />

      <ol className="mt-4 space-y-2">
        {CUP_ROUNDS.map((r, i) => {
          const res = active.results[i];
          const esActual = !terminado && i === active.round;
          return (
            <li
              key={r.id}
              className={`flex items-center justify-between gap-2 rounded-sm border px-3 py-2 text-sm ${
                esActual
                  ? "border-[var(--oro)]/70 bg-[var(--oro)]/10"
                  : "border-[var(--oro)]/20 bg-black/30"
              }`}
            >
              <span className="font-display text-[11px] uppercase tracking-[0.18em] text-[var(--oro)]/85">
                {r.corto}
              </span>
              <span className="flex-1 truncate text-[var(--crema)]/80">
                {active.rivals[i]?.nombre ?? "Por definir"}
                {active.rivals[i] ? (
                  <span className="text-[var(--crema)]/45">
                    {" "}
                    · {garraLabel(active.rivals[i]!.garra)}
                  </span>
                ) : null}
              </span>
              <span
                className={`font-display text-[11px] uppercase tracking-[0.2em] ${
                  res === "win"
                    ? "text-emerald-300"
                    : res === "loss"
                      ? "text-[var(--cd-red)]"
                      : "text-[var(--crema)]/40"
                }`}
              >
                {res === "win" ? "Ganada" : res === "loss" ? "Caíste" : esActual ? "Ahora" : "—"}
              </span>
            </li>
          );
        })}
      </ol>

      {active.trofeos.length ? (
        <p className="mt-3 text-xs text-[var(--crema)]/65">
          <span className="text-[var(--oro)]/80">Vitrina:</span> {active.trofeos.join(" · ")}
        </p>
      ) : null}

      {terminado ? (
        <div className="mt-4">
          <div className="rounded-sm border border-[var(--oro)]/35 bg-black/45 p-3">
            <p className="font-display text-[11px] uppercase tracking-[0.26em] text-[var(--oro)]/80">
              {active.status === "campeon" ? "Premiación" : "Fin del cuadro"}
            </p>
            <p className="mt-1 text-sm text-[var(--crema)]/80">
              {active.status === "campeon"
                ? `Campeón de ${juego?.nombre}. La casa te pagó ¢${active.purse}.`
                : `Te dejaron afuera en ${cupRoundName(active.round)}. La bolsa quedó en ¢${active.purse}.`}
            </p>
            <ul className="mt-2 space-y-0.5 text-[11px] text-[var(--crema)]/60">
              {active.results.map((r, i) => (
                <li key={i}>
                  {CUP_ROUNDS[i].corto} · {active.rivals[i]?.nombre ?? "—"} —{" "}
                  {r === "win" ? "ganada" : "perdida"}
                </li>
              ))}
              <li>
                Entrada ¢{active.buyin} · saldo neto ¢{active.purse - active.buyin} ·{" "}
                {active.puntos} pts de temporada
              </li>
              {active.trofeos.length ? <li>Vitrina: {active.trofeos.join(" · ")}</li> : null}
            </ul>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
          {active.status === "eliminado" ? (
            <button
              type="button"
              disabled={reintentos === 0}
              onClick={() => onReintentar()}
              className={btn}
            >
              {reintentos > 0 ? `Reintentar (${reintentos})` : "Sin reintentos"}
            </button>
          ) : null}
          <button type="button" onClick={onCerrar} className={btn}>
            Cerrar cuadro
          </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="flex-1 text-sm text-[var(--crema)]/80">
            {cupRoundName(active.round)} contra <strong>{rival?.nombre}</strong> (
            {garraLabel(rival?.garra ?? 1)}). {juego?.criterio}
            {rivalInfo ? (
              <span className="block text-[11px] text-[var(--crema)]/50">
                {rivalInfo.apodo} · {rivalInfo.record.g}-{rivalInfo.record.p} en el salón
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={onJugar}
            className="cd-hit-44 rounded-sm border border-[var(--oro)]/70 bg-[var(--oro)]/25 px-4 py-2 font-display text-[11px] uppercase tracking-[0.22em] text-[var(--oro)] transition active:scale-[0.97]"
          >
            Jugar ronda {active.round + 1}/{CUP_TOTAL_ROUNDS}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="cd-hit-44 rounded-sm px-2 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--crema)]/50 underline-offset-4 hover:underline"
          >
            Retirarse
          </button>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────  Posiciones  ──────────────────────────── */

function MesaPicker({ mesa, setMesa }: { mesa: string; setMesa: (id: string) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {CUP_GAMES.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => setMesa(g.id)}
          className={`cd-hit-44 rounded-sm border px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.18em] transition ${
            mesa === g.id
              ? "border-[var(--oro)]/70 bg-[var(--oro)]/20 text-[var(--oro)]"
              : "border-[var(--oro)]/25 text-[var(--crema)]/60"
          }`}
        >
          {g.nombre}
        </button>
      ))}
    </div>
  );
}

function PosicionesTab({
  hydrated,
  mesa,
  setMesa,
}: {
  hydrated: boolean;
  mesa: string;
  setMesa: (id: string) => void;
}) {
  const scores = useCup((s) => s.scores);
  const sc = scores[mesa];
  const filas = useMemo(
    () => buildStandings(mesa, hydrated ? (sc?.puntos ?? 0) : 0, hydrated ? (sc?.titulos ?? 0) : 0),
    [mesa, sc?.puntos, sc?.titulos, hydrated],
  );

  const totalPuntos = hydrated
    ? Object.values(scores).reduce((a, b) => a + b.puntos, 0)
    : 0;
  const div = cupDivision(totalPuntos);

  return (
    <section>
      <div className={`${card} mb-3`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
            Temporada
          </h2>
          <span className="font-display text-[12px] tracking-[0.14em] text-[var(--oro)]">
            {div.actual.nombre}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--crema)]/65">
          {totalPuntos} pts en total
          {div.siguiente
            ? ` · faltan ${Math.max(0, div.siguiente.desde - totalPuntos)} para ${div.siguiente.nombre}`
            : " · estás en lo más alto del salón"}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--oro)]/10">
          <div
            className="h-full rounded-full bg-[var(--oro)]/70"
            style={{
              width: div.siguiente
                ? `${Math.min(100, Math.round(((totalPuntos - div.actual.desde) / (div.siguiente.desde - div.actual.desde)) * 100))}%`
                : "100%",
            }}
          />
        </div>
      </div>
      <MesaPicker mesa={mesa} setMesa={setMesa} />
      <ol className={`${card} divide-y divide-[var(--oro)]/10 p-0`}>
        {filas.map((f, i) => (
          <li
            key={f.nombre}
            className={`flex items-center gap-3 px-3 py-2 text-sm ${
              f.esVos ? "bg-[var(--oro)]/10 text-[var(--oro)]" : "text-[var(--crema)]/80"
            }`}
          >
            <span className="w-6 font-display text-[11px] tracking-[0.16em] text-[var(--crema)]/50">
              {i + 1}
            </span>
            <span className="flex-1 truncate">{f.nombre}</span>
            <span className="text-[11px] text-[var(--crema)]/55">★ {f.titulos}</span>
            <span className="font-display text-[12px] tracking-[0.14em]">{f.puntos} pts</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-[var(--crema)]/50">
        Los puntos salen de las rondas ganadas: 10 / 25 / 45 / 80, más 60 por el título.
      </p>
    </section>
  );
}

/* ─────────────────────────────  Historial  ───────────────────────────── */

function HistorialTab({ hydrated }: { hydrated: boolean }) {
  const history = useCup((s) => s.history);
  const scores = useCup((s) => s.scores);

  if (!hydrated) {
    return <p className="py-10 text-center text-[11px] italic text-[var(--crema)]/60">Abriendo la libreta…</p>;
  }

  return (
    <section className="space-y-4">
      <div className={card}>
        <h2 className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
          Puntajes por mesa
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-[var(--crema)]/80">
          {CUP_GAMES.map((g) => {
            const sc = scores[g.id];
            return (
              <li key={g.id} className="flex items-baseline justify-between gap-2">
                <span className="truncate">{g.nombre}</span>
                <span className="text-[11px] text-[var(--crema)]/55">
                  {sc ? `${sc.puntos} pts · ★ ${sc.titulos} · ${sc.torneos} torneos` : "sin jugar"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={card}>
        <h2 className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">
          Torneos jugados
        </h2>
        {history.length === 0 ? (
          <p className="mt-2 text-xs italic text-[var(--crema)]/55">
            Todavía no cerraste ningún cuadro.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--oro)]/10">
            {history.map((h) => (
              <li key={`${h.at}-${h.gameId}`} className="flex items-center gap-3 py-2 text-sm">
                <span
                  className={`font-display text-[10px] uppercase tracking-[0.18em] ${
                    h.status === "campeon" ? "text-emerald-300" : "text-[var(--cd-red)]"
                  }`}
                >
                  {h.status === "campeon" ? "Campeón" : `R${h.rondas + 1}`}
                </span>
                <span className="flex-1 truncate text-[var(--crema)]/80">
                  {CUP_GAME_BY_ID[h.gameId]?.nombre ?? h.gameId}
                  <span className="text-[var(--crema)]/45"> · vs {h.rival}</span>
                </span>
                <span className="text-[11px] text-[var(--crema)]/55">
                  ¢{h.purse} · {h.puntos} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────  Llave de 16 en vivo  ─────────────────────── */

function BracketView() {
  const active = useCup((s) => s.active)!;
  const b = active.bracket;
  if (!b) return null;

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-[10px] uppercase tracking-[0.28em] text-[var(--oro)]/70">
          La llave · 16 anotados
        </h3>
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--crema)]/50">
          Pozo ¢{b.pozo}
        </span>
      </div>
      <div className="cuervo-scroll-perf mt-2 flex gap-2 overflow-x-auto pb-1">
        {CUP_ROUNDS.map((r, ri) => {
          const cruces = matchesAt(b, ri);
          const jugada = Boolean(b.winners[ri]);
          return (
            <div key={r.id} className="min-w-[9.5rem] flex-1">
              <p className="mb-1 font-display text-[9px] uppercase tracking-[0.2em] text-[var(--oro)]/60">
                {r.corto}
              </p>
              <ul className="space-y-1">
                {cruces.length === 0 ? (
                  <li className="rounded-sm border border-dashed border-[var(--oro)]/20 px-2 py-3 text-center text-[10px] italic text-[var(--crema)]/35">
                    por definir
                  </li>
                ) : (
                  cruces.map(([a, c], mi) => {
                    const ganador = b.winners[ri]?.[mi];
                    return (
                      <li
                        key={`${ri}-${mi}`}
                        className="rounded-sm border border-[var(--oro)]/20 bg-black/40 px-2 py-1"
                      >
                        {[a, c].map((idx) => {
                          const e = b.entrants[idx];
                          const gano = jugada && ganador === idx;
                          const perdio = jugada && ganador !== idx;
                          return (
                            <p
                              key={idx}
                              className={`flex items-center justify-between gap-1 truncate text-[11px] leading-5 ${
                                e?.esVos
                                  ? "text-[var(--oro)] font-bold"
                                  : perdio
                                    ? "text-[var(--crema)]/30 line-through"
                                    : "text-[var(--crema)]/80"
                              }`}
                            >
                              <span className="truncate">{e?.nombre ?? "—"}</span>
                              {gano ? <span className="text-emerald-300">✓</span> : null}
                            </p>
                          );
                        })}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-[var(--crema)]/45">
        Quedan {participantsAt(b, active.round).length} en carrera.
      </p>
    </div>
  );
}
