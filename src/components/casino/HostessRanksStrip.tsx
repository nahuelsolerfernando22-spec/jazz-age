import { Link } from "@tanstack/react-router";
import { allSingleHostesses } from "@/lib/single-hostess";
import { useHostessRank } from "@/store/hostess-rank";

function HostessRankCard({ gameId, npcId, name }: { gameId: string; npcId: string; name: string }) {
  const { rank, next, progress, record } = useHostessRank(npcId);
  return (
    <Link
      to={`/${gameId}` as "/truco"}
      className="flex w-[150px] shrink-0 flex-col gap-1.5 rounded-md border border-[var(--oro)]/30 bg-[#141008]/90 p-2.5"
    >
      <p className="truncate text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--crema-brillo)]">
        {name.split(" ")[0]}
      </p>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--oro-claro)]">
        {rank.label}
      </p>
      <div className="h-[6px] overflow-hidden rounded-full bg-[#2a2114]">
        <div
          className="h-full rounded-full bg-[var(--oro-claro)]"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="text-[11px] leading-snug text-[var(--marfil)]/80">
        {next
          ? `Faltan ${Math.max(0, next.min - record.affinity)} para ${next.label}`
          : "Rango máximo"}
      </p>
    </Link>
  );
}

export function HostessRanksStrip() {
  const list = allSingleHostesses();
  return (
    <section
      aria-labelledby="rangos-heading"
      className="rounded-lg border border-[var(--oro)]/35 bg-[#0a0806]/95 p-4"
    >
      <header className="mb-2.5">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[var(--oro-viejo)]">
          Reputación
        </p>
        <h2
          id="rangos-heading"
          className="mt-0.5 text-xl text-[var(--crema-brillo)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}
        >
          Tu trato con las anfitrionas
        </h2>
      </header>
      <div className="cd-scroll-x-fade flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map(({ gameId, hostess }) => (
          <HostessRankCard key={gameId} gameId={gameId} npcId={hostess.npcId} name={hostess.name} />
        ))}
      </div>
    </section>
  );
}
