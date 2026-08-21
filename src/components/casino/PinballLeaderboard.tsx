import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPinballLeaderboard } from "@/lib/pinball.functions";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { isOfflineDemo } from "@/lib/offline-demo";

type Props = {
  highlightUserId?: string | null;
  metric?: "best_ball" | "score";
  limit?: number;
};

function fmt(n: number) {
  return n.toLocaleString("es-AR");
}

export function PinballLeaderboard({ highlightUserId, metric = "best_ball", limit = 8 }: Props) {
  const fn = useServerFn(getPinballLeaderboard);
  const { user } = useAuth();
  const offline = isOfflineDemo();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["pinball-leaderboard", metric, limit],
    queryFn: () => fn({ data: { mode: "casual", metric, limit } }),
    refetchInterval: 30_000,
    staleTime: 15_000,
    enabled: !offline,
  });

  const rows = data?.rows ?? [];
  const me = highlightUserId ?? user?.id ?? null;

  return (
    <section className="rounded-[0.8rem] border border-[var(--brass)]/40 bg-[oklch(0.07_0.012_25/0.65)] p-3">
      <header className="mb-2 flex items-center justify-between">
        <div>
          <div className="font-display text-[11px] uppercase tracking-[0.38em] text-[var(--brass)]/80">
            salón de la fama
          </div>
          <div className="font-script text-base text-[var(--brass-bright)]">mejor bola</div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-[11px] uppercase tracking-[0.3em] text-[var(--ivory)]/50 hover:text-[var(--brass-bright)]"
        >
          {isFetching ? "…" : "↻"}
        </button>
      </header>

      {isLoading ? (
        <div className="py-6 text-center text-[11px] uppercase tracking-[0.32em] text-[var(--ivory)]/40">
          cargando…
        </div>
      ) : rows.length === 0 ? (
        <div className="py-4 text-center text-xs italic text-[var(--ivory)]/55">
          Nadie ha entrado al salón aún. Podrías ser el primero.
        </div>
      ) : (
        <ol className="space-y-1">
          {rows.map((r, i) => {
            const mine = me && r.id && me === (r as { user_id?: string }).user_id;
            return (
              <li
                key={r.id}
                className={`flex items-center gap-2 rounded-[0.4rem] px-2 py-1.5 text-xs ${
                  mine
                    ? "bg-[oklch(0.25_0.10_55/0.45)] ring-1 ring-[var(--brass-bright)]"
                    : "bg-transparent"
                }`}
              >
                <span className="w-5 text-right font-display text-[11px] tracking-[0.2em] text-[var(--brass)]/90">
                  {i + 1}
                </span>
                <span className="flex-1 truncate font-mono text-[var(--ivory)]">
                  {r.display_name}
                </span>
                <span className="font-mono text-[var(--brass-bright)]">
                  {fmt(metric === "best_ball" ? r.best_ball : r.score)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {!user && (
        <div className="mt-3 rounded-[0.4rem] border border-[var(--brass)]/40 bg-[oklch(0.05_0.01_25/0.5)] p-2 text-center">
          <div className="text-[11px] italic text-[var(--ivory)]/70">
            Tus bolas no se guardan aún.
          </div>
        </div>
      )}
    </section>
  );
}
