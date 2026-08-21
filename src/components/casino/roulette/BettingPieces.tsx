import { memo } from "react";
import { motion } from "framer-motion";
import type { Color } from "@/lib/roulette-math";
import { ChipFace } from "./ChipFace";

const COLOR_LABEL: Record<Color, string> = {
  red: "rojo",
  black: "negro",
  green: "verde",
};

function chipsLabel(amount: number): string {
  return amount === 1 ? "1 ficha" : `${amount} fichas`;
}

export const StackedChip = memo(function StackedChip({ amount }: { amount: number }) {
  const denom = [100, 50, 25, 10, 5].find((v) => amount >= v) ?? 5;
  return (
    <div
      aria-hidden
      className="cd-chip-pop pointer-events-none absolute -right-1.5 -top-1.5 z-10 flex items-center gap-0.5"
    >
      <ChipFace amount={denom} size={22} />
      {amount !== denom && (
        <span
          className="rounded-sm border border-[var(--brass)]/70 bg-[var(--noir)]/90 px-1 font-display text-[11px] font-bold tabular-nums text-[var(--brass-bright)]"
          style={{ textShadow: "0 1px 1px rgba(0,0,0,0.95)" }}
        >
          {amount}
        </span>
      )}
    </div>
  );
});

type NumberCellProps = {
  n: number;
  color: Color;
  chips: number;
  isWinner: boolean;
  onSelect: () => void;
  disabled?: boolean;
  tall?: boolean;
  /** Android/APK: sin framer-motion, el feedback del toque va por CSS :active. */
  lowFx?: boolean;
};

export const NumberCell = memo(function NumberCell({
  n,
  color,
  chips,
  isWinner,
  onSelect,
  disabled,
  tall,
  lowFx,
}: NumberCellProps) {
  const bg =
    color === "green"
      ? "linear-gradient(180deg, oklch(0.36 0.16 145), oklch(0.22 0.10 145))"
      : color === "red"
        ? "linear-gradient(180deg, oklch(0.48 0.20 25), oklch(0.30 0.16 25))"
        : "linear-gradient(180deg, oklch(0.18 0.02 30), oklch(0.08 0.01 30))";
  const baseLabel = `Pleno al ${n} ${COLOR_LABEL[color]}`;
  const ariaLabel =
    chips > 0
      ? `${baseLabel}. Apuesta actual ${chipsLabel(chips)}. Toca para sumar otra ficha.`
      : `${baseLabel}. Sin apuesta. Toca para apostar.`;
  const shape = tall ? "h-full w-full min-w-0" : "aspect-square w-full min-h-[22px] min-w-0";
  const common = `relative flex items-center justify-center overflow-visible px-0 font-display font-bold tabular-nums leading-none tracking-normal ${shape} rounded-[3px] text-[11px] sm:text-xs disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--noir)]`;
  const style = {
    background: bg,
    color: "var(--ivory)",
    border: "1px solid oklch(0.85 0.04 75 / 0.45)",
    boxShadow: isWinner
      ? "0 0 16px oklch(0.85 0.18 75), inset 0 0 10px oklch(0.95 0.10 75 / 0.5)"
      : "inset 0 -2px 3px rgba(0,0,0,0.55), inset 0 1px 0 oklch(0.95 0.05 75 / 0.18)",
    textShadow: "0 1px 1px rgba(0,0,0,0.95)",
  } as const;

  if (lowFx) {
    return (
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={chips > 0}
        aria-disabled={disabled || undefined}
        data-card-target
        className={`cd-press ${isWinner ? "cd-win-flash" : ""} ${common}`}
        style={style}
      >
        <span aria-hidden>{n}</span>
        {chips > 0 && <StackedChip key={chips} amount={chips} />}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={chips > 0}
      aria-disabled={disabled || undefined}
      data-card-target
      whileHover={!disabled ? { scale: 1.06, y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.94 } : undefined}
      animate={isWinner ? { scale: [1, 1.3, 1.1, 1.2, 1] } : { scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={common}
      style={style}
    >
      <span aria-hidden>{n}</span>
      {chips > 0 && <StackedChip key={chips} amount={chips} />}
    </motion.button>
  );
});

type OutsideCellProps = {
  label: string;
  subLabel?: string;
  accent?: string;
  chips: number;
  onSelect: () => void;
  disabled?: boolean;
  small?: boolean;
  hideSubLabel?: boolean;
  lowFx?: boolean;
};

export const OutsideCell = memo(function OutsideCell({
  label,
  subLabel,
  accent,
  chips,
  onSelect,
  disabled,
  small,
  hideSubLabel,
  lowFx,
}: OutsideCellProps) {
  const baseLabel = subLabel ? `${label}, ${subLabel}` : label;
  const ariaLabel =
    chips > 0
      ? `${baseLabel}. Apuesta actual ${chipsLabel(chips)}. Toca para sumar otra ficha.`
      : `${baseLabel}. Sin apuesta. Toca para apostar.`;
  const common = `relative flex w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-[3px] border min-h-[30px] sm:min-h-[38px] ${small ? "py-1 px-0 text-[11px] tracking-normal sm:text-[11px] sm:tracking-[0.1em]" : "py-2 px-1 text-[11px] tracking-[0.08em] sm:text-[11px] sm:tracking-[0.16em]"} font-display uppercase disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)]`;
  const style = {
    borderColor: "oklch(0.85 0.04 75 / 0.45)",
    background: accent
      ? `linear-gradient(180deg, ${accent}, oklch(0.10 0.03 28))`
      : "linear-gradient(180deg, oklch(0.22 0.06 145 / 0.7), oklch(0.10 0.04 145 / 0.85))",
    color: "var(--ivory)",
    boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.5), inset 0 1px 0 oklch(0.95 0.05 75 / 0.18)",
    textShadow: "0 1px 1px rgba(0,0,0,0.9)",
  } as const;

  const inner = (
    <>
      <span
        aria-hidden
        className="max-w-full whitespace-normal break-words text-center leading-[1.1]"
      >
        {label}
      </span>
      {subLabel && !hideSubLabel && (
        <span aria-hidden className="mt-0.5 text-[11px] opacity-80">
          {subLabel}
        </span>
      )}
      {chips > 0 && <StackedChip key={chips} amount={chips} />}
    </>
  );

  if (lowFx) {
    return (
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={chips > 0}
        aria-disabled={disabled || undefined}
        data-card-target
        className={`cd-press cd-press-soft ${common}`}
        style={style}
      >
        {inner}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={chips > 0}
      aria-disabled={disabled || undefined}
      data-card-target
      whileHover={!disabled ? { scale: 1.03, y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      className={common}
      style={style}
    >
      {inner}
    </motion.button>
  );
});

export const TableAction = memo(function TableAction({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-disabled={disabled || undefined}
      data-inline-chip
      className="cd-press cd-press-soft relative min-h-9 rounded-sm border border-[var(--brass)]/45 bg-[var(--noir)]/70 px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)] hover:bg-[var(--noir)] hover:text-[var(--brass-bright)] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)]"
    >
      {label}
    </button>
  );
});

type NumberRowProps = {
  nums: readonly number[];
  colors: readonly Color[];
  chips: readonly number[];
  winning: number | null;
  disabled: boolean;
  onSelect: (n: number) => void;
  lowFx?: boolean;
};

function NumberRowImpl({
  nums,
  colors,
  chips,
  winning,
  disabled,
  onSelect,
  lowFx,
}: NumberRowProps) {
  return (
    <div className="grid grid-cols-12 gap-[2px] sm:gap-1.5" role="row">
      {nums.map((n, i) => (
        <NumberCell
          key={n}
          n={n}
          color={colors[i]}
          chips={chips[i]}
          isWinner={winning === n}
          onSelect={() => onSelect(n)}
          disabled={disabled}
          lowFx={lowFx}
        />
      ))}
    </div>
  );
}

export const NumberRow = memo(NumberRowImpl, (prev, next) => {
  if (
    prev.winning !== next.winning ||
    prev.disabled !== next.disabled ||
    prev.lowFx !== next.lowFx ||
    prev.onSelect !== next.onSelect ||
    prev.nums !== next.nums ||
    prev.colors !== next.colors
  )
    return false;
  if (prev.chips === next.chips) return true;
  if (prev.chips.length !== next.chips.length) return false;
  for (let i = 0; i < prev.chips.length; i++) {
    if (prev.chips[i] !== next.chips[i]) return false;
  }
  return true;
});
