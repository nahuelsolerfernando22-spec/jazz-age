import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type BrassButtonVariant = "primary" | "blood" | "ghost" | "danger";
export type BrassButtonSize = "sm" | "md" | "lg";
export type BrassButtonShape = "plate" | "ingot";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BrassButtonVariant;
  size?: BrassButtonSize;
  shape?: BrassButtonShape;
  leading?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
};

const SIZE: Record<BrassButtonSize, { h: number; px: number; text: string; tracking: string }> = {
  sm: { h: 30, px: 12, text: "10px", tracking: "0.32em" },
  md: { h: 44, px: 18, text: "11px", tracking: "0.35em" },
  lg: { h: 48, px: 22, text: "13px", tracking: "0.40em" },
};

function chamfer(shape: BrassButtonShape): string {
  const c = shape === "ingot" ? 7 : 4;
  return `polygon(0 ${c}px, ${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;
}

function variantStyles(v: BrassButtonVariant) {
  switch (v) {
    case "primary":
      return {
        background:
          "linear-gradient(180deg, oklch(0.78 0.13 80) 0%, oklch(0.55 0.13 65) 55%, oklch(0.38 0.11 55) 100%)",
        borderColor: "oklch(0.85 0.10 80 / 0.85)",
        color: "var(--noir)",
        shadow:
          "0 0 16px oklch(0.78 0.13 80 / 0.45), inset 0 1px 0 oklch(1 0 0 / 0.35), inset 0 -2px 4px oklch(0.20 0.05 50 / 0.5), 0 6px 14px rgba(0,0,0,0.65)",
        textShadow: "0 1px 0 oklch(0.95 0.05 80 / 0.5)",
      };
    case "blood":
      return {
        background:
          "linear-gradient(180deg, oklch(0.38 0.16 22) 0%, oklch(0.24 0.13 22) 55%, oklch(0.15 0.09 22) 100%)",
        borderColor: "oklch(0.55 0.18 24 / 0.85)",
        color: "var(--ivory)",
        shadow:
          "0 0 16px oklch(0.40 0.18 24 / 0.50), inset 0 1px 0 oklch(1 0 0 / 0.10), inset 0 -2px 4px rgba(0,0,0,0.55), 0 6px 14px rgba(0,0,0,0.7)",
        textShadow: "0 1px 2px rgba(0,0,0,0.85)",
      };
    case "ghost":
      return {
        background:
          "linear-gradient(180deg, oklch(0.09 0.012 30 / 0.92) 0%, oklch(0.05 0.008 30 / 0.92) 100%)",
        borderColor: "oklch(0.78 0.13 80 / 0.55)",
        color: "var(--brass)",
        shadow:
          "inset 0 1px 0 oklch(1 0 0 / 0.06), 0 0 12px oklch(0.78 0.13 80 / 0.18), 0 4px 10px oklch(0 0 0 / 0.55)",
        textShadow: "0 1px 1px rgba(0,0,0,0.65)",
      };
    case "danger":
      return {
        background: "linear-gradient(180deg, oklch(0.55 0.22 25) 0%, oklch(0.38 0.20 25) 100%)",
        borderColor: "oklch(0.70 0.22 28 / 0.85)",
        color: "var(--ivory)",
        shadow:
          "0 0 18px oklch(0.55 0.22 25 / 0.55), inset 0 1px 0 oklch(1 0 0 / 0.15), 0 6px 14px rgba(0,0,0,0.7)",
        textShadow: "0 1px 2px rgba(0,0,0,0.85)",
      };
  }
}

const HAPTIC: Record<BrassButtonVariant, "tap" | "select" | "warning" | "error"> = {
  primary: "select",
  blood: "select",
  ghost: "tap",
  danger: "warning",
};

export const BrassButton = forwardRef<HTMLButtonElement, Props>(function BrassButton(
  {
    variant = "primary",
    size = "md",
    shape = "plate",
    leading,
    trailing,
    block,
    className = "",
    style,
    children,
    ...rest
  },
  ref,
) {
  const s = SIZE[size];
  const v = variantStyles(variant);
  const clip = chamfer(shape);
  return (
    <button
      ref={ref}
      data-haptic={HAPTIC[variant]}
      {...rest}
      data-brass-button={variant}
      className={`group/brass relative inline-flex items-center justify-center gap-2 font-display uppercase transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${
        block ? "w-full" : ""
      } ${className}`}
      style={{
        minHeight: s.h,
        padding: `0 ${s.px}px`,
        fontSize: s.text,
        letterSpacing: s.tracking,
        background: v.background,
        border: `1px solid ${v.borderColor}`,
        color: v.color,
        boxShadow: v.shadow,
        textShadow: v.textShadow,
        clipPath: clip,
        WebkitClipPath: clip,
        ...style,
      }}
    >
      {leading ? <span className="flex shrink-0 items-center">{leading}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
      {trailing ? <span className="flex shrink-0 items-center">{trailing}</span> : null}
    </button>
  );
});
