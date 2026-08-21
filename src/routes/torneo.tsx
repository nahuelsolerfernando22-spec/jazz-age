import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NoirBackdrop } from "@/components/single/NoirBackdrop";
import { useRouteVeil } from "@/hooks/use-route-veil";
import {
  CUP_GAMES,
  CUP_GAME_BY_ID,
  CUP_PURSE,
  CUP_ROUNDS,
  CUP_TOTAL_ROUNDS,
  cupRoundName,
} from "@/lib/cup";
import { useCup } from "@/store/cup";

export const Route = createFileRoute("/torneo")({
  head: () => ({
    meta: [
      { title: "Torneo del Cuervo — cuatro rondas por el título" },
      {
        name: "description",
        content:
          "Anotate en el torneo del Cuervo Dorado: cuatro rondas de eliminación directa en truco, chinchón, blackjack, dados y El Sindicato.",
      },
      { property: "og:title", content: "Torneo del Cuervo — cuatro rondas por el título" },
      {
        property: "og:description",
        content: "Cuadro de eliminación directa, rivales de la casa y bolsa creciente.",
      },
    ],
  }),
  component: TorneoPage,
});

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function TorneoPage() {
  useRouteVeil("none");
  const hydrated = useHydrated();
  const active = useCup((s) => s.active);
  const titles = useCup((s) => s.titles);
  const start = useCup((s) => s.start);
  const abandon = useCup((s) => s.abandon);
  const navigate = useNavigate();

  const titulosPorMesa = titles.reduce<Record<string, number>>((acc, t) => {
    acc[t.gameId] = (acc[t.gameId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main
      className="relative min-h-dvh px-4 py-10 text-[var(--crema)]"
      style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
    >
      <NoirBackdrop variant="logros" />

      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--oro)]/70">
            Trastienda del salón
          </p>
          <h1 className="font-display text-3xl uppercase tracking-[0.14em] text-[var(--oro)]">
            Torneo del Cuervo
          </h1>
          <p className="mt-2 max-w-prose text-sm text-[var(--crema)]/75">
            Cuatro rondas, eliminación directa. Ganás las cuatro y te llevás el título de la mesa.
            Si caés, el cuadro se cierra: te podés volver a anotar cuando quieras, con otro sorteo.
          </p>
        </header>

        {hydrated && active ? (
          <CuadroActivo
            onJugar={() => {
              const juego = CUP_GAME_BY_ID[active.gameId];
              if (juego) void navigate({ to: juego.ruta });
            }}
            onCerrar={abandon}
          />
        ) : null}

        <section className="mt-6">
          <h2 className="font-display text-sm uppercase tracking-[0.28em] text-[var(--oro)]/80">
            {active && active.status === "jugando" ? "Otras mesas" : "Elegí la mesa"}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {CUP_GAMES.map((g) => {
              const enCurso = active?.gameId === g.id && active.status === "jugando";
              return (
                <li
                  key={g.id}
                  className="rounded-sm border border-[var(--oro)]/30 bg-black/45 p-3 backdrop-blur-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-base uppercase tracking-[0.12em] text-[var(--oro)]">
                      {g.nombre}
                    </h3>
                    {hydrated && titulosPorMesa[g.id] ? (
                      <span
                        className="font-display text-[11px] uppercase tracking-[0.2em] text-[var(--oro)]/80"
                        title="Títulos ganados en esta mesa"
                      >
                        ★ {titulosPorMesa[g.id]}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--crema)]/70">{g.criterio}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={enCurso}
                      onClick={() => start(g.id)}
                      className="cd-hit-44 rounded-sm border border-[var(--oro)]/60 bg-[var(--oro)]/15 px-3 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-[var(--oro)] transition active:scale-[0.97] disabled:opacity-40"
                    >
                      {enCurso ? "En curso" : "Anotarse"}
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
            Cómo se juega el cuadro
          </h2>
          <ul className="mt-2 space-y-1">
            {CUP_ROUNDS.map((r, i) => (
              <li key={r.id}>
                <span className="text-[var(--oro)]/90">{r.nombre}</span> — bolsa ¢{CUP_PURSE[i]}
              </li>
            ))}
            <li>Un empate no cierra la ronda: se vuelve a jugar.</li>
            <li>Abandonar la partida cuenta como derrota.</li>
          </ul>
        </section>

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

function CuadroActivo({ onJugar, onCerrar }: { onJugar: () => void; onCerrar: () => void }) {
  const active = useCup((s) => s.active)!;
  const juego = CUP_GAME_BY_ID[active.gameId];
  const rival = active.rivals[active.round];
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
          Bolsa ¢{active.purse}
        </p>
      </div>

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
                {active.rivals[i]?.nombre}
                <span className="text-[var(--crema)]/45"> · {active.rivals[i]?.apodo}</span>
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

      {terminado ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="flex-1 text-sm text-[var(--crema)]/80">
            {active.status === "campeon"
              ? `Campeón de ${juego?.nombre}. La casa te pagó ¢${active.purse}.`
              : `Te dejaron afuera. La bolsa quedó en ¢${active.purse}.`}
          </p>
          <button
            type="button"
            onClick={onCerrar}
            className="cd-hit-44 rounded-sm border border-[var(--oro)]/60 bg-[var(--oro)]/15 px-3 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-[var(--oro)]"
          >
            Cerrar cuadro
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="flex-1 text-sm text-[var(--crema)]/80">
            {cupRoundName(active.round)} contra <strong>{rival?.nombre}</strong>. {juego?.criterio}
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
