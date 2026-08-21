import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { allSingleHostesses } from "@/lib/single-hostess";

export const Route = createFileRoute("/camerinos")({
  head: () => ({
    meta: [
      { title: "Camerinos — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Los camerinos del Cuervo Dorado: retratos de las anfitrionas de cada mesa, su sala y su frase de bienvenida.",
      },
      { property: "og:title", content: "Camerinos — El Cuervo Dorado" },
      {
        property: "og:description",
        content: "Retratos de las anfitrionas del Cuervo Dorado, sala por sala.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CamerinosPage,
});

const GAME_LABEL: Record<string, string> = {
  blackjack: "Veintiuno de Medianoche",
  chinchon: "Chinchón",
  truco: "Truco",
  mahjong: "Mahjong",
  escoba: "Escoba de Quince",
  dados: "Cinco Huesos",
  ruleta: "Ruleta",
  slots: "Tragamonedas",
  bagatelle: "Bagatelle",
  solitario: "La Mano Muerta",
};

const GAME_TO: Record<string, string> = {
  blackjack: "/tables",
  chinchon: "/chinchon",
  truco: "/truco",
  mahjong: "/mahjong",
  escoba: "/escoba",
  dados: "/dados",
  ruleta: "/ruleta",
  bagatelle: "/bagatelle",
  solitario: "/solitario",
};

function CamerinosPage() {
  const list = allSingleHostesses();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = list.find((h) => h.hostess.npcId === openId) ?? null;

  return (
    <main className="cuervo-game-root min-h-svh px-3 pt-[calc(var(--cd-content-offset,72px))] pb-[calc(var(--app-tabbar-h,74px)+32px)]">
      <header className="mx-auto max-w-[560px] px-1 pb-4">
        <h1
          className="text-[26px] uppercase tracking-[0.28em] text-[var(--oro,var(--cd-gold))]"
          style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}
        >
          Camerinos
        </h1>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--marfil)]/65">
          Los retratos salieron de las mesas para dejar el paño libre. Acá quedan colgados,
          uno por sala.
        </p>
      </header>

      <div className="mx-auto grid max-w-[560px] grid-cols-2 gap-3">
        {list.map(({ gameId, hostess }) => (
          <button
            key={`${gameId}-${hostess.npcId}`}
            type="button"
            onClick={() => setOpenId(hostess.npcId)}
            className="group relative overflow-hidden rounded-[14px] border-2 border-[var(--brass-bright,var(--cd-gold))]/40 bg-black/40 text-left shadow-deep transition active:scale-[0.98]"
          >
            <img
              src={hostess.portrait}
              alt={`Retrato de ${hostess.name}`}
              loading="lazy"
              className="aspect-[3/4] w-full object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-6">
              <p
                className="truncate text-[13px] uppercase tracking-[0.14em] text-[var(--oro,var(--cd-gold))]"
                style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}
              >
                {hostess.name}
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.2em] text-[var(--marfil)]/60">
                {GAME_LABEL[gameId] ?? gameId}
              </p>
            </div>
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-3"
          role="dialog"
          aria-modal="true"
          aria-label={`Camerino de ${open.hostess.name}`}
          onClick={() => setOpenId(null)}
        >
          <div
            className="w-full max-w-[420px] overflow-hidden rounded-[16px] border-2 border-[var(--brass-bright,var(--cd-gold))]/60 bg-[var(--noir,#0d0b0a)]/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={open.hostess.portrait}
              alt={`Retrato de ${open.hostess.name}`}
              className="max-h-[46svh] w-full object-cover object-top"
            />
            <div className="p-4">
              <p
                className="text-[20px] uppercase tracking-[0.16em] text-[var(--oro,var(--cd-gold))]"
                style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}
              >
                {open.hostess.name}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[var(--marfil)]/55">
                {GAME_LABEL[open.gameId] ?? open.gameId}
              </p>
              <p className="mt-3 text-[13px] italic leading-relaxed text-[var(--marfil)]/85">
                «{open.hostess.greet}»
              </p>
              <div className="mt-4 flex gap-2">
                {GAME_TO[open.gameId] ? (
                  <Link
                    to={GAME_TO[open.gameId]!}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[var(--oro,var(--cd-gold))]/60 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--oro,var(--cd-gold))]"
                  >
                    Ir a su mesa
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/75"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
