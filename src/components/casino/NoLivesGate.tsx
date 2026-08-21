import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Link } from "@tanstack/react-router";
import { MAX_LIVES, formatRegen, msUntilNextLife, useLives } from "@/store/lives";
import { useMembership } from "@/store/membership";
import { useCasino } from "@/store/casino";
import { AD_REWARD_CHIPS } from "@/store/daily-rewards";
import { toast } from "sonner";
import { BrassButton } from "@/components/casino/BrassButton";
import { RewardedAdPlayer } from "@/components/casino/RewardedAdPlayer";
import corvinaPortrait from "@/assets/_placeholder.webp";

interface Props {
  open: boolean;
  onClose: () => void;
  line?: string;
}

export function NoLivesGate({ open, onClose, line }: Props) {
  const current = useLives((s) => s.current);
  const lastRegenAt = useLives((s) => s.lastRegenAt);
  const tick = useLives((s) => s.tick);
  const add = useLives((s) => s.add);
  const member = useMembership((s) => s.member);
  const remainingAds = useMembership((s) => s.remainingAds());
  const consumeAd = useMembership((s) => s.consumeAd);
  const addChips = useCasino((s) => s.addChips);
  const [adRunning, setAdRunning] = useState<null | "life" | "chips">(null);
  const [adPlaying, setAdPlaying] = useState<null | "life" | "chips">(null);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    if (open && member) onClose();
  }, [open, member, onClose]);

  function watchRewarded(reward: "life" | "chips") {
    if (adRunning) return;

    if (reward === "life" && useLives.getState().current >= MAX_LIVES) {
      toast.error(`Ya tenés ${MAX_LIVES}/${MAX_LIVES} vidas.`);
      return;
    }
    if (!consumeAd()) {
      toast.error("No quedan funciones por hoy. El reloj de la casa sigue corriendo.");
      return;
    }
    setAdRunning(reward);
    setAdPlaying(reward);
  }

  function finishAd() {
    const reward = adPlaying;
    setAdPlaying(null);
    setAdRunning(null);
    if (reward === "life") {
      add(1);
      toast.success(`+1 vida · ahora ${useLives.getState().current}/${MAX_LIVES}`);
    } else if (reward === "chips") {
      addChips(AD_REWARD_CHIPS);
      toast.success(`+¢${AD_REWARD_CHIPS} — el Cuervo paga por mirar.`);
    }
  }

  function cancelAd() {
    setAdPlaying(null);
    setAdRunning(null);
    toast("Cortaste la función", { description: "Sin función completa no hay premio." });
  }

  useEffect(() => {
    if (!open) return;
    tick();
    const t = window.setInterval(() => {
      tick();
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(t);
  }, [open, tick]);

  useEffect(() => {
    if (open && current > 0) onClose();
  }, [open, current, onClose]);

  const remaining = msUntilNextLife(current, lastRegenAt);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {}
          <div className="absolute inset-0 bg-[var(--noir)]/85 backdrop-blur-md" />
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, rgba(199,160,79,0.25), transparent 55%), radial-gradient(circle at 75% 80%, rgba(115,32,32,0.35), transparent 60%)",
            }}
          />

          <motion.div
            initial={{ y: 24, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-md border border-[var(--brass)]/60 bg-gradient-to-b from-[var(--mahogany)]/90 to-[var(--noir)] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]"
          >
            {}
            <div className="pointer-events-none absolute inset-0 rounded-md border border-[var(--brass)]/25" />
            <div className="pointer-events-none absolute inset-2 rounded-sm border border-[var(--brass)]/15" />

            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 font-display text-base leading-none text-[var(--brass)]/90 transition hover:bg-[var(--noir)]/60 hover:text-[var(--ivory)]"
            >
              ×
            </button>

            {}
            <div className="relative h-44 w-full overflow-hidden border-b border-[var(--brass)]/30">
              <img
                src={corvinaPortrait}
                alt="Madame Corvina"
                className="h-full w-full object-cover object-top opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--noir)]" />
              {}
              <div
                className="absolute inset-0 opacity-30 mix-blend-multiply"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
                }}
              />
            </div>

            <div className="relative px-6 pb-6 pt-4 text-center">
              <p className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/80">
                Madame Corvina
              </p>
              <h2 className="mt-1 font-display text-2xl text-[var(--ivory)]">Sin vidas, querida</h2>
              <p className="mt-2 text-sm italic text-[var(--ivory)]/75">
                {line ?? '"La casa también descansa. Volvé en un rato… o convencé al público."'}
              </p>

              {}
              <div className="mt-4 flex items-center justify-center gap-1.5 leading-none">
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    style={{ fontSize: 22, lineHeight: 1 }}
                    className={i < current ? "text-[var(--blood)]" : "text-[var(--smoke)]/30"}
                  >
                    ♥
                  </span>
                ))}
              </div>

              {}
              <div className="mt-4 inline-flex items-center gap-2 rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/70 px-3 py-1.5">
                <span className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/85">
                  próxima vida
                </span>
                <span className="font-display text-base text-[var(--ivory)] tabular-nums">
                  {current >= MAX_LIVES ? "lleno" : formatRegen(remaining)}
                </span>
              </div>

              {}
              <div className="mt-5 flex flex-col gap-2">
                <p className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                  {remainingAds > 0
                    ? `Mirá una función y elegí tu premio · quedan ${remainingAds}`
                    : "Sin funciones por hoy"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <BrassButton
                    variant="primary"
                    size="md"
                    onClick={() => watchRewarded("life")}
                    disabled={adRunning !== null || remainingAds <= 0 || current >= MAX_LIVES}
                  >
                    {adRunning === "life" ? "Función…" : "+1 vida"}
                  </BrassButton>
                  <BrassButton
                    variant="ghost"
                    size="md"
                    onClick={() => watchRewarded("chips")}
                    disabled={adRunning !== null || remainingAds <= 0}
                  >
                    {adRunning === "chips" ? "Función…" : `+¢${AD_REWARD_CHIPS}`}
                  </BrassButton>
                </div>
                <p className="mt-1 text-[11px] italic text-[var(--ivory)]/55">
                  El Solitario y la Quiniela siguen abiertos — no cuestan vidas.
                </p>
                <button
                  onClick={onClose}
                  className="mt-1 font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90 transition hover:text-[var(--ivory)]"
                >
                  Mirar desde la barra
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <RewardedAdPlayer
        key="rewarded-ad"
        open={adPlaying !== null}
        rewardLabel={adPlaying === "chips" ? `+¢${AD_REWARD_CHIPS}` : "+1 vida"}
        onComplete={finishAd}
        onCancel={cancelAd}
      />
    </AnimatePresence>
  );
}
