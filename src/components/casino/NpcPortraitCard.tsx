import { motion, AnimatePresence } from "framer-motion";

import { useEffect, type ReactNode } from "react";
import { HostessHudStrip } from "@/components/casino/HostessHudStrip";
import { HostessTellOverlay } from "@/components/casino/HostessTellOverlay";
import { traitOf } from "@/lib/hostess-rivalry";
import { wornSrcForEquipped } from "@/lib/hostess-variants";
import { tierOf, tierIsVisible, TIER_META } from "@/lib/hostess-ladder";
import { nicknameFor } from "@/lib/hostess-nickname";
import { publishMomentCallback } from "@/lib/hostess-callbacks";
import { useNpcCallback } from "@/lib/npc-callbacks";

import { getDailyEmotionalState, type EmotionalState } from "@/lib/hostess-emotion";
import type { Situation } from "@/lib/dialogue";

const MOOD_OVERLAY: Partial<Record<Situation, { tint: string; shake: number; glow: string }>> = {
  win: {
    tint: "oklch(0.75 0.16 85 / 0.16)",
    shake: 0,
    glow: "0 0 40px oklch(0.78 0.16 85 / 0.35)",
  },
  victory: {
    tint: "oklch(0.75 0.16 85 / 0.18)",
    shake: 0,
    glow: "0 0 40px oklch(0.78 0.16 85 / 0.4)",
  },
  lose: {
    tint: "oklch(0.22 0.05 260 / 0.28)",
    shake: 0,
    glow: "inset 0 -60px 60px -20px oklch(0.05 0.02 260 / 0.65)",
  },
  defeat: {
    tint: "oklch(0.22 0.05 260 / 0.32)",
    shake: 0,
    glow: "inset 0 -60px 60px -20px oklch(0.05 0.02 260 / 0.7)",
  },
  tense: {
    tint: "oklch(0.42 0.14 20 / 0.20)",
    shake: 1.5,
    glow: "0 0 30px oklch(0.5 0.16 20 / 0.35)",
  },
  tilt: { tint: "oklch(0.42 0.14 20 / 0.22)", shake: 2, glow: "0 0 32px oklch(0.5 0.18 20 / 0.4)" },
  angry: {
    tint: "oklch(0.36 0.20 22 / 0.34)",
    shake: 3,
    glow: "0 0 40px oklch(0.55 0.22 22 / 0.55)",
  },
  flirty: {
    tint: "oklch(0.58 0.14 12 / 0.18)",
    shake: 0,
    glow: "0 0 30px oklch(0.7 0.18 12 / 0.35)",
  },
};

const EMOTION_META: Record<EmotionalState, { icon: string; label: string; tint: string }> = {
  neutral: { icon: "◇", label: "serena", tint: "var(--brass)" },
  exalted: { icon: "★", label: "exaltada", tint: "oklch(0.85 0.18 60)" },
  satisfied: { icon: "◆", label: "satisfecha", tint: "oklch(0.78 0.12 90)" },
  playful: { icon: "☙", label: "juguetona", tint: "oklch(0.80 0.15 30)" },
  generous: { icon: "❦", label: "generosa", tint: "oklch(0.82 0.14 80)" },
  focused: { icon: "◈", label: "concentrada", tint: "oklch(0.72 0.06 220)" },
  nostalgic: { icon: "❧", label: "nostálgica", tint: "oklch(0.68 0.08 300)" },
  curious: { icon: "❃", label: "curiosa", tint: "oklch(0.78 0.10 150)" },
  cautious: { icon: "◑", label: "cauta", tint: "oklch(0.65 0.05 240)" },
  irritated: { icon: "✗", label: "irritada", tint: "oklch(0.62 0.18 25)" },
  melancholic: { icon: "☂", label: "melancólica", tint: "oklch(0.58 0.06 260)" },
  tense: { icon: "≡", label: "tensa", tint: "oklch(0.60 0.15 15)" },
  distant: { icon: "◍", label: "distante", tint: "oklch(0.55 0.04 250)" },
  protective: { icon: "⛨", label: "protectora", tint: "oklch(0.68 0.10 140)" },
};

export function NpcPortraitCard({
  src,
  alt,
  name,
  line,
  children,
  className = "",
  compact = false,
  delay = 0.2,
  npcId,
  archetype,
  bgSrc,
  bgFilter,
  mood = null,
}: {
  src?: string;
  alt?: string;
  name: string;
  line?: string;
  children?: ReactNode;
  className?: string;

  compact?: boolean;
  delay?: number;

  npcId?: string;

  archetype?: string;

  bgSrc?: string;

  bgFilter?: string;

  mood?: Situation | null;
}) {
  const moodStyle = mood ? MOOD_OVERLAY[mood] : undefined;
  const wornSrc = npcId ? wornSrcForEquipped(npcId) : undefined;
  const effectiveSrc = wornSrc ?? src;

  useEffect(() => {
    if (!npcId) return;
    publishMomentCallback(npcId);
  }, [npcId]);
  const callback = useNpcCallback(npcId);
  const displayLine = callback?.text ?? line;

  // Los retratos salieron de las mesas: ocupaban media pantalla y obligaban a
  // hacer scroll para jugar. Ahora se ven en /camerinos.
  if (!children) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay }}
      className={`relative h-fit rounded-sm border border-[var(--brass)]/40 bg-[var(--mahogany)]/70 ${compact ? "p-2" : "p-1.5 sm:p-3"} shadow-deep backdrop-blur ${className}`}
    >
      <div
        className="relative overflow-hidden rounded-sm border border-[var(--brass)]/40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, oklch(0.32 0.10 25 / 0.95) 0%, oklch(0.18 0.07 22 / 0.95) 55%, oklch(0.10 0.04 25 / 0.95) 100%)",
        }}
      >
        {}
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.05 25 / 0.6), oklch(0.10 0.03 25 / 0.6))",
          }}
        />
        <motion.div
          className={`relative w-full ${compact ? "aspect-[4/5]" : "aspect-[4/5]"} overflow-hidden`}
          animate={
            moodStyle && moodStyle.shake > 0
              ? { x: [0, -moodStyle.shake, moodStyle.shake, -moodStyle.shake * 0.6, 0] }
              : { x: 0 }
          }
          transition={
            moodStyle && moodStyle.shake > 0
              ? { duration: 0.42, ease: "easeInOut", repeat: 1, repeatDelay: 1.6 }
              : { duration: 0 }
          }
          style={moodStyle ? { boxShadow: moodStyle.glow } : undefined}
        >
          {bgSrc && (
            <img
              src={bgSrc}
              alt=""
              aria-hidden
              width={896}
              height={1200}
              decoding="async"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
              style={{ filter: bgFilter ?? "brightness(0.72) saturate(1.05)" }}
            />
          )}
          {children ? (
            children
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={effectiveSrc ?? "blank"}
                src={effectiveSrc}
                alt={alt ?? name}
                width={896}
                height={1200}
                decoding="async"
                loading="eager"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full select-none object-cover object-top"
                draggable={false}
                style={{
                  filter: "saturate(1.05) contrast(1.02)",
                  boxShadow: "inset 0 -40px 60px -30px rgba(0,0,0,0.7)",
                }}
              />
            </AnimatePresence>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, transparent 55%, oklch(0.10 0.04 25 / 0.55) 100%)",
            }}
          />
          {npcId && <HostessTellOverlay npcId={npcId} />}
          {npcId && <HostessHudStrip npcId={npcId} />}
          {moodStyle && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 mix-blend-multiply"
              style={{ background: moodStyle.tint }}
            />
          )}
          {npcId &&
            (() => {
              const emo = getDailyEmotionalState(npcId);
              const meta = EMOTION_META[emo];
              return (
                <div
                  className="pointer-events-none absolute right-1.5 top-1.5 flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] uppercase tracking-[0.2em] backdrop-blur-sm"
                  style={{
                    color: meta.tint,
                    borderColor: `${meta.tint}66`,
                    background: "oklch(0.10 0.03 25 / 0.65)",
                  }}
                  title={`Hoy está ${meta.label}`}
                >
                  <span aria-hidden>{meta.icon}</span>
                  <span className="hidden sm:inline">{meta.label}</span>
                </div>
              );
            })()}
        </motion.div>
      </div>
      <div
        className={`mt-2 text-center font-display uppercase text-[var(--brass)]/80 ${compact ? "text-[11px] tracking-[0.35em]" : "text-[11px] tracking-[0.25em] sm:text-[11px] sm:tracking-[0.4em]"}`}
      >
        <span className="block truncate">— {name} —</span>
      </div>
      {archetype && (
        <div
          className={`mt-1 text-center italic text-[var(--brass)]/90 ${compact ? "text-[11px]" : "text-[11px] sm:text-[11px]"} line-clamp-2 sm:line-clamp-none`}
        >
          Estilo · {archetype}
        </div>
      )}
      {npcId &&
        (() => {
          const trait = traitOf(npcId);
          if (!trait) return null;
          return (
            <div
              className={`mt-1 flex items-center justify-center gap-1.5 font-display uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[var(--blood)]/85 ${compact ? "text-[11px]" : "text-[11px] sm:text-[11px]"}`}
              title="Rasgo aprendido de partidas anteriores"
            >
              <span
                aria-hidden
                className="inline-block h-1 w-1 rotate-45 border border-[var(--blood,#a8324a)]/70"
              />
              <span>{trait.label}</span>
              <span
                aria-hidden
                className="inline-block h-1 w-1 rotate-45 border border-[var(--blood,#a8324a)]/70"
              />
            </div>
          );
        })()}
      {npcId &&
        (() => {
          const tier = tierOf(npcId);
          if (!tierIsVisible(tier)) return null;
          const meta = TIER_META[tier];
          const nick = nicknameFor(npcId);
          return (
            <div
              className={`mt-1 text-center font-display uppercase tracking-[0.25em] sm:tracking-[0.3em] ${compact ? "text-[11px]" : "text-[11px] sm:text-[11px]"}`}
              style={{ color: meta.color }}
              title={`Rango de rivalidad · ${meta.label}${nick ? ` · te llama "${nick}"` : ""}`}
            >
              <span>
                {meta.glyph} {meta.label}
              </span>
              {nick && (
                <span className="ml-1 normal-case tracking-normal font-script text-[var(--ivory)]/80">
                  · te llama «{nick}»
                </span>
              )}
            </div>
          );
        })()}

      {displayLine !== undefined && (
        <AnimatePresence mode="wait">
          <motion.p
            key={displayLine}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-1.5 text-center font-script leading-snug text-[var(--brass-bright)] ${compact ? "min-h-[2.5rem] text-[13px]" : "text-[11px] leading-tight sm:min-h-[2.5rem] sm:text-sm sm:leading-snug line-clamp-3 sm:line-clamp-none"}`}
          >
            &ldquo;{displayLine}&rdquo;
          </motion.p>
        </AnimatePresence>
      )}
    </motion.aside>
  );
}
