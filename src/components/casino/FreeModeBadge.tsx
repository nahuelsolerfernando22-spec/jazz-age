export function FreeModeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-[var(--brass)]/45 bg-[var(--noir)]/70 px-2 py-0.5 font-display text-[11px] uppercase tracking-[0.32em] text-[var(--brass)]/85 ${className}`}
      title="Este salón no consume vidas. Jugá tranquilo."
    >
      <span aria-hidden className="text-[var(--brass)]">
        ♣
      </span>
      Salón libre · sin vidas
    </span>
  );
}
