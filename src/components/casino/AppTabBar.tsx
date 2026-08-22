import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GamesSheet } from "./GamesSheet";
import tabbarBrass from "@/assets/ambience/tabbar-brass.webp";
import { IconFichas, IconLampara, IconLibro, IconNaipes, IconSobre } from "./DecoIcons";

function useEncargosBadge(path: string): boolean {
  const [hasBadge, setHasBadge] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (path.startsWith("/encargos")) {
        window.localStorage.setItem("cd:encargos:lastSeen", today);
        setHasBadge(false);
        return;
      }
      const last = window.localStorage.getItem("cd:encargos:lastSeen");
      setHasBadge(last !== today);
    } catch {
      setHasBadge(false);
    }
  }, [path]);
  return hasBadge;
}

const HUB_ROUTES = new Set([
  "/single",
  "/encargos",
  "/ajustes",
  "/diario",
  "/logros",
  "/torneo",
  "/estadisticas",
  "/dificultad",
  "/reglas",
  "/camerinos",
]);

type Tab = {
  to: string;
  label: string;
  match: (path: string) => boolean;
  icon: ReactNode;
};

const IconChips = () => <IconFichas size={26} />;
const IconEnvelope = () => <IconSobre size={26} />;
const IconGear = () => <IconLampara size={26} />;
const IconGrid = () => <IconNaipes size={26} />;
const IconBook = () => <IconLibro size={26} />;

const TABS: Tab[] = [
  {
    to: "/single",
    label: "Jugar",
    icon: <IconChips />,
    match: (p) => p === "/single" || p === "/" || p.startsWith("/tables"),
  },
  {
    to: "/encargos",
    label: "Encargos",
    icon: <IconEnvelope />,
    match: (p) => p.startsWith("/encargos"),
  },
  {
    to: "/reglas",
    label: "Reglas",
    icon: <IconBook />,
    match: (p) => p.startsWith("/reglas"),
  },
  {
    to: "/ajustes",
    label: "Ajustes",
    icon: <IconGear />,
    match: (p) =>
      p.startsWith("/ajustes") ||
      p.startsWith("/diario") ||
      p.startsWith("/logros") ||
      p.startsWith("/torneo") ||
      p.startsWith("/estadisticas") ||
      p.startsWith("/dificultad") ||
      p.startsWith("/camerinos"),
  },
];

/* Superficie táctil única para todas las pestañas: 64px de alto (por encima
   del mínimo de 48dp de Android) y estados activos con placa de latón. */
const tabClass = (active: boolean) =>
  `relative mx-1 my-1 flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[10px] uppercase transition-[color,transform,background] duration-200 active:scale-[0.96] ${
    active ? "hud-plate" : ""
  }`;

const tabStyle = (active: boolean): React.CSSProperties => ({
  color: active ? "var(--cd-gold-tab)" : "rgba(236,235,230,0.72)",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  fontFamily: "'Bebas Neue', 'Barlow', sans-serif",
  // Tipografía fluida: legible en 320px y sin desbordar en tablets.
  fontSize: "clamp(0.625rem, 2.5vw, 0.75rem)",
  letterSpacing: "clamp(0.08em, 0.7vw, 0.2em)",
  lineHeight: 1.1,
  textShadow: active ? "0 0 10px rgba(244,217,122,0.35)" : "0 1px 0 rgba(0,0,0,0.75)",
});

function TabInner({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-[2px] rounded-full transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background:
            "linear-gradient(90deg, transparent 0%, var(--cd-gold-tab) 50%, transparent 100%)",
          boxShadow: "0 0 10px rgba(244,217,122,0.7)",
        }}
      />
      <span
        className="grid place-items-center transition-transform duration-200"
        style={{
          width: 34,
          height: 34,
          transform: active ? "translateY(-1px) scale(1.06)" : "none",
          filter: active
            ? "drop-shadow(0 2px 6px rgba(244,217,122,0.45))"
            : "grayscale(0.25) opacity(0.9)",
        }}
        aria-hidden
      >
        {icon}
      </span>
      <span>{label}</span>
    </>
  );
}

export function AppTabBar() {
  const location = useLocation();
  const path = location.pathname;
  const [gamesOpen, setGamesOpen] = useState(false);
  const encargosBadge = useEncargosBadge(path);

  useEffect(() => {
    setGamesOpen(false);
  }, [path]);

  useEffect(() => {
    const open = () => setGamesOpen(true);
    window.addEventListener("cd:open-games-sheet", open);
    return () => window.removeEventListener("cd:open-games-sheet", open);
  }, []);

  const visible = useMemo(() => {
    const first = "/" + (path.split("/")[1] ?? "");
    if (path === "/") return true;
    return HUB_ROUTES.has(first);
  }, [path]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (visible) {
      document.body.dataset.tabbar = "1";
    } else {
      delete document.body.dataset.tabbar;
    }
    return () => {
      delete document.body.dataset.tabbar;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-[200] bg-[var(--cd-noir-1)]"
        style={{
          paddingBottom: "var(--sa-bottom)",
          paddingLeft: "var(--sa-left)",
          paddingRight: "var(--sa-right)",
          borderTop: "1px solid rgba(201,168,76,0.5)",
          backgroundImage: `linear-gradient(180deg, rgba(10,8,6,0.7) 0%, rgba(10,8,6,0.93) 100%), url(${tabbarBrass})`,
          backgroundSize: "auto, 320px 100%",
          backgroundRepeat: "no-repeat, repeat-x",
          backgroundPosition: "center, center",
          boxShadow: "inset 0 1px 0 rgba(244,217,122,0.22), 0 -10px 28px -14px rgba(0,0,0,0.9)",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <ul className="mx-auto flex w-full max-w-[560px] items-stretch justify-around">
          {TABS.flatMap((t, i) => {
            const active = t.match(path);
            const showBadge = t.to === "/encargos" && encargosBadge && !active;
            const linkItem = (
              <li key={t.to} className="flex-1">
                <Link
                  to={t.to}
                  data-haptic="tap"
                  aria-current={active ? "page" : undefined}
                  className={tabClass(active)}
                  style={tabStyle(active)}
                >
                  <TabInner active={active} icon={t.icon} label={t.label} />
                  {showBadge ? (
                    <span
                      aria-label="Novedades en encargos"
                      className="absolute right-3 top-2 h-2 w-2 animate-pulse rounded-full"
                      style={{
                        background: "var(--cd-gold-tab)",
                        boxShadow: "0 0 0 2px var(--cd-noir-1), 0 0 8px rgba(244,217,122,0.9)",
                      }}
                    />
                  ) : null}
                </Link>
              </li>
            );
            if (i === 0) {
              const gamesItem = (
                <li key="__games" className="flex-1">
                  <button
                    type="button"
                    data-haptic="tap"
                    onClick={() => setGamesOpen(true)}
                    aria-label="Ver todos los juegos"
                    aria-expanded={gamesOpen}
                    className={`${tabClass(gamesOpen)} w-[calc(100%-0.5rem)]`}
                    style={tabStyle(gamesOpen)}
                  >
                    <TabInner active={gamesOpen} icon={<IconGrid />} label="Juegos" />
                  </button>
                </li>
              );
              return [linkItem, gamesItem];
            }
            return [linkItem];
          })}
        </ul>
      </nav>
      <GamesSheet open={gamesOpen} onClose={() => setGamesOpen(false)} />
    </>
  );
}
