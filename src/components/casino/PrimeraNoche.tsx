import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { BrassButton } from "@/components/casino/BrassButton";
import { OrnamentoTinta } from "@/components/casino/DecoIcons";
import { useHaptics } from "@/hooks/use-haptics";
import { track } from "@/lib/analytics";
import { useCasino } from "@/store/casino";
import { MAX_LIVES, REGEN_MS } from "@/store/lives";
import { CUP_BUYIN, CUP_PURSE, CUP_TOTAL_ROUNDS, CUP_ENTRIES_PER_DAY } from "@/lib/cup";

/**
 * Primera noche en el salón: la bienvenida que ve el jugador nuevo una sola vez.
 * Explica en cuatro cartelitos qué es el lugar, cómo funcionan fichas y vidas,
 * y qué es el Torneo del Cuervo. Se marca visto en el store del casino.
 */

interface Paso {
  kicker: string;
  titulo: string;
  cuerpo: string;
  detalle: string;
}

const MINUTOS_REGEN = Math.round(REGEN_MS / 60_000);

const PASOS: Paso[] = [
  {
    kicker: "1928 · Puerto",
    titulo: "El Cuervo Dorado",
    cuerpo:
      "Un salón clandestino detrás de una puerta sin cartel. Naipes criollos, dados y mesas de casino contra la casa y sus habitués.",
    detalle: "Todo funciona sin conexión: el salón viaja con vos.",
  },
  {
    kicker: "La caja",
    titulo: "Fichas para sentarte",
    cuerpo:
      "Cada mesa tiene su entrada. Ganás fichas jugando, con el regalo diario y manteniendo la racha de visitas.",
    detalle: "Si te quedás corto, siempre hay una changa para recuperar.",
  },
  {
    kicker: "El aguante",
    titulo: `${MAX_LIVES} vidas por noche`,
    cuerpo: `Abandonar una mesa empezada te cuesta una vida. Se recuperan solas: una cada ${MINUTOS_REGEN} minutos.`,
    detalle: "También podés canjearlas en la sala de descanso, tocando el corazón del HUD.",
  },
  {
    kicker: "La gloria",
    titulo: "Torneo del Cuervo",
    cuerpo: `Anotate por ¢${CUP_BUYIN} y jugá ${CUP_TOTAL_ROUNDS} rondas de eliminación. Cada ronda paga, y la final reparte ¢${CUP_PURSE[CUP_PURSE.length - 1]}.`,
    detalle: `Hasta ${CUP_ENTRIES_PER_DAY} entradas por día, en el juego que elijas.`,
  },
];

export function PrimeraNoche() {
  const vista = useCasino((s) => s.tutorialSeen);
  const marcar = useCasino((s) => s.markTutorialSeen);
  const haptic = useHaptics();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [i, setI] = useState(0);

  // Se decide en el cliente: el store viene de almacenamiento persistido.
  useEffect(() => {
    if (!vista) {
      setAbierto(true);
      track("tutorial_step", { step: 0 });
    }
  }, [vista]);

  const paso = PASOS[i];
  const ultimo = i === PASOS.length - 1;

  const cerrar = useCallback(
    (motivo: "completado" | "salteado") => {
      marcar();
      setAbierto(false);
      track(motivo === "completado" ? "tutorial_completed" : "tutorial_skipped", { step: i });
    },
    [i, marcar],
  );

  const avanzar = useCallback(() => {
    haptic(ultimo ? "success" : "select");
    if (ultimo) {
      cerrar("completado");
      void navigate({ to: "/single" });
      return;
    }
    const next = i + 1;
    setI(next);
    track("tutorial_step", { step: next });
  }, [cerrar, haptic, i, navigate, ultimo]);

  const contenido = useMemo(
    () => (
      <div
        className="fixed inset-0 z-[240] flex flex-col items-center justify-center px-6"
        role="dialog"
        aria-modal="true"
        aria-label="Bienvenida al salón"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 12%, oklch(0.22 0.03 60 / 0.96), var(--cd-noir-0) 62%)",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            haptic("tap");
            cerrar("salteado");
          }}
          className="absolute right-2 px-4 py-3 text-[10px] uppercase tracking-[0.32em] text-[var(--cd-gold-dim)] transition-colors hover:text-[var(--cd-gold)]"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
        >
          Saltear
        </button>

        <div
          key={i}
          className="animate-fade-in relative w-full max-w-sm border px-6 py-8 text-center"
          style={{
            borderColor: "oklch(0.72 0.11 80 / 0.35)",
            background:
              "linear-gradient(180deg, oklch(0.20 0.02 60 / 0.92), oklch(0.13 0.02 55 / 0.94))",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 oklch(1 0 0 / 0.06)",
            clipPath:
              "polygon(0 14px, 14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))",
          }}
        >
          <div className="mx-auto mb-4 w-24 opacity-70">
            <OrnamentoTinta />
          </div>

          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--cd-gold-dim)]">
            {paso.kicker}
          </p>
          <h2
            className="mt-3 text-2xl text-[var(--cd-gold)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {paso.titulo}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--cd-parchment,oklch(0.88_0.02_80))]/90">
            {paso.cuerpo}
          </p>
          <p className="mt-3 text-xs italic leading-relaxed text-[var(--cd-gold-dim)]">
            {paso.detalle}
          </p>

          <div className="mt-7 flex items-center justify-center gap-2" aria-hidden>
            {PASOS.map((_, n) => (
              <span
                key={n}
                className="h-[3px] transition-all duration-300"
                style={{
                  width: n === i ? 22 : 10,
                  background:
                    n === i ? "var(--cd-gold)" : "oklch(0.72 0.11 80 / 0.28)",
                }}
              />
            ))}
          </div>

          <div className="mt-6">
            <BrassButton block variant="primary" size="lg" onClick={avanzar}>
              {ultimo ? "Abrir la puerta" : "Seguir"}
            </BrassButton>
          </div>
        </div>
      </div>
    ),
    [avanzar, cerrar, haptic, i, paso, ultimo],
  );

  if (!abierto || typeof document === "undefined") return null;
  return createPortal(contenido, document.body);
}
