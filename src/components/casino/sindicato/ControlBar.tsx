import { faccionDe } from "@/lib/sindicato-facciones";

interface PlayerLike {
  id: number;
  name: string;
  color: string;
  eliminated: boolean;
  faction?: string;
}

interface Props {
  players: PlayerLike[];
  counts: Record<number, number>;
  total: number;
  currentPlayerId: number;
}

/** Fichas de control territorial: una barra + chip por banda. */
export function ControlBar({ players, counts, total, currentPlayerId }: Props) {
  if (players.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[100px] z-[65] px-2 min-[420px]:top-[106px]">
      <div className="pointer-events-auto rounded-xl border-2 border-[var(--oro-viejo)]/60 bg-black/90 px-2 py-1 backdrop-blur-md shadow-lg">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-black bg-white/12">
          {players.map((p) => {
            const pct = total > 0 ? ((counts[p.id] || 0) / total) * 100 : 0;
            return (
              <div
                key={p.id}
                className="h-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: p.color,
                  opacity: p.eliminated ? 0.25 : 1,
                }}
              />
            );
          })}
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {players.map((p) => {
            const faccion = faccionDe(p.faction);
            const active = p.id === currentPlayerId;
            return (
              <div
                key={p.id}
                className={`flex shrink-0 items-center gap-1 rounded-full border-2 px-2 py-0.5 ${
                  active
                    ? "border-[var(--oro-palido)] bg-[var(--oro)]/20"
                    : "border-black/60 bg-black/50"
                } ${p.eliminated ? "opacity-40 line-through" : ""}`}
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-black text-[11px] font-black text-black"
                  style={{ backgroundColor: p.color }}
                >
                  {faccion.sello}
                </span>
                <span className="font-bebas text-sm leading-none tabular-nums text-[var(--crema-clara)]">
                  {counts[p.id] || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
