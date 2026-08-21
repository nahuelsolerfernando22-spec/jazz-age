import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Pause, Play, AlertTriangle, ArrowLeft, Heart } from "lucide-react";
import { useGameLock } from "@/store/gameLock";
import { useGamePause } from "@/store/game-pause";
import { useModalBodyFlag } from "@/hooks/use-modal-body-flag";
import { useHaptics } from "@/hooks/use-haptics";
import { leaveGameToLobby } from "@/lib/leave-game-to-lobby";
import { onAppPauseChange } from "@/lib/app-lifecycle";

const GAME_ROUTES = new Set([
  "/blackjack",
  "/chinchon",
  "/truco",
  "/mahjong",
  "/escoba",
  "/dados",
  "/ruleta",
  "/bagatelle",
  "/solitario",
  "/tables",
]);

export function GamePauseButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const started = useGameLock((s) => s.started);
  const locked = useGameLock((s) => s.locked);
  const paused = useGamePause((s) => s.paused);
  const setPaused = useGamePause((s) => s.setPaused);
  const haptic = useHaptics();
  const [confirming, setConfirming] = useState(false);
  useModalBodyFlag(paused || confirming);

  const first = "/" + (location.pathname.split("/")[1] ?? "");
  // Sólo con partida en curso: durante el setup (elegir modo, puntos, flor) no
  // hay nada que pausar y el botón se superponía a los diálogos.
  const active = GAME_ROUTES.has(first) && locked;

  // Reservamos el hueco del botón (arriba a la derecha) para que las
  // cabeceras de mesa no queden debajo en horizontal.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!active) {
      root.style.removeProperty("--cd-hud-inset");
      return;
    }
    root.style.setProperty("--cd-hud-inset", "calc(var(--hud-btn) + 12px)");
    return () => {
      root.style.removeProperty("--cd-hud-inset");
    };
  }, [active]);

  useEffect(() => {
    if (active) return;
    if (paused) setPaused(false);
    setConfirming(false);
  }, [active, paused, setPaused]);

  // Android puede mandar la app a segundo plano en cualquier momento (llamada,
  // notificación, botón home): pausamos la partida sola para que nadie pierda
  // una mano por un aviso del sistema.
  useEffect(() => {
    if (!active) return;
    return onAppPauseChange((isPaused) => {
      if (isPaused) setPaused(true);
    });
  }, [active, setPaused]);

  const open = active && paused;

  const requestLobby = () => {
    haptic("select");
    if (!started) {
      finalizeLobby();
      return;
    }
    setConfirming(true);
  };

  const finalizeLobby = () => {
    setConfirming(false);
    leaveGameToLobby((opts) => navigate(opts));
  };

  const openPause = () => {
    if (paused) return;
    haptic("select");
    setPaused(true);
  };
  const closePause = () => {
    if (!paused) return;
    haptic("tap");
    setConfirming(false);
    setPaused(false);
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!active) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openPause();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label="Pausar partida"
        data-hud="pause"
        className="fixed z-[220] grid place-items-center rounded-full border border-[var(--oro)]/55 bg-[var(--verde-noche)]/95 text-[var(--crema)] shadow-[0_6px_18px_rgba(0,0,0,0.65)] backdrop-blur active:scale-95"
        style={{
          top: "calc(var(--sa-top) + 8px)",
          right: "calc(var(--sa-right) + 10px)",
          width: "var(--hud-btn)",
          height: "var(--hud-btn)",
          touchAction: "manipulation",
        }}
      >
        <Pause
          strokeWidth={2.75}
          fill="currentColor"
          style={{
            width: "var(--hud-btn-icon)",
            height: "var(--hud-btn-icon)",
          }}
        />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="pause-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pause-title"
                data-hud="pause-overlay"
                className="fixed inset-0 z-[400] flex flex-col items-center justify-center px-6 text-center"
                style={{
                  touchAction: "none",
                  paddingTop: "calc(var(--sa-top) + 24px)",
                  paddingBottom: "calc(var(--sa-bottom) + 24px)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={(e) => {
                  if (e.target === e.currentTarget && !confirming) closePause();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {/* Backdrop opaco: bloquea toques al tablero */}
                <div aria-hidden data-backdrop className="absolute inset-0 bg-[#050a09]" />

                {!confirming ? (
                  <motion.div
                    key="pause-panel"
                    initial={{ scale: 0.94, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                    className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl border border-[var(--oro)]/40 bg-gradient-to-b from-[#12201d]/95 to-[#0a1614]/98 px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
                  >
                    <div
                      aria-hidden
                      className="grid h-20 w-20 place-items-center rounded-full border-2 border-[var(--oro)]/70 bg-[var(--verde-noche)] text-[var(--crema)] shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
                    >
                      <Pause
                        strokeWidth={2.5}
                        fill="currentColor"
                        style={{ width: 40, height: 40 }}
                      />
                    </div>

                    <div className="mt-5 font-display text-[11px] uppercase tracking-[0.42em] text-[var(--oro)]/80">
                      ─ pausa ─
                    </div>
                    <h2
                      id="pause-title"
                      className="mt-2 font-script text-4xl leading-tight text-[var(--crema)]"
                    >
                      Partida en curso
                    </h2>
                    <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-[var(--marfil)]/80">
                      El salón queda quieto. Tu tablero, puntaje y tiempo se conservan intactos
                      hasta que vuelvas.
                    </p>
                    {started && (
                      <p className="mt-2 max-w-[280px] text-[11px] leading-relaxed text-[var(--marfil)]/65">
                        Si volvés al lobby ahora se cuenta como abandono y puede costarte una vida.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={closePause}
                      autoFocus
                      className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[var(--oro)]/55 bg-[var(--oro)]/25 px-6 text-base font-semibold uppercase tracking-[0.22em] text-[var(--crema)] shadow-[0_8px_22px_rgba(201,168,76,0.28)] active:scale-[0.98] active:bg-[var(--oro)]/40"
                      style={{ touchAction: "manipulation" }}
                    >
                      <Play
                        strokeWidth={2.5}
                        fill="currentColor"
                        style={{ width: 20, height: 20 }}
                      />
                      Reanudar
                    </button>

                    <button
                      type="button"
                      onClick={requestLobby}
                      className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--marfil)]/80 active:bg-white/[0.09]"
                      style={{ touchAction: "manipulation" }}
                    >
                      Volver al lobby
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pause-confirm"
                    initial={{ scale: 0.94, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl border border-[var(--cd-red)]/50 bg-gradient-to-b from-[#201212]/95 to-[#160a0a]/98 px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.8)]"
                  >
                    <div
                      aria-hidden
                      className="grid h-20 w-20 place-items-center rounded-full border-2 border-[var(--cd-red)]/70 bg-[#160a0a] text-[#f7cccc] shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
                    >
                      <AlertTriangle strokeWidth={2.4} style={{ width: 40, height: 40 }} />
                    </div>

                    <div className="mt-5 font-display text-[11px] uppercase tracking-[0.42em] text-[var(--cd-red)]/90">
                      ─ abandonar ─
                    </div>
                    <h2 className="mt-2 font-script text-3xl leading-tight text-[var(--crema)]">
                      ¿Volver al lobby?
                    </h2>
                    <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-[var(--marfil)]/85">
                      La partida está en curso. Salir cuenta como abandono y
                      <span className="mx-1 inline-flex items-center gap-1 font-semibold text-[#f7cccc]">
                        <Heart
                          strokeWidth={2.5}
                          fill="currentColor"
                          style={{ width: 12, height: 12 }}
                        />
                        te costará 1 vida
                      </span>
                      del contador diario.
                    </p>

                    <button
                      type="button"
                      onClick={finalizeLobby}
                      autoFocus
                      className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-full border-2 border-[var(--cd-red)]/80 bg-[var(--cd-red)]/25 px-6 text-base font-semibold uppercase tracking-[0.22em] text-[var(--crema)] shadow-[0_8px_22px_rgba(201,66,76,0.28)] active:scale-[0.98] active:bg-[var(--cd-red)]/40"
                      style={{ touchAction: "manipulation" }}
                    >
                      <ArrowLeft strokeWidth={2.5} style={{ width: 18, height: 18 }} />
                      Sí, abandonar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(false);
                      }}
                      className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--marfil)]/80 active:bg-white/[0.09]"
                      style={{ touchAction: "manipulation" }}
                    >
                      Seguir jugando
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
