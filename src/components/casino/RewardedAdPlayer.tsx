import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { BrassButton } from "@/components/casino/BrassButton";
import { useHaptics } from "@/hooks/use-haptics";

export const AD_DURATION_MS = 6000;

interface Props {
  open: boolean;
  /** Qué se lleva el espectador si aguanta la función completa. */
  rewardLabel: string;
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * "Función del Cuervo": reproductor de anuncio recompensado. Hoy simula la
 * tanda (el APK es 100% offline); cuando se conecte una red real de ads,
 * basta con reemplazar el temporizador por los callbacks del SDK y dejar
 * intacto el contrato de onComplete / onCancel.
 */
export function RewardedAdPlayer({ open, rewardLabel, onComplete, onCancel }: Props) {
  const haptic = useHaptics();
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      doneRef.current = false;
      return;
    }
    startedAt.current = Date.now();
    doneRef.current = false;
    setElapsed(0);
    const id = window.setInterval(() => {
      const ms = Date.now() - startedAt.current;
      setElapsed(ms);
      if (ms >= AD_DURATION_MS && !doneRef.current) {
        doneRef.current = true;
        window.clearInterval(id);
        haptic("success");
        onComplete();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [open, onComplete, haptic]);

  const pct = Math.min(100, (elapsed / AD_DURATION_MS) * 100);
  const left = Math.max(0, Math.ceil((AD_DURATION_MS - elapsed) / 1000));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Función del Cuervo"
        >
          <div className="absolute inset-0 bg-[var(--cd-ink,#07060a)]/95 backdrop-blur-md" />

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="relative w-full max-w-md overflow-hidden rounded-md border border-[var(--brass)]/60 bg-[var(--noir)] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]"
          >
            {/* Pantalla de proyección con haz de luz y grano */}
            <div className="relative aspect-video w-full overflow-hidden border-b border-[var(--brass)]/30 bg-black">
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0.55, 0.9, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 0%, rgba(199,160,79,0.35), transparent 60%), radial-gradient(circle at 50% 100%, rgba(115,32,32,0.35), transparent 65%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <span className="font-display text-[10px] uppercase tracking-[0.45em] text-[var(--brass)]/80">
                  función del cuervo
                </span>
                <span className="font-display text-2xl text-[var(--ivory)]">{rewardLabel}</span>
                <span className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--smoke)] tabular-nums">
                  {left > 0 ? `termina en ${left}s` : "gracias por mirar"}
                </span>
              </div>
            </div>

            {/* Barra de avance en bronce */}
            <div className="h-1.5 w-full bg-[var(--brass)]/15">
              <div
                className="h-full bg-gradient-to-r from-[var(--brass)] to-[var(--brass-bright)] transition-[width] duration-100"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-left text-[11px] italic leading-tight text-[var(--ivory)]/60">
                Aguantá la función completa y cobrás {rewardLabel.toLowerCase()}.
              </p>
              <BrassButton variant="ghost" size="sm" onClick={onCancel}>
                Cortar
              </BrassButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
