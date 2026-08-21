import { useRouterState, Link } from "@tanstack/react-router";
import { useCup } from "@/store/cup";
import { CUP_GAME_BY_ID, CUP_ROUND_REWARDS, cupRoundName, rivalAt } from "@/lib/cup";

/**
 * Banda de torneo activo: aparece arriba de la mesa donde se juega la ronda.
 * Recuerda contra quién jugás, qué paga la ronda y cómo volver al cuadro.
 */
export function CupRunBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = useCup((s) => s.active);

  if (!active || active.status !== "jugando") return null;
  const mesa = CUP_GAME_BY_ID[active.gameId];
  if (!mesa || !pathname.startsWith(mesa.ruta)) return null;

  const rival = rivalAt(active.bracket, active.round);
  const paga = CUP_ROUND_REWARDS[Math.min(active.round, CUP_ROUND_REWARDS.length - 1)];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
    >
      <div
        className="pointer-events-auto w-full max-w-md rounded-sm px-3 py-1.5"
        style={{
          border: "1px solid oklch(0.55 0.10 65 / 0.6)",
          background:
            "linear-gradient(180deg, oklch(0.20 0.06 40 / 0.94) 0%, oklch(0.09 0.03 25 / 0.96) 100%)",
          boxShadow: "0 14px 34px -16px oklch(0 0 0 / 0.95)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="hud-label shrink-0 text-[10px] tracking-[0.3em] text-[var(--brass)]/85">
            Torneo
          </span>
          <span className="shrink-0 font-display text-[11px] uppercase tracking-[0.14em] text-[var(--oro-claro)]">
            {cupRoundName(active.round)}
          </span>
          <span className="min-w-0 flex-1 truncate font-script text-[11px] text-[var(--marfil)]/85">
            {rival ? (
              <>
                vs {rival.apodo}
                <span className="text-[var(--marfil)]/55">
                  {" "}
                  ({rival.record.g}–{rival.record.p})
                </span>
              </>
            ) : (
              "esperando cruce"
            )}
          </span>
          <span className="shrink-0 font-numerals text-[11px] text-[var(--oro-claro)]">
            ¢{paga.fichas}
          </span>
          <Link
            to="/torneo"
            aria-label="Volver al cuadro del torneo"
            className="cd-hit-44 shrink-0 px-1 font-display text-[11px] text-[var(--brass)]/85"
          >
            cuadro
          </Link>
        </div>
      </div>
    </div>
  );
}
