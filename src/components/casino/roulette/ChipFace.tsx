import type { CSSProperties } from "react";

const CHIP_PALETTE: Record<number, [string, string]> = {
  5: ["oklch(0.55 0.18 25)", "oklch(0.30 0.12 25)"],
  10: ["oklch(0.46 0.05 250)", "oklch(0.22 0.03 250)"],
  25: ["oklch(0.50 0.09 150)", "oklch(0.24 0.06 150)"],
  50: ["oklch(0.20 0.02 30)", "oklch(0.08 0.01 30)"],
  100: ["oklch(0.78 0.13 70)", "oklch(0.45 0.10 60)"],
};

function chipStyle3D(
  c1: string,
  c2: string,
  opts: { active?: boolean; size: number } = { size: 40 },
): CSSProperties {
  const { active, size } = opts;
  return {
    background: [
      `radial-gradient(circle at 32% 26%, oklch(1 0 0 / 0.45) 0%, oklch(1 0 0 / 0) 38%)`,
      `radial-gradient(circle at 35% 30%, ${c1} 0%, ${c2} 78%)`,
    ].join(", "),
    color: "var(--ivory)",
    border: `2px solid ${active ? "oklch(0.92 0.14 80)" : "oklch(0.85 0.10 75 / 0.55)"}`,
    boxShadow: [
      `inset 0 0 0 ${Math.round(size * 0.06)}px oklch(0.95 0.05 80 / 0.18)`,
      `inset 0 0 0 ${Math.round(size * 0.09)}px ${c2}`,
      `inset 0 0 0 ${Math.round(size * 0.1)}px oklch(0.95 0.05 80 / 0.85)`,
      `inset 0 0 0 ${Math.round(size * 0.12)}px ${c1}`,
      `inset 0 -${Math.round(size * 0.12)}px ${Math.round(size * 0.16)}px rgba(0,0,0,0.55)`,
      `inset 0 ${Math.round(size * 0.04)}px ${Math.round(size * 0.08)}px oklch(1 0 0 / 0.18)`,
      active
        ? `0 ${Math.round(size * 0.18)}px ${Math.round(size * 0.32)}px -${Math.round(size * 0.1)}px rgba(0,0,0,0.85), 0 0 ${Math.round(size * 0.5)}px oklch(0.85 0.13 80 / 0.55)`
        : `0 ${Math.round(size * 0.12)}px ${Math.round(size * 0.22)}px -${Math.round(size * 0.08)}px rgba(0,0,0,0.8)`,
    ].join(", "),
    textShadow: "0 1px 2px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.6)",
    transform: active ? "translateY(-3px)" : undefined,
    backgroundClip: "padding-box",
    backgroundBlendMode: "normal",
  };
}

export function ChipFace({
  amount,
  size = 40,
  active = false,
}: {
  amount: number;
  size?: number;
  active?: boolean;
}) {
  const [c1, c2] = CHIP_PALETTE[amount] ?? CHIP_PALETTE[5];
  const dots = Array.from({ length: 8 }, (_, i) => i);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold tabular-nums"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.28)),
        ...chipStyle3D(c1, c2, { active, size }),
      }}
    >
      {dots.map((i) => {
        const ang = (i * 360) / 8;
        const rad = ((ang - 90) * Math.PI) / 180;
        const dotR = size * 0.42;
        return (
          <span
            key={i}
            aria-hidden
            className="pointer-events-none absolute rounded-sm"
            style={{
              width: Math.max(3, size * 0.11),
              height: Math.max(4, size * 0.14),
              left: `calc(50% + ${dotR * Math.cos(rad)}px)`,
              top: `calc(50% + ${dotR * Math.sin(rad)}px)`,
              transform: `translate(-50%, -50%) rotate(${ang}deg)`,
              background: "oklch(0.96 0.03 80 / 0.92)",
              boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.35)",
            }}
          />
        );
      })}
      <span className="relative z-10">{amount}</span>
    </span>
  );
}
