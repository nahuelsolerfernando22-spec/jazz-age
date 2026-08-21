import { useNavigate } from "@tanstack/react-router";
import { useRoomCooldown } from "@/lib/room-cooldown";

interface Props {
  gameId: string;
  hostessLine?: string;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function RoomRestingOverlay({ gameId, hostessLine }: Props) {
  const { secondsLeft, onCooldown } = useRoomCooldown(gameId);
  const navigate = useNavigate();
  if (!onCooldown) return null;
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 px-6 backdrop-blur-md">
      <div className="max-w-sm rounded-sm border border-[var(--brass)]/55 bg-[var(--noir)] p-7 text-center shadow-deep">
        <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/80">
          el cuervo dorado
        </div>
        <h2 className="mt-1 font-script text-3xl text-[var(--brass-bright)] text-glow-brass">
          La mesa descansa
        </h2>
        <p className="mt-3 font-body text-sm italic leading-relaxed text-[var(--smoke)]">
          {hostessLine ?? "Esta noche no es tu noche, cariño. La mesa te va a esperar."}
        </p>
        <div className="my-5 font-display text-4xl tracking-[0.3em] text-[var(--brass-bright)]">
          {fmt(secondsLeft)}
        </div>
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-sm border border-[var(--brass)]/60 px-5 py-2 font-display text-[11px] uppercase tracking-[0.4em] text-[var(--ivory)] hover:bg-[var(--mahogany)]/40"
        >
          Volver al salón
        </button>
      </div>
    </div>
  );
}
