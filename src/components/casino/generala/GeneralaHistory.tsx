import type { MatchRecord } from "@/hooks/use-generala-progression";

interface Props {
  history: MatchRecord[];
  currentLevelId: string;
}

export function GeneralaHistory({ history, currentLevelId }: Props) {
  const slice = history.slice(-12);
  const onlyThisMesa = history.filter((h) => h.levelId === currentLevelId);
  const wins = onlyThisMesa.filter((h) => h.result === "W").length;
  const losses = onlyThisMesa.filter((h) => h.result === "L").length;
  const ties = onlyThisMesa.filter((h) => h.result === "T").length;

  return (
    <section className="rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/82 p-3 shadow-deep backdrop-blur">
      <div className="mb-2 flex items-baseline justify-between border-b border-[var(--brass)]/15 pb-1.5">
        <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/90">
          últimas partidas
        </div>
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
          <span className="text-[oklch(0.86_0.16_75)]">{wins}G</span> ·{" "}
          <span className="text-[oklch(0.66_0.18_25)]">{losses}P</span> ·{" "}
          <span className="text-[var(--smoke)]">{ties}E</span>
        </div>
      </div>
      {slice.length === 0 ? (
        <p className="py-3 text-center font-serif text-xs italic text-[var(--smoke)]">
          Sin tiradas aún. Ganá la primera y dejá huella en el cartón.
        </p>
      ) : (
        <div className="flex flex-wrap items-end justify-center gap-1.5">
          {slice.map((h, i) => {
            const color =
              h.result === "W"
                ? "oklch(0.84 0.17 75)"
                : h.result === "L"
                  ? "oklch(0.55 0.18 25)"
                  : "oklch(0.55 0.04 60)";
            return (
              <div
                key={i}
                className="flex h-12 w-7 flex-col items-center justify-end rounded-[2px] border text-center"
                style={{
                  borderColor: `${color}80`,
                  background: `linear-gradient(180deg, transparent, ${color}22)`,
                }}
                title={`${h.result === "W" ? "Ganaste" : h.result === "L" ? "Perdiste" : "Empate"} · ${h.playerScore} vs ${h.zeldaScore}`}
              >
                <div
                  className="font-display text-[11px] leading-none tracking-[0.15em]"
                  style={{ color }}
                >
                  {h.result}
                </div>
                <div className="mt-0.5 font-display text-[11px] leading-none text-[var(--ivory)]/85">
                  {h.playerScore}
                </div>
                <div className="font-display text-[11px] leading-none text-[var(--smoke)]">
                  {h.zeldaScore}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
