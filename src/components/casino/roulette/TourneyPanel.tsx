import { Link } from "@tanstack/react-router";
import { ROULETTE_TOURNEY } from "@/lib/tournament";
import { DEFAULT_LEAGUE, leagueById } from "@/lib/leagues";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-[var(--brass)]/25 bg-[var(--noir)]/70 px-2 py-2">
      <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        {label}
      </div>
      <div className="mt-0.5 font-display text-sm text-[var(--brass-bright)] tabular-nums">
        {value}
      </div>
    </div>
  );
}

export function TourneyPanel({
  inTourney,
  stack,
  spinsLeft,
  attemptsLeft,
  attemptsTotal,
  bestToday,
  attemptsToday,
  onStart,
  onAbandon,
  disabled,
}: {
  inTourney: boolean;
  stack: number;
  spinsLeft: number;
  attemptsLeft: number;
  attemptsTotal: number;
  bestToday: number;
  attemptsToday: Array<{ score: number; spinsUsed: number; at: number }>;
  onStart: () => void;
  onAbandon: () => void;
  disabled: boolean;
}) {
  const canStart = !inTourney && attemptsLeft > 0 && !disabled;
  const league = leagueById(DEFAULT_LEAGUE);
  return (
    <section className="relative isolate overflow-hidden rounded-sm border border-[var(--brass)]/45 bg-gradient-to-br from-[var(--oxblood)]/35 via-[var(--noir)]/85 to-[var(--noir)]/85 p-4 shadow-deep backdrop-blur">
      <img
        src={league.bg}
        alt=""
        aria-hidden
        loading="lazy"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-20 mix-blend-luminosity"
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={league.badge}
            alt=""
            aria-hidden
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-full border border-[var(--brass)]/60 object-cover shadow-[0_4px_10px_rgba(0,0,0,0.55)]"
          />
          <div className="min-w-0">
            <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/80">
              torneo del día · {league.shortName.toLowerCase()}
            </div>
            <div className="mt-0.5 truncate font-script text-xl leading-tight text-[var(--blood)] sm:text-2xl">
              Clara reparte parejo
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--smoke)]">
            intentos
          </div>
          <div className="font-display text-base text-[var(--brass-bright)] tabular-nums">
            {attemptsTotal - attemptsLeft}/{attemptsTotal}
          </div>
        </div>
      </div>

      {inTourney ? (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="stack" value={`${stack}¢`} />
            <Stat label="giros" value={`${spinsLeft}`} />
            <Stat label="mejor hoy" value={`${bestToday}¢`} />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
              <span>stack vs inicial · {Math.round((stack / 500) * 100)}%</span>
              <span className="tabular-nums text-[var(--smoke)]">{500}¢</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-sm border border-[var(--brass)]/25 bg-[var(--noir)]/80">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, (stack / 500) * 100))}%`,
                  background:
                    stack >= 500
                      ? "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.78 0.18 130))"
                      : stack >= 250
                        ? "linear-gradient(90deg, oklch(0.68 0.16 78), oklch(0.85 0.16 80))"
                        : "linear-gradient(90deg, oklch(0.48 0.18 25), oklch(0.65 0.20 28))",
                }}
              />
            </div>
            <div className="relative -mt-2 h-2 w-full">
              <div className="absolute right-0 top-0 h-2 w-px bg-[var(--brass-bright)]/60" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
              <span>
                progreso · {ROULETTE_TOURNEY.spins - spinsLeft}/{ROULETTE_TOURNEY.spins}
              </span>
              <span className="tabular-nums text-[var(--smoke)]">{spinsLeft} restantes</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm border border-[var(--brass)]/25 bg-[var(--noir)]/80">
              <div
                className="h-full bg-gradient-to-r from-[var(--brass)]/60 to-[var(--brass-bright)] transition-all duration-500"
                style={{
                  width: `${((ROULETTE_TOURNEY.spins - spinsLeft) / ROULETTE_TOURNEY.spins) * 100}%`,
                }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onAbandon}
            disabled={disabled}
            className="mt-3 w-full rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/60 px-3 py-2 font-display text-[11px] uppercase tracking-[0.35em] text-[var(--smoke)] transition hover:bg-[var(--noir)]/85 disabled:opacity-40"
          >
            Plantarse y guardar puntaje
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 font-body text-xs leading-relaxed text-[var(--smoke)]">
            Stack fijo de <b className="text-[var(--ivory)]">{500}¢</b>,{" "}
            <b className="text-[var(--ivory)]">30 giros</b>, misma secuencia para todo el mundo. Tu
            puntuación = fichas que te quedan al final.
          </p>
          {bestToday > 0 && (
            <div className="mt-3 rounded-sm border border-[var(--brass)]/25 bg-[var(--noir)]/60 px-3 py-2 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/85">
              mejor de hoy · <span className="text-[var(--brass-bright)]">{bestToday}¢</span>
            </div>
          )}
          {attemptsToday.length > 0 && (
            <ul className="mt-2 space-y-1 font-body text-xs text-[var(--smoke)]">
              {attemptsToday.map((a, i) => (
                <li key={i} className="flex justify-between border-b border-[var(--brass)]/10 py-1">
                  <span>intento {i + 1}</span>
                  <span className="tabular-nums text-[var(--ivory)]">
                    {a.score}¢ · {a.spinsUsed} giros
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            className="mt-3 w-full rounded-sm border border-[var(--brass)]/60 bg-gradient-to-b from-[var(--brass)]/35 to-[var(--brass)]/15 px-3 py-2 font-display text-xs uppercase tracking-[0.32em] text-[var(--ivory)] transition hover:from-[var(--brass)]/55 hover:to-[var(--brass)]/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {attemptsLeft <= 0
              ? "Sin intentos hoy"
              : `Entrar al torneo · ${attemptsLeft} restante${attemptsLeft === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </section>
  );
}
