import { useMemo } from "react";
import { toast } from "sonner";
import { useFavors } from "@/store/favors";
import { useCasino } from "@/store/casino";
import { useRewardsHistory } from "@/store/rewards-history";
import { useLeagueProgress } from "@/store/league-progress";
import { tierById } from "@/lib/leagues-daily";

interface CanjeItem {
  id: string;
  label: string;
  hint: string;
  cost: number;
  chips: number;
}

const CANJES: CanjeItem[] = [
  { id: "propina", label: "Propina del portero", hint: "Un puñado de fichas", cost: 3, chips: 500 },
  { id: "sobre", label: "Sobre de la casa", hint: "Fichas del cajón bueno", cost: 8, chips: 1_800 },
  {
    id: "cuervo",
    label: "Bolsa del Cuervo",
    hint: "Lo que guarda Corvina bajo llave",
    cost: 20,
    chips: 5_500,
  },
];

export function RecompensasCard() {
  const favors = useFavors((s) => s.favors);
  const lifetime = useFavors((s) => s.lifetime);
  const spend = useFavors((s) => s.spend);
  const addChips = useCasino((s) => s.addChips);
  const entries = useRewardsHistory((s) => s.entries);
  const inbox = useLeagueProgress((s) => s.inbox);

  const recent = useMemo(() => entries.slice(0, 12), [entries]);

  return (
    <div className="space-y-4">
      <section className="flex items-center justify-between rounded-2xl border border-[var(--oro)]/40 bg-black/60 p-3 shadow-lg">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--oro)]/80">Favores</p>
          <p className="text-2xl tabular-nums text-[var(--oro-claro)]">🪶 {favors}</p>
        </div>
        <p className="text-right text-[11px] text-[var(--marfil)]/65">
          Ganados en total
          <br />
          <span className="tabular-nums text-[var(--marfil)]/80">{lifetime}</span>
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="px-1 text-[11px] uppercase tracking-[0.25em] text-[var(--oro)]/80">
          Canjear
        </h3>
        {CANJES.map((c) => {
          const can = favors >= c.cost;
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/40 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-[var(--crema)]">{c.label}</p>
                <p className="text-[11px] text-[var(--crema-clara)]/80">
                  {c.hint} · +{c.chips.toLocaleString("es-AR")} fichas
                </p>
              </div>
              <button
                type="button"
                data-haptic="tap"
                disabled={!can}
                onClick={() => {
                  if (!spend(c.cost)) return;
                  addChips(c.chips);
                  toast.success(`${c.label}: +${c.chips.toLocaleString("es-AR")} fichas`);
                }}
                className={`min-h-11 shrink-0 rounded-full px-4 text-[11px] font-bold uppercase tracking-[0.18em] ${
                  can
                    ? "bg-[var(--oro)] text-[#14100a]"
                    : "border border-white/10 text-[var(--marfil)]/65"
                }`}
              >
                🪶 {c.cost}
              </button>
            </div>
          );
        })}
      </section>

      {inbox.length > 0 ? (
        <section className="space-y-2">
          <h3 className="px-1 text-[11px] uppercase tracking-[0.25em] text-[var(--oro)]/80">
            Cierres de jornada
          </h3>
          {inbox.slice(0, 6).map((r, i) => (
            <div
              key={`${r.game}-${i}`}
              className="rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-[12px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--crema)]">{tierById(r.tier).fullName}</span>
                <span
                  className={
                    r.outcome === "promo"
                      ? "text-[#7bd88f]"
                      : r.outcome === "demote"
                        ? "text-[#e88b7b]"
                        : "text-[var(--marfil)]/80"
                  }
                >
                  {r.outcome === "promo"
                    ? "Ascenso"
                    : r.outcome === "demote"
                      ? "Descenso"
                      : "Sigue"}
                </span>
              </div>
              <p className="text-[11px] text-[var(--crema-clara)]/80">
                Puesto {r.rank}/{r.total} · {r.playerScore.toLocaleString("es-AR")} pts · 🪶{" "}
                {r.favors}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="px-1 text-[11px] uppercase tracking-[0.25em] text-[var(--oro)]/80">
          Historial
        </h3>
        {recent.length === 0 ? (
          <p className="px-1 text-[11px] italic text-[var(--marfil)]/65">
            Todavía no cobraste nada.
          </p>
        ) : (
          recent.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-[12px]"
            >
              <div className="min-w-0">
                <p className="truncate text-[var(--marfil)]/85">{e.label}</p>
                <p className="text-[11px] text-[var(--crema-clara)]/80">
                  {new Date(e.ts).toLocaleDateString("es-AR")}
                </p>
              </div>
              <span className="shrink-0 tabular-nums text-[var(--oro-claro)]">
                {e.favors > 0 ? `🪶 ${e.favors}` : ""} {e.chips > 0 ? `· ${e.chips}` : ""}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
