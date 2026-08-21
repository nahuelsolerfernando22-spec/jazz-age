import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "@/lib/games/truco/truco";

export function TrucoHistoryRail({
  g,
  hostShort,
  onHaptic,
}: {
  g: GameState;
  hostShort: string;
  onHaptic?: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("truco:open-history", onOpen);
    return () => window.removeEventListener("truco:open-history", onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentLog = g.hand.log.slice(-20);
  const past = g.history.slice().reverse();
  const totalEvents = currentLog.length + past.length;

  return (
    <>
      {/* Botón integrado en el ScoreBoard footer via window event 'truco:open-history' */}
      <span data-history-events={totalEvents} className="sr-only">
        {totalEvents}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md max-h-[80vh] rounded-t-lg sm:rounded-sm border-2 border-[var(--brass)]/60 bg-[var(--noir)] shadow-deep flex flex-col"
              style={{
                paddingBottom: "max(var(--sa-bottom), 0.75rem)",
              }}
            >
              <div className="flex items-center justify-between p-3 border-b border-[var(--brass)]/25 shrink-0">
                <h3 className="font-display text-lg text-[var(--brass)] tracking-[0.15em]">
                  Historial
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar historial"
                  className="min-w-[44px] min-h-[44px] rounded-sm border border-[var(--brass)]/40 text-[var(--ivory)]/70 hover:text-[var(--brass)] active:brightness-125"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto p-3 space-y-4">
                <section>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90 mb-2">
                    Mano actual · vos {g.scores.you} · {hostShort} {g.scores.ai}
                  </div>
                  {currentLog.length === 0 ? (
                    <p className="text-xs text-[var(--ivory)]/50 italic">
                      Sin movimientos aún en esta mano.
                    </p>
                  ) : (
                    <ol className="space-y-1 text-xs text-[var(--ivory)]/85">
                      {currentLog.map((l, i) => (
                        <li
                          key={i}
                          className="flex gap-2 border-l-2 border-[var(--brass)]/30 pl-2 py-0.5"
                        >
                          <span className="text-[var(--brass)]/90 font-numerals min-w-[1.5rem]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1">{l}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                {past.length > 0 && (
                  <section>
                    <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90 mb-2">
                      Manos anteriores ({past.length})
                    </div>
                    <ul className="space-y-1.5 text-xs text-[var(--ivory)]/80">
                      {past.map((e, i) => {
                        const n = past.length - i;
                        const winnerLabel =
                          e.winner === "you" ? "Vos" : e.winner === "ai" ? g.aiName : "—";
                        return (
                          <li
                            key={i}
                            className="flex items-center justify-between gap-2 rounded-sm bg-black/30 border border-[var(--brass)]/15 px-2 py-1.5"
                          >
                            <span className="text-[var(--brass)]/90 font-numerals w-8">#{n}</span>
                            <span className="flex-1 text-[11px] leading-tight">
                              Mano de{" "}
                              <span className="text-[var(--ivory)]">
                                {e.mano === "you" ? "vos" : g.aiName}
                              </span>
                              {e.envido && (
                                <span className="ml-1 text-[11px] text-[var(--ivory)]/55">
                                  · env {e.envido.you}/{e.envido.ai}
                                </span>
                              )}
                              {e.wentToMazo && (
                                <span className="ml-1 text-[11px] text-red-300/80">· mazo</span>
                              )}
                            </span>
                            <span className="text-[var(--brass)] text-[11px]">
                              {winnerLabel} <span className="font-numerals">+{e.points}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
