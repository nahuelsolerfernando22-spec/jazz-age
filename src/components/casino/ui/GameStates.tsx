import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface FrameProps {
  minH?: number | string;
  className?: string;
  children: ReactNode;
}

function StateFrame({ minH = 220, className = "", children }: FrameProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative mx-auto flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/70 px-6 py-8 text-center backdrop-blur ${className}`}
      style={{
        minHeight: typeof minH === "number" ? `${minH}px` : minH,
        boxShadow:
          "inset 0 1px 0 oklch(1 0 0 / 0.05), inset 0 -1px 3px oklch(0 0 0 / 0.55), 0 6px 24px oklch(0 0 0 / 0.55)",
      }}
    >
      {children}
    </div>
  );
}

export function GameSkeleton({
  label = "Preparando la mesa…",
  minH = 220,
  className,
}: {
  label?: string;
  minH?: number | string;
  className?: string;
}) {
  return (
    <StateFrame minH={minH} className={className}>
      <div className="flex w-full flex-col gap-2">
        <div className="h-3 w-3/4 animate-pulse rounded-sm bg-[var(--brass)]/15" />
        <div className="h-3 w-1/2 animate-pulse rounded-sm bg-[var(--brass)]/10" />
        <div className="mt-2 h-24 w-full animate-pulse rounded-sm bg-[var(--brass)]/8 [animation-delay:150ms]" />
      </div>
      <span className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
        {label}
      </span>
    </StateFrame>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  minH = 220,
  icon = "◇",
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  minH?: number | string;
  icon?: ReactNode;
}) {
  return (
    <StateFrame minH={minH}>
      <div
        aria-hidden
        className="grid size-12 place-items-center rounded-full border border-[var(--brass)]/40 text-[var(--brass)] text-[20px]"
      >
        {icon}
      </div>
      <div className="font-display text-[12px] uppercase tracking-[0.42em] text-[var(--brass-bright)]">
        {title}
      </div>
      {hint && (
        <p className="max-w-xs text-[12px] italic leading-snug text-[var(--ivory)]/75">{hint}</p>
      )}
      {action}
    </StateFrame>
  );
}

export function ErrorState({
  title = "Algo se torció",
  hint = "El garito tuvo un traspié. Probá otra vez o volvé al salón.",
  onRetry,
  minH = 220,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
  minH?: number | string;
}) {
  return (
    <StateFrame minH={minH} className="border-[var(--oxblood)]/50">
      <div
        aria-hidden
        className="grid size-12 place-items-center rounded-full border border-[var(--oxblood)]/70 text-[oklch(0.82_0.22_24)] text-[20px]"
      >
        ✕
      </div>
      <div className="font-display text-[12px] uppercase tracking-[0.42em] text-[oklch(0.82_0.22_24)]">
        {title}
      </div>
      <p className="max-w-xs text-[12px] italic leading-snug text-[var(--ivory)]/80">{hint}</p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-sm border border-[var(--brass)]/60 bg-[var(--noir)]/70 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass-bright)] transition hover:bg-[var(--oxblood)]/40"
          >
            Reintentar
          </button>
        )}
        <Link
          to="/"
          className="rounded-sm border border-[var(--brass)]/30 bg-transparent px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/85 transition hover:text-[var(--brass-bright)] hover:border-[var(--brass)]/60"
        >
          Volver al salón
        </Link>
      </div>
    </StateFrame>
  );
}

export function MapImageSkeleton({ ratio = 1024 / 1600 }: { ratio?: number }) {
  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden rounded-sm bg-[var(--noir)]/60"
      style={{ aspectRatio: `${ratio}` }}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-[var(--mahogany)]/30 via-[var(--noir)]/40 to-[var(--noir)]/70" />
      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 space-y-2">
        <div className="h-2 w-1/3 animate-pulse rounded-sm bg-[var(--brass)]/20" />
        <div className="h-2 w-2/3 animate-pulse rounded-sm bg-[var(--brass)]/10 [animation-delay:120ms]" />
      </div>
    </div>
  );
}
