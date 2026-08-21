import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useFavors } from "@/store/favors";
import {
  achievementsByCategory,
  hostessLevelsSummary,
  useAchievements,
  type AchievementState,
} from "@/store/achievements";
import { useDailyMissions, allGameIds, missionOfTheDay } from "@/store/daily-missions";
import { useGameStreaks, DAILY_MILESTONES, WEEKLY_MILESTONES } from "@/store/game-streaks";
import { useRewardsHistory } from "@/store/rewards-history";
import { useLoginStreak } from "@/store/loginStreak";
import { SINGLE_GAMES } from "@/lib/single-games";
import { NoirBackdrop } from "@/components/single/NoirBackdrop";
import { useRouteVeil } from "@/hooks/use-route-veil";
import logrosHero from "@/assets/logros-hero.webp";

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

export const Route = createFileRoute("/logros")({
  head: () => ({
    meta: [
      { title: "Logros y Rachas — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Tu progreso en el salón: misiones diarias, logros, rachas e historial de recompensas.",
      },
      { property: "og:title", content: "Logros y Rachas — El Cuervo Dorado" },
      { property: "og:description", content: "Panel unificado de progreso del Cuervo." },
    ],
  }),
  component: LogrosPage,
});

type Tab = "misiones" | "logros" | "rachas" | "historial" | "anfitrionas";

function LogrosPage() {
  const [tab, setTab] = useState<Tab>("misiones");
  const favors = useFavors((s) => s.favors);
  const hydrated = useHydrated();

  useRouteVeil("none");

  return (
    <main
      className="relative min-h-dvh px-4 py-10 text-[var(--crema)]"
      style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
    >
      {}
      <NoirBackdrop variant="logros" />

      <div className="mx-auto max-w-3xl">
        <div className="relative -mx-4 mb-4 overflow-hidden rounded-lg border border-[var(--oro)]/30 shadow-lg">
          <img
            src={logrosHero}
            alt=""
            width={1536}
            height={640}
            className="h-32 w-full object-cover sm:h-44"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 40%, rgba(11,10,8,0.65) 85%, rgba(11,10,8,0.92) 100%)",
            }}
          />
        </div>
        <header className="mb-6 border-b border-[var(--oro)]/25 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p
                className="text-[11px] tracking-[0.25em] text-[var(--oro)]/80"
                style={{
                  fontFamily: "'IM Fell English', 'Cormorant Garamond', serif",
                  fontStyle: "italic",
                }}
              >
                — Despacho del Cuervo · MCMXXVIII —
              </p>
              <h1
                className="mt-1 text-5xl leading-none text-[var(--crema)]"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.08em",
                  textShadow: "0 2px 0 rgba(0,0,0,0.5), 0 0 24px rgba(201,168,76,0.15)",
                }}
              >
                Libro de Cuentas
              </h1>
              <p
                className="mt-1 text-[13px] italic text-[#b8a888]"
                style={{ fontFamily: "'IM Fell English', 'Cormorant Garamond', serif" }}
              >
                Rachas, favores y deudas cobradas del salón.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className="rounded-sm border border-[var(--oro)]/50 bg-[#0a0705]/60 px-3 py-1 text-[var(--crema)] shadow-inner"
                style={{ fontFamily: "'Special Elite', 'Share Tech Mono', monospace" }}
                title="Favores acumulados"
                role="status"
                aria-live="polite"
                aria-label={`Favores acumulados: ${favors.toLocaleString("es-AR")}`}
              >
                <span aria-hidden>🪶</span> {favors.toLocaleString("es-AR")}
              </span>
              <Link
                to="/single"
                className="cuervo-tap-target inline-flex items-center justify-center gap-1 rounded-sm border border-[var(--oro)]/40 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[var(--oro)] transition hover:bg-[var(--oro)]/10 active:scale-[0.97] active:bg-[var(--oro)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oro-claro)]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                aria-label="Volver al salón principal"
              >
                <span aria-hidden>← </span>Salón
              </Link>
            </div>
          </div>
        </header>

        <nav
          className="mb-6 -mx-1 flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Secciones del Libro de Cuentas"
        >
          {(
            [
              ["misiones", "Misiones"],
              ["logros", "Logros"],
              ["rachas", "Rachas"],
              ["anfitrionas", "Anfitrionas"],
              ["historial", "Historial"],
            ] as const
          ).map(([id, label]) => {
            const selected = tab === id;
            return (
              <button
                key={id}
                id={`tab-${id}`}
                type="button"
                role="tab"
                aria-pressed={selected}
                aria-selected={selected}
                aria-controls={`panel-${id}`}
                data-selected={selected ? "true" : undefined}
                onClick={() => setTab(id)}
                className="paper-chip"
              >
                {label}
                <span className="sr-only"> {selected ? "(sección activa)" : ""}</span>
              </button>
            );
          })}
        </nav>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {!hydrated ? (
            <TabSkeleton />
          ) : (
            <>
              {tab === "misiones" && <MissionsTab />}
              {tab === "logros" && <AchievementsTab />}
              {tab === "rachas" && <StreaksTab />}
              {tab === "anfitrionas" && <HostessLevelsTab />}
              {tab === "historial" && <HistoryTab />}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={`paper-card ${interactive ? "paper-card--interactive" : ""} p-4 ${className}`}>
      {}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-[var(--oro)]/60"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t border-[var(--oro)]/60"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b border-l border-[var(--oro)]/60"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-[var(--oro)]/60"
      />
      {children}
    </div>
  );
}

function ProgressBar({ value, target, label }: { value: number; target: number; label?: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-[var(--oro)]/10"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-label={label ?? `Progreso: ${value} de ${target} (${pct}%)`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--oro)] to-[var(--crema)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TabSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando información del libro de cuentas"
      className="grid gap-3 sm:grid-cols-2"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="paper-card p-4">
          <div className="mb-3 h-3 w-1/3 animate-pulse rounded bg-[var(--oro)]/15" />
          <div className="mb-4 h-4 w-3/4 animate-pulse rounded bg-[var(--marfil)]/10" />
          <div className="mb-2 h-2 w-full animate-pulse rounded-full bg-[var(--oro)]/10" />
          <div className="mt-3 flex justify-between">
            <div className="h-3 w-16 animate-pulse rounded bg-[var(--marfil)]/10" />
            <div className="h-3 w-14 animate-pulse rounded bg-[var(--oro)]/15" />
          </div>
        </div>
      ))}
      <span className="sr-only">Cargando datos guardados en el dispositivo…</span>
    </div>
  );
}

function EmptyState({
  title,
  hint,
  actionLabel,
  actionTo,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span aria-hidden className="text-3xl text-[var(--oro)]/80">
          🪶
        </span>
        <h3
          className="text-xl text-[var(--crema)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}
        >
          {title}
        </h3>
        <p
          className="max-w-sm text-[13px] italic text-[var(--marfil)]/80"
          style={{ fontFamily: "'IM Fell English', 'Cormorant Garamond', serif" }}
        >
          {hint}
        </p>
        {actionLabel && actionTo && (
          <Link to={actionTo as "/single"} className="paper-chip" aria-label={actionLabel}>
            {actionLabel}
          </Link>
        )}
      </div>
    </Card>
  );
}

function MissionsTab() {
  useDailyMissions((s) => s.byGame);
  const claim = useDailyMissions((s) => s.claim);
  const gameIds = useMemo(() => allGameIds(), []);

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {gameIds.map((gid) => {
        const mission = missionOfTheDay(gid);
        const st = useDailyMissions.getState().get(gid);
        const game = SINGLE_GAMES.find((g) => g.id === gid)!;
        const ready = st.progress.count >= mission.target && !st.progress.claimed;
        return (
          <Card key={gid}>
            <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-[var(--oro)]/80">
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.14em" }}>
                {game.name}
              </span>
              <span style={{ fontFamily: "'Special Elite', monospace" }}>🪶 {mission.favors}</span>
            </div>
            <p
              className="mb-2 text-[14px] italic text-[var(--marfil)]"
              style={{ fontFamily: "'IM Fell English', 'Cormorant Garamond', serif" }}
            >
              {mission.label}
            </p>

            <ProgressBar value={st.progress.count} target={mission.target} />
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--marfil)]/80">
              <span style={{ fontFamily: "'Special Elite', monospace" }}>
                {st.progress.count} / {mission.target}
              </span>
              {st.progress.claimed ? (
                <span
                  className="text-[var(--oro)]"
                  style={{ fontFamily: "'Special Elite', monospace" }}
                  aria-label={`Recompensa de ${game.name} ya cobrada`}
                >
                  Cobrado <span aria-hidden>✓</span>
                </span>
              ) : ready ? (
                <button
                  type="button"
                  onClick={() => claim(gid)}
                  className="rounded-full border border-[var(--oro)] bg-[var(--oro)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#14100a]"
                  aria-label={`Cobrar ${mission.favors} favores de la misión de ${game.name}`}
                >
                  Cobrar
                </button>
              ) : (
                <Link
                  to={game.to as "/single"}
                  className="cuervo-tap-target inline-flex items-center justify-center rounded-full border border-[var(--oro)]/40 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--oro)] transition hover:bg-[var(--oro)]/10 active:bg-[var(--oro)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oro-claro)]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  aria-label={`Ir a jugar ${game.name} para avanzar la misión`}
                >
                  Ir
                </Link>
              )}
            </div>
          </Card>
        );
      })}
    </section>
  );
}

function AchievementsTab() {
  useAchievements((s) => s.claimed);
  const claim = useAchievements((s) => s.claim);
  const groups = achievementsByCategory();
  const order = ["global", ...SINGLE_GAMES.map((g) => g.id)];
  const hasAny = order.some((cat) => groups[cat]?.length);
  if (!hasAny) {
    return (
      <EmptyState
        title="Sin logros todavía"
        hint="Jugá cualquier mesa del salón para empezar a acumular logros y trofeos en tu vitrina."
        actionLabel="Ir al salón"
        actionTo="/single"
      />
    );
  }
  return (
    <section className="space-y-6">
      {order.map((cat) => {
        const items = groups[cat];
        if (!items?.length) return null;
        const label =
          cat === "global"
            ? "Todo el Salón"
            : (SINGLE_GAMES.find((g) => g.id === cat)?.name ?? cat);
        return (
          <div key={cat}>
            <h2 className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--oro)]/80">
              {label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((a) => (
                <AchievementCard key={a.def.id} a={a} onClaim={() => claim(a.def.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function AchievementCard({ a, onClaim }: { a: AchievementState; onClaim: () => void }) {
  const ready = a.unlocked && !a.claimed;
  return (
    <Card className={a.claimed ? "opacity-70" : ""}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3
          className="text-base text-[var(--crema)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
        >
          {a.def.name}
        </h3>
        <span
          className="text-xs text-[var(--oro)]"
          style={{ fontFamily: "'Special Elite', monospace" }}
        >
          🪶 {a.def.favors}
        </span>
      </div>
      <p
        className="mb-2 text-[13px] italic text-[var(--marfil)]/80"
        style={{ fontFamily: "'IM Fell English', 'Cormorant Garamond', serif" }}
      >
        {a.def.hint}
      </p>
      <ProgressBar
        value={a.progress}
        target={a.def.target}
        label={`Progreso de ${a.def.name}: ${a.progress} de ${a.def.target}`}
      />
      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--marfil)]/80">
        <span style={{ fontFamily: "'Special Elite', monospace" }}>
          {a.progress} / {a.def.target}
        </span>
        {a.claimed ? (
          <span
            className="text-[var(--oro)]"
            style={{ fontFamily: "'Special Elite', monospace" }}
            aria-label={`Logro ${a.def.name} ya cobrado`}
          >
            Cobrado <span aria-hidden>✓</span>
          </span>
        ) : ready ? (
          <button
            type="button"
            onClick={onClaim}
            className="rounded-full border border-[var(--oro)] bg-[var(--oro)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#14100a]"
            aria-label={`Cobrar ${a.def.favors} favores del logro ${a.def.name}`}
          >
            Cobrar
          </button>
        ) : (
          <span
            style={{ fontFamily: "'Special Elite', monospace" }}
            aria-label={a.unlocked ? "Logro desbloqueado, listo para cobrar" : "Logro en curso"}
          >
            {a.unlocked ? "Listo" : "En curso"}
          </span>
        )}
      </div>
    </Card>
  );
}

function StreaksTab() {
  useGameStreaks((s) => s.byGame);
  const login = useLoginStreak();
  return (
    <section className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80"
              style={{ fontFamily: "'Special Elite', monospace" }}
            >
              Racha de visita
            </p>
            <p
              className="text-3xl text-[var(--crema)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
            >
              {login.streak} días
            </p>
            <p
              className="text-xs text-[var(--marfil)]/80"
              style={{ fontFamily: "'Special Elite', monospace" }}
            >
              Mejor: {login.bestStreak}
            </p>
          </div>
          <Link
            to="/single"
            className="rounded-full border border-[var(--oro)]/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--oro)]"
          >
            Volver al salón
          </Link>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {SINGLE_GAMES.map((g) => {
          const st = useGameStreaks.getState().get(g.id);
          const nextDaily = DAILY_MILESTONES.find((m) => m > st.daily.current);
          const nextWeekly = WEEKLY_MILESTONES.find((m) => m > st.weekly.current);
          return (
            <Card key={g.id}>
              <div className="mb-1 flex items-center justify-between">
                <span
                  className="text-base text-[var(--crema)]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
                >
                  {g.name}
                </span>
                <span
                  className="text-xs text-[var(--marfil)]/80"
                  style={{ fontFamily: "'Special Elite', monospace" }}
                >
                  {st.plays} partidas
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[var(--oro)]/80"
                    style={{ fontFamily: "'Special Elite', monospace" }}
                  >
                    Diaria
                  </p>
                  <p
                    className="text-2xl text-[var(--marfil)]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {st.daily.current}d
                  </p>
                  <p
                    className="text-[11px] text-[var(--marfil)]/80"
                    style={{ fontFamily: "'Special Elite', monospace" }}
                  >
                    {nextDaily ? `Próx: ${nextDaily}d` : "Máximo cobrado"} · mejor {st.daily.best}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[var(--oro)]/80"
                    style={{ fontFamily: "'Special Elite', monospace" }}
                  >
                    Semanal
                  </p>
                  <p
                    className="text-2xl text-[var(--marfil)]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {st.weekly.current}s
                  </p>
                  <p
                    className="text-[11px] text-[var(--marfil)]/80"
                    style={{ fontFamily: "'Special Elite', monospace" }}
                  >
                    {nextWeekly ? `Próx: ${nextWeekly}s` : "Máximo cobrado"} · mejor{" "}
                    {st.weekly.best}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function HostessLevelsTab() {
  const rows = hostessLevelsSummary();
  if (!rows.length) {
    return (
      <EmptyState
        title="Sin anfitrionas registradas"
        hint="Todavía no jugaste con ninguna anfitriona. Elegí una mesa del salón para empezar a subir afinidad."
        actionLabel="Ir al salón"
        actionTo="/single"
      />
    );
  }
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <Card key={r.gameId}>
          <div className="mb-1 flex items-baseline justify-between">
            <h3
              className="text-base text-[var(--crema)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
            >
              {r.hostessName}
            </h3>
            <span
              className="text-xs text-[var(--oro)]"
              style={{ fontFamily: "'Special Elite', monospace" }}
              aria-label={`Nivel ${r.level} de afinidad con ${r.hostessName}`}
            >
              Nvl {r.level}
            </span>
          </div>
          <p
            className="mb-2 text-[13px] italic text-[var(--marfil)]/80"
            style={{ fontFamily: "'IM Fell English', 'Cormorant Garamond', serif" }}
          >
            {r.gameName}
          </p>
          <ProgressBar
            value={r.affinity % 20 || (r.level === 5 ? 20 : 0)}
            target={20}
            label={`Afinidad con ${r.hostessName}: ${r.affinity} de 100`}
          />
          <p
            className="mt-1 text-[11px] text-[var(--marfil)]/80"
            style={{ fontFamily: "'Special Elite', monospace" }}
          >
            Afinidad {r.affinity}/100
          </p>
        </Card>
      ))}
    </section>
  );
}

function HistoryTab() {
  const entries = useRewardsHistory((s) => s.entries);
  const totalFavors = useRewardsHistory((s) => s.totalFavors);
  if (!entries.length) {
    return (
      <EmptyState
        title="Sin recompensas cobradas"
        hint="Todavía no cobraste favores. Completá una misión diaria o un logro para empezar tu historial."
        actionLabel="Ver misiones"
        actionTo="/logros"
      />
    );
  }

  return (
    <section className="space-y-3">
      <Card>
        <p
          className="text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80"
          style={{ fontFamily: "'Special Elite', monospace" }}
        >
          Total cobrado
        </p>
        <p
          className="text-3xl text-[var(--crema)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
        >
          🪶 {totalFavors.toLocaleString("es-AR")}
        </p>
      </Card>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between rounded-sm border border-[var(--oro)]/20 bg-black/20 px-3 py-2 text-sm"
          >
            <div>
              <p className="text-[var(--marfil)]">{e.label}</p>
              <p
                className="text-[11px] text-[var(--marfil)]/80"
                style={{ fontFamily: "'Special Elite', monospace" }}
              >
                {new Date(e.ts).toLocaleString("es-AR")}
              </p>
            </div>
            <span
              className="text-[var(--oro)]"
              style={{ fontFamily: "'Special Elite', monospace" }}
            >
              +🪶 {e.favors}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
