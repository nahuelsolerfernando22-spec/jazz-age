import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { BrassButton } from "@/components/casino/BrassButton";
import { RewardedAdPlayer } from "@/components/casino/RewardedAdPlayer";
import { IconCorazon } from "@/components/casino/DecoIcons";
import {
  MAX_LIVES,
  REGEN_MS,
  formatLongWait,
  formatRegen,
  msUntilFull,
  msUntilNextLife,
  useLives,
} from "@/store/lives";
import { useMembership } from "@/store/membership";

const REGEN_MIN = Math.round(REGEN_MS / 60000);

/**
 * "Sala de descanso": único lugar donde se explican y se usan las dos vías de
 * recuperación de vidas — esperar el reloj de la casa o mirar una función.
 * Se abre desde el corazón del HUD en cualquier pantalla.
 */
export function LivesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const current = useLives((s) => s.current);
  const lastRegenAt = useLives((s) => s.lastRegenAt);
  const tick = useLives((s) => s.tick);
  const add = useLives((s) => s.add);
  const member = useMembership((s) => s.member);
  const remainingAds = useMembership((s) => s.remainingAds());
  const consumeAd = useMembership((s) => s.consumeAd);
  const [adOpen, setAdOpen] = useState(false);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    tick();
    const t = window.setInterval(() => {
      tick();
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(t);
  }, [open, tick]);

  const full = current >= MAX_LIVES;
  const remaining = msUntilNextLife(current, lastRegenAt);
  const toFull = msUntilFull(current, lastRegenAt);

  function startAd() {
    if (full) {
      toast.error(`Ya tenés ${MAX_LIVES}/${MAX_LIVES} vidas.`);
      return;
    }
    if (!consumeAd()) {
      toast.error("No quedan funciones por hoy. El reloj sigue corriendo igual.");
      return;
    }
    setAdOpen(true);
  }

  const finishAd = useCallback(() => {
    setAdOpen(false);
    add(1);
    const next = useLives.getState().current;
    toast.success(`+1 vida · ahora ${next}/${MAX_LIVES}`);
  }, [add]);

  const cancelAd = useCallback(() => {
    setAdOpen(false);
    toast("Cortaste la función", { description: "Sin función completa no hay corazón." });
  }, []);

  // El HUD tiene transform/backdrop-filter: sin portal, `fixed` se ancla al
  // HUD y la hoja queda recortada fuera de vista.
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Cerrar sala de descanso"
              onClick={onClose}
              className="absolute inset-0 bg-[var(--noir)]/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              role="dialog"
              aria-modal="true"
              aria-label="Recuperar vidas"
              className="relative w-full max-w-md overflow-hidden rounded-t-md border border-[var(--brass)]/55 bg-gradient-to-b from-[var(--mahogany)]/90 to-[var(--noir)] px-5 pt-5 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.9)] sm:rounded-md"
              style={{ paddingBottom: "max(1.25rem, var(--sa-bottom))" }}
            >
              <div className="pointer-events-none absolute inset-2 rounded-sm border border-[var(--brass)]/15" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[10px] uppercase tracking-[0.45em] text-[var(--brass)]/80">
                    sala de descanso
                  </p>
                  <h2 className="mt-1 font-display text-xl text-[var(--ivory)]">
                    {full ? "Corazón completo" : "Recuperar vidas"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="cd-hit-44 rounded-full px-2 py-0.5 font-display text-base leading-none text-[var(--brass)]/90 transition hover:text-[var(--ivory)]"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <IconCorazon
                    key={i}
                    size={26}
                    style={{
                      color: i < current ? "var(--blood, #c8442f)" : "rgba(236,235,230,0.22)",
                    }}
                  />
                ))}
              </div>

              {/* Vía 1 — el reloj de la casa */}
              <div className="mt-5 rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/70 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                    el reloj de la casa
                  </span>
                  <span className="font-display text-base text-[var(--ivory)] tabular-nums">
                    {full ? "lleno" : formatRegen(remaining)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--brass)]/15">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--blood)] to-[var(--brass-bright)] transition-[width] duration-500"
                    style={{ width: `${full ? 100 : ((REGEN_MS - remaining) / REGEN_MS) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] italic leading-tight text-[var(--ivory)]/60">
                  {full
                    ? `Una vida cada ${REGEN_MIN} minutos, hasta ${MAX_LIVES}. Sigue corriendo con el juego cerrado.`
                    : `Un corazón cada ${REGEN_MIN} minutos, también con el juego cerrado. Sala llena en ${formatLongWait(toFull)}.`}
                </p>
              </div>

              {/* Vía 2 — la función */}
              <div className="mt-3 rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/70 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                    función del cuervo
                  </span>
                  <span className="font-display text-[11px] uppercase tracking-[0.2em] text-[var(--smoke)] tabular-nums">
                    {member ? "socio · sin tandas" : `quedan ${remainingAds}`}
                  </span>
                </div>
                <p className="mt-1 text-[11px] italic leading-tight text-[var(--ivory)]/60">
                  Mirá una función corta y te llevás un corazón al instante.
                </p>
                <div className="mt-2">
                  <BrassButton
                    variant="primary"
                    size="md"
                    onClick={startAd}
                    disabled={full || remainingAds <= 0}
                  >
                    {full ? "Vidas al máximo" : remainingAds <= 0 ? "Sin funciones hoy" : "+1 vida"}
                  </BrassButton>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] italic text-[var(--ivory)]/50">
                El Solitario y la Quiniela siguen abiertos — no cuestan vidas.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RewardedAdPlayer
        open={adOpen}
        rewardLabel="+1 vida"
        onComplete={finishAd}
        onCancel={cancelAd}
      />
    </>,
    document.body,
  );
}
