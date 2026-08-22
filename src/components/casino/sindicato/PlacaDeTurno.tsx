import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { faccionDe } from "@/lib/sindicato-facciones";

interface Props {
  /** Índice de la banda que abre el turno: cambia -> aparece la placa. */
  playerIndex: number;
  name: string;
  color: string;
  factionId?: string;
  isBot: boolean;
  round: number;
  /** Si es falso, se avisa que la vuelta es de acomodo. */
  canAssault: boolean;
}

/**
 * Placa de cine noir entre turnos: dos filetes de latón que se abren, el sello
 * de la banda y una línea de bajada. Dura poco y no bloquea el toque.
 */
export function PlacaDeTurno({
  playerIndex,
  name,
  color,
  factionId,
  isBot,
  round,
  canAssault,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(t);
  }, [playerIndex, round]);

  const faccion = faccionDe(factionId);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`${playerIndex}-${round}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center"
        >
          <motion.div
            initial={{ scaleX: 0.7, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0.9, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[86%] max-w-sm overflow-hidden rounded-xl border-y-2 border-[var(--oro)]/80 bg-black/88 px-4 py-3 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black text-xl font-black text-black"
                style={{ backgroundColor: color }}
              >
                {faccion.sello}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bebas text-2xl leading-none text-[var(--crema-clara)]">
                  {isBot ? `Mueve ${name}` : `Tu turno, ${name}`}
                </span>
                <span className="block truncate text-[11px] font-black uppercase tracking-[0.2em] text-[var(--oro)]">
                  {canAssault
                    ? `${faccion.nombre} · vuelta ${round}`
                    : `${faccion.nombre} · vuelta ${round} de acomodo`}
                </span>
              </span>
            </div>

            {/* Barrido de luz de proyector, una sola pasada. */}
            <motion.span
              aria-hidden
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[var(--oro)]/25 to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
