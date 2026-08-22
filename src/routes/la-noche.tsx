import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { BrassButton } from "@/components/casino/BrassButton";
import { useLaNoche } from "@/store/la-noche";
import {
  NOCHE_MESAS,
  NOCHE_PAGO_MESA,
  NOCHE_PREMIO,
  NOCHE_PREMIO_JEFE,
  NOCHE_TOTAL,
  TALISMANES,
  eventoDeNoche,
  ofertaTalismanes,
  pagoDeMesa,
} from "@/lib/la-noche";
import { useHaptics } from "@/hooks/use-haptics";
import bgNoche from "@/assets/app-bg-speakeasy.webp";

export const Route = createFileRoute("/la-noche")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "La Noche — corrida roguelike hasta la mesa del Dueño · El Cuervo Dorado" },
      {
        name: "description",
        content:
          "La Noche encadena cinco mesas del Cuervo Dorado, eventos de pasillo con riesgo y recompensa, talismanes acumulables y un cierre contra el Dueño de la casa.",
      },
      { property: "og:title", content: "La Noche — corrida roguelike hasta la mesa del Dueño" },
      {
        property: "og:description",
        content: "Cinco mesas, eventos de pasillo, talismanes acumulables y la mesa del Dueño. Todo offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LaNochePage,
});

function LaNochePage() {
  const navigate = useNavigate();
  const haptic = useHaptics();
  const noche = useLaNoche();

  const oferta = useMemo(
    () => (noche.fase === "talisman" ? ofertaTalismanes(noche.seed, noche.paso, noche.talismanes) : []),
    [noche.fase, noche.seed, noche.paso, noche.talismanes],
  );
  const evento = useMemo(
    () => (noche.fase === "evento" ? eventoDeNoche(noche.seed, noche.paso) : null),
    [noche.fase, noche.seed, noche.paso],
  );

  const mesaActual = noche.mesas[noche.paso];
  const pago = pagoDeMesa(noche.talismanes, !!mesaActual?.jefe);

  return (
    <GameRoomShell bg={bgNoche} room="la-noche" title="La Noche" subtitle="Cinco mesas y el Dueño">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-3 pb-28 pt-2">
        {noche.fase === "idle" && (
          <Panel>
            <Titulo>Una sola noche, seis mesas</Titulo>
            <p className="mt-2 font-serif text-[14px] leading-relaxed text-[var(--cd-text-main)]">
              La casa arma un recorrido distinto cada vez: {NOCHE_MESAS} mesas en fila y, al final, la
              mesa del Dueño, que paga triple. Entre mesa y mesa cruzás un pasillo con su propio
              enredo —prestamistas, apuestas laterales, coimas— y después elegís un talismán. Ganás{" "}
              {NOCHE_PAGO_MESA} fichas por mesa más lo que sumen tus talismanes, {NOCHE_PREMIO} por
              cerrar con tres mesas y {NOCHE_PREMIO_JEFE} si le ganás al Dueño.
            </p>
            {noche.ultima && (
              <p className="mt-3 font-display text-[11px] uppercase tracking-[0.16em] text-[var(--cd-text-muted)]">
                Última noche: {noche.ultima.ganadas}/{NOCHE_TOTAL} mesas · {noche.ultima.fichas} fichas
                · mejor racha {noche.mejorRacha} · Dueños caídos {noche.jefesCaidos}
              </p>
            )}
            <div className="mt-4">
              <BrassButton
                variant="primary"
                block
                onClick={() => {
                  haptic("chip");
                  noche.empezar();
                }}
              >
                Empezar la noche
              </BrassButton>
            </div>
          </Panel>
        )}

        {noche.fase === "mesa" && mesaActual && (
          <>
            <Panel>
              {noche.aviso && <Aviso texto={noche.aviso} />}
              <Titulo>
                {mesaActual.jefe ? "Mesa final" : `Mesa ${noche.paso + 1} de ${NOCHE_TOTAL}`}
              </Titulo>
              <p className="mt-1 font-display text-[15px] uppercase tracking-[0.14em] text-[var(--cd-gold-bright)]">
                {mesaActual.label}
              </p>
              <p className="mt-1 font-serif text-[13.5px] text-[var(--cd-text-main)]">
                {mesaActual.pedido}
              </p>
              <p className="mt-2 font-display text-[11px] uppercase tracking-[0.16em] text-[var(--cd-text-muted)]">
                Pago si ganás: {pago} fichas{mesaActual.jefe ? " · triple del Dueño" : ""}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <BrassButton
                  variant="primary"
                  block
                  onClick={() => {
                    haptic("tap");
                    void navigate({ to: mesaActual.route });
                  }}
                >
                  Ir a la mesa
                </BrassButton>
                <BrassButton variant="ghost" block onClick={() => noche.abandonar()}>
                  Abandonar la noche
                </BrassButton>
              </div>
            </Panel>
            <Recorrido />
            <Mano />
          </>
        )}

        {noche.fase === "evento" && evento && (
          <>
            <Panel>
              {noche.aviso && <Aviso texto={noche.aviso} />}
              <Titulo>Pasillo</Titulo>
              <p className="mt-1 font-display text-[15px] uppercase tracking-[0.14em] text-[var(--cd-gold-bright)]">
                {evento.titulo}
              </p>
              <p className="mt-1 font-serif text-[13.5px] leading-relaxed text-[var(--cd-text-main)]">
                {evento.texto}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {evento.opciones.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      haptic("chip");
                      noche.elegirOpcion(o);
                    }}
                    className="cd-press min-h-11 rounded-sm border px-3 py-2.5 text-left"
                    style={{ borderColor: "var(--cd-gold-mid)", background: "oklch(0.18 0.03 60 / 0.7)" }}
                  >
                    <span className="block font-display text-[13px] uppercase tracking-[0.14em] text-[var(--cd-gold-bright)]">
                      {o.label}
                    </span>
                    <span className="block font-serif text-[12.5px] text-[var(--cd-text-muted)]">
                      {o.detalle}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
            <Recorrido />
          </>
        )}

        {noche.fase === "talisman" && (
          <>
            <Panel>
              {noche.aviso && <Aviso texto={noche.aviso} />}
              <Titulo>Elegí un talismán</Titulo>
              <p className="mt-1 font-serif text-[13.5px] text-[var(--cd-text-main)]">
                Te queda{NOCHE_TOTAL - noche.paso === 1 ? "" : "n"} {NOCHE_TOTAL - noche.paso} mesa
                {NOCHE_TOTAL - noche.paso === 1 ? "" : "s"}, contando la del Dueño. Lo que agarres
                ahora te acompaña hasta el final.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {oferta.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      haptic("chip");
                      noche.elegirTalisman(t.id);
                    }}
                    className="cd-press min-h-11 rounded-sm border px-3 py-2.5 text-left"
                    style={{
                      borderColor: "var(--cd-gold-mid)",
                      background: "oklch(0.18 0.03 60 / 0.7)",
                    }}
                  >
                    <span className="block font-display text-[13px] uppercase tracking-[0.14em] text-[var(--cd-gold-bright)]">
                      {t.nombre}
                    </span>
                    <span className="block font-serif text-[12.5px] text-[var(--cd-text-muted)]">
                      {t.efecto}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
            <Recorrido />
            <Mano />
          </>
        )}

        {noche.fase === "final" && noche.ultima && (
          <Panel>
            <Titulo>
              {noche.ultima.jefeCaido
                ? "Le ganaste al Dueño"
                : noche.ultima.ganadas >= 3
                  ? "Noche cerrada"
                  : "Te echaron temprano"}
            </Titulo>
            <p className="mt-2 font-serif text-[14px] leading-relaxed text-[var(--cd-text-main)]">
              {noche.ultima.ganadas} de {NOCHE_TOTAL} mesas ganadas. Te llevás {noche.ultima.fichas}{" "}
              fichas
              {noche.ultima.jefeCaido ? ", con el premio del Dueño incluido" : ""}.
            </p>
            <div className="mt-4">
              <BrassButton variant="primary" block onClick={() => noche.ackFinal()}>
                Volver al salón
              </BrassButton>
            </div>
          </Panel>
        )}
      </div>
    </GameRoomShell>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <p
      className="mb-2 rounded-sm border px-2.5 py-1.5 font-serif text-[12.5px] text-[var(--cd-text-main)]"
      style={{ borderColor: "var(--cd-gold-mid)", background: "oklch(0.22 0.04 60 / 0.6)" }}
    >
      {texto}
    </p>
  );
}


function Recorrido() {
  const { mesas, paso } = useLaNoche();
  return (
    <Panel>
      <Titulo>Recorrido</Titulo>
      <ol className="mt-2 flex flex-col gap-1">
        {mesas.map((m, i) => (
          <li
            key={m.gameId}
            className="flex items-center justify-between font-display text-[12px] uppercase tracking-[0.14em]"
            style={{
              color:
                i < paso
                  ? "var(--cd-text-muted)"
                  : i === paso
                    ? "var(--cd-gold-bright)"
                    : "var(--cd-text-main)",
            }}
          >
            <span className="truncate">
              {i + 1}. {m.label}
            </span>
            <span>{i < paso ? "jugada" : i === paso ? "en curso" : "pendiente"}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function Mano() {
  const talismanes = useLaNoche((s) => s.talismanes);
  if (talismanes.length === 0) return null;
  return (
    <Panel>
      <Titulo>Talismanes en la mano</Titulo>
      <ul className="mt-2 flex flex-col gap-1">
        {talismanes.map((id) => {
          const t = TALISMANES.find((x) => x.id === id);
          if (!t) return null;
          return (
            <li key={id} className="font-serif text-[13px] text-[var(--cd-text-main)]">
              <span className="text-[var(--cd-gold-bright)]">{t.nombre}</span> — {t.efecto}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-sm border p-4"
      style={{
        borderColor: "var(--cd-gold-mid)",
        background: "oklch(0.16 0.03 60 / 0.86)",
        boxShadow: "0 12px 40px oklch(0 0 0 / 0.5)",
      }}
    >
      {children}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[13px] uppercase tracking-[0.18em] text-[var(--cd-gold-bright)]">
      {children}
    </p>
  );
}
