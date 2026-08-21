import { useEffect, useRef } from "react";

export function ChipsBadge({ value, flash }: { value: string; flash?: "gain" | "loss" | null }) {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = numRef.current;
    if (!el) return;
    el.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-1px)" },
        { transform: "translateY(0)" },
      ],
      { duration: 220, easing: "ease-out" },
    );
  }, [value]);

  const glow =
    flash === "gain"
      ? "0 0 12px oklch(0.86 0.18 130 / 0.55)"
      : flash === "loss"
        ? "0 0 12px oklch(0.72 0.22 24 / 0.55)"
        : "0 0 8px oklch(0.78 0.13 80 / 0.28)";

  return (
    <div
      aria-label={`Fichas: ${value}`}
      className="hud-plate relative flex items-center justify-center px-3 sm:px-4"
      style={{
        height: "calc(var(--hud-h) - 16px)",
        minHeight: 34,
        filter: `drop-shadow(${glow})`,
      }}
    >
      <div className="flex flex-col items-center leading-none">
        <span className="hud-label">Fichas</span>
        <span
          ref={numRef}
          className="hud-value mt-[3px]"
          style={{
            fontSize: "clamp(16px, 2.4vw, 22px)",
            display: "inline-block",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
