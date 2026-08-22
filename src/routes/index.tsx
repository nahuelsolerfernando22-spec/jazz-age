import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SINGLE_GAMES } from "@/lib/single-games";
import { useSingleScores } from "@/store/single-scores";
import { BrassButton } from "@/components/casino/BrassButton";
import { NoirBackdrop } from "@/components/single/NoirBackdrop";
import { OrnamentoTinta } from "@/components/casino/DecoIcons";
import { useRouteVeil } from "@/hooks/use-route-veil";
import brandMedallion from "@/assets/brand-medallion.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "El Cuervo Dorado — Portada del salón" },
      {
        name: "description",
        content:
          "Portada de El Cuervo Dorado: entrá al salón clandestino de 1928 y seguí tu última partida de naipes y casino, sin conexión.",
      },
      { property: "og:title", content: "El Cuervo Dorado — Portada del salón" },
      {
        property: "og:description",
        content: "Speakeasy de bolsillo: entrá al salón o continuá tu última mesa, todo offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortadaPage,
});

function PortadaPage() {
  useRouteVeil("none");
  const navigate = useNavigate();
  const scoreFor = useSingleScores((s) => s.get);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const ultima = useMemo(() => {
    if (!mounted) return null;
    let best: { name: string; to: string; at: number } | null = null;
    for (const g of SINGLE_GAMES) {
      const sc = scoreFor(g.id);
      if (sc.lastAt && (!best || sc.lastAt > best.at)) {
        best = { name: g.name, to: g.to, at: sc.lastAt };
      }
    }
    return best;
  }, [mounted, scoreFor]);

  return (
    <div
      className="relative flex h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--cd-noir-0)] px-6 text-center"
      style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
    >
      <NoirBackdrop variant="hub" />

      <div className="relative flex flex-col items-center">
        <img
          src={brandMedallion}
          alt=""
          aria-hidden
          width={96}
          height={96}
          className="h-20 w-20 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.9)] sm:h-24 sm:w-24"
        />
        <p className="paria-eyebrow mt-4">— Club clandestino · 1928 —</p>
        <h1 className="paria-sign mt-1 text-4xl leading-none sm:text-6xl">EL CUERVO DORADO</h1>
        <OrnamentoTinta size={30} className="mt-3 text-[var(--oro)]/80" />
        <p
          className="mt-3 max-w-xs text-[13px] italic text-[var(--marfil)]/75"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          La puerta está sin cartel. Golpeá tres veces y sentate a jugar.
        </p>

      <div
        className="relative mt-8 flex w-full max-w-xs flex-col gap-2.5"
        style={{ paddingBottom: "calc(78px + var(--sa-bottom))" }}
      >
        <BrassButton variant="primary" size="lg" block onClick={() => navigate({ to: "/single" })}>
          Entrar al salón
        </BrassButton>
        {ultima ? (
          <BrassButton variant="blood" size="md" block onClick={() => navigate({ to: ultima.to })}>
            Continuar · {ultima.name}
          </BrassButton>
        ) : null}
        <Link to="/ajustes" className="w-full">
          <BrassButton variant="ghost" size="md" block>
            Ajustes
          </BrassButton>
        </Link>
        <p className="mt-1 text-[10px] leading-snug tracking-wide text-[var(--marfil)]/45">
          Juego de casino simulado. Fichas ficticias, sin dinero real ni premios. +18.{" "}
          <Link to="/privacidad" className="cd-hit-44 underline underline-offset-2 hover:text-[var(--oro)]">
            Privacidad
          </Link>
        </p>
      </div>

    </div>
  );
}
