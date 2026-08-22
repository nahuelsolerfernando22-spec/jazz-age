import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, memo, Suspense, useEffect, useMemo, useState } from "react";
import { useGameMode } from "@/store/game-mode";
import { useNemesis } from "@/store/nemesis";
import { useSingleScores } from "@/store/single-scores";
import { useLives } from "@/store/lives";
import { GameHud } from "@/components/casino/GameHud";
import { BrassButton } from "@/components/casino/BrassButton";
import { nemesisDifficulty } from "@/lib/nemesis";
import { SINGLE_GAMES, CATEGORY_LABELS } from "@/lib/single-games";
import {
  coverArtFor,
  coverBackground,
  coverBannerBackground,
  warmCoverArtCache,
} from "@/lib/single-art";
import { GameCoverArt } from "@/components/single/GameCoverArt";
import {
  SINGLE_TROPHIES,
  useSingleTrophies,
  evaluateSingleTrophies,
  installSingleTrophyWatcher,
} from "@/store/single-trophies";
import { DailyEchoPanel } from "@/components/casino/DailyEchoPanel";
import { RumoresPanel } from "@/components/casino/RumoresPanel";
import { HostessRanksStrip } from "@/components/casino/HostessRanksStrip";
// El legajo del día carga el catálogo completo de encargos: se pide aparte
// para no engordar el arranque del salón.
const TorneoDelDiaPanel = lazy(() =>
  import("@/components/casino/TorneoDelDiaPanel").then((m) => ({ default: m.TorneoDelDiaPanel })),
);
import { SectionErrorBoundary } from "@/components/single/RecoveryUI";
import { NoirBackdrop } from "@/components/single/NoirBackdrop";
import { useRouteVeil } from "@/hooks/use-route-veil";
import { WelcomeTutorial } from "@/components/single/WelcomeTutorial";
import { installAnalyticsSession } from "@/lib/analytics";
import { IconManoContinuar } from "@/components/casino/DecoIcons";

export const Route = createFileRoute("/single")({
  head: () => ({
    meta: [
      { title: "El Cuervo Dorado — Sala de juegos offline" },
      {
        name: "description",
        content:
          "Minijuegos de casino y naipes 100% offline: truco, blackjack, chinchón, mahjong, cinco huesos y más. Sin internet, sin cuentas.",
      },
      { property: "og:title", content: "El Cuervo Dorado — Sala de juegos offline" },
      {
        property: "og:description",
        content: "Speakeasy de bolsillo con mesas de naipes y casino jugables sin conexión.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SinglePage,
});

type GameLike = (typeof SINGLE_GAMES)[number];
type NemLike = ReturnType<ReturnType<typeof useNemesis.getState>["get"]> | null;
type ScoreLike = ReturnType<ReturnType<typeof useSingleScores.getState>["get"]>;

function openGamesSheet() {
  try {
    window.dispatchEvent(new Event("cd:open-games-sheet"));
  } catch {
    /* noop */
  }
}

function timeAgo(ts: number): string | null {
  if (!ts) return null;
  const diff = Date.now() - ts;
  if (diff < 60_000) return "hace instantes";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function SinglePage() {
  const setMode = useGameMode((s) => s.setMode);
  useRouteVeil("none");

  const tick = useLives((s) => s.tick);
  const nemesisFor = useNemesis((s) => s.get);
  const scoreFor = useSingleScores((s) => s.get);
  const unlocked = useSingleTrophies((s) => s.unlocked);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMode("single");
    tick();
    installSingleTrophyWatcher();
    installAnalyticsSession();
    evaluateSingleTrophies();
  }, [setMode, tick]);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setReady(true);
        try {
          window.dispatchEvent(new Event("cuervo:hub-ready"));
        } catch {
          /* noop */
        }
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  useEffect(() => {
    warmCoverArtCache(SINGLE_GAMES);
  }, []);

  const featured = useMemo(() => {
    const ranked = SINGLE_GAMES.map((g) => {
      const nem = g.hasNemesis ? nemesisFor(g.id) : null;
      const sc = scoreFor(g.id);
      const weight = (nem?.level ?? 0) * 10 + (nem?.wins ?? 0) + sc.plays + sc.best / 100;
      return { g, nem, sc, weight };
    }).sort((a, b) => b.weight - a.weight);
    const top = ranked[0];
    if (top && top.weight > 0) return { ...top, kind: "continue" as const, ranked };
    const day = new Date();
    const seed = day.getUTCFullYear() * 372 + (day.getUTCMonth() + 1) * 31 + day.getUTCDate();
    const pick = SINGLE_GAMES[seed % SINGLE_GAMES.length]!;
    return {
      g: pick,
      nem: pick.hasNemesis ? nemesisFor(pick.id) : null,
      sc: scoreFor(pick.id),
      weight: 0,
      kind: "daily" as const,
      ranked,
    };
  }, [nemesisFor, scoreFor]);

  const [retosOpen, setRetosOpen] = useState(false);

  const carousel = useMemo(
    () => featured.ranked.map((r) => r.g).filter((g) => g.id !== featured.g.id),
    [featured],
  );

  return (
    <div
      data-hub-ready={ready ? "true" : undefined}
      className="relative flex flex-col overflow-hidden bg-[var(--cd-noir-0)] text-[var(--crema-clara)]"
      style={{
        fontFamily: "'Barlow', system-ui, sans-serif",
        // El alto útil descuenta la barra de pestañas fija y el notch, así el
        // dock inferior y el carrusel nunca quedan tapados ni recortados.
        height: "calc(100dvh - var(--app-tabbar-h) - var(--sa-top))",
      }}
    >
      <WelcomeTutorial />
      <NoirBackdrop variant="hub" />

      {/* HUD de latón: nada de navbar web */}
      <GameHud />

      <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pt-1.5 text-center">
        <p className="paria-eyebrow">— Salón principal —</p>
        <h1 className="paria-sign text-xl leading-none sm:text-2xl">EL CUERVO DORADO</h1>
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-2 px-3 pt-2 sm:px-5">
        {!ready ? (
          <BentoSkeleton />
        ) : (
          <>
            <div className="min-h-0 flex-1">
              <HeroTile g={featured.g} nem={featured.nem} sc={featured.sc} kind={featured.kind} />
            </div>
            <MesasCarousel games={carousel} />
          </>
        )}
      </main>

      {/* Dock físico inferior */}
      <div className="mx-auto flex w-full max-w-2xl shrink-0 items-stretch gap-2 px-3 pb-2 pt-2 sm:px-5">
        <BrassButton variant="ghost" size="md" block onClick={() => setRetosOpen(true)}>
          Retos
        </BrassButton>
        <Link to="/progreso" className="flex-1">
          <BrassButton variant="ghost" size="md" block>
            Ligas
          </BrassButton>
        </Link>
        <BrassButton variant="primary" size="md" block onClick={openGamesSheet}>
          {SINGLE_GAMES.length} mesas
        </BrassButton>
      </div>

      {retosOpen ? (
        <div
          className="fixed inset-0 z-[300] flex flex-col justify-end bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-label="Retos del día"
          onClick={() => setRetosOpen(false)}
        >
          <div
            className="max-h-[82dvh] overflow-y-auto border-t border-[var(--oro)]/40 bg-[var(--cd-noir-1)] px-3 pt-3"
            style={{ paddingBottom: "calc(84px + var(--sa-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ChallengesSwitcher />
            <div className="mt-3">
              <BrassButton variant="ghost" size="md" block onClick={() => setRetosOpen(false)}>
                Cerrar
              </BrassButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Fila de mesas en carrusel horizontal, estilo estantería de fichas. */
function MesasCarousel({ games }: { games: GameLike[] }) {
  return (
    <div
      className="cd-scroll-x-fade -mx-1 flex shrink-0 snap-x snap-mandatory items-stretch gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Otras mesas"
    >
      {games.map((g) => (
        <CarouselTile key={g.id} g={g} />
      ))}
    </div>
  );
}

const CarouselTile = memo(function CarouselTile({ g }: { g: GameLike }) {
  const art = coverArtFor(g);
  return (
    <Link
      to={g.to}
      data-haptic="tap"
      aria-label={`${g.name}. ${g.hint}`}
      className="paria-photo group relative flex h-[104px] w-[92px] shrink-0 snap-start flex-col justify-end overflow-hidden border border-white/10 p-1.5 text-left transition-transform active:scale-[0.96]"
      style={{
        background: coverBackground(art),
        backgroundColor: art.from,
        borderRadius: "var(--cd-radius-tile)",
      }}
    >
      <GameCoverArt gameId={g.id} fit="cover" sizes="120px" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,8,4,0.1) 0%, rgba(11,8,4,0.6) 60%, rgba(6,4,2,0.96) 100%)",
        }}
      />
      <div
        className="relative truncate text-[13px] leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
      >
        {g.name}
      </div>
    </Link>
  );
});

function HeroTile({
  g,
  nem,
  sc,
  kind,
}: {
  g: GameLike;
  nem: NemLike;
  sc: ScoreLike;
  kind: "continue" | "daily";
}) {
  const art = coverArtFor(g);
  const label = kind === "continue" ? "Continuar" : "Mesa del día";
  const ago = timeAgo(sc.lastAt);
  return (
    <Link
      to={g.to}
      data-haptic="select"
      aria-label={`${label}: ${g.name}. ${g.hint}`}
      className="paria-photo group relative block w-full overflow-hidden border border-white/10 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)] transition-colors hover:border-[var(--oro)]/60"
      style={{ height: "100%", borderRadius: "var(--cd-radius-hero)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: coverBannerBackground(art), backgroundColor: art.from }}
      />
      <GameCoverArt gameId={g.id} eager fit="cover" sizes="(min-width: 672px) 672px, 100vw" />

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,8,4,0.10) 0%, rgba(11,8,4,0.30) 45%, rgba(11,8,4,0.92) 90%, rgba(11,8,4,0.98) 100%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        {/* Top: chip contexto */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-[2px] border border-[var(--oro)] bg-black/80 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[var(--oro-claro)]">
            <IconManoContinuar size={16} className="shrink-0 text-[var(--oro)]" />
            {label}
          </span>
          {ago && kind === "continue" ? (
            <span className="rounded-[2px] border border-[var(--oro)]/25 bg-black/55 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-white/75">
              {ago}
            </span>
          ) : null}
        </div>

        {/* Bottom: título + CTA */}
        <div>
          <h2
            className="text-4xl leading-[0.92] text-white sm:text-5xl"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.02em",
              textShadow: "0 3px 18px rgba(0,0,0,0.75)",
            }}
          >
            {g.name}
          </h2>
          <p
            className="mt-1 max-w-md text-[12px] italic text-white/80"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.75)" }}
          >
            {g.hint}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 uppercase tracking-[0.22em] text-white/90 backdrop-blur">
                {CATEGORY_LABELS[g.category]}
              </span>
              {nem ? (
                <span className="rounded-full bg-black/80 px-2.5 py-0.5 uppercase tracking-[0.22em] text-[var(--oro-claro)] font-bold backdrop-blur">
                  LV.{nem.level} · ×{nemesisDifficulty(nem.level).toFixed(2)}
                </span>
              ) : null}
              {sc.best > 0 ? (
                <span className="rounded-full bg-black/55 px-2.5 py-0.5 uppercase tracking-[0.22em] text-white/80 backdrop-blur">
                  Best {sc.best.toLocaleString("es-AR")}
                </span>
              ) : null}
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--oro)] px-6 py-3 text-[14px] font-bold uppercase tracking-[0.24em] text-[var(--cd-noir-3)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", boxShadow: "var(--cd-gold-glow)" }}
            >
              Jugar <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ChallengesSwitcher() {
  const [tab, setTab] = useState<"reto" | "torneo">("reto");
  return (
    <section className="paria-paper overflow-hidden rounded-[3px]" aria-label="Retos del día">
      <div className="relative flex items-stretch gap-0 border-b border-[var(--oro)]/20 bg-black/40">
        {[
          { id: "reto" as const, label: "Reto diario" },
          { id: "torneo" as const, label: "Legajo del día" },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              data-haptic="tap"
              aria-pressed={active}
              data-on={active}
              className="paria-tab relative min-h-11 flex-1 border-0 py-3 text-[12px]"
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
        <Link
          to="/progreso"
          data-haptic="tap"
          className="inline-flex min-h-11 shrink-0 items-center px-4 text-[11px] uppercase tracking-[0.22em] text-[var(--oro)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Ligas →
        </Link>
      </div>

      <div className="p-0">
        {tab === "reto" ? (
          <SectionErrorBoundary label="Reto diario">
            <DailyEchoPanel />
          </SectionErrorBoundary>
        ) : (
          <SectionErrorBoundary label="Legajo del día">
            <Suspense
              fallback={
                <div className="p-4 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/70">
                  Corvina revisa el legajo…
                </div>
              }
            >
              <TorneoDelDiaPanel />
            </Suspense>
          </SectionErrorBoundary>
        )}
      </div>

      <div className="space-y-3 p-3">
        <SectionErrorBoundary label="Rumores del bajo mundo">
          <RumoresPanel />
        </SectionErrorBoundary>
        <SectionErrorBoundary label="Reputación de anfitrionas">
          <HostessRanksStrip />
        </SectionErrorBoundary>
      </div>
    </section>
  );
}

function BentoSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2" aria-hidden>
      <div className="min-h-0 flex-1 animate-pulse rounded-[3px] bg-white/[0.04]" />
      <div className="h-[104px] shrink-0 animate-pulse rounded-[3px] bg-white/[0.04]" />
    </div>
  );
}
