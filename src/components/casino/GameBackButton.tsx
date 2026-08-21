import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, Heart } from "lucide-react";
import { useGameLock } from "@/store/gameLock";
import { useGamePause } from "@/store/game-pause";
import { useLives } from "@/store/lives";
import { useMembership } from "@/store/membership";
import { useHaptics } from "@/hooks/use-haptics";
import { leaveGameToLobby } from "@/lib/leave-game-to-lobby";
import { useModalBodyFlag } from "@/hooks/use-modal-body-flag";

/**
 * Botón "Atrás" universal de las mesas.
 *
 * Reglas (las mismas que aplica `leaveGameToLobby`):
 *  - Partida NO empezada  → se sale gratis, sin confirmación.
 *  - Partida en curso     → confirma y descuenta 1 vida (abandono).
 *  - Socio del club       → nunca cuesta vidas.
 *  - Juegos "libres"      → si el juego no bloquea la salida (`locked === false`,
 *    p. ej. slots/ruleta fuera de encargo) tampoco cuesta vidas.
 */
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
  "/generala",
]);

export function GameBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const locked = useGameLock((s) => s.locked);
  const started = useGameLock((s) => s.started);
  const paused = useGamePause((s) => s.paused);
  const lives = useLives((s) => s.current);
  const member = useMembership((s) => s.member);
  const haptic = useHaptics();
  const [confirming, setConfirming] = useState(false);
  useModalBodyFlag(confirming);
  const confirmingRef = useRef(confirming);
  confirmingRef.current = confirming;
  const requestRef = useRef<() => void>(() => {});

  const first = "/" + (location.pathname.split("/")[1] ?? "");
  const active = GAME_ROUTES.has(first);

  useEffect(() => {
    if (!active && confirming) setConfirming(false);
  }, [active, confirming]);

  // Reservamos el hueco del botón para que la franja de la anfitriona no
  // quede pisada por él (ver SingleHostessCorner).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!active) {
      root.style.removeProperty("--cd-back-inset");
      return;
    }
    root.style.setProperty("--cd-back-inset", "calc(var(--hud-btn) + 6px)");
    return () => {
      root.style.removeProperty("--cd-back-inset");
    };
  }, [active]);

  // Botón físico de Android + tecla Escape usan el mismo diálogo.
  useEffect(() => {
    if (!active) return;
    const onAndroidBack = (e: Event) => {
      if (confirmingRef.current) {
        e.preventDefault();
        setConfirming(false);
        return;
      }
      e.preventDefault();
      requestRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && confirmingRef.current) setConfirming(false);
    };
    window.addEventListener("cuervo:android-back", onAndroidBack);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("cuervo:android-back", onAndroidBack);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  // En mesas con scroll (ruleta) el botón fijo tapaba celdas de apuesta:
  // se esconde al bajar y vuelve al subir o al llegar arriba.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    let last = -1;
    let raf = 0;
    const offsetOf = (t: EventTarget | null) => {
      if (!t || t === document || t === window) {
        return window.scrollY || document.scrollingElement?.scrollTop || 0;
      }
      const el = t as HTMLElement;
      return typeof el.scrollTop === "number" ? el.scrollTop : 0;
    };
    const onScroll = (e: Event) => {
      const y = offsetOf(e.target);
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (last < 0) last = y;
        if (y < 90) setTucked(false);
        else if (y > last + 6) setTucked(true);
        else if (y < last - 6) setTucked(false);
        last = y;
      });
    };
    // capture: los scroll de contenedores internos no burbujean hasta window.
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active]);

  if (!active) return null;

  // Sólo cuesta vida si la mesa está bloqueada (partida en juego con apuesta /
  // encargo activo), ya empezó y no sos socio.
  const costsLife = locked && started && !member;
  // Cualquier partida ya empezada pide confirmación: aunque no cueste vida,
  // salir borra el progreso de la mano/tablero en curso.
  const needsConfirm = started;

  const request = () => {
    haptic("select");
    if (needsConfirm) {
      setConfirming(true);
      return;
    }
    leave();
  };

  requestRef.current = request;

  const leave = () => {
    setConfirming(false);
    leaveGameToLobby((opts) => navigate(opts));
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          request();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label={costsLife ? "Volver al lobby (cuesta 1 vida)" : "Volver al lobby"}
        title={costsLife ? "Volver al lobby — cuesta 1 vida" : "Volver al lobby"}
        data-hud="back"
        className="fixed z-[220] grid place-items-center rounded-full border border-[var(--oro)]/55 bg-[var(--verde-noche)]/95 text-[var(--crema)] shadow-[0_6px_18px_rgba(0,0,0,0.65)] backdrop-blur active:scale-95"
        hidden={paused}

        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 8px)",
          left: "calc(env(safe-area-inset-left, 0px) + 10px)",
          width: "var(--hud-btn)",
          height: "var(--hud-btn)",
          touchAction: "manipulation",
          display: paused ? "none" : undefined,
          transform: tucked && !confirming ? "translateY(-140%)" : "translateY(0)",
          opacity: tucked && !confirming ? 0 : 1,
          pointerEvents: tucked && !confirming ? "none" : undefined,
          transition: "transform 180ms ease, opacity 180ms ease",
        }}
      >
        <ArrowLeft
          strokeWidth={2.75}
          style={{
            width: "var(--hud-btn-icon)",
            height: "var(--hud-btn-icon)",
          }}
        />
        {costsLife && (
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-[var(--cd-red)]/80 bg-[#160a0a] text-[#f7cccc]"
          >
            <Heart strokeWidth={2.5} fill="currentColor" style={{ width: 10, height: 10 }} />
          </span>
        )}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {confirming && (
              <motion.div
                key="back-confirm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="back-confirm-title"
                className="fixed inset-0 z-[400] flex items-center justify-center px-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                style={{ touchAction: "none" }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Seguir jugando"
                  onClick={() => setConfirming(false)}
                  data-backdrop
                  className="absolute inset-0 bg-[#050a09]"
                />
                <motion.div
                  initial={{ scale: 0.94, y: 10, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  className={`relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl border bg-gradient-to-b px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.8)] ${costsLife ? "border-[var(--cd-red)]/50 from-[#201212]/95 to-[#160a0a]/98" : "border-[var(--oro)]/45 from-[#14201a]/95 to-[var(--verde-noche)]/98"}`}
                >
                  <div
                    aria-hidden
                    className={`grid h-20 w-20 place-items-center rounded-full border-2 ${costsLife ? "border-[var(--cd-red)]/70 bg-[#160a0a] text-[#f7cccc]" : "border-[var(--oro)]/70 bg-[var(--verde-noche)] text-[var(--crema)]"}`}
                  >
                    <AlertTriangle strokeWidth={2.4} style={{ width: 40, height: 40 }} />
                  </div>
                  <div
                    className={`mt-5 font-display text-[11px] uppercase tracking-[0.42em] ${costsLife ? "text-[var(--cd-red)]/90" : "text-[var(--oro)]/90"}`}
                  >
                    ─ abandonar ─
                  </div>
                  <h2
                    id="back-confirm-title"
                    className="mt-2 font-script text-3xl leading-tight text-[var(--crema)]"
                  >
                    ¿Dejar la mesa?
                  </h2>
                  {costsLife ? (
                    <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-[var(--marfil)]/85">
                      La partida está en curso: salir cuenta como abandono, perdés el progreso y te
                      costará
                      <span className="mx-1 inline-flex items-center gap-1 font-semibold text-[#f7cccc]">
                        <Heart
                          strokeWidth={2.5}
                          fill="currentColor"
                          style={{ width: 12, height: 12 }}
                        />
                        1 vida
                      </span>
                      (te queda{lives === 1 ? "" : "n"} {lives}).
                    </p>
                  ) : (
                    <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-[var(--marfil)]/85">
                      Se perderá el progreso de esta partida.
                      <span className="mt-1 block text-[var(--oro)]">
                        {member
                          ? "Como socio del club, no te cuesta vidas."
                          : "Esta mesa no descuenta vidas."}
                      </span>
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={leave}
                    autoFocus
                    className={`mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-full border-2 ${costsLife ? "border-[var(--cd-red)]/80 bg-[var(--cd-red)]/25" : "border-[var(--oro)]/80 bg-[var(--oro)]/20"} px-6 text-base font-semibold uppercase tracking-[0.22em] text-[var(--crema)] active:scale-[0.98]`}
                    style={{ touchAction: "manipulation" }}
                  >
                    <ArrowLeft strokeWidth={2.5} style={{ width: 18, height: 18 }} />
                    Sí, salir
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--marfil)]/80 active:bg-white/[0.09]"
                    style={{ touchAction: "manipulation" }}
                  >
                    Seguir jugando
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
