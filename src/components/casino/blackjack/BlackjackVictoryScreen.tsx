import { AnimatePresence, motion } from "framer-motion";
import { BLACKJACK_LEVELS, findBlackjackLevel } from "@/lib/games/blackjack/blackjack-levels";
import { useBlackjackRun } from "@/store/games/blackjack/blackjack-run";
import { useGameOutcome } from "@/hooks/use-game-outcome";

const REASON_LABEL: Record<string, string> = {
  won: "Encargo cumplido",
  "lost-hands": "Se te acabaron las manos",
  "lost-budget": "La casa se comió el fondo",
  "lost-clock": "El reloj te ganó",
  abandoned: "Abandonaste el encargo",
};

export function BlackjackVictoryScreen() {
  const result = useBlackjackRun((s) => s.lastResult);
  useGameOutcome(result ? (result.won ? "win" : "loss") : null);
  const reason = useBlackjackRun((s) => s.lastEndReason);
  const ack = useBlackjackRun((s) => s.ackResult);
  const startRun = useBlackjackRun((s) => s.startRun);

  return (
    <AnimatePresence>
      {result ? (
        <motion.div
          key="blackjack-result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          onClick={ack}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-h-[78svh] max-w-md overflow-y-auto rounded-sm border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] ${
              result.won ? "border-[var(--oro)] bg-black" : "border-[var(--carmin)]/70 bg-[#1a0a0d]"
            }`}
            style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
          >
            <p
              className="text-center text-[11px] uppercase tracking-[0.3em] text-white/50"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {reason ? REASON_LABEL[reason] : ""}
            </p>
            <h2
              className={`text-center text-4xl ${result.won ? "text-[#e8d47a]" : "text-[#c14a51]"}`}
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
            >
              {result.won ? "¡Encargo cumplido!" : "Mesa perdida"}
            </h2>
            <p className="mt-1 text-center text-sm text-white/70">
              {findBlackjackLevel(result.levelId)?.title}
            </p>

            {result.won ? (
              <div className="my-6 text-center">
                <p className="text-4xl">
                  {"★".repeat(result.stars)}
                  <span className="text-white/20">{"★".repeat(3 - result.stars)}</span>
                </p>
                <p
                  className="mt-2 text-xs uppercase tracking-[0.25em] text-white/60"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {result.handsUsed} manos · {result.chipsGained >= 0 ? "+" : ""}
                  {result.chipsGained.toLocaleString("es-AR")} neto
                </p>
                <p
                  className="mt-4 text-lg font-semibold text-[#e8d47a]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  +{result.reward.toLocaleString("es-AR")} fichas
                </p>
              </div>
            ) : (
              <div className="my-6 text-center text-sm text-white/60">
                El zapato sigue cargado. Volvé cuando estés listo.
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={ack}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:border-[var(--oro)]/50 hover:text-[#e8d47a]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Volver al mapa
              </button>
              {result.won ? (
                (() => {
                  const cur = BLACKJACK_LEVELS.find((l) => l.id === result.levelId);
                  const next = cur ? BLACKJACK_LEVELS[cur.order] : undefined;
                  if (!next) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        ack();
                        startRun(next.id);
                      }}
                      className="flex-1 rounded-full border border-[var(--oro)] bg-[var(--oro)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:bg-[#e8d47a]"
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      Siguiente: {next.id}
                    </button>
                  );
                })()
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    ack();
                    startRun(result.levelId);
                  }}
                  className="flex-1 rounded-full border border-[var(--carmin)] bg-[var(--carmin)]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c14a51] hover:bg-[var(--carmin)]/30"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  Reintentar
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
