import { motion, AnimatePresence } from "framer-motion";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useHaptics } from "@/hooks/use-haptics";
import { getStableVh } from "@/hooks/use-stable-viewport";

export function ResponsiveBoard({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState<number>(0);

  // OJO: este efecto NO debe re-ejecutarse en cada render. Antes no tenía
  // array de dependencias, así que cada tap del tablero recreaba el
  // ResizeObserver y forzaba un reflow sincrónico (clientWidth + scrollWidth):
  // era uno de los principales tirones en Android.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const available = wrap.clientWidth;
      const vh = getStableVh();
      const top = wrap.getBoundingClientRect().top;
      const availableH = Math.max(300, vh - top - 92);
      const natural = inner.scrollWidth;
      const naturalH = inner.scrollHeight;
      const s = Math.max(
        0.6,
        Math.min(2.6, available / Math.max(1, natural), availableH / Math.max(1, naturalH)),
      );
      // Evitamos renders redundantes (y el bucle de realimentación con el
      // ResizeObserver, que observa un nodo cuyo tamaño depende de `scale`).
      setScale((prev) => (Math.abs(prev - s) < 0.005 ? prev : s));
      const nextH = naturalH * s;
      setH((prev) => (Math.abs(prev - nextH) < 1 ? prev : nextH));
    };
    const compute = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    ro.observe(inner);
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative mt-4 w-full" style={{ height: h || undefined }}>
      <div
        ref={innerRef}
        className="absolute left-1/2"
        style={{
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--brass)]/20 pb-1">
      <span className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        {label}
      </span>
      <span className="font-script text-xl text-[var(--ivory)]">{value}</span>
    </div>
  );
}

export function Lives({ current, max, flash }: { current: number; max: number; flash: number }) {
  const slots = Array.from({ length: max }, (_, i) => i < current);
  return (
    <div className="leading-tight">
      <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
        Vidas
      </div>
      <motion.div
        key={flash}
        initial={{ scale: 1 }}
        animate={flash > 0 ? { scale: [1, 1.25, 1], x: [0, -4, 4, -2, 2, 0] } : { scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mt-1 flex items-center gap-1"
      >
        {slots.map((alive, i) => (
          <Heart key={i} alive={alive} />
        ))}
      </motion.div>
    </div>
  );
}

export function Heart({ alive }: { alive: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      style={{
        filter: alive
          ? "drop-shadow(0 0 6px oklch(0.55 0.22 25 / 0.7))"
          : "grayscale(1) brightness(0.5)",
      }}
    >
      <path
        d="M12 21s-7-4.35-9.5-8.5C.5 9 2.5 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4.5 0 6.5 5 4.5 8.5C19 16.65 12 21 12 21z"
        fill={alive ? "oklch(0.55 0.22 25)" : "oklch(0.3 0.02 30)"}
        stroke="oklch(0.78 0.12 70)"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function Stat({
  label,
  shortLabel,
  value,
  accent,
  glow,
  animateKey,
}: {
  label: string;
  shortLabel?: string;
  value: number | string;
  accent?: boolean;
  glow?: boolean;
  animateKey?: number | string;
}) {
  return (
    <div className="leading-tight">
      <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
        <span className="sm:hidden">{shortLabel ?? label}</span>
        <span className="hidden sm:inline">{label}</span>
      </div>
      <div className="relative h-7 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={String(animateKey ?? value)}
            initial={{ y: 14, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -14, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
            className={`font-script text-2xl ${
              accent
                ? "text-[oklch(0.85_0.18_75)]"
                : glow
                  ? "text-[oklch(0.9_0.16_80)] [text-shadow:0_0_10px_oklch(0.85_0.18_75/0.7)]"
                  : "text-[var(--ivory)]"
            }`}
          >
            {value}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ActionBtn({
  onClick,
  disabled,
  label,
  badge,
  badgeLabel,
  title,
  mobileHidden,
  locked,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  badge?: string;
  /** Texto leído por lectores de pantalla en lugar del badge crudo ("3/5"). */
  badgeLabel?: string;
  title?: string;
  mobileHidden?: boolean;
  /** La habilidad todavía no se ganó: se muestra apagada y con candado. */
  locked?: boolean;
  children: React.ReactNode;
}) {
  const haptic = useHaptics();
  const [pulse, setPulse] = useState(0);
  const lastRef = useRef(0);
  const off = disabled || locked;

  const handle = () => {
    if (off) return;
    // Anti doble-toque: en WebView Android un tap puede disparar dos eventos.
    const now = Date.now();
    if (now - lastRef.current < 320) return;
    lastRef.current = now;
    haptic("select");
    setPulse((n) => n + 1);
    onClick();
  };

  const describe = badge ? `${label}, ${badgeLabel ?? badge}` : label;

  return (
    <button
      type="button"
      onClick={handle}
      disabled={off}
      title={title}
      aria-label={
        locked ? `${describe} (bloqueada)` : off ? `${describe} (no disponible)` : describe
      }
      aria-describedby={undefined}
      aria-disabled={off || undefined}
      data-skill={label}
      data-locked={locked ? "true" : "false"}
      className={`cd-tap-safe cd-skill-btn relative ${mobileHidden ? "hidden sm:flex" : "flex"} min-h-[54px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-sm border px-2.5 py-2 font-display text-[11px] uppercase leading-none tracking-[0.14em] transition-colors [touch-action:manipulation] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brass-bright)] sm:min-h-[58px] sm:min-w-[72px] sm:px-3.5 sm:text-[11px] sm:tracking-[0.2em] ${
        off
          ? "cursor-not-allowed border-[var(--brass)]/40 bg-[var(--noir-soft)]/70 text-[var(--brass)]/90"
          : "border-[var(--brass)]/60 bg-[var(--noir-soft)] text-[var(--brass-bright)] hover:bg-[var(--mahogany)] active:scale-[0.97]"
      } ${locked ? "opacity-60 grayscale" : ""}`}
    >
      <div className="h-[20px] w-[20px] sm:h-5 sm:w-5" aria-hidden>
        {children}
      </div>
      <span className="whitespace-nowrap">{label}</span>
      {badge && (
        <span
          aria-hidden
          className={`pointer-events-none absolute -top-2 right-1 max-w-[46px] overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-[var(--noir)] px-1.5 py-[2px] text-[11px] font-bold leading-none shadow-md ${
            off
              ? "bg-[var(--blood)]/70 text-[var(--ivory)]/85"
              : "bg-[var(--blood)] text-[var(--ivory)]"
          }`}
        >
          {badge}
        </span>
      )}
      {pulse > 0 && !off && (
        <span
          key={pulse}
          aria-hidden
          className="cd-skill-pulse pointer-events-none absolute inset-0 rounded-sm"
        />
      )}
    </button>
  );
}

export function ShuffleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}
export function BulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.8.7 1 1.6 1 2.3v1h6v-1c0-.7.2-1.6 1-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}
export function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <path d="M3 12h14" />
      <path d="m9 6-6 6 6 6" />
      <path d="M21 19V5" />
    </svg>
  );
}
export function UndoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
    </svg>
  );
}
export function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
export function MagnetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <path d="M5 3v8a7 7 0 0 0 14 0V3" />
      <path d="M5 3h4v6H5z" />
      <path d="M15 3h4v6h-4z" />
    </svg>
  );
}
export function PlusSlotIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <rect x="3" y="7" width="11" height="10" rx="1.5" />
      <path d="M19 9v6" />
      <path d="M16 12h6" />
    </svg>
  );
}

export function ScorePop({ delta, tick }: { delta: number; tick: number }) {
  if (!tick || !delta) return null;
  const isSpecial = delta >= 60;
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={tick}
        initial={{ opacity: 0, y: 6, scale: 0.8 }}
        animate={{ opacity: 1, y: -18, scale: 1 }}
        exit={{ opacity: 0, y: -34 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="pointer-events-none absolute -top-1 left-full ml-2 whitespace-nowrap font-display text-[12px] font-bold tracking-wider"
        style={{
          color: isSpecial ? "oklch(0.88 0.18 80)" : "oklch(0.82 0.14 70)",
          textShadow: isSpecial
            ? "0 0 12px oklch(0.85 0.18 75 / 0.9)"
            : "0 0 8px oklch(0.7 0.12 65 / 0.7)",
        }}
      >
        +{delta}
      </motion.span>
    </AnimatePresence>
  );
}

export function ComboBadge({ combo, best }: { combo: number; best: number }) {
  const active = combo >= 2;
  const mult =
    combo >= 8
      ? 4
      : combo >= 7
        ? 3.5
        : combo >= 6
          ? 3
          : combo >= 5
            ? 2.5
            : combo >= 4
              ? 2
              : combo >= 3
                ? 1.5
                : 1.25;

  const emberTier: 0 | 1 | 2 | 3 = combo >= 6 ? 3 : combo >= 5 ? 2 : combo >= 3 ? 1 : 0;
  return (
    <AnimatePresence mode="wait">
      {active ? (
        <motion.div
          key={combo}
          initial={{ scale: 0.7, opacity: 0, y: 4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className="relative flex flex-col items-center rounded-sm border border-[var(--brass)]/60 px-2 py-0.5"
          style={{
            background:
              emberTier >= 2
                ? "linear-gradient(180deg, oklch(0.42 0.19 40 / 0.9), oklch(0.22 0.14 30 / 0.9))"
                : "linear-gradient(180deg, oklch(0.32 0.12 30 / 0.85), oklch(0.18 0.08 25 / 0.85))",
            boxShadow:
              emberTier >= 3
                ? "0 0 28px oklch(0.78 0.24 45 / 0.85), inset 0 0 12px oklch(0.9 0.22 60 / 0.5)"
                : emberTier >= 2
                  ? "0 0 22px oklch(0.82 0.2 55 / 0.65)"
                  : "0 0 14px oklch(0.85 0.18 75 / 0.4)",
          }}
        >
          {emberTier > 0 && <EmberField tier={emberTier as 1 | 2 | 3} />}
          <span className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]">
            Combo
          </span>
          <span
            className="font-display text-base font-bold leading-none"
            style={{
              color: emberTier >= 2 ? "oklch(0.95 0.2 65)" : "oklch(0.92 0.18 75)",
              textShadow:
                emberTier >= 2
                  ? "0 0 10px oklch(0.85 0.24 45 / 0.9), 0 0 4px oklch(1 0.15 80 / 0.7)"
                  : "none",
            }}
          >
            ×{mult} <span className="text-[11px] opacity-70">({combo})</span>
          </span>
        </motion.div>
      ) : best > 0 ? (
        <motion.div
          key="best"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90"
        >
          Mejor combo ×{best}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function EmberField({ tier }: { tier: 1 | 2 | 3 }) {
  const emberCount = tier === 3 ? 10 : tier === 2 ? 7 : 4;
  const embers = useMemo(
    () =>
      Array.from({ length: emberCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 1.1 + Math.random() * 0.9,
        size: 2 + Math.random() * (tier === 3 ? 3 : 2),
        drift: (Math.random() - 0.5) * 16,
      })),
    [emberCount, tier],
  );
  const smokeCount = tier === 3 ? 3 : tier === 2 ? 2 : 0;
  const smokes = useMemo(
    () =>
      Array.from({ length: smokeCount }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        delay: Math.random() * 1.5,
        dur: 2.2 + Math.random() * 1.2,
        size: 18 + Math.random() * 10,
      })),
    [smokeCount],
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-6 bottom-0 overflow-visible">
      {smokes.map((s) => (
        <motion.span
          key={`s-${s.id}`}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            bottom: 0,
            width: s.size,
            height: s.size,
            background:
              "radial-gradient(circle, oklch(0.55 0.02 30 / 0.55) 0%, oklch(0.35 0.02 30 / 0) 70%)",
            filter: "blur(2px)",
          }}
          initial={{ opacity: 0, y: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.55, 0], y: -34, scale: 1.4 }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      {embers.map((e) => (
        <motion.span
          key={`e-${e.id}`}
          className="absolute rounded-full"
          style={{
            left: `${e.x}%`,
            bottom: 0,
            width: e.size,
            height: e.size,
            background:
              tier === 3
                ? "radial-gradient(circle, oklch(0.98 0.22 70) 0%, oklch(0.75 0.24 40) 60%, oklch(0.4 0.18 30 / 0) 100%)"
                : "radial-gradient(circle, oklch(0.95 0.2 75) 0%, oklch(0.7 0.2 55) 65%, oklch(0.4 0.12 40 / 0) 100%)",
            boxShadow: "0 0 6px oklch(0.85 0.22 55 / 0.9)",
          }}
          initial={{ opacity: 0, y: 0, x: 0 }}
          animate={{ opacity: [0, 1, 0], y: -28 - Math.random() * 10, x: e.drift }}
          transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function DoorOpenReveal() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.1, delay: 0.55 }}
    >
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: "-101%" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="absolute inset-y-0 left-0 w-1/2"
        style={{
          background: "linear-gradient(100deg, oklch(0.18 0.04 35), oklch(0.08 0.02 30))",
          boxShadow: "inset -2px 0 0 oklch(0.62 0.12 70)",
        }}
      />
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: "101%" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="absolute inset-y-0 right-0 w-1/2"
        style={{
          background: "linear-gradient(260deg, oklch(0.18 0.04 35), oklch(0.08 0.02 30))",
          boxShadow: "inset 2px 0 0 oklch(0.62 0.12 70)",
        }}
      />
    </motion.div>
  );
}

export function FeverOverlay({ active, intensity }: { active: boolean; intensity: number }) {
  const embers = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.6,
        dur: 1.6 + Math.random() * 1.2,
        size: 3 + Math.random() * 4,
        drift: (Math.random() - 0.5) * 40,
      })),
    [],
  );
  const glow = Math.min(1, (intensity - 4) * 0.15);
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="fever"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, oklch(0.35 0.18 25 / 0.45) 100%)",
              mixBlendMode: "screen",
            }}
            animate={{ opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="absolute inset-x-0 top-0 h-24"
            style={{
              background: "linear-gradient(180deg, oklch(0.8 0.2 55 / 0.18) 0%, transparent 100%)",
              opacity: 0.4 + glow * 0.6,
            }}
          />
          {embers.map((e) => (
            <motion.span
              key={e.id}
              className="absolute rounded-full"
              style={{
                left: `${e.x}%`,
                bottom: -8,
                width: e.size,
                height: e.size,
                background:
                  "radial-gradient(circle, oklch(0.98 0.22 70) 0%, oklch(0.72 0.24 40) 60%, transparent 100%)",
                boxShadow: "0 0 8px oklch(0.85 0.24 55 / 0.9)",
              }}
              initial={{ opacity: 0, y: 0, x: 0 }}
              animate={{ opacity: [0, 1, 0], y: -260 - Math.random() * 120, x: e.drift }}
              transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ProgressBar({ cleared, total }: { cleared: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (cleared / total) * 100)) : 0;
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        <span>Tablero</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-[var(--brass)]/30 bg-[var(--noir)]/80">
        <motion.div
          className="absolute inset-y-0 left-0"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{
            background:
              "linear-gradient(90deg, oklch(0.62 0.14 60), oklch(0.85 0.18 75) 60%, oklch(0.95 0.12 90))",
            boxShadow: "0 0 10px oklch(0.85 0.18 75 / 0.6)",
          }}
        />
      </div>
    </div>
  );
}

export function MatchSparkles({ tick, delta }: { tick: number; delta: number }) {
  if (!tick || !delta) return null;
  const isSpecial = delta >= 60;
  const count = isSpecial ? 22 : 9;
  const sparks = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (tick % 7) * 0.13;
    const dist = (isSpecial ? 90 : 60) + Math.random() * (isSpecial ? 70 : 40);
    return {
      i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 10,
      rot: Math.random() * 360,
      scale: (isSpecial ? 1.0 : 0.6) + Math.random() * (isSpecial ? 1.1 : 0.6),
    };
  });
  return (
    <AnimatePresence>
      <motion.div
        key={tick}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {sparks.map((s) => (
          <motion.span
            key={s.i}
            className={`absolute rounded-full ${isSpecial ? "h-2.5 w-2.5" : "h-1.5 w-1.5"}`}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{ x: s.x, y: s.y, scale: s.scale, opacity: 0, rotate: s.rot }}
            transition={{ duration: isSpecial ? 1.05 : 0.85, ease: "easeOut" }}
            style={{
              background: isSpecial
                ? "radial-gradient(circle, oklch(0.98 0.18 92) 0%, oklch(0.82 0.20 75) 60%, transparent 100%)"
                : "radial-gradient(circle, oklch(0.92 0.14 70) 0%, oklch(0.65 0.12 60) 70%, transparent 100%)",
              boxShadow: isSpecial
                ? "0 0 18px oklch(0.92 0.20 80 / 1), 0 0 6px oklch(1 0 0 / 0.9)"
                : "0 0 6px oklch(0.78 0.14 65 / 0.7)",
            }}
          />
        ))}
        {isSpecial && (
          <>
            <motion.div
              className="absolute h-40 w-40 rounded-full"
              initial={{ scale: 0.2, opacity: 0.85 }}
              animate={{ scale: 3.4, opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(circle, oklch(0.97 0.20 82 / 0.75) 0%, oklch(0.82 0.20 70 / 0.35) 45%, transparent 75%)",
              }}
            />
            <motion.div
              className="absolute h-20 w-20 rounded-full"
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(circle, oklch(1 0 0 / 0.95) 0%, oklch(0.95 0.18 80 / 0.6) 40%, transparent 80%)",
              }}
            />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <motion.span
                  key={`ray-${i}`}
                  className="absolute origin-left"
                  initial={{ scaleX: 0, opacity: 0.9 }}
                  animate={{ scaleX: 1, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{
                    width: 110,
                    height: 3,
                    transform: `rotate(${a}rad)`,
                    background: "linear-gradient(90deg, oklch(0.98 0.18 85 / 0.95), transparent)",
                    filter: "blur(1px)",
                  }}
                />
              );
            })}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
