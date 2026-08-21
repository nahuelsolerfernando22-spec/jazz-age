import { useMemo, useState, useEffect, useRef } from "react";
import { hostessForGame } from "@/lib/single-hostess";
import { useSingleAffinity } from "@/store/single-affinity";
import { getHostessAiProfile } from "@/lib/hostess-ai";
import { portraitStateFor, portraitStateForMood } from "@/lib/npc-portrait-states";
import { getMood } from "@/lib/hostess-mood";
import { useHostessReaction } from "@/lib/hostess-reaction";
import { HostessMoodImage } from "@/components/casino/HostessMoodImage";
import { pickEmotionLine } from "@/lib/hostess-emotion-lines";
import { interpolate } from "@/lib/dialogue";
import { avatarFocus } from "@/lib/npc-avatar-focus";

interface Props {
  gameId: string;
  overrideLine?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  compact?: boolean;
}

const ROTATE_MS = 8000;

export function SingleHostessCorner({
  gameId,
  overrideLine,
  position: _position = "top-left",
  compact: _compact = false,
}: Props) {
  const hostess = useMemo(() => hostessForGame(gameId), [gameId]);
  const record = useSingleAffinity((s) => s.byNpc[hostess?.npcId ?? ""]);
  const reaction = useHostessReaction(gameId);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [overrideActive, setOverrideActive] = useState(false);
  const [hidden, setHidden] = useState(false);
  const rotateRef = useRef<number | null>(null);

  // Auto-ocultar al desplazar hacia abajo: en portrait la franja tapa el
  // tablero (0 de la ruleta, cabecera de póker). Reaparece al subir o al tope.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scroller: HTMLElement | Window =
      document.scrollingElement === document.body ? window : window;
    let last = window.scrollY || document.body.scrollTop || 0;
    let raf = 0;
    const read = () =>
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = read();
        const dy = y - last;
        if (Math.abs(dy) < 8) return;
        last = y;
        setHidden(y > 120 && dy > 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.body.addEventListener("scroll", onScroll, { passive: true });
    void scroller;
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      document.body.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Marca <body> para que el CSS reserve --hostess-h bajo el HUD en móvil.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.setAttribute("data-hostess-strip", "1");
    return () => {
      document.body.removeAttribute("data-hostess-strip");
    };
  }, []);

  useEffect(() => {
    if (!overrideLine) return;
    setOverrideActive(true);
    setBubbleOpen(true);
    const t = window.setTimeout(() => {
      setOverrideActive(false);
      setBubbleOpen(false);
    }, 3600);
    return () => window.clearTimeout(t);
  }, [overrideLine]);

  // Auto-abrir burbuja emergente al recibir reacción emocional, autocierre 3.6s.
  useEffect(() => {
    if (!reaction) return;
    setBubbleOpen(true);
    const t = window.setTimeout(() => setBubbleOpen(false), 3600);
    return () => window.clearTimeout(t);
  }, [reaction]);

  useEffect(() => {
    if (!hostess) return;
    setIdx(Math.floor(Math.random() * hostess.chatter.length));
  }, [hostess]);

  useEffect(() => {
    if (!hostess || overrideActive) return;
    const total = hostess.chatter.length;
    if (total <= 1) return;
    const tick = () => setIdx((i) => (i + 1 + Math.floor(Math.random() * (total - 1))) % total);
    rotateRef.current = window.setInterval(tick, ROTATE_MS);
    return () => {
      if (rotateRef.current) window.clearInterval(rotateRef.current);
      rotateRef.current = null;
    };
  }, [hostess, overrideActive]);

  if (!hostess) return null;
  const affinity = record?.affinity ?? 0;
  const line = overrideLine ?? hostess.chatter[idx] ?? hostess.greet;
  void getHostessAiProfile;
  const moodState = portraitStateForMood(getMood(hostess.npcId));
  const activeState = reaction ?? moodState;
  const portraitSrc = portraitStateFor(hostess.npcId, activeState) || hostess.portrait;

  const emotionLine = pickEmotionLine(hostess.npcId, activeState, idx);
  const shouldUseEmotion =
    !overrideActive && !!emotionLine && (reaction !== null || activeState !== "idle");
  const displayLine = shouldUseEmotion ? interpolate(emotionLine!) : line;

  const portraitFocus = avatarFocus(hostess.npcId);
  const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oro-claro)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cd-noir-3)]";

  return (
    <div
      className={`fixed z-30 flex flex-col gap-2 items-stretch select-none left-1/2 w-[calc(100vw-1rem)] transition-[transform,opacity] duration-200 ${
        hidden ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
      }`}
      style={{
        fontFamily: "'Barlow', system-ui, sans-serif",
        top: "calc(var(--hud-h) + env(safe-area-inset-top, 0px) + 4px)",
        transform: hidden
          ? "translateX(-50%) translateY(calc(-100% - var(--hud-h) - 24px))"
          : "translateX(-50%)",
        /* Reservamos 8px de padding lateral para que el ring-offset del
           focus visible no se recorte contra el borde del letterbox. */
        maxWidth: "min(var(--cd-canvas-max, 560px), calc(100vw - 1rem))",
        /* Reservamos el ancho del botón "Atrás" de las mesas para que el
           retrato de la anfitriona no quede debajo del botón. */
        paddingLeft: "calc(max(8px, env(safe-area-inset-left, 0px)) + var(--cd-back-inset, 0px))",
        paddingRight: "max(8px, env(safe-area-inset-right, 0px))",
        contain: "layout style",
        willChange: "transform",
      }}

      role="complementary"
      aria-label={`Anfitriona ${hostess.name}`}
    >
      {/* Franja unificada: mismo layout en móvil, tablet y desktop. */}
      <div
        className={`flex items-center gap-2 rounded-full border-2 border-[var(--oro-viejo)]/60 bg-[#1a1612]/95 pl-1 pr-3 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-md ${
          bubbleOpen
            ? "min-h-[clamp(48px,7vh,64px)] rounded-[1.6rem] py-2"
            : "h-[clamp(48px,7vh,64px)]"
        }`}
      >
        <button
          type="button"
          onClick={() => setBubbleOpen((v) => !v)}
          aria-label={`Ver reacción de ${hostess.name}`}
          aria-expanded={bubbleOpen}
          className={`relative -mb-3 -ml-0.5 h-[clamp(52px,7.5vh,72px)] aspect-square shrink-0 self-end overflow-hidden rounded-full border-2 border-[var(--oro)]/80 bg-[var(--verde-noche)] shadow-[0_8px_18px_rgba(0,0,0,0.55)] ${focusRing}`}
        >
          <div
            className="absolute inset-0 [&_img]:object-cover"
            style={
              {
                "--pf": `${portraitFocus.x}% ${portraitFocus.y}%`,
                "--pz": String(portraitFocus.zoom),
              } as React.CSSProperties
            }
          >
            <HostessMoodImage
              src={portraitSrc}
              alt=""
              eager
              className="h-full w-full [&_img]:object-cover [&_img]:[object-position:var(--pf)] [&_img]:[transform:scale(var(--pz))] [&_img]:[transform-origin:var(--pf)]"
            />
          </div>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 36 36"
            aria-hidden
          >
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="var(--cd-gold-mid)"
              strokeWidth="2"
              strokeDasharray={`${(affinity / 100) * 100.53} 100.53`}
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div
          className="flex min-w-0 flex-1 flex-col justify-center leading-tight"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-baseline gap-2">
            <span
              className="truncate text-[clamp(11px,1.5vh,13px)] uppercase tracking-[0.2em] text-[var(--crema-brillo)] font-black"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {hostess.name}
            </span>
            <span
              className="shrink-0 text-[clamp(9px,1.2vh,11px)] uppercase tracking-[0.2em] text-[var(--oro-viejo)] font-bold"
              aria-label={`Afinidad ${Math.round(affinity)} de 100`}
            >
              ♥ {Math.round(affinity)}
            </span>
          </div>
          <p
            className={`text-[clamp(11px,1.45vh,13px)] leading-tight text-white font-medium ${
              bubbleOpen ? "line-clamp-4 whitespace-normal" : "truncate"
            }`}
          >
            {displayLine}
          </p>
        </div>
      </div>
    </div>
  );
}
