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
  "/estadisticas",
  "/dificultad",
  "/reglas",
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
      p.startsWith("/estadisticas") ||
      p.startsWith("/dificultad"),
  },
];

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
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
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
                  className={`relative mx-1 my-1 flex h-[62px] flex-col items-center justify-center gap-1 text-[11px] uppercase transition-colors active:scale-[0.97] ${active ? "hud-plate" : ""}`}
                  style={{
                    color: active ? "var(--cd-gold-tab)" : "rgba(236,235,230,0.78)",
                    touchAction: "manipulation",
                    fontFamily: "'Bebas Neue', 'Barlow', sans-serif",
                    fontSize: "0.5625rem",
                    letterSpacing: "0.26em",
                    textShadow: "0 1px 0 rgba(0,0,0,0.75)",
                  }}
                >
                  <span
                    className="grid place-items-center"
                    style={{ width: 34, height: 34 }}
                    aria-hidden
                  >
                    {t.icon}
                  </span>
                  <span>{t.label}</span>
                  {showBadge ? (
                    <span
                      aria-label="Novedades en encargos"
                      className="absolute right-3 top-2 h-2 w-2 rounded-full"
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
                    onClick={() => setGamesOpen(true)}
                    aria-label="Ver todos los juegos"
                    aria-expanded={gamesOpen}
                    className={`relative mx-1 my-1 flex h-[62px] w-[calc(100%-0.5rem)] flex-col items-center justify-center gap-1 text-[11px] uppercase transition-colors active:scale-[0.97] ${gamesOpen ? "hud-plate" : ""}`}
                    style={{
                      color: gamesOpen ? "var(--cd-gold-tab)" : "rgba(236,235,230,0.78)",
                      touchAction: "manipulation",
                      fontFamily: "'Bebas Neue', 'Barlow', sans-serif",
                      fontSize: "0.5625rem",
                      letterSpacing: "0.26em",
                      textShadow: "0 1px 0 rgba(0,0,0,0.75)",
                    }}
                  >
                    <span
                      className="grid place-items-center"
                      style={{ width: 34, height: 34 }}
                      aria-hidden
                    >
                      <IconGrid />
                    </span>
                    <span>Juegos</span>
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
