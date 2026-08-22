import { useLocation, useRouter } from "@tanstack/react-router";
import { ClipboardList, Map as MapIcon } from "lucide-react";
import { useCasino, rankFromXp } from "@/store/casino";
import { useLives } from "@/store/lives";
import { useGameLock } from "@/store/gameLock";
import { useFavors } from "@/store/favors";
import { useSurrenderStore } from "@/store/surrender";
import { SurrenderButton } from "@/components/casino/SurrenderButton";
import { DebtBadge } from "@/components/casino/DebtBadge";
import { LivesIndicator } from "@/components/casino/LivesIndicator";
import { ChipsBadge } from "@/components/casino/ChipsBadge";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useCountUp } from "@/hooks/use-count-up";
import { useSlotAudio } from "@/hooks/use-slot-audio";
import { useWear, type WearMode } from "@/lib/wear";
import { DecoStar } from "@/components/casino/DecoStar";
import iconVolumeOn from "@/assets/_placeholder.webp";
import iconVolumeOff from "@/assets/_placeholder.webp";

import iconBar from "@/assets/_placeholder.webp";
import iconBlackjack from "@/assets/_placeholder.webp";
import iconRuleta from "@/assets/_placeholder.webp";
import iconPlaceholder from "@/assets/_placeholder.webp";
import iconMahjong from "@/assets/_placeholder.webp";
import iconDados from "@/assets/_placeholder.webp";
import iconBagatelle from "@/assets/_placeholder.webp";
import iconDespacho from "@/assets/_placeholder.webp";

import hudChipIcon from "@/assets/_placeholder.webp";
import hudFeatherIcon from "@/assets/_placeholder.webp";
import hudEmberIcon from "@/assets/_placeholder.webp";
import { useGameMode } from "@/store/game-mode";
import { useNemesis } from "@/store/nemesis";
import { SINGLE_GAMES } from "@/lib/single-games";

function nemesisGameIdForPath(pathname: string): string | null {
  const match = SINGLE_GAMES.find(
    (g) => g.hasNemesis && (pathname === g.to || pathname.startsWith(g.to + "/")),
  );
  return match?.id ?? null;
}

type Status = "open" | "hot" | "reserved" | "live";
interface RoomMeta {
  to: string;
  label: string;
  tag: string;
  status: Status;
  accent: string;
  icon: string;
}

const ROOM_META: RoomMeta[] = [
  {
    to: "/ruleta",
    label: "La Rueda de la Fortuna",
    tag: "Rojo o negro",
    status: "hot",
    accent: "oklch(0.65 0.22 25)",
    icon: iconRuleta,
  },
  {
    to: "/tables",
    label: "Veintiuno de Medianoche",
    tag: "21 · la crupier de guantes negros",
    status: "hot",
    accent: "oklch(0.62 0.18 200)",
    icon: iconBlackjack,
  },
  {
    to: "/truco",
    label: "El Truco del Cuervo",
    tag: "Envido · flor · truco",
    status: "hot",
    accent: "oklch(0.70 0.18 40)",
    icon: iconPlaceholder,
  },
  {
    to: "/escoba",
    label: "La Escoba de Quince",
    tag: "Sumar quince · barrer",
    status: "open",
    accent: "oklch(0.68 0.16 145)",
    icon: iconPlaceholder,
  },
  {
    to: "/chinchon",
    label: "La Baraja Corta",
    tag: "Chinchón · cartas españolas",
    status: "hot",
    accent: "oklch(0.72 0.18 30)",
    icon: iconPlaceholder,
  },
  {
    to: "/solitario",
    label: "Solitario del Cuervo",
    tag: "Paciencia · sin vidas",
    status: "open",
    accent: "oklch(0.68 0.16 30)",
    icon: iconPlaceholder,
  },
  {
    to: "/mahjong",
    label: "El Dragón de Marfil",
    tag: "Muralla de marfil",
    status: "reserved",
    accent: "oklch(0.65 0.18 25)",
    icon: iconMahjong,
  },
  {
    to: "/dados",
    label: "Los Cinco del Diablo",
    tag: "Cubilete · dudo",
    status: "reserved",
    accent: "oklch(0.76 0.15 55)",
    icon: iconDados,
  },
  {
    to: "/bagatelle",
    label: "El Tablero de Clavos",
    tag: "Clavos · tiro de gracia",
    status: "hot",
    accent: "oklch(0.72 0.20 25)",
    icon: iconBagatelle,
  },
  {
    to: "/encargos",
    label: "Los Encargos",
    tag: "Contratos de Corvina",
    status: "open",
    accent: "oklch(0.68 0.18 30)",
    icon: iconDespacho,
  },
];

const STATUS_LABEL: Record<Status, string> = {
  open: "Abierto",
  hot: "Encendido",
  reserved: "Reservado",
  live: "En Vivo",
};

const GAME_ROUTE_PREFIXES = [
  "/blackjack",
  "/chinchon",
  "/truco",
  "/mahjong",
  "/escoba",
  "/dados",
  "/ruleta",
  "/bagatelle",
  "/solitario",
  "/tables",
];
function isGameRoute(pathname: string): boolean {
  const first = "/" + (pathname.split("/")[1] ?? "");
  return GAME_ROUTE_PREFIXES.includes(first);
}

function pickRoom(pathname: string): RoomMeta | null {
  const exact = ROOM_META.find((r) => r.to === pathname);
  if (exact) return exact;

  const prefix = ROOM_META.filter((r) => pathname.startsWith(r.to + "/")).sort(
    (a, b) => b.to.length - a.to.length,
  )[0];
  return prefix ?? null;
}

const ArtIcon = ({ src, alt, size = 16 }: { src: string; alt: string; size?: number }) => (
  <img
    src={src}
    alt={alt}
    width={size}
    height={size}
    loading="lazy"
    decoding="async"
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.55))",
    }}
  />
);

export function CasinoHUD({ showBack: _showBack = true }: { showBack?: boolean } = {}) {
  const chips = useCasino((s) => s.chips);
  const favors = useFavors((s) => s.favors);
  const streak = useCasino((s) => s.streak);
  const isSingle = useGameMode((s) => s.mode) === "single";
  const xp = useCasino((s) => s.xp);
  const rank = rankFromXp(xp);
  const luckBuff = useCasino((s) => s.luckBuff);
  const buffExpiresAt = useCasino((s) => s.buffExpiresAt);
  const consumeBuffIfExpired = useCasino((s) => s.consumeBuffIfExpired);
  const audio = useSlotAudio();
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(audio.isMuted()), [audio]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const t = setInterval(consumeBuffIfExpired, 1000);
    return () => clearInterval(t);
  }, [consumeBuffIfExpired]);

  const buffActive = mounted && luckBuff > 0 && buffExpiresAt && buffExpiresAt > Date.now();

  const [, setNow] = useState(0);
  useEffect(() => {
    if (!buffActive) return;
    const t = setInterval(() => setNow((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [buffActive]);

  const buffRemainingMs = buffActive && buffExpiresAt ? Math.max(0, buffExpiresAt - Date.now()) : 0;
  const buffSecondsLeft = Math.ceil(buffRemainingMs / 1000);
  const buffPct = Math.min(1, buffRemainingMs / 120_000);

  const displayChips = useCountUp(mounted ? chips : 500, 650);
  const prevChipsRef = useRef(chips);
  const [chipFlash, setChipFlash] = useState<"gain" | "loss" | null>(null);
  useEffect(() => {
    if (!mounted) return;
    const prev = prevChipsRef.current;
    if (chips > prev) {
      setChipFlash("gain");
      const t = setTimeout(() => setChipFlash(null), 900);
      prevChipsRef.current = chips;
      return () => clearTimeout(t);
    }
    if (chips < prev) {
      setChipFlash("loss");
      const t = setTimeout(() => setChipFlash(null), 600);
      prevChipsRef.current = chips;
      return () => clearTimeout(t);
    }
  }, [chips, mounted]);

  const location = useLocation();
  const room = useMemo(() => pickRoom(location.pathname), [location.pathname]);
  const isLobby = location.pathname === "/";
  const accent = room?.accent ?? "oklch(0.78 0.13 80)";

  const setLocked = useGameLock((s) => s.setLocked);
  const prevPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevPathRef.current !== null && prevPathRef.current !== location.pathname) {
      setLocked(false);
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, setLocked]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[260] hud-safe-top safe-px">
      {}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "calc(var(--hud-h) + 18px)",
          background:
            "linear-gradient(180deg, oklch(0.04 0.005 30 / 0.82) 0%, oklch(0.04 0.005 30 / 0.55) 60%, oklch(0.04 0.005 30 / 0) 100%)",
        }}
      />
      {}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] transition-colors duration-500"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent} 18%, ${accent} 82%, transparent 100%)`,
          boxShadow: `0 0 12px ${accent.replace(")", " / 0.55)")}`,
          opacity: 0.85,
        }}
      />

      <div
        className="pointer-events-auto mx-auto flex w-full max-w-[1280px] items-center justify-between gap-2 px-2 min-[400px]:gap-3 min-[400px]:px-2.5 sm:gap-3 sm:px-6 lg:px-10"
        style={{
          minHeight: "var(--hud-h)",
          paddingRight: "calc(var(--hud-btn) + 26px + var(--sa-right))",
          paddingLeft: isGameRoute(location.pathname)
            ? "calc(var(--hud-btn) + 20px + var(--sa-left))"
            : undefined,
        }}
      >
        {}
        {isLobby ? (
          <span
            className="font-display text-[12px] uppercase tracking-[0.2em] hidden sm:inline font-black"
            style={{ color: accent, textShadow: `0 0 12px ${accent.replace(")", " / 0.6)")}` }}
          >
            ─ EL CUERVO DORADO · 1928 ─
          </span>
        ) : isGameRoute(location.pathname) ? (
          <span aria-hidden />
        ) : (
          <RoomIdentity room={room} accent={accent} />
        )}

        {}
        {buffActive ? (
          <div
            className="relative hidden overflow-hidden rounded-sm border border-[oklch(0.65_0.22_24)]/60 bg-[var(--noir)]/85 px-3 py-1 backdrop-blur md:block"
            style={{
              boxShadow:
                "inset 0 1px 0 oklch(1 0 0 / 0.08), inset 0 -1px 2px oklch(0 0 0 / 0.5), 0 0 14px oklch(0.7 0.22 24 / 0.4)",
            }}
            title={`Suerte Líquida: quedan ${buffSecondsLeft}s`}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-display text-[11px] uppercase tracking-[0.2em] text-[oklch(0.78_0.22_24)] text-glow-blood">
                <DecoStar size={10} /> Suerte +{Math.round(luckBuff * 100)}%
              </span>
              <span className="font-numerals text-[12px] text-[var(--brass-bright)]/80">
                {buffSecondsLeft}s
              </span>
            </div>
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[oklch(0.2_0.05_24)]/60">
              <div
                className="h-full transition-[width] duration-300 ease-linear"
                style={{
                  width: `${buffPct * 100}%`,
                  background:
                    "linear-gradient(90deg, oklch(0.78 0.22 24) 0%, oklch(0.85 0.18 60) 100%)",
                }}
              />
            </div>
          </div>
        ) : (
          <span aria-hidden />
        )}

        {}
        <div className="ml-auto flex max-w-full min-w-0 items-center justify-end gap-1 overflow-x-auto min-[400px]:gap-1.5 sm:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Trofeos/rango, racha y favor: solo en el lobby. En juegos, el HUD queda limpio. */}
          <div className={isLobby ? "hidden min-[520px]:contents" : "hidden"}>
            <StatPlate
              label="Nivel"
              tone="brass"
              value={mounted ? String(rank.level) : "1"}
              popoverTitle={rank.current.name}
              popoverBody={
                rank.next ? (
                  <>
                    <p className="t-body text-[12px] leading-snug text-[var(--ivory)]/85">
                      <span className="font-numerals text-[15px] text-[var(--brass-bright)]">
                        {xp}
                      </span>
                      <span className="text-[var(--smoke)]"> / </span>
                      <span className="font-numerals text-[15px] text-[var(--brass-bright)]">
                        {rank.next.xp}
                      </span>
                      <span className="text-[var(--smoke)]"> XP al rango </span>
                      <em className="font-script text-[14px] text-[var(--brass-bright)]">
                        {rank.next.name}
                      </em>
                    </p>
                    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[oklch(0.06_0.01_28)]/80">
                      <div
                        className="h-full"
                        style={{
                          width: `${rank.pct * 100}%`,
                          background:
                            "linear-gradient(90deg, oklch(0.50 0.08 65) 0%, oklch(0.78 0.13 78) 100%)",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="t-body text-[12px] text-[var(--brass-bright)]">
                    Has alcanzado el rango más alto. La casa te respeta, encanto.
                  </p>
                )
              }
              footer={
                <span
                  className="pointer-events-none absolute inset-x-2 bottom-[2px] h-[2px] overflow-hidden rounded-full bg-[oklch(0.06_0.01_28)]/80"
                  aria-hidden
                >
                  <span
                    className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                    style={{
                      width: `${rank.pct * 100}%`,
                      background:
                        "linear-gradient(90deg, oklch(0.50 0.08 65) 0%, oklch(0.72 0.12 78) 100%)",
                    }}
                  />
                </span>
              }
            />
          </div>

          <div className={isLobby ? "hidden min-[430px]:contents" : "hidden"}>
            <StatPlate
              label="Racha"
              tone="blood"
              icon={hudEmberIcon}
              value={mounted ? String(streak) : "0"}
              popoverTitle="Racha"
              popoverBody={
                <p className="t-body text-[12px] leading-snug text-[var(--ivory)]/85">
                  Victorias seguidas. Cada minijuego usa la racha a su modo: multiplicador de premio
                  en tragaperras y ruleta. <br />
                  <span className="text-[var(--smoke)]">Se rompe al perder o cobrar.</span>
                </p>
              }
            />
          </div>

          <div className={!isLobby || isSingle ? "hidden" : "hidden min-[490px]:contents"}>
            <StatPlate
              label="Favor"
              tone="brass"
              icon={hudFeatherIcon}
              value={mounted ? String(favors) : "0"}
              popoverTitle="Favores del Cuervo"
              popoverBody={
                <div className="space-y-1.5 t-body text-[12px] leading-snug text-[var(--ivory)]/85">
                  <p>
                    Moneda social del Cuervo (🪶). Se gana subiendo afinidad y cobrando propinas en
                    el Despacho.
                  </p>
                  <ul className="ml-3 list-disc text-[12px] text-[var(--ivory)]/70">
                    <li>Ante base por tono — calle 10¢ · salón 50¢ · apuesta alta 200¢.</li>
                    <li>Descuento por afinidad — lvl 1 −10% · lvl 2 −25% · lvl 3 −50%.</li>
                    <li>Entrada a mesa alta — 5🪶 (gratis 1×día con afinidad 3).</li>
                  </ul>
                </div>
              }
            />
          </div>

          <ChipsBadge value={displayChips.toLocaleString("es-AR")} flash={chipFlash} />

          {isLobby && <DebtBadge />}

          {isLobby && isSingle && mounted && <NemesisBadge pathname={location.pathname} />}

          {/* Vidas: visibles en el lobby Y dentro de los juegos, para que
              el jugador vea en tiempo real cualquier penalización. */}
          {mounted && (
            <div className="hidden min-[560px]:block">
              <LivesIndicator compact={false} />
            </div>
          )}
          {mounted && (
            <div className="hidden min-[400px]:block min-[560px]:hidden">
              <LivesIndicator compact />
            </div>
          )}
          {mounted && (
            <div className="min-[400px]:hidden">
              <LivesIndicator ultra />
            </div>
          )}

          {isLobby && (
            <OverflowMenu
              muted={muted}
              onToggleAudio={() => {
                const next = !muted;
                audio.setMuted(next);
                setMuted(next);
              }}
              currentPath={location.pathname}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function RoomIdentity({ room, accent }: { room: RoomMeta | null; accent: string }) {
  const pulse = room?.status === "hot" || room?.status === "live";
  const router = useRouter();
  const locked = useGameLock((s) => s.locked);
  const started = useGameLock((s) => s.started);
  const markStarted = useGameLock((s) => s.markStarted);
  const surrenderHandler = useSurrenderStore((s) => s.handler);
  const surrenderLabel = useSurrenderStore((s) => s.label);
  const spendLife = useLives((s) => s.spend);
  const setLocked = useGameLock((s) => s.setLocked);
  const isSingle = useGameMode((s) => s.mode) === "single";

  useEffect(() => {
    if (!locked || started) return;
    const onFirstInput = () => markStarted();
    window.addEventListener("pointerdown", onFirstInput, {
      once: true,
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", onFirstInput, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstInput, true);
      window.removeEventListener("keydown", onFirstInput, true);
    };
  }, [locked, started, markStarted]);

  void spendLife;
  const fallbackSurrender = () => {
    setLocked(false);
    router.navigate({ to: isSingle ? "/single" : "/" });
  };
  const effectiveSurrender = surrenderHandler ?? (locked ? fallbackSurrender : null);

  return (
    <div className="relative flex items-center gap-1.5">
      {/* El botón de volver vive en GameBackButton (flotante, universal). */}

      {}
      {locked && started && effectiveSurrender && (
        <SurrenderButton
          active
          label={surrenderLabel ?? "Rendirse"}
          onSurrender={effectiveSurrender}
          className="fixed left-[max(0.75rem,var(--sa-left))] bottom-[calc(max(var(--sa-bottom),0px)+var(--app-tabbar-h,0px)+12px)] z-[330] inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-sm border border-[var(--oxblood)]/80 bg-[var(--noir)]/92 px-3 py-2 font-display text-[11px] uppercase tracking-[0.2em] text-[var(--ivory)] shadow-[0_8px_22px_rgba(0,0,0,0.55)] backdrop-blur transition-colors hover:bg-[var(--oxblood)]/30 hover:border-[var(--oxblood)] active:bg-[var(--oxblood)]/50 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/70 disabled:opacity-40 disabled:cursor-not-allowed"
        />
      )}

      {}
      {}
      <div
        className="hidden min-[430px]:flex items-center gap-2 rounded-[3px] backdrop-blur"
        style={{
          height: "calc(var(--hud-h) - 16px)",
          padding: "0 10px",
          background:
            "linear-gradient(180deg, oklch(0.09 0.012 30 / 0.95) 0%, oklch(0.05 0.008 30 / 0.95) 100%)",
          border: `1px solid ${accent.replace(")", " / 0.55)")}`,
          boxShadow: `inset 0 1px 0 oklch(1 0 0 / 0.06), 0 0 14px ${accent.replace(")", " / 0.18)")}, 0 4px 10px oklch(0 0 0 / 0.45)`,
          clipPath:
            "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
        }}
        title={room?.label}
        aria-label={room?.label ?? "Sala"}
      >
        {room && (
          <>
            <span
              aria-hidden
              className="flex size-6 items-center justify-center rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, oklch(0.18 0.03 35) 0%, oklch(0.06 0.012 30) 78%)",
                boxShadow: `inset 0 0 0 1px ${accent.replace(")", " / 0.5)")}, 0 0 6px ${accent.replace(")", " / 0.3)")}`,
              }}
            >
              <ArtIcon src={room.icon} alt="" size={14} />
            </span>
            <span
              className="hidden sm:inline font-script text-[15px] leading-none"
              style={{
                color: accent,
                textShadow: `0 0 6px ${accent.replace(")", " / 0.45)")}, 0 1px 0 rgba(0,0,0,0.7)`,
              }}
            >
              {room.label}
            </span>
            <span
              aria-hidden
              className="hidden h-1.5 w-1.5 rounded-full sm:inline-block"
              style={{
                background: accent,
                boxShadow: `0 0 6px ${accent}, 0 0 12px ${accent.replace(")", " / 0.6)")}`,
                animation: pulse ? "neon-flicker 1.6s infinite" : undefined,
              }}
              title={STATUS_LABEL[room.status]}
            />
          </>
        )}
      </div>
    </div>
  );
}

function StatPlate({
  label,
  tone,
  value,
  valueAnimation,
  popoverTitle,
  popoverBody,
  footer,
  icon,
}: {
  label: string;
  tone: "brass" | "blood";
  value: string;
  valueAnimation?: string;
  popoverTitle?: string;
  popoverBody?: ReactNode;
  footer?: ReactNode;
  icon?: string;
}) {
  const valueColor = tone === "blood" ? "oklch(0.82 0.22 24)" : "var(--brass-bright)";
  const glow = tone === "blood" ? "text-glow-blood" : "text-glow-brass";

  const interactive = !!popoverBody;
  const [open, setOpen] = useState(false);
  const Tag = (interactive ? "button" : "div") as "button" | "div";

  return (
    <div className="relative">
      <Tag
        type={interactive ? "button" : undefined}
        onClick={interactive ? () => setOpen((v) => !v) : undefined}
        className={`hud-plate ${tone === "blood" ? "hud-plate-blood" : ""} relative flex shrink-0 min-w-[52px] flex-col items-center justify-center px-1 min-[400px]:min-w-[62px] min-[400px]:px-1.5 sm:min-w-16 sm:px-4 ${
          interactive
            ? "cursor-pointer transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)]"
            : ""
        }`}
        style={{
          height: "calc(var(--hud-h) - 10px)",
          minHeight: 42,
          paddingTop: 3,
          paddingBottom: 3,
        }}
        title={popoverTitle}
      >
        <div className="hud-label flex items-center gap-1 whitespace-nowrap">
          {icon ? (
            <img
              src={icon}
              alt=""
              aria-hidden
              className="h-[14px] w-[14px] object-contain sm:h-[16px] sm:w-[16px]"
              style={{
                filter: `drop-shadow(0 0 3px ${
                  tone === "blood" ? "oklch(0.7 0.22 24 / 0.55)" : "oklch(0.78 0.13 80 / 0.55)"
                }) drop-shadow(0 1px 1px oklch(0 0 0 / 0.7))`,
              }}
            />
          ) : null}
          {label}
        </div>
        <div
          className={`font-numerals leading-none ${glow}`}
          style={{
            color: valueColor,
            fontSize: "clamp(14px, 2.2vw, 22px)",
            lineHeight: 1,
            marginTop: 3,
            animation: valueAnimation,
            display: "inline-block",
          }}
        >
          {value}
        </div>
        {footer}
      </Tag>

      {interactive && open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] rounded-sm border border-[var(--brass)]/45 bg-[var(--noir)]/96 p-3 shadow-deep backdrop-blur"
            style={{
              boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.06), 0 12px 28px oklch(0 0 0 / 0.7)",
            }}
            role="dialog"
          >
            <div className="font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)]">
              {popoverTitle}
            </div>
            <div className="mt-1.5">{popoverBody}</div>
          </div>
        </>
      )}
    </div>
  );
}

const WEAR_OPTIONS: { value: WearMode; label: string; hint: string }[] = [
  { value: "progress", label: "Por nivel", hint: "Se arruina con tu carrera" },
  { value: "auto-session", label: "Sesión", hint: "Cada noche es distinta" },
  { value: "light", label: "Lustrado", hint: "Recién abierto · 1928" },
  { value: "medium", label: "Curtido", hint: "Mugre y humo" },
  { value: "heavy", label: "Destrozado", hint: "Paredes a los tiros" },
];

function OverflowMenu({
  muted,
  onToggleAudio,
  currentPath,
}: {
  muted: boolean;
  onToggleAudio: () => void;
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [wearOpen, setWearOpen] = useState(false);
  const wearMode = useWear((s) => s.mode);
  const setWear = useWear((s) => s.setMode);
  const reroll = useWear((s) => s.rerollSession);
  const missions = useCasino((s) => s.missions);
  const claimableMissions = missions.filter((m) => !m.claimed && m.progress >= m.goal).length;
  const locked = useGameLock((s) => s.locked);
  const isLobby = currentPath === "/";
  const isSingle = useGameMode((s) => s.mode) === "single";
  const activeWear = WEAR_OPTIONS.find((o) => o.value === wearMode);

  useEffect(() => {
    if (locked && open) setOpen(false);
  }, [locked, open]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={locked ? "Atajos bloqueados durante la partida" : "Más opciones"}
        title={locked ? "Termina la partida para usar atajos" : "Más opciones"}
        disabled={locked}
        onClick={() => !locked && setOpen((v) => !v)}
        className="relative flex items-center justify-center text-[var(--brass)] transition hover:text-[var(--brass-bright)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[var(--brass)]"
        style={{
          height: "max(44px, calc(var(--hud-h) - 12px))",
          width: 44,
          background:
            "linear-gradient(180deg, oklch(0.10 0.020 30 / 0.94) 0%, oklch(0.05 0.008 30 / 0.96) 100%)",
          border: "1px solid oklch(0.55 0.10 70 / 0.55)",
          borderRadius: 2,
          boxShadow:
            "inset 0 1px 0 oklch(1 0 0 / 0.07), inset 0 -1px 3px oklch(0 0 0 / 0.6), 0 3px 8px oklch(0 0 0 / 0.45)",
          clipPath:
            "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
        }}
      >
        <span className="font-numerals text-[20px] leading-none tracking-[0.15em]">···</span>
        {claimableMissions > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[oklch(0.7_0.22_24)] px-1 font-display text-[11px] font-bold text-white">
            <span className="absolute inset-0 animate-ping rounded-full bg-[oklch(0.7_0.22_24)] opacity-60" />
            <span className="relative">{claimableMissions}</span>
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(304px,calc(100vw-0.75rem))] origin-top-right animate-scale-in overflow-hidden rounded-sm border border-[var(--brass)]/60 bg-gradient-to-b from-[var(--noir)] via-[var(--noir)]/97 to-[var(--mahogany)]/40 shadow-deep backdrop-blur transition-all duration-200"
            style={{
              boxShadow:
                "inset 0 1px 0 oklch(1 0 0 / 0.08), inset 0 -1px 0 oklch(0 0 0 / 0.5), 0 18px 40px oklch(0 0 0 / 0.75)",
            }}
            role="menu"
          >
            {}
            <div className="relative border-b border-[var(--brass)]/35 bg-gradient-to-r from-[var(--blood)]/25 via-transparent to-[var(--blood)]/25 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)]">
                  El Cuervo
                </span>
                <DecoStar className="h-3 w-3 text-[var(--brass)]/90" />
              </div>
              <span className="block font-serif text-[13px] font-medium italic leading-tight text-[var(--ivory)]/90">
                Atajos del garito
              </span>
            </div>

            <div className="p-2">
              {}
              {!isSingle && (
                <button
                  type="button"
                  title="Contratos diarios del Cuervo · resetean a medianoche"
                  aria-label="Abrir misiones diarias"
                  data-missions-toggle
                  onClick={() => {
                    setOpen(false);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("toggle-missions-panel"));
                    }
                  }}
                  role="menuitem"
                  className="group flex w-full items-center gap-3 rounded-sm border border-transparent px-2.5 py-2 pr-3 text-left transition-all duration-200 hover:border-[var(--brass)]/40 hover:bg-[var(--mahogany)]/45 active:scale-[0.98] active:bg-[var(--mahogany)]/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brass)]/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="grid size-7 place-items-center rounded-sm border border-[var(--brass)]/40 bg-[var(--blood)]/25 text-[var(--brass-bright)] transition group-hover:bg-[var(--blood)]/40">
                    <ClipboardList size={14} strokeWidth={1.75} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      title="Misiones diarias"
                      className="truncate font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)]"
                    >
                      Misiones diarias
                    </span>
                    <span
                      title="contratos del Cuervo · resetea a medianoche"
                      className="line-clamp-2 text-[11px] italic leading-tight text-[var(--smoke)]"
                    >
                      contratos del Cuervo · resetea a medianoche
                    </span>
                  </div>
                  {claimableMissions > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[oklch(0.7_0.22_24)] px-1 font-display text-[11px] font-bold text-white shadow-[0_0_8px_oklch(0.7_0.22_24/0.6)]">
                      {claimableMissions}
                    </span>
                  )}
                </button>
              )}

              {}
              {!isLobby && !isSingle && (
                <button
                  type="button"
                  title="Mapa del casino · saltá entre salas (tecla «?»)"
                  aria-label="Abrir mapa del casino"
                  onClick={() => {
                    setOpen(false);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("open-casino-map"));
                    }
                  }}
                  role="menuitem"
                  className="group flex w-full items-center gap-3 rounded-sm border border-transparent px-2.5 py-2 pr-3 text-left transition-all duration-200 hover:border-[var(--brass)]/40 hover:bg-[var(--mahogany)]/45 active:scale-[0.98] active:bg-[var(--mahogany)]/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brass)]/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="grid size-7 place-items-center rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/70 text-[var(--brass)]">
                    <MapIcon size={14} strokeWidth={1.75} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      title="Mapa del casino"
                      className="truncate font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)]"
                    >
                      Mapa del casino
                    </span>
                    <span
                      title="saltar entre salas · «?»"
                      className="line-clamp-2 text-[11px] italic leading-tight text-[var(--smoke)]"
                    >
                      saltar entre salas · «?»
                    </span>
                  </div>
                </button>
              )}

              {}
              <button
                type="button"
                title={muted ? "Reactivar audio del garito" : "Silenciar audio del garito"}
                aria-label={muted ? "Dar sonido al garito" : "Silenciar el garito"}
                aria-pressed={!muted}
                onClick={() => {
                  onToggleAudio();
                }}
                role="menuitem"
                className="group flex w-full items-center gap-3 rounded-sm border border-transparent px-2.5 py-2 pr-3 text-left transition-all duration-200 hover:border-[var(--brass)]/40 hover:bg-[var(--mahogany)]/45 active:scale-[0.98] active:bg-[var(--mahogany)]/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brass)]/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="grid size-7 place-items-center rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/70">
                  <ArtIcon src={muted ? iconVolumeOff : iconVolumeOn} alt="" size={14} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)]">
                    {muted ? "Dar sonido" : "Silenciar"}
                  </span>
                  <span className="line-clamp-2 text-[11px] italic leading-tight text-[var(--smoke)]">
                    efectos y voces del garito
                  </span>
                </div>
              </button>

              {/* Salida del garito: sólo el botón flotante universal. */}
            </div>

            {}
            <div className="border-t border-[var(--brass)]/25 bg-[var(--noir)]/60">
              <button
                type="button"
                onClick={() => setWearOpen((v) => !v)}
                aria-expanded={wearOpen}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass)]/90 transition hover:text-[var(--brass-bright)]"
              >
                <span className="flex-1">Estado del garito</span>
                <span className="normal-case tracking-normal text-[11px] italic text-[var(--smoke)]">
                  {activeWear?.label ?? ""}
                </span>
                <span
                  aria-hidden
                  className="text-[11px] leading-none transition-transform"
                  style={{ transform: wearOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  ▾
                </span>
              </button>
              {wearOpen && (
                <div className="px-2 pb-2">
                  {WEAR_OPTIONS.map((opt) => {
                    const active = opt.value === wearMode;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setWear(opt.value);
                          if (opt.value === "auto-session") reroll();
                        }}
                        className={`flex w-full flex-col gap-0.5 rounded-sm px-2 py-1.5 text-left transition ${
                          active
                            ? "bg-[var(--mahogany)]/70 text-[var(--brass-bright)] ring-1 ring-inset ring-[var(--brass)]/40"
                            : "text-[var(--ivory)]/85 hover:bg-[var(--noir)] hover:text-[var(--brass-bright)]"
                        }`}
                      >
                        <span className="font-display text-[11px] uppercase tracking-[0.2em]">
                          {opt.label}
                        </span>
                        <span className="text-[11px] leading-tight text-[var(--smoke)]">
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NemesisBadge({ pathname }: { pathname: string }) {
  const gameId = useMemo(() => nemesisGameIdForPath(pathname), [pathname]);
  const record = useNemesis((s) => (gameId ? s.byGame[gameId] : undefined));
  const [open, setOpen] = useState(false);
  const prevLevelRef = useRef<number | null>(null);
  const prevReasonRef = useRef<string | null>(null);

  const [pulse, setPulse] = useState(false);
  const [shake, setShake] = useState(false);
  const [climbing, setClimbing] = useState(false);

  useEffect(() => {
    if (!record) return;
    const reason = record.lastDelta?.reason ?? null;
    const levelChanged = prevLevelRef.current !== null && record.level !== prevLevelRef.current;
    if (levelChanged) {
      setPulse(true);
      setClimbing(true);
      const tPulse = setTimeout(() => setPulse(false), 1600);
      const tClimb = setTimeout(() => setClimbing(false), 2400);
      prevLevelRef.current = record.level;
      prevReasonRef.current = reason;
      return () => {
        clearTimeout(tPulse);
        clearTimeout(tClimb);
      };
    }

    if ((reason === "loss" || reason === "abandoned") && reason !== prevReasonRef.current) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 900);
      prevReasonRef.current = reason;
      return () => clearTimeout(t);
    }
    prevLevelRef.current = record.level;
    prevReasonRef.current = reason;
  }, [record?.level, record?.lastDelta?.reason, record]);

  if (!gameId) return null;
  const level = record?.level ?? 1;
  const learning = record?.learning ?? 0;
  const nextLevel = Math.min(20, level + 1);
  const tags = record?.mistakesLifetime ?? {};
  const topTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const learningPct = Math.round(learning * 100);
  const rivalName = record?.name ?? "Rival";
  const describedById = `nemesis-desc-${gameId}`;
  const lastReason = record?.lastDelta?.reason ?? null;
  const ariaLabel =
    `Rival ${rivalName}, nivel ${level}` +
    (learning > 0 ? `, aprendizaje ${learningPct} por ciento` : "") +
    (climbing ? ", subiendo de nivel" : "") +
    ". Toca para ver detalles.";

  return (
    <div className="relative hidden md:block">
      <style>{`
        @keyframes nemesisShake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-3px) rotate(-1deg); }
          30% { transform: translateX(3px) rotate(1deg); }
          45% { transform: translateX(-2px); }
          60% { transform: translateX(2px); }
          80% { transform: translateX(-1px); }
        }
        @keyframes nemesisClimbing {
          0% { opacity: 0; transform: translateY(4px) scale(0.9); }
          20%,80% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-4px) scale(0.95); }
        }
      `}</style>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={describedById}
        aria-live="polite"
        className="relative flex min-w-[52px] flex-col items-center justify-center px-1.5 sm:min-w-[62px] sm:px-3 cursor-pointer transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)]"
        style={{
          height: "calc(var(--hud-h) - 16px)",
          background:
            "linear-gradient(180deg, oklch(0.10 0.020 30 / 0.94) 0%, oklch(0.05 0.008 30 / 0.96) 100%)",
          border: `1px solid oklch(0.7 0.22 24 / ${lastReason === "loss" || lastReason === "abandoned" ? 0.85 : 0.55})`,
          borderRadius: "2px",
          boxShadow: pulse
            ? "0 0 0 2px oklch(0.85 0.22 24 / 0.7), 0 0 18px oklch(0.85 0.22 24 / 0.5)"
            : "inset 0 1px 0 oklch(1 0 0 / 0.07), inset 0 -1px 3px oklch(0 0 0 / 0.6), 0 0 8px oklch(0.7 0.22 24 / 0.16)",
          clipPath:
            "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))",
          transition: "box-shadow 0.6s ease-out, border-color 0.6s ease-out",
          animation: shake
            ? "nemesisShake 0.85s cubic-bezier(0.36,0.07,0.19,0.97) both"
            : undefined,
        }}
      >
        <div
          className="font-display text-[11px] uppercase leading-none text-[var(--smoke)] sm:text-[11px]"
          style={{ letterSpacing: "0.4em", textShadow: "0 1px 0 oklch(0 0 0 / 0.7)" }}
        >
          Rival
        </div>
        <div
          className="font-numerals leading-none text-glow-blood"
          style={{
            color: "oklch(0.82 0.22 24)",
            fontSize: "clamp(12px, 1.8vw, 20px)",
            marginTop: 2,
          }}
        >
          L{level}
          {learning > 0 && (
            <span className="ml-0.5 font-display text-[11px] tracking-[0.2em] text-[oklch(0.78_0.13_80)]">
              +{learningPct}%
            </span>
          )}
        </div>
        {climbing && (
          <span
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-[var(--brass-bright)]/70 bg-[oklch(0.08_0.02_28)]/95 px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)] shadow-[0_2px_8px_oklch(0_0_0/0.6)]"
            style={{ animation: "nemesisClimbing 2.2s ease-out both" }}
          >
            Subiendo…
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            id={describedById}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] rounded-sm border border-[var(--brass)]/45 bg-[var(--noir)]/96 p-3 shadow-deep backdrop-blur"
            style={{
              boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.06), 0 12px 28px oklch(0 0 0 / 0.7)",
            }}
            role="dialog"
            aria-label={`Detalles del rival ${rivalName}`}
          >
            <div className="font-display text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)]">
              {rivalName} · Nivel {level}
            </div>
            <p className="mt-1.5 t-body text-[12px] leading-snug text-[var(--ivory)]/85">
              Cada partida perdida sube el nivel a{" "}
              <span className="font-numerals text-[var(--brass-bright)]">L{nextLevel}</span>. Si{" "}
              <em>vos</em> ganás, el rival <strong>aprende de sus errores</strong> y suma
              modificador de dificultad además del nivel.
            </p>
            <div className="mt-2 rounded-sm border border-[var(--brass)]/25 bg-[oklch(0.06_0.01_28)]/60 p-2 text-[12px] text-[var(--ivory)]/80">
              <div className="flex justify-between">
                <span className="text-[var(--smoke)]">Aprendizaje</span>
                <span className="font-numerals text-[var(--brass-bright)]">+{learningPct}%</span>
              </div>
              <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[oklch(0.06_0.01_28)]/80">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(100, learningPct * 2)}%`,
                    background:
                      "linear-gradient(90deg, oklch(0.60 0.20 24) 0%, oklch(0.78 0.13 78) 100%)",
                  }}
                />
              </div>
              {topTags.length > 0 ? (
                <ul className="mt-2 space-y-0.5 text-[10.5px] text-[var(--ivory)]/70">
                  {topTags.map(([tag, n]) => (
                    <li key={tag} className="flex justify-between gap-2">
                      <span className="truncate">{humanTag(tag)}</span>
                      <span className="font-numerals text-[var(--brass)]">×{Math.round(n)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[10.5px] italic text-[var(--smoke)]">
                  Sin errores registrados todavía.
                </p>
              )}
            </div>
            <p className="mt-2 text-[10.5px] leading-tight text-[var(--smoke)]">
              Rendirse o cerrar mid-partida cuenta como derrota leve — igual sube el nivel.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function humanTag(tag: string): string {
  const map: Record<string, string> = {
    left_siete_oros_on_table: "Dejar el 7 de oros expuesto",
    built_dangerous_table: "Armar una mesa peligrosa",
    cpu_missed_broom_defense: "No cubrir una escoba",
    cpu_lost_siete_oros: "Perder el 7 de oros",
    cpu_leaked_oros: "Ceder oros al rival",
    missed_capture: "Dejar pasar captura",
    gave_broom: "Regalar una escoba",

    cpu_dealer_busted: "Crupier se pasa de 21",
    cpu_stood_too_low: "Plantarse muy bajo",
    cpu_missed_bj_check: "No cantar blackjack a tiempo",
    cpu_lost_to_double: "Perder contra un doble",
    cpu_lost_split_hands: "Perder dos manos split",

    cpu_lost_generala: "Perder la generala",
    cpu_low_final_roll: "Tiro final flojo",
    cpu_wasted_rolls: "Desperdiciar los tres tiros",

    cpu_paid_with_weak_hand: "Pagar con mano débil",
    cpu_overcommitted_pot: "Sobrepujar en el bote",

    board_cleared: "Dejar limpiar el tablero",
    cpu_easy_layout: "Repartir un layout fácil",
    cpu_slow_shuffle: "Barajar demasiado lento",

    cpu_late_close: "Cerrar tarde",
    cpu_paid_high_ante: "Pagar una ante alta",

    cpu_lost_big: "Perder por goleada",
    cpu_lost_close: "Perder por poco",
    cpu_no_envido_won: "No ganar ni un envido",
  };

  if (tag.startsWith("cpu_lost_hand:")) {
    const rank = tag.slice("cpu_lost_hand:".length);
    return `Perder con ${rank}`;
  }
  return map[tag] ?? tag.replace(/_/g, " ");
}
