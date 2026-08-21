import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NoirBackdrop } from "@/components/single/NoirBackdrop";
import { useRouteVeil } from "@/hooks/use-route-veil";
import { LigasTab } from "@/components/casino/progreso/LigasTab";
import { TorneosTab } from "@/components/casino/progreso/TorneosTab";
import { RecompensasCard } from "@/components/casino/progreso/RecompensasCard";
import { HistorialTab } from "@/components/casino/progreso/HistorialTab";
import { resolvePendingCycles } from "@/lib/progress-cycle";

export const Route = createFileRoute("/progreso")({
  head: () => ({
    meta: [
      { title: "Ligas y Torneos — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Tu progreso en el Cuervo Dorado: ranking de ligas por temporada, torneo semanal y canje de recompensas.",
      },
      { property: "og:title", content: "Ligas y Torneos — El Cuervo Dorado" },
      {
        property: "og:description",
        content: "Ranking, posición, historial de jornadas y recompensas del salón.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgresoPage,
});

type Tab = "ligas" | "torneo";

const TABS: { id: Tab; label: string }[] = [
  { id: "ligas", label: "Ligas" },
  { id: "torneo", label: "Torneo" },
];

function ProgresoPage() {
  const [tab, setTab] = useState<Tab>("ligas");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    resolvePendingCycles();
  }, []);
  useRouteVeil("none");

  return (
    <main
      className="relative flex flex-col text-[var(--crema)]"
      style={{
        fontFamily: "'Barlow', system-ui, sans-serif",
        height: "100svh",
      }}
    >
      <NoirBackdrop variant="logros" />

      {/* Encabezado fijo + pestañas: no tapan el contenido, el scroll vive abajo */}
      <header
        className="relative z-10 shrink-0 border-b border-[var(--oro)]/20 bg-black/55 backdrop-blur"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.5rem)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 pb-1">
          <Link
            to="/single"
            data-haptic="tap"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-[11px] uppercase tracking-[0.22em] text-[var(--marfil)] font-bold"
          >
            ‹ Volver
          </Link>
          <h1
            className="flex-1 truncate text-center text-xl uppercase tracking-[0.12em] text-[var(--crema)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Ligas y torneos
          </h1>
          <span className="w-16" aria-hidden />
        </div>
        <div className="mx-auto flex w-full max-w-3xl px-2" role="tablist">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-haptic="tap"
                onClick={() => setTab(t.id)}
                className={`relative min-h-11 flex-1 py-2 text-[11px] uppercase tracking-[0.24em] ${
                  active ? "text-[var(--oro-claro)] font-bold" : "text-[var(--marfil)]/80"
                }`}
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {t.label}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[var(--oro)]"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      <div
        className="cuervo-scroll-perf relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 7.5rem)" }}
      >
        <div className="mx-auto w-full max-w-3xl">
          {!hydrated ? (
            <p className="py-10 text-center text-[11px] italic text-[var(--marfil)]/65">
              Abriendo la libreta…
            </p>
          ) : tab === "ligas" ? (
            <div className="space-y-4">
              <RecompensasCard />
              <LigasTab />
              <HistorialTab />
            </div>
          ) : (
            <TorneosTab />
          )}
        </div>
      </div>
    </main>
  );
}
