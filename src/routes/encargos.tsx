import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ENCARGO_GAMES,
  type EncargoGame,
  type EncargoLevel,
} from "@/components/casino/encargos/encargos-config";
import { NoirOverlay } from "@/components/single/NoirOverlay";
import { OrnamentoTinta } from "@/components/casino/DecoIcons";
import { useCasino, rankFromXp } from "@/store/casino";
import corvinaOficina from "@/assets/corvina-oficina.webp";

export const Route = createFileRoute("/encargos")({
  ssr: false,
  component: EncargosPage,
  errorComponent: EncargosError,
  notFoundComponent: EncargosNotFound,
  pendingComponent: EncargosPending,
  head: () => ({
    meta: [
      { title: "La Oficina de Corvina — Encargos del Cuervo" },
      {
        name: "description",
        content:
          "Corvina reparte los encargos del salón clandestino según tu rango: legajos por mesa, jefes, modificadores y estrellas.",
      },
    ],
  }),
});

function EncargosPending() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--tinta)] text-[var(--oro)]">
      <div className="font-display text-xs uppercase tracking-[0.4em] opacity-70">
        Cargando encargos…
      </div>
    </div>
  );
}

function EncargosNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--tinta)] text-[var(--marfil)]">
      <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-[var(--oro-claro)]">
        Encargo perdido
      </h1>
      <Link
        to="/encargos"
        className="rounded-full border border-[var(--oro)]/40 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[var(--oro)] hover:bg-[var(--oro)]/10"
      >
        Volver al hub
      </Link>
    </div>
  );
}

function EncargosError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--tinta)] p-6 text-center text-[var(--marfil)]">
      <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-red-300">
        Se cayó la mesa
      </h1>
      <p className="max-w-md text-sm text-[var(--marfil)]/80">
        {error.message || "Algo salió mal cargando los encargos."}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[var(--oro)] px-5 py-2 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--tinta)] hover:bg-[var(--oro-claro)]"
        >
          Reintentar
        </button>
        <Link
          to="/"
          className="rounded-full border border-[var(--oro)]/40 px-5 py-2 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--oro)] hover:bg-[var(--oro)]/10"
        >
          Volver al salón
        </Link>
      </div>
    </div>
  );
}

/** Cantidad de legajos previos que hay que cerrar para que Corvina abra el siguiente. */
const CARPETAS_PARA_ABRIR = 2;

type Fila = {
  game: EncargoGame;
  cleared: Record<string, { stars: 0 | 1 | 2 | 3 }>;
  active: string | null;
  clearedCount: number;
  next: EncargoLevel | null;
  unlocked: boolean;
  requisito: string;
};

function useOficina(playerLevel: number): Fila[] {
  // El orden de ENCARGO_GAMES es estático: los hooks se llaman siempre igual.
  const raw = ENCARGO_GAMES.map((game) => ({
    game,
    cleared: game.useCleared(),
    active: game.useActiveLevel(),
  }));

  const filas: Fila[] = [];
  raw.forEach((r, i) => {
    const clearedCount = Object.keys(r.cleared).length;
    const next =
      [...r.game.levels].sort((a, b) => a.order - b.order).find((l) => !r.cleared[l.id]) ?? null;
    const prev = filas[i - 1];
    const prevOk = i === 0 || (prev != null && prev.clearedCount >= CARPETAS_PARA_ABRIR);
    const rangoOk = playerLevel >= r.game.requiredLevel;
    filas.push({
      ...r,
      clearedCount,
      next,
      unlocked: prevOk && rangoOk,
      requisito: !rangoOk
        ? `Rango nivel ${r.game.requiredLevel}`
        : !prevOk
          ? `Cerrá ${CARPETAS_PARA_ABRIR} encargos de ${prev?.game.title ?? "la mesa anterior"}`
          : "",
    });
  });
  return filas;
}

function EncargosPage() {
  const xp = useCasino((s) => s.xp);
  const rank = rankFromXp(xp);
  const filas = useOficina(rank.level);

  const enCurso = filas.find((f) => f.active != null) ?? null;
  const oferta = enCurso ? null : (filas.find((f) => f.unlocked && f.next != null) ?? null);

  return (
    <div className="relative min-h-dvh bg-[var(--tinta)] text-[var(--marfil)]">
      <NoirOverlay />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.30 0.10 40 / 0.5) 0%, transparent 62%), linear-gradient(180deg, oklch(0.08 0.03 22 / 1) 0%, oklch(0.04 0.01 22 / 1) 100%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 pb-28 pt-4">
        <Oficina rankName={rank.current.name} level={rank.level} />

        {enCurso ? (
          <EncargoEnCurso fila={enCurso} />
        ) : oferta ? (
          <Legajo fila={oferta} />
        ) : (
          <div className="mt-5 rounded-sm border border-[var(--oro)]/25 bg-black/40 p-6 text-center">
            <p className="font-script text-base text-[var(--marfil)]/90">
              «Por hoy no tengo nada para vos. Subí de rango y volvé.»
            </p>
          </div>
        )}

        <Archivo filas={filas} />
      </div>
    </div>
  );
}

function Oficina({ rankName, level }: { rankName: string; level: number }) {
  return (
    <header className="relative overflow-hidden rounded-sm border border-[var(--oro)]/30 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.95)]">
      <img
        src={corvinaOficina}
        alt="Corvina, la encargada, en su oficina del salón clandestino"
        style={{
          objectPosition: "50% 22%",
          filter: "sepia(0.32) contrast(1.12) saturate(0.86) brightness(0.94)",
        }}
        className="h-[340px] w-full object-cover sm:h-[420px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(58deg, oklch(0.02 0 0 / 0.35) 0px, oklch(0.02 0 0 / 0.35) 1px, transparent 1px, transparent 5px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 50% 30%, transparent 38%, oklch(0.03 0.01 30 / 0.85) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.06 0.02 24 / 0.55) 0%, transparent 30%, oklch(0.06 0.02 24 / 0.75) 72%, oklch(0.05 0.02 24 / 0.98) 100%)",
        }}
      />
      <Link
        to="/"
        aria-label="Salir de la oficina"
        className="cd-tap-safe absolute left-3 top-3 z-20 inline-flex items-center justify-center rounded-full border border-[var(--oro)]/40 bg-[var(--tinta)]/70 px-4 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--oro)] backdrop-blur"
      >
        Salir
      </Link>

      <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-center sm:p-5">
        <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--oro)]/85">
          Oficina de la encargada
        </div>
        <h1 className="mt-1 flex items-center justify-center gap-2 font-display text-2xl uppercase tracking-[0.2em] text-[var(--oro-claro)] sm:text-3xl">
          <OrnamentoTinta size={14} className="text-[var(--oro)]/80" />
          Corvina
          <OrnamentoTinta size={14} flip className="text-[var(--oro)]/80" />
        </h1>
        <p className="mx-auto mt-2 max-w-sm font-script text-sm leading-snug text-[var(--marfil)]/95 sm:text-base">
          «Acá se trabaja de a un encargo por vez. Cerrás uno y recién ahí abro la carpeta que
          sigue.»
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="rounded-sm border border-[var(--oro)]/40 bg-[var(--oro)]/10 px-2 py-1 font-display text-[11px] uppercase tracking-[0.25em] text-[var(--oro)]">
            {rankName}
          </span>
          <span className="rounded-sm border border-[var(--oro)]/25 bg-black/50 px-2 py-1 font-display text-[11px] uppercase tracking-[0.25em] text-[var(--marfil)]/80">
            Nivel {level}
          </span>
        </div>
      </div>
    </header>
  );
}

function SelloLegajo({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--oro)]/45" />
      <OrnamentoTinta size={13} className="shrink-0 text-[var(--oro)]/80" />
      <span className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--oro)]/85">
        {texto}
      </span>
      <OrnamentoTinta size={13} flip className="shrink-0 text-[var(--oro)]/80" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--oro)]/45" />
    </div>
  );
}

function EncargoEnCurso({ fila }: { fila: Fila }) {
  const level = fila.game.levels.find((l) => l.id === fila.active) ?? null;
  return (
    <section className="mt-6">
      <SelloLegajo texto="Encargo en curso" />
      <div className="mt-3 rounded-sm border border-emerald-500/45 bg-emerald-500/[0.07] p-5">
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-emerald-300/80">
          {fila.game.hostess} · {fila.game.title}
        </div>
        <h2 className="mt-1 font-display text-xl uppercase tracking-[0.12em] text-[var(--oro-claro)]">
          {level?.title ?? fila.active}
        </h2>
        <p className="mt-1 text-sm text-[var(--marfil)]/80">{level?.objectiveLabel}</p>
        <Link
          to={fila.game.route}
          className="mt-4 block rounded-full bg-emerald-500 py-3 text-center font-display text-[11px] uppercase tracking-[0.3em] text-emerald-950"
        >
          Ir a la mesa
        </Link>
      </div>
    </section>
  );
}

function Legajo({ fila }: { fila: Fila }) {
  const navigate = useNavigate();
  const level = fila.next!;
  const nro = level.order.toString().padStart(2, "0");

  const aceptar = () => {
    fila.game.startRun(level.id);
    void navigate({ to: fila.game.route });
  };

  return (
    <section className="mt-6">
      <SelloLegajo texto="Encargo de esta noche" />
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative mt-5 rounded-sm border-2 manila ${
          level.boss ? "border-[#8a1e1e]/70" : "border-[var(--oro)]/45"
        }`}
        style={{ transform: "rotate(-0.35deg)" }}
      >
        <span aria-hidden className="cinta -top-2.5 left-6 -rotate-6" />
        <span aria-hidden className="cinta -top-2.5 right-6 rotate-6" />

        <div className="flex items-center justify-between border-b border-[var(--tinta)]/45 bg-black/25 px-4 py-2">
          <span className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--oro-claro)]/85">
            Legajo {nro} · {fila.game.hostess}
          </span>
          {level.boss ? <span className="sello text-[#ff8a8a]">jefe</span> : null}
        </div>

        <div className="relative p-5">
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-6 h-16 w-16 rounded-full border-2 border-[#7a5a2a]/25"
            style={{ boxShadow: "inset 0 0 0 6px oklch(0.3 0.05 60 / 0.12)" }}
          />
          <div className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--crema)]/80">
            {fila.game.title}
          </div>
          <h2 className="mt-1 font-display text-2xl uppercase leading-tight tracking-[0.1em] text-[#fff5d0]">
            {level.title}
          </h2>
          <p className="mt-1 font-script text-base text-[var(--crema)]/90">{level.subtitle}</p>

          <blockquote className="mt-3 border-l-2 border-[var(--oro)]/60 pl-3 font-serif text-lg font-medium italic text-[var(--crema)] leading-relaxed">
            «{level.bossQuote ?? fila.game.corvinaLine}»
          </blockquote>

          <div className="mt-4 border-t border-[var(--tinta)]/35 pt-3">
            <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[#e8c987]/80">
              Objetivo
            </div>
            <div className="font-numerals text-base text-[var(--crema-clara)]">
              {level.objectiveLabel}
            </div>
          </div>

          {level.modifierLabels.length ? (
            <div className="mt-3">
              <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[#e8c987]/80">
                Condiciones
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {level.modifierLabels.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-sm border border-[var(--tinta)]/40 bg-black/25 px-2 py-1 font-display text-[11px] uppercase tracking-[0.15em] text-[var(--oro-claro)]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {([3, 2, 1] as const).map((st) => {
              const k = st === 3 ? "three" : st === 2 ? "two" : "one";
              return (
                <div
                  key={st}
                  className="rounded-sm border border-[var(--tinta)]/45 bg-black/30 p-2 shadow-[inset_0_1px_0_rgba(255,225,170,0.08)]"
                >
                  <div className="font-display text-sm text-[#e8c987]">{"★".repeat(st)}</div>
                  <div className="font-numerals text-base text-[#fff5d0]">
                    {level.reward[k].toLocaleString("es-AR")}¢
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={aceptar}
            className="cd-tap-safe mt-5 w-full rounded-sm border border-[#7a5a2a] bg-gradient-brass py-4 font-display text-[12px] uppercase tracking-[0.35em] text-[#1a1206] shadow-[inset_0_1px_0_rgba(255,240,200,0.5),0_10px_26px_-14px_rgba(0,0,0,0.9)] active:translate-y-px"
          >
            Firmar el encargo
          </button>
        </div>
      </motion.article>
    </section>
  );
}

function Archivo({ filas }: { filas: Fila[] }) {
  return (
    <section className="mt-8">
      <SelloLegajo texto="Archivo de la casa" />
      <ul className="mt-4 space-y-2.5">
        {filas.map((f, i) => {
          const total = f.game.levels.length;
          const done = f.clearedCount >= total;
          return (
            <li
              key={f.game.key}
              className={`relative grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-sm border px-3 py-3.5 ${
                f.unlocked
                  ? "manila border-[var(--oro)]/35"
                  : "border-[var(--oro)]/12 bg-black/50 opacity-80"
              }`}
              style={{ transform: `rotate(${i % 2 === 0 ? -0.2 : 0.2}deg)` }}
            >
              <span className="font-numerals text-base text-[#e8c987]/80">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="truncate font-display text-[15px] uppercase tracking-[0.08em] text-[#fff5d0]">
                  {f.game.title}
                </div>
                <div className="truncate font-display text-[11px] uppercase tracking-[0.22em] text-[var(--marfil)]/65">
                  {f.unlocked ? f.game.hostess : f.requisito}
                </div>
              </div>
              {f.unlocked ? (
                <span
                  className={`shrink-0 rounded-sm border px-2 py-1 font-display text-[11px] uppercase tracking-[0.18em] ${
                    f.active
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : done
                        ? "border-[var(--oro)]/50 bg-black/30 text-[#fff5d0]"
                        : "border-[var(--tinta)]/45 bg-black/30 text-[var(--crema)]/80"
                  }`}
                >
                  {f.active ? "en curso" : done ? "cerrado" : `${f.clearedCount}/${total}`}
                </span>
              ) : (
                <span className="sello shrink-0 text-[#c96b4a]">bajo llave</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
