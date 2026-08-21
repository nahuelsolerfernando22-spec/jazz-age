import { useCasino } from "@/store/casino";
import { useMemo } from "react";

type Props = {
  max?: number;
  floor?: number;
  blend?: "multiply" | "normal";
  z?: number;
  className?: string;
};

export function RoomGrime({
  max = 0.55,
  floor = 0.08,
  blend = "multiply",
  z = 1,
  className,
}: Props) {
  const xp = useCasino((s) => s.xp);
  const progress = Math.max(0, Math.min(1, xp / 1500));
  const opacity = floor + progress * (max - floor);

  const background = useMemo(
    () =>
      "radial-gradient(120% 90% at 50% 35%, transparent 28%, oklch(0.18 0.06 55 / 0.55) 78%, oklch(0.06 0.04 40 / 0.92) 100%), linear-gradient(160deg, oklch(0.32 0.07 55 / 0.20) 0%, oklch(0.12 0.05 40 / 0.42) 100%)",
    [],
  );

  if (opacity <= 0.02) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 motion-safe:transition-opacity motion-safe:duration-1000 ${className ?? ""}`}
      style={{
        opacity,
        background,
        mixBlendMode: blend === "multiply" ? "multiply" : undefined,
        zIndex: z,

        transform: "translateZ(0)",
        willChange: "opacity",
        contain: "strict",
      }}
    />
  );
}
