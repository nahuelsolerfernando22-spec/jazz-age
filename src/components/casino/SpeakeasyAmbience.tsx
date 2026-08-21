import { memo, useEffect, useMemo, useState } from "react";
import smokeSheet from "@/assets/ambience/smoke-sprites.webp";
import decoSheet from "@/assets/ambience/deco-sprites.webp";
import grainTex from "@/assets/ambience/grain-1928.webp";

/**
 * Capa de atmósfera "jazz sucio, 1928": grano de celuloide, humo de cigarrillo
 * y sprites art déco a la deriva. Todo decorativo, sin capturar toques.
 */

// Hoja de humo: 2x2 (1024x1024)
const SMOKE_CELLS = [
  { x: "0%", y: "0%" },
  { x: "100%", y: "0%" },
  { x: "0%", y: "100%" },
  { x: "100%", y: "100%" },
] as const;

// Hoja déco: 3x2 (saxo, gramófono, copa / polilla, cuervo, dados)
export const DECO_SPRITES = {
  saxo: { x: "0%", y: "0%" },
  gramofono: { x: "50%", y: "0%" },
  copa: { x: "100%", y: "0%" },
  polilla: { x: "0%", y: "100%" },
  cuervo: { x: "50%", y: "100%" },
  dados: { x: "100%", y: "100%" },
} as const;

export type DecoSpriteName = keyof typeof DECO_SPRITES;

/** Sprite déco recortado de la hoja, usable en cualquier UI. */
export function DecoSprite({
  name,
  size = 48,
  className,
  style,
}: {
  name: DecoSpriteName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cell = DECO_SPRITES[name];
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundImage: `url(${decoSheet})`,
        backgroundSize: "300% 200%",
        backgroundPosition: `${cell.x} ${cell.y}`,
        backgroundRepeat: "no-repeat",
        ...style,
      }}
    />
  );
}

type Puff = {
  id: number;
  cell: (typeof SMOKE_CELLS)[number];
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  drift: number;
};

function buildPuffs(): Puff[] {
  return [0, 1, 2, 3].map((i) => ({
    id: i,
    cell: SMOKE_CELLS[i]!,
    left: 8 + i * 24 + (i % 2 === 0 ? 4 : -3),
    size: 150 + (i % 3) * 60,
    delay: i * 7.5,
    duration: 34 + i * 6,
    opacity: 0.05 + (i % 2) * 0.02,
    drift: i % 2 === 0 ? 40 : -34,
  }));
}

function SpeakeasyAmbienceImpl() {
  const [enabled, setEnabled] = useState(false);
  const [motion, setMotion] = useState(true);
  const puffs = useMemo(buildPuffs, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const lowPerf = root.getAttribute("data-perf") === "low";
    const reduced =
      root.getAttribute("data-reduce-motion") === "1" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setMotion(!lowPerf && !reduced);
    setEnabled(true);
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[85] overflow-hidden print:hidden"
      style={{ contain: "strict" }}
    >
      {/* Luz de lámpara ámbar + penumbra de sótano */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 8%, oklch(0.78 0.13 70 / 0.10) 0%, transparent 46%), radial-gradient(100% 100% at 50% 100%, oklch(0.06 0.03 30 / 0.42) 0%, transparent 62%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Humo de cigarrillo */}
      {motion &&
        puffs.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-[-18%]"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.35,
              opacity: p.opacity,
            }}
          >
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url(${smokeSheet})`,
                backgroundSize: "200% 200%",
                backgroundPosition: `${p.cell.x} ${p.cell.y}`,
                backgroundRepeat: "no-repeat",
                filter: "saturate(0.35) blur(5px)",
                animation: `cuervo-smoke-rise ${p.duration}s linear ${p.delay}s infinite`,
                ["--smoke-drift" as string]: `${p.drift}px`,
                willChange: "transform, opacity",
              }}
            />
          </div>
        ))}

      {/* Trama de dibujo clandestino: rayado a pluma sobre el celuloide */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(38deg, oklch(0.02 0 0 / 0.16) 0px, oklch(0.02 0 0 / 0.16) 1px, transparent 1px, transparent 5px)",
          opacity: 0.35,
          mixBlendMode: "multiply",
        }}
      />

      {/* Grano de celuloide 1928 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${grainTex})`,
          backgroundSize: "420px 420px",
          opacity: 0.22,
          mixBlendMode: "overlay",
        }}
      />

      {/* Viñeta sucia */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 85% at 50% 45%, transparent 52%, oklch(0.08 0.04 35 / 0.45) 88%, oklch(0.04 0.02 30 / 0.68) 100%)",
        }}
      />
    </div>
  );
}

export const SpeakeasyAmbience = memo(SpeakeasyAmbienceImpl);
