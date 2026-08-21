import { Link } from "@tanstack/react-router";
import { ENCARGO_GAMES } from "@/components/casino/encargos/encargos-config";
import { useCasino, rankFromXp } from "@/store/casino";
import { dateKey } from "@/lib/daily/daily-challenge";
import { hashSeed } from "@/lib/rng";

/**
 * "El legajo del día": Corvina destaca una mesa de la oficina de encargos.
 * Usa el estado real de los encargos (nivel pendiente, rango exigido),
 * así el hub y la oficina cuentan siempre la misma historia.
 */
export function TorneoDelDiaPanel() {
  const xp = useCasino((s) => s.xp);
  const rank = rankFromXp(xp);

  // Orden estático: los hooks de cada mesa se llaman siempre igual.
  const filas = ENCARGO_GAMES.map((game) => {
    const cleared = game.useCleared();
    const next =
      [...game.levels].sort((a, b) => a.order - b.order).find((l) => !cleared[l.id]) ?? null;
    return { game, cleared, next };
  });

  const disponibles = filas.filter((f) => f.next != null);
  if (disponibles.length === 0) return null;

  const key = dateKey();
  const fila = disponibles[hashSeed(`legajo:${key}`) % disponibles.length]!;
  const { game, next, cleared } = fila;
  const rangoOk = rank.level >= game.requiredLevel;
  const hechos = Object.keys(cleared).length;

  return (
    <Link
      to="/encargos"
      className="cd-tap-target block bg-gradient-to-br from-[#1a0f08]/90 to-[#2a1608]/90 p-4 transition-transform active:scale-[0.98]"
      aria-label={`Legajo del día: ${game.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#c8a862]/80">
            Legajo del día · Corvina
          </div>
          <div
            className="mt-1 truncate text-xl font-bold text-[#f4ecd5] sm:text-2xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}
          >
            {game.title}
          </div>
          <div className="mt-1 truncate text-xs text-[#c8a862]/80">
            {next!.title} · {next!.objectiveLabel}
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-[var(--marfil)]/65">
            {hechos} de {game.levels.length} cerrados
          </div>
        </div>
        <div
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] uppercase tracking-widest ${
            rangoOk
              ? "bg-[#3a2410] text-[#c8a862] ring-1 ring-[#c8a862]/40"
              : "bg-black/40 text-[var(--marfil)]/65 ring-1 ring-white/10"
          }`}
        >
          {rangoOk ? "A la oficina" : `Rango ${game.requiredLevel}`}
        </div>
      </div>
      {next!.modifierLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {next!.modifierLabels.map((m) => (
            <span
              key={m}
              className="rounded-full bg-[#c8a862]/10 px-2 py-0.5 text-[11px] uppercase tracking-wider text-[#e6c983]"
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
