import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLowFx } from "@/hooks/use-low-fx";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import boneFace from "@/assets/huesos/die-face.webp";

interface Props {
  face: number;
  held?: boolean;
  rolling?: boolean;
  cursed?: boolean;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const PIP_LAYOUT: Record<number, Array<[number, number]>> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  6: [
    [0.28, 0.22],
    [0.72, 0.22],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.78],
    [0.72, 0.78],
  ],
};

const ROLL_Y = [0, -26, -6, -18, -3, 0];
const ROLL_DURATION = 0.62;
/** Cada cuánto cambia la cara visible mientras el hueso rueda. */
const FLICKER_MS = 70;

/** Cara de hueso tallado: textura propia de Cinco Huesos + pips grabados. */
function BoneFace({
  face,
  cursed = false,
  size = 76,
  className = "",
  style,
}: {
  face: number;
  cursed?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pips = PIP_LAYOUT[Math.max(1, Math.min(6, face))] ?? PIP_LAYOUT[1];
  const pipR = size * 0.082;

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-[14%] ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <img
        src={boneFace}
        alt=""
        aria-hidden
        loading="lazy"
        width={256}
        height={256}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{
          filter: cursed
            ? "sepia(0.5) hue-rotate(-30deg) saturate(1.6) brightness(0.86)"
            : "saturate(1.02)",
        }}
      />
      {/* Volumen: luz arriba-izquierda, sombra abajo-derecha */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 28% 20%, oklch(1 0 0 / 0.38) 0%, transparent 52%), linear-gradient(155deg, transparent 45%, oklch(0.25 0.05 40 / 0.45) 100%)",
        }}
      />
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full" aria-hidden>
        {pips.map(([x, y], i) => (
          <g key={i} transform={`translate(${x * size} ${y * size})`}>
            {/* hueco tallado */}
            <circle r={pipR * 1.15} fill="oklch(0.30 0.04 45 / 0.35)" />
            <circle r={pipR} fill={cursed ? "oklch(0.34 0.20 25)" : "oklch(0.26 0.09 32)"} />
            <circle
              r={pipR}
              fill="none"
              stroke="oklch(1 0 0 / 0.45)"
              strokeWidth={size * 0.012}
              strokeDasharray={`${pipR * 2.6} ${pipR * 6}`}
              transform="rotate(-140)"
            />
          </g>
        ))}
      </svg>
    </span>
  );
}

export function BoneDie({
  face,
  held = false,
  rolling = false,
  cursed = false,
  size = 76,
  onClick,
  disabled = false,
}: Props) {
  const reduced = useReducedMotion();
  const lowFx = useLowFx();
  const spinning = rolling && !reduced;

  const [landKey, setLandKey] = useState(0);
  // Cara que se ve mientras rueda: cambia rápido para que se lea como un
  // dado girando de verdad en vez de la cara final dando vueltas.
  const [flickerFace, setFlickerFace] = useState(face);

  useEffect(() => {
    if (!spinning) return;
    const id = window.setInterval(() => {
      setFlickerFace(1 + Math.floor(Math.random() * 6));
    }, FLICKER_MS);
    return () => window.clearInterval(id);
  }, [spinning]);

  const shownFace = spinning ? flickerFace : face;

  const onRollComplete = useCallback(() => {
    if (!rolling && !reduced) setLandKey((k) => k + 1);
  }, [rolling, reduced]);

  useEffect(() => {
    if (rolling) setLandKey(0);
  }, [rolling]);

  const dust = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
        distance: size * (0.35 + Math.random() * 0.45),
        size: 2 + Math.random() * 3,
        delay: Math.random() * 0.05,
      })),
    [size, landKey],
  );

  // Nada de rotateX/rotateY: la cara es plana, y voltearla en 3D dejaba pips
  // espejados y momentos "de canto" que se leían como un glitch. Un tumbo
  // plano (salto + giro en Z) con cambio de cara resulta mucho más claro.
  const rollVariants = {
    y: ROLL_Y,
    rotateZ: [0, -70, -160, -250, -330, -360],
    scale: [1, 1.1, 0.95, 1.06, 0.98, 1],
  };
  const restPose = { y: held ? -10 : 0, rotateZ: 0, scale: 1 };

  return (
    <span
      className="relative inline-flex shrink-0 items-end justify-center"
      style={{ width: size, height: size }}
    >
      {/* Sombra de contacto */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 rounded-[50%]"
        style={{
          bottom: -size * 0.09,
          width: size * 0.92,
          height: size * 0.2,
          marginLeft: -size * 0.46,
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(0.04 0.01 25 / 0.78) 0%, oklch(0.04 0.01 25 / 0.35) 55%, transparent 78%)",
          filter: "blur(1.5px)",
        }}
        animate={
          spinning
            ? {
                scaleX: [1, 0.55, 0.82, 0.5, 0.9, 1],
                opacity: [0.9, 0.22, 0.52, 0.18, 0.72, 0.9],
              }
            : { scaleX: held ? 0.82 : 1, opacity: held ? 0.55 : 0.9 }
        }
        transition={{ duration: spinning ? ROLL_DURATION : reduced ? 0 : 0.28, ease: "easeOut" }}
      />

      {/* Estelas */}
      {!lowFx &&
        spinning &&
        [0.06, 0.12].map((lag, idx) => (
          <motion.span
            key={`ghost-${idx}`}
            aria-hidden
            className="pointer-events-none absolute"
            initial={restPose}
            animate={rollVariants}
            transition={{
              duration: ROLL_DURATION,
              ease: [0.3, 0.02, 0.3, 1],
              times: [0, 0.18, 0.38, 0.6, 0.85, 1],
              delay: lag,
            }}
            style={{ opacity: 0.14 - idx * 0.06, filter: "blur(1px)" }}
          >
            <BoneFace face={shownFace} cursed={cursed} size={size} />
          </motion.span>
        ))}

      <motion.button
        type="button"
        data-card-target
        onClick={onClick}
        disabled={disabled}
        animate={spinning ? rollVariants : restPose}
        transition={{
          duration: spinning ? ROLL_DURATION : reduced ? 0 : 0.28,
          ease: spinning ? [0.3, 0.02, 0.3, 1] : "easeOut",
          times: spinning ? [0, 0.18, 0.38, 0.6, 0.85, 1] : undefined,
        }}
        onAnimationComplete={onRollComplete}
        className="relative shrink-0 rounded-[14%] disabled:cursor-default"
        style={{
          width: size,
          height: size,
          boxShadow: held
            ? "0 0 22px oklch(0.85 0.18 75 / 0.65), 0 3px 6px rgba(0,0,0,0.5)"
            : cursed
              ? "0 0 18px oklch(0.55 0.24 25 / 0.65), 0 3px 6px rgba(0,0,0,0.5)"
              : "0 3px 6px rgba(0,0,0,0.5)",
          outline: held
            ? "2px solid var(--brass-bright)"
            : cursed
              ? "2px solid oklch(0.55 0.24 25)"
              : "1px solid oklch(0.42 0.05 50 / 0.7)",
          outlineOffset: 2,
        }}
        aria-label={`hueso ${face}${held ? " guardado" : ""}`}
      >
        <BoneFace face={shownFace} cursed={cursed} size={size} className="h-full w-full" />

        {held && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[2px] bg-[var(--brass-bright)] px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.2em] text-[var(--noir)]">
            guardo
          </span>
        )}
        {cursed && (
          <span className="absolute -bottom-2 left-1 rounded-[2px] bg-[oklch(0.55_0.24_25)] px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]">
            hex
          </span>
        )}
      </motion.button>

      {/* Feedback de asentado: anillo de impacto + polvo */}
      {!reduced && landKey > 0 && (
        <motion.span
          key={`ring-${landKey}`}
          aria-hidden
          className="pointer-events-none absolute left-1/2 rounded-[50%] border"
          style={{
            bottom: -size * 0.12,
            width: size,
            height: size * 0.3,
            marginLeft: -size * 0.5,
            borderColor: cursed ? "oklch(0.55 0.24 25 / 0.6)" : "oklch(0.82 0.14 65 / 0.55)",
          }}
          initial={{ opacity: 0.8, scale: 0.4 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}
      {!lowFx && !reduced && landKey > 0 && (
        <span
          key={landKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          {dust.map((p) => {
            const x = Math.cos(p.angle) * p.distance;
            const y = Math.sin(p.angle) * p.distance * 0.45;
            return (
              <motion.span
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: cursed ? "oklch(0.55 0.24 25 / 0.85)" : "oklch(0.86 0.09 80 / 0.9)",
                }}
                initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                animate={{ x, y, opacity: 0, scale: 0.2 }}
                transition={{ duration: 0.35, delay: p.delay, ease: "easeOut" }}
              />
            );
          })}
        </span>
      )}
    </span>
  );
}
