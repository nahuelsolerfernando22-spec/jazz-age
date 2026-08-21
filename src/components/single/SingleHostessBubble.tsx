import { useEffect, useMemo, useRef, useState } from "react";
import { hostessForGame } from "@/lib/single-hostess";
import { useSingleAffinity } from "@/store/single-affinity";
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
}

const ROTATE_MS = 9000;

/**
 * Burbuja compacta de la anfitriona: sólo un retrato circular flotante que no
 * reserva alto en el layout del juego. Al tocarla muestra su frase; los
 * retratos en grande viven en /camerinos.
 */
export function SingleHostessBubble({ gameId, overrideLine }: Props) {
  const hostess = useMemo(() => hostessForGame(gameId), [gameId]);
  const record = useSingleAffinity((s) => s.byNpc[hostess?.npcId ?? ""]);
  const reaction = useHostessReaction(gameId);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [overrideActive, setOverrideActive] = useState(false);
  const rotateRef = useRef<number | null>(null);

  useEffect(() => {
    if (!overrideLine) return;
    setOverrideActive(true);
    setOpen(true);
    const t = window.setTimeout(() => {
      setOverrideActive(false);
      setOpen(false);
    }, 3600);
    return () => window.clearTimeout(t);
  }, [overrideLine]);

  useEffect(() => {
    if (!reaction) return;
    setOpen(true);
    const t = window.setTimeout(() => setOpen(false), 3200);
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
    rotateRef.current = window.setInterval(
      () => setIdx((i) => (i + 1 + Math.floor(Math.random() * (total - 1))) % total),
      ROTATE_MS,
    );
    return () => {
      if (rotateRef.current) window.clearInterval(rotateRef.current);
      rotateRef.current = null;
    };
  }, [hostess, overrideActive]);

  if (!hostess) return null;

  const affinity = record?.affinity ?? 0;
  const moodState = portraitStateForMood(getMood(hostess.npcId));
  const activeState = reaction ?? moodState;
  const portraitSrc = portraitStateFor(hostess.npcId, activeState) || hostess.portrait;
  const emotionLine = pickEmotionLine(hostess.npcId, activeState, idx);
  const shouldUseEmotion =
    !overrideActive && !!emotionLine && (reaction !== null || activeState !== "idle");
  const line =
    overrideLine ??
    (shouldUseEmotion ? interpolate(emotionLine!) : (hostess.chatter[idx] ?? hostess.greet));
  const focus = avatarFocus(hostess.npcId);

  return (
    <div
      className="pointer-events-none fixed z-30 flex items-end justify-end gap-2"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        right: "max(8px, env(safe-area-inset-right, 0px))",
        maxWidth: "min(320px, calc(100vw - 96px))",
        fontFamily: "'Barlow', system-ui, sans-serif",
        contain: "layout style",
      }}
      role="complementary"
      aria-label={`Anfitriona ${hostess.name}`}
    >
      {open ? (
        <div
          className="pointer-events-auto max-w-[220px] rounded-2xl rounded-br-sm border border-[var(--oro-viejo)]/60 bg-[#1a1612]/95 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md"
          aria-live="polite"
        >
          <div className="flex items-baseline gap-2">
            <span
              className="truncate text-[11px] font-black uppercase tracking-[0.2em] text-[var(--crema-brillo)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {hostess.name}
            </span>
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--oro-viejo)]">
              ♥ {Math.round(affinity)}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] font-medium leading-snug text-white">{line}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${open ? "Ocultar" : "Ver"} frase de ${hostess.name}`}
        aria-expanded={open}
        className="pointer-events-auto relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[var(--oro)]/80 bg-[var(--verde-noche)] shadow-[0_6px_16px_rgba(0,0,0,0.55)] transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oro-claro)] sm:h-12 sm:w-12"
      >
        <div
          className="absolute inset-0 [&_img]:object-cover"
          style={
            {
              "--pf": `${focus.x}% ${focus.y}%`,
              "--pz": String(focus.zoom),
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
          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
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
    </div>
  );
}
