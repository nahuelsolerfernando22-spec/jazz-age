import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { activeRumors, rumorBadge, specialClient } from "@/lib/rumores";
import { msUntilNextDay } from "@/lib/daily-seed";
import { hostessForGame } from "@/lib/single-hostess";
import { useCasino } from "@/store/casino";

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

export function RumoresPanel() {
  const [mounted, setMounted] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
    setLeft(msUntilNextDay());
    const id = window.setInterval(() => setLeft(msUntilNextDay()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const setCurrentRumor = useCasino((s) => s.setCurrentRumor);
  const rumors = useMemo(() => {
    if (!mounted) return [];
    const active = activeRumors();
    // Persistimos el primer rumor con efecto de juego para que los componentes lo vean
    const gameEffectRumor = active.find((r) => r.effect.kind === "flavor") || active[0];
    if (gameEffectRumor) {
      setCurrentRumor({
        id: gameEffectRumor.id,
        title: gameEffectRumor.title,
        text: gameEffectRumor.text,
      });
    }
    return active;
  }, [mounted, setCurrentRumor]);

  const client = useMemo(() => (mounted ? specialClient() : null), [mounted]);
  const clientHostess = client ? hostessForGame(client.gameId) : null;

  if (!mounted) return null;

  return (
    <section
      aria-labelledby="rumores-heading"
      className="relative overflow-hidden rounded-lg border border-[var(--oro)]/35 bg-[#0a0806]/95 p-4 sm:p-5"
    >
      <header className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[var(--oro-viejo)]">
            Bajo mundo
          </p>
          <h2
            id="rumores-heading"
            className="mt-0.5 text-xl text-[var(--crema-brillo)] sm:text-2xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}
          >
            Rumores de esta noche
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--marfil)]/80">
            Cierra en
          </p>
          <p
            className="tabular-nums text-lg font-bold text-[var(--oro-claro)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {formatCountdown(left)}
          </p>
        </div>
      </header>

      <ul className="space-y-2">
        {rumors.map((r) => {
          const badge = rumorBadge(r);
          return (
            <li key={r.id} className="rounded-md border border-[var(--oro)]/25 bg-[#141008]/90 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--crema-brillo)]">
                  {r.title}
                </p>
                {badge && (
                  <span className="shrink-0 rounded-sm bg-[var(--oro-claro)] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#1a1206]">
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-snug text-[var(--marfil)]/90">{r.text}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.games.map((g) => {
                  const h = hostessForGame(g);
                  return (
                    <Link
                      key={g}
                      to={`/${g}` as "/truco"}
                      className="rounded-sm border border-[var(--oro)]/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--oro-claro)]"
                    >
                      {h?.name?.split(" ")[0] ?? g}
                    </Link>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {client && (
        <div className="mt-3 rounded-md border border-[#8fbf6a]/40 bg-[#0f1408]/90 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#b9e08f]">
            Cliente especial
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--crema-brillo)]">
            {client.name} · mesa de {clientHostess?.name?.split(" ")[0] ?? client.gameId}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[var(--marfil)]/90">{client.demand}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-[var(--oro-claro)]">
              +{client.reward} fichas
            </span>
            <Link
              to={`/${client.gameId}` as "/truco"}
              className="rounded-sm bg-[var(--oro-claro)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#1a1206]"
            >
              Atenderlo
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
