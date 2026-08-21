import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SINGLE_GAMES, CATEGORY_LABELS, type SingleCategory } from "@/lib/single-games";
import { coverArtFor, coverBackground } from "@/lib/single-art";
import { GameCoverArt } from "@/components/single/GameCoverArt";
import { useSingleScores } from "@/store/single-scores";
import { warmSingleBackgrounds } from "@/lib/single-bg-preload";
import { hasActiveRun } from "@/lib/has-active-run";
import { useHaptics } from "@/hooks/use-haptics";
import { useSwipe } from "@/hooks/use-swipe";
import { GameIcon } from "@/components/casino/GameIcon";
import { IconChinche } from "@/components/casino/DecoIcons";

type Props = {
  open: boolean;
  onClose: () => void;
};

const CATEGORY_ORDER: SingleCategory[] = ["meta", "naipes", "azar", "dados", "puntaje"];
type Filter = "all" | SingleCategory;
const FILTERS: Filter[] = ["all", ...CATEGORY_ORDER];
const LS_FILTER = "cd:games-sheet:filter";
const LS_QUERY = "cd:games-sheet:query";
const TITLE_ID = "games-sheet-title";

function readLS(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function GamesSheet({ open, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>(() => {
    const stored = readLS(LS_FILTER, "all") as Filter;
    return (FILTERS as string[]).includes(stored) ? stored : "all";
  });
  const [query, setQuery] = useState<string>(() => readLS(LS_QUERY, ""));
  const [rendered, setRendered] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const haptics = useHaptics();

  const byGame = useSingleScores((s) => s.byGame);
  const recent = useMemo(() => {
    return Object.entries(byGame)
      .filter(([, r]) => r && r.lastAt > 0)
      .sort((a, b) => b[1].lastAt - a[1].lastAt)
      .slice(0, 4)
      .map(([id]) => SINGLE_GAMES.find((g) => g.id === id))
      .filter((g): g is (typeof SINGLE_GAMES)[number] => Boolean(g));
  }, [byGame]);

  useSwipe(handleRef, {
    onSwipeDown: () => {
      haptics("select");
      onClose();
    },
    threshold: 40,
    maxOffAxis: 120,
  });

  useEffect(() => {
    writeLS(LS_FILTER, filter);
  }, [filter]);
  useEffect(() => {
    writeLS(LS_QUERY, query);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    warmSingleBackgrounds();
    haptics("tap");
    returnFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    setRendered(false);
    const raf = requestAnimationFrame(() => setRendered(true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = containerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 60);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(focusTimer);
      cancelAnimationFrame(raf);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose, haptics]);

  if (!open) return null;

  const q = normalize(query.trim());
  const matches = SINGLE_GAMES.filter((g) => {
    if (filter !== "all" && g.category !== filter) return false;
    if (!q) return true;
    return normalize(g.name).includes(q) || normalize(g.hint).includes(q);
  });

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    games: matches.filter((g) => g.category === cat),
  })).filter((g) => g.games.length > 0);

  const showRecent = filter === "all" && q.length === 0 && recent.length > 0;

  return (
    <div
      className="fixed inset-0 z-[240] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
    >
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />
      <div
        ref={containerRef}
        className="paria-paper paria-grime relative w-full overflow-hidden rounded-t-sm border-x-0 border-b-0 border-t-2 border-[var(--oro)]/45"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)",
          maxHeight: "85vh",
        }}
      >
        {/* Cintas de embalar sujetando la hoja al marco */}
        <span aria-hidden className="cinta -left-4 -top-2 -rotate-[8deg] z-10" />
        <span aria-hidden className="cinta -right-4 -top-2 rotate-[7deg] z-10" />
        <div
          ref={handleRef}
          className="mx-auto mt-3 px-8 pb-1 pt-1"
          style={{ touchAction: "none" }}
        >
          <div className="mx-auto h-1 w-14 bg-[var(--oro)]/45" aria-hidden />
        </div>
        <header className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pb-2 pt-3 sm:px-5">
          <div className="min-w-0">
            <p className="paria-eyebrow">— Sala completa —</p>
            <h2 id={TITLE_ID} className="paria-sign mt-0.5 truncate text-[1.35rem] sm:text-2xl">
              TODOS LOS JUEGOS ({SINGLE_GAMES.length})
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="cd-tap-target grid h-11 w-11 shrink-0 place-items-center rounded-[2px] border border-[var(--oro)]/45 bg-black/60 text-lg text-[var(--oro-palido)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--oro-palido)] active:scale-[0.94]"
            style={{ touchAction: "manipulation" }}
          >
            ×
          </button>
        </header>
        <div aria-hidden className="paria-rule mx-4 mb-1 mt-2 sm:mx-5" />

        {/* Buscador + filtros */}
        <div className="px-4 pb-2 pt-1">
          <label htmlFor="games-sheet-search" className="sr-only">
            Buscar un juego por nombre
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oro)]/80"
            >
              ⌕
            </span>
            <input
              ref={searchRef}
              id="games-sheet-search"
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar un juego…"
              autoComplete="off"
              className="h-11 w-full rounded-[2px] border border-[var(--oro)]/30 bg-black/45 pl-9 pr-9 text-sm text-[var(--crema-clara)] placeholder:text-[var(--marfil)]/65 outline-none transition focus:border-[var(--oro)] focus-visible:ring-2 focus-visible:ring-[var(--oro-palido)]/50"
              style={{ fontFamily: "'Special Elite', monospace" }}
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--marfil)]/80 hover:text-[var(--oro-claro)] focus-visible:ring-2 focus-visible:ring-[var(--oro-palido)]"
              >
                ×
              </button>
            ) : null}
          </div>

          <div
            role="tablist"
            aria-label="Filtrar por categoría"
            className="mt-2 flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {FILTERS.map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  data-on={on}
                  onClick={() => setFilter(f)}
                  className="paria-tab min-h-11 snap-start shrink-0 px-3 py-2 text-[0.7rem] focus-visible:ring-2 focus-visible:ring-[var(--oro-palido)]"
                >
                  {CATEGORY_LABELS[f]}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="overflow-y-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maxHeight: "calc(85dvh - 14rem)", overscrollBehavior: "contain" }}
          aria-live="polite"
          aria-busy={!rendered}
        >
          {!rendered ? (
            <SkeletonGrid />
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm italic text-[var(--marfil)]/80">
                Ningún juego coincide con tu búsqueda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="rounded-full border border-[var(--oro)]/60 bg-[var(--oro)]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--oro-palido)] focus-visible:ring-2 focus-visible:ring-[var(--oro-palido)]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              {showRecent ? (
                <section className="mt-1">
                  <SectionLabel>Recientes</SectionLabel>
                  <ul className="grid grid-cols-3 gap-2 min-[380px]:grid-cols-4">
                    {recent.map((g) => (
                      <li key={`recent-${g.id}`}>
                        <GameTile
                          game={g}
                          onNavigate={() => {
                            haptics("select");
                            onClose();
                          }}
                          compact
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {grouped.map(({ cat, games }) => (
                <section key={cat} className="mt-3 first:mt-1">
                  <SectionLabel>{CATEGORY_LABELS[cat]}</SectionLabel>
                  <ul className="grid grid-cols-2 gap-2 min-[340px]:grid-cols-3">
                    {games.map((g) => (
                      <li key={g.id}>
                        <GameTile
                          game={g}
                          onNavigate={() => {
                            haptics("select");
                            onClose();
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <IconChinche size={13} className="shrink-0 text-[var(--oro)]/80" />
      <h3 className="paria-eyebrow">{children}</h3>
      <span aria-hidden className="paria-rule flex-1" />
    </div>
  );
}

function GameTile({
  game,
  onNavigate,
  compact = false,
}: {
  game: (typeof SINGLE_GAMES)[number];
  onNavigate: () => void;
  compact?: boolean;
}) {
  const art = coverArtFor(game);
  const best = useSingleScores((s) => s.byGame[game.id]?.best ?? 0);
  const [resumable, setResumable] = useState(false);
  useEffect(() => {
    setResumable(hasActiveRun(game.id));
  }, [game.id]);
  return (
    <Link
      to={game.to}
      onClick={onNavigate}
      aria-label={`${game.name}. ${game.hint}${best > 0 ? `. Mejor puntaje ${best}.` : ""}${resumable ? ". Partida en curso." : ""}`}
      className="paria-photo group relative flex aspect-square w-full flex-col justify-between overflow-hidden p-2 text-left outline-none transition focus-visible:border-[var(--oro-palido)] focus-visible:ring-2 focus-visible:ring-[var(--oro-palido)] active:scale-[0.96]"
      style={{
        background: coverBackground(art),
        touchAction: "manipulation",
        contentVisibility: "auto",
        containIntrinsicSize: "120px 120px",
      }}
    >
      <GameCoverArt
        gameId={game.id}
        sizes="(min-width: 672px) 220px, 31vw"
        className="opacity-95"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10"
      />
      <div aria-hidden className="absolute inset-0 mix-blend-color bg-[#8a6630]/38" />
      {resumable ? (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-full border border-[var(--oro-palido)]/70 bg-[#1d1610]/85 px-1.5 py-0.5 text-[11px] uppercase tracking-[0.18em] text-[var(--oro-palido)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          ▶ Retomar
        </span>
      ) : null}
      <span
        aria-hidden
        className="relative inline-flex items-center justify-center rounded-[2px] border border-[var(--oro)]/55 bg-[#0d0a06]/75 p-1 text-[#e6c67a] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        style={{ width: compact ? 26 : 30, height: compact ? 26 : 30 }}
      >
        <GameIcon id={game.id} size={compact ? 18 : 22} />
      </span>
      <div className="relative flex items-end justify-between gap-1">
        <span
          className={`min-w-0 text-[var(--crema-clara)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] leading-tight ${compact ? "text-[0.62rem]" : "text-[0.7rem]"}`}
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
        >
          {game.name}
        </span>
        {best > 0 ? (
          <span
            className="shrink-0 rounded-sm border border-[var(--oro)]/40 bg-black/55 px-1 py-px text-[11px] uppercase tracking-[0.15em] text-[var(--oro-palido)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            aria-hidden
          >
            {best}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div aria-hidden className="mt-2 space-y-4">
      {[0, 1].map((row) => (
        <div key={row}>
          <div className="mb-2 h-3 w-20 rounded bg-white/5" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-square w-full animate-pulse rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.02]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
