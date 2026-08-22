import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { buildDiarioEntries, buildHostessDossier } from "@/lib/hostess-dossier";
import { getEventContext } from "@/lib/event-manager";
import { portraitFor } from "@/lib/npc-portraits";
import { NoirOverlay } from "@/components/single/NoirOverlay";
import diarioHero from "@/assets/diario-hero.webp";

export const Route = createFileRoute("/diario")({
  head: () => ({
    meta: [
      { title: "Diario del Cuervo — Anoche en el salón" },
      {
        name: "description",
        content:
          "Resumen periodístico del salón: rivalidades activas, chismes cruzados, evento de la semana y anfitriona destacada del día.",
      },
      { property: "og:title", content: "Diario del Cuervo" },
      {
        property: "og:description",
        content: "Qué pasó anoche entre las anfitrionas del Cuervo Dorado.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiarioPage,
});

function DiarioPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 120);
    return () => window.clearTimeout(id);
  }, []);
  const ctx = useMemo(() => getEventContext(), []);
  const entries = useMemo(() => buildDiarioEntries(), []);
  const featured = useMemo(() => buildHostessDossier(ctx.featuredHostess), [ctx.featuredHostess]);

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="relative min-h-dvh bg-[#f4ecd5] text-[var(--tinta-parda)]"
      style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
    >
      <NoirOverlay variant="paper" />
      <div className="cuervo-scroll-perf relative mx-auto max-w-3xl px-4 py-8 sm:px-8">
        {}
        <div className="relative -mx-4 mb-4 overflow-hidden rounded-lg border border-[var(--tinta-parda)]/40 shadow-lg sm:-mx-8">
          <img
            src={diarioHero}
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
                "linear-gradient(180deg, transparent 40%, rgba(11,10,8,0.55) 85%, rgba(11,10,8,0.85) 100%)",
            }}
          />
        </div>
        <header className="border-b-4 border-double border-[var(--tinta-parda)] pb-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-[var(--cd-wood)]">
            <span />

            <span>{today}</span>
          </div>
          <h1
            className="mt-2 text-center text-5xl leading-none sm:text-6xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}
          >
            EL DIARIO DEL CUERVO
          </h1>
          <p className="mt-1 text-center text-xs italic text-[var(--cd-wood)]">
            Crónica nocturna del salón · edición del día
          </p>
          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[var(--cd-wood)]">
            <span>{ctx.timeBand}</span>
            <span>·</span>
            <span>{ctx.season}</span>
            <span>·</span>
            <span>{ctx.weekly.title}</span>
          </div>
        </header>

        {!mounted ? (
          <DiarioSkeleton />
        ) : (
          <>
            {}
            <section className="mt-6 grid gap-4 border-b border-[var(--tinta-parda)]/25 pb-6 sm:grid-cols-[140px_1fr]">
              <img
                src={portraitFor(ctx.featuredHostess)}
                alt={featured.name}
                className="h-40 w-full rounded-sm border border-[var(--tinta-parda)]/30 object-cover object-top sm:h-full grayscale"
                style={{ filter: "sepia(0.35) contrast(1.05)" }}
                loading="lazy"
                decoding="async"
              />
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--cd-wood)]">
                  Anfitriona destacada
                </p>
                <h2
                  className="mt-1 text-3xl"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}
                >
                  {featured.name}
                </h2>
                <p className="mt-1 text-sm italic text-[#3a2818]">«{featured.ai.label}»</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--tinta-parda)]">
                  Preside la barra esta noche.{" "}
                  {featured.trait
                    ? `Trae el aire de una ${featured.trait.label.toLowerCase()}.`
                    : "El humor le anda parejo."}{" "}
                  {featured.mood !== "neutral" ? `Anda ${featured.mood}.` : ""}
                </p>
              </div>
            </section>

            {}
            <section className="mt-6">
              <h2
                className="border-b-2 border-[var(--tinta-parda)]/40 pb-1 text-xl uppercase"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em" }}
              >
                Notas de la noche
              </h2>
              {entries.length === 0 ? (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-sm border border-dashed border-[var(--cd-wood)]/40 px-4 py-10 text-center">
                  <span aria-hidden className="text-3xl text-[var(--cd-wood)]/65">
                    ✒︎
                  </span>
                  <p className="text-sm italic text-[var(--cd-wood)]">
                    Todavía no hay historias que contar.
                  </p>
                  <p className="text-xs text-[var(--cd-wood)]/80">
                    Sentate a alguna mesa y las anfitrionas empezarán a chusmear.
                  </p>
                  <Link
                    to="/single"
                    className="mt-2 inline-flex min-h-11 items-center rounded-md border border-[var(--tinta-parda)]/50 bg-[var(--tinta-parda)]/5 px-4 text-[11px] uppercase tracking-[0.25em] hover:bg-[var(--tinta-parda)]/10"
                  >
                    Ir al salón
                  </Link>
                </div>
              ) : (
                <div className="mt-4 columns-1 gap-6 sm:columns-2">
                  {entries.slice(0, 8).map((e) => (
                    <article
                      key={e.npcId}
                      className="mb-5 break-inside-avoid border-l-2 border-[var(--cd-wood)]/40 pl-3"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={e.portrait}
                          alt=""
                          className="h-9 w-9 rounded-full border border-[var(--tinta-parda)]/30 object-cover object-top"
                          style={{ filter: "sepia(0.3)" }}
                          loading="lazy"
                          decoding="async"
                        />
                        <h3
                          className="text-base leading-tight"
                          style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {e.headline}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-snug text-[#3a2818]">{e.detail}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {}
        <footer className="mt-8 border-t border-[var(--tinta-parda)]/25 pt-4 text-center text-[11px] uppercase tracking-[0.3em] text-[var(--cd-wood)]">
          Impreso en el Cuervo Dorado · edición local
        </footer>
      </div>
    </div>
  );
}

function DiarioSkeleton() {
  return (
    <div aria-hidden className="cd-diario-skeleton mt-6 animate-pulse">
      <div className="grid gap-4 border-b border-[var(--tinta-parda)]/20 pb-6 sm:grid-cols-[140px_1fr]">
        <div className="h-40 w-full rounded-sm bg-[var(--tinta-parda)]/10" />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-[var(--tinta-parda)]/10" />
          <div className="h-7 w-40 rounded bg-[var(--tinta-parda)]/15" />
          <div className="h-3 w-full rounded bg-[var(--tinta-parda)]/10" />
          <div className="h-3 w-5/6 rounded bg-[var(--tinta-parda)]/10" />
          <div className="h-3 w-2/3 rounded bg-[var(--tinta-parda)]/10" />
        </div>
      </div>
      <div className="mt-6 space-y-4 columns-1 sm:columns-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-5 break-inside-avoid border-l-2 border-[var(--cd-wood)]/25 pl-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-[var(--tinta-parda)]/10" />
              <div className="h-4 w-40 rounded bg-[var(--tinta-parda)]/15" />
            </div>
            <div className="mt-2 h-3 w-full rounded bg-[var(--tinta-parda)]/10" />
            <div className="mt-1 h-3 w-4/5 rounded bg-[var(--tinta-parda)]/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
