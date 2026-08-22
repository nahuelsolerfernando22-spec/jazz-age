import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flag, Swords, Briefcase, X } from "lucide-react";
import { useHaptics } from "@/hooks/use-haptics";
import { useRulesSeen } from "@/store/rules-seen";
import type { TurnPhase } from "./TurnBanner";

const CLAVE = "sindicato-onboarding";

interface Paso {
  id: TurnPhase | "naipes";
  icon: typeof Flag;
  titulo: string;
  texto: string;
}

const PASOS: Paso[] = [
  {
    id: "deployment",
    icon: Flag,
    titulo: "1 · Repartí tus tropas",
    texto:
      "Tocá cualquier sector tuyo para sumarle una ficha. Cuando no te queden fichas sueltas, confirmá el despliegue abajo.",
  },
  {
    id: "attack",
    icon: Swords,
    titulo: "2 · Asaltá al vecino",
    texto:
      "Tocá un sector tuyo con 2 o más tropas y después un sector limitrofe del rival. Los dados deciden: gana el número más alto.",
  },
  {
    id: "naipes",
    icon: Briefcase,
    titulo: "3 · Canjeá naipes",
    texto:
      "Cada vez que conquistás, te llevás un naipe. Con tres del mismo palo (o un comodín) canjeás por tropas desde el botón Naipes.",
  },
];

/**
 * Guía de primeros pasos: aparece solo la primera noche y acompaña
 * despliegue, asalto y canje sin tapar el tablero.
 */
export function PrimerosPasos({
  phase,
  activo,
}: {
  phase: TurnPhase;
  activo: boolean;
}) {
  const haptics = useHaptics();
  const seen = useRulesSeen((s) => s.seen[CLAVE] === true);
  const markSeen = useRulesSeen((s) => s.markSeen);
  const [paso, setPaso] = useState(0);
  const [cerrado, setCerrado] = useState(false);

  // El paso sigue la fase real de la mesa: si el jugador ya está asaltando,
  // no tiene sentido seguir explicándole el despliegue.
  useEffect(() => {
    if (phase === "attack") setPaso((p) => Math.max(p, 1));
  }, [phase]);

  const visible = activo && !seen && !cerrado;
  const actual = useMemo(() => PASOS[Math.min(paso, PASOS.length - 1)], [paso]);

  if (!visible) return null;
  const Icon = actual.icon;
  const ultimo = paso >= PASOS.length - 1;

  const cerrar = () => {
    setCerrado(true);
    markSeen(CLAVE);
    haptics("tap");
  };

  return (
    <AnimatePresence>
      <motion.div
        key={actual.id}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        className="pointer-events-auto fixed inset-x-3 z-[88] rounded-2xl border-2 border-[var(--oro)]/60 bg-black/94 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-md"
        style={{ bottom: "calc(5.5rem + var(--sa-bottom))" }}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--oro)]/50 bg-[var(--oro)]/15 text-[var(--oro)]">
            <Icon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bebas text-lg leading-none text-[var(--oro-palido)]">
              {actual.titulo}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[var(--crema-brillo)]/85">
              {actual.texto}
            </p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar guía"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--oro)]/30 text-[var(--oro)]/70 touch-manipulation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5">
            {PASOS.map((p, i) => (
              <span
                key={p.id}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= paso ? "bg-[var(--oro)]" : "bg-white/15"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (ultimo) return cerrar();
              setPaso((p) => p + 1);
              haptics("tap");
            }}
            className="h-10 rounded-xl border-2 border-black bg-[var(--oro)] px-4 font-bebas text-base text-black shadow-[0_3px_0_#000] touch-manipulation"
          >
            {ultimo ? "LISTO" : "SIGUIENTE"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
