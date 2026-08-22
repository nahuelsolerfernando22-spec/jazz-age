import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { SINGLE_GAMES } from "@/lib/single-games";
import { useNemesis } from "@/store/nemesis";
import { useSingleScores } from "@/store/single-scores";
import { useBlackjackHistory, summarizeHistory } from "@/store/games/blackjack/blackjack-history";
import estadisticasHero from "@/assets/estadisticas-hero.webp";

export const Route = createFileRoute("/estadisticas")({
  head: () => ({
    meta: [
      { title: "Estadísticas — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Resumen global de tus partidas: win rate, ganancias netas, empates y manos totales por cada mesa del Cuervo Dorado.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EstadisticasPage,
});

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function fmtSigned(n: number): string {
  if (n === 0) return "0";
  const s = new Intl.NumberFormat("es-AR").format(Math.abs(n));
  return n > 0 ? `+${s}` : `−${s}`;
}

interface Row {
  id: string;
  name: string;
  to: string;
  plays: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  net: number | null;
  best: number | null;
  hasNemesis: boolean;
}

function EstadisticasPage() {
  const byGame = useNemesis((s) => s.byGame);
  const scores = useSingleScores((s) => s.byGame);
  const bjEntries = useBlackjackHistory((s) => s.entries);
  const bjSummary = useMemo(() => summarizeHistory(bjEntries), [bjEntries]);

  const rows: Row[] = useMemo(() => {
    return SINGLE_GAMES.map((g) => {
      if (g.id === "blackjack") {
        const wins = bjSummary.wins;
        const losses = bjSummary.losses;
        const draws = bjSummary.pushes;
        const decisive = wins + losses;
        return {
          id: g.id,
          name: g.name,
          to: g.to,
          plays: bjSummary.played,
          wins,
          losses,
          draws,
          winRate: decisive === 0 ? 0 : wins / decisive,
          net: bjSummary.netTotal,
          best: null,
          hasNemesis: g.hasNemesis,
        };
      }
      if (g.hasNemesis) {
        const n = byGame[g.id];
        const wins = n?.wins ?? 0;
        const losses = n?.losses ?? 0;
        const draws = n?.draws ?? 0;
        const decisive = wins + losses;
        return {
          id: g.id,
          name: g.name,
          to: g.to,
          plays: wins + losses + draws,
          wins,
          losses,
          draws,
          winRate: decisive === 0 ? 0 : wins / decisive,
          net: null,
          best: null,
          hasNemesis: true,
        };
      }
      const sc = scores[g.id];
      const plays = sc?.plays ?? 0;
      return {
        id: g.id,
        name: g.name,
        to: g.to,
        plays,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        net: null,
        best: sc?.best ?? 0,
        hasNemesis: false,
      };
    });
  }, [byGame, scores, bjSummary]);

  const totals = useMemo(() => {
    const decisive = rows.reduce((s, r) => s + r.wins + r.losses, 0);
    const wins = rows.reduce((s, r) => s + r.wins, 0);
    const plays = rows.reduce((s, r) => s + r.plays, 0);
    const draws = rows.reduce((s, r) => s + r.draws, 0);
    return {
      plays,
      wins,
      draws,
      winRate: decisive === 0 ? 0 : wins / decisive,
      netBJ: bjSummary.netTotal,
    };
  }, [rows, bjSummary]);

  const nemesisRows = rows.filter((r) => r.hasNemesis);
  const scoreRows = rows.filter((r) => !r.hasNemesis);

  return (
    <main className="min-h-dvh bg-[var(--verde-noche)] pt-[calc(var(--hud-h)+24px)] pb-24 text-[var(--marfil)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
        <div className="relative -mx-4 mb-6 overflow-hidden rounded-lg border border-[var(--oro)]/30 shadow-lg sm:-mx-6 lg:-mx-10">
          <img
            src={estadisticasHero}
            alt=""
            width={1536}
            height={640}
            className="h-32 w-full object-cover sm:h-44"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 40%, rgba(11,21,18,0.65) 85%, rgba(11,21,18,0.92) 100%)",
            }}
          />
        </div>
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--oro)]/80">
              — El libro contable del Cuervo —
            </p>
            <h1
              className="mt-2 text-4xl text-[var(--marfil)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}
            >
              Estadísticas globales
            </h1>
            <p className="mt-1 text-sm text-[var(--marfil)]/80">
              Todo lo que jugaste, contado por Madame Corvina.
            </p>
          </div>
        </header>

        {}
        <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BigStat label="Manos totales" value={totals.plays.toLocaleString("es-AR")} />
          <BigStat label="Victorias" value={totals.wins.toLocaleString("es-AR")} />
          <BigStat label="Efectividad global" value={fmtPct(totals.winRate)} />
          <BigStat
            label="Balance Blackjack"
            value={fmtSigned(totals.netBJ)}
            tone={totals.netBJ > 0 ? "positive" : totals.netBJ < 0 ? "negative" : "neutral"}
          />
        </section>

        {}
        <section className="mb-10">
          <h2 className="mb-3 font-display text-[11px] uppercase tracking-[0.4em] text-[var(--oro)]">
            Mesas con oponente
          </h2>
          <div className="overflow-x-auto overflow-y-hidden rounded-md border border-[var(--cd-felt)]/40 bg-[#101c19]">
            <StatsTable rows={nemesisRows} showNet />
          </div>
          <p className="mt-2 text-[11px] text-[var(--marfil)]/65">
            Efectividad calculada sobre partidas decisivas (excluye empates).
          </p>
        </section>

        {}
        <section>
          <h2 className="mb-3 font-display text-[11px] uppercase tracking-[0.4em] text-[var(--oro)]">
            Juegos de puntaje
          </h2>
          <div className="overflow-x-auto overflow-y-hidden rounded-md border border-[var(--cd-felt)]/40 bg-[#101c19]">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-black/30 text-[11px] uppercase tracking-[0.25em] text-[var(--marfil)]/80">
                <tr>
                  <th className="px-3 py-2 text-left">Juego</th>
                  <th className="px-3 py-2 text-right">Partidas</th>
                  <th className="px-3 py-2 text-right">Mejor puntaje</th>
                </tr>
              </thead>
              <tbody>
                {scoreRows.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--cd-felt)]/25 hover:bg-white/[0.02]">
                    <td className="px-3 py-2">
                      <Link
                        to={r.to}
                        className="inline-flex min-h-[44px] items-center text-[var(--marfil)] hover:text-[var(--oro)]"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.plays}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[var(--oro)]">
                      {r.best ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function BigStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const color =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-rose-300"
        : "text-[var(--marfil)]";
  return (
    <div className="rounded-md border border-[var(--cd-felt)]/40 bg-[#101c19] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--marfil)]/65">{label}</p>
      <p
        className={`mt-1 text-2xl tabular-nums ${color}`}
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
      >
        {value}
      </p>
    </div>
  );
}

function StatsTable({ rows, showNet }: { rows: Row[]; showNet?: boolean }) {
  return (
    <table className="w-full min-w-[600px] text-sm">
      <thead className="bg-black/30 text-[11px] uppercase tracking-[0.25em] text-[var(--marfil)]/80">
        <tr>
          <th className="px-3 py-2 text-left">Juego</th>
          <th className="px-3 py-2 text-right">Manos</th>
          <th className="px-3 py-2 text-right">Ganó</th>
          <th className="px-3 py-2 text-right">Perdió</th>
          <th className="px-3 py-2 text-right">Empates</th>
          <th className="px-3 py-2 text-right">% Victorias</th>
          {showNet ? <th className="px-3 py-2 text-right">Neto</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-[var(--cd-felt)]/25 hover:bg-white/[0.02]">
            <td className="px-3 py-2">
              <Link
                to={r.to}
                className="inline-flex min-h-[44px] items-center text-[var(--marfil)] hover:text-[var(--oro)]"
              >
                {r.name}
              </Link>
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{r.plays}</td>
            <td className="px-3 py-2 text-right tabular-nums text-emerald-300/90">{r.wins}</td>
            <td className="px-3 py-2 text-right tabular-nums text-rose-300/90">{r.losses}</td>
            <td className="px-3 py-2 text-right tabular-nums text-[var(--marfil)]/80">{r.draws}</td>
            <td className="px-3 py-2 text-right tabular-nums">
              {r.plays === 0 ? (
                <span className="text-[var(--marfil)]/65">—</span>
              ) : (
                fmtPct(r.winRate)
              )}
            </td>
            {showNet ? (
              <td className="px-3 py-2 text-right tabular-nums">
                {r.net === null ? (
                  <span className="text-[var(--marfil)]/65">—</span>
                ) : (
                  <span
                    className={
                      r.net > 0
                        ? "text-emerald-300"
                        : r.net < 0
                          ? "text-rose-300"
                          : "text-[var(--marfil)]/80"
                    }
                  >
                    {fmtSigned(r.net)}
                  </span>
                )}
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
