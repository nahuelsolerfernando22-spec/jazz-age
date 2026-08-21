import type { MahjongObjectiveView } from "@/hooks/use-mahjong-daily";

interface Props {
  objectives: MahjongObjectiveView[];
  onClaim: (id: string) => void;
  compact?: boolean;
}

export function MahjongDailyObjectives({ objectives, onClaim, compact }: Props) {
  if (!objectives.length) return null;
  return (
    <div
      className={`cd-daily-objectives rounded-sm border border-[var(--brass)]/30 bg-[var(--noir)]/60 ${
        compact ? "p-2" : "p-3"
      }`}
      aria-label="Objetivos diarios de Mahjong"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/80">
          Objetivos de hoy
        </div>
        <div className="font-script text-[11px] text-[var(--ivory)]/60">
          Se renuevan a medianoche
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {objectives.map((o) => {
          const pct = Math.round(o.progress * 100);
          return (
            <li
              key={o.id}
              className="flex items-center gap-2 rounded-sm border border-[var(--brass)]/15 bg-black/30 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-serif text-[12px] text-[var(--ivory)]">
                    {o.label}
                  </span>
                  <span className="shrink-0 font-display text-[11px] text-[var(--brass)]/80">
                    +{o.favors}★ · +{o.xp}xp
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--brass)]/10">
                  <div
                    className="h-full rounded-full bg-[oklch(0.78_0.16_70)] transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {o.done && !o.claimed ? (
                <button
                  type="button"
                  onClick={() => onClaim(o.id)}
                  className="shrink-0 rounded-sm border border-[oklch(0.78_0.16_70)] bg-[oklch(0.78_0.16_70)]/20 px-2 py-1 font-display text-[11px] uppercase tracking-widest text-[oklch(0.92_0.18_80)] active:scale-95"
                >
                  Cobrar
                </button>
              ) : o.claimed ? (
                <span className="shrink-0 font-display text-[11px] uppercase tracking-widest text-[var(--brass)]/90">
                  ✓ Cobrado
                </span>
              ) : (
                <span className="shrink-0 font-display text-[11px] text-[var(--ivory)]/40">
                  {pct}%
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
