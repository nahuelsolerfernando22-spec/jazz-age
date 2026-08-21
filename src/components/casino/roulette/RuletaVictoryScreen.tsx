import { AnimatePresence, motion } from "framer-motion";
import { RULETA_LEVELS, findRuletaLevel } from "@/lib/games/ruleta/ruleta-levels";
import { useRuletaRun } from "@/store/games/ruleta/ruleta-run";
import { useGameOutcome } from "@/hooks/use-game-outcome";

const REASON_LABEL: Record<string, string> = {
  won: "Encargo cumplido",
  "lost-spins": "Se te acabaron los giros",
  "lost-budget": "La rueda se comió el fondo",
  "lost-clock": "El reloj te ganó",
  abandoned: "Abandonaste el encargo",
};

export function RuletaVictoryScreen() {
  const result = useRuletaRun((s) => s.lastResult);
  useGameOutcome(result ? (result.won ? "win" : "loss") : null);
  const reason = useRuletaRun((s) => s.lastEndReason);
  const ack = useRuletaRun((s) => s.ackResult);
  const startRun = useRuletaRun((s) => s.startRun);

  return (
    <AnimatePresence>
      {result ? (
        <motion.div
          key="ruleta-result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 pb-[max(0.75rem,var(--sa-bottom))] sm:items-center"
          onClick={ack}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-h-[78svh] max-w-md overflow-y-auto rounded-sm border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] ${
              result.won
                ? "border-[var(--brass)] bg-[var(--noir)]"
                : "border-[var(--blood)]/70 bg-[#1a0a0d]"
            }`}
          >
            <p className="text-center font-display text-[11px] uppercase tracking-[0.3em] text-[var(--smoke)]">
              {reason ? REASON_LABEL[reason] : ""}
            </p>
            <h2
              className={`text-center font-script text-4xl ${result.won ? "text-[var(--brass-bright)]" : "text-[var(--blood)]"}`}
            >
              {result.won ? "¡Encargo cumplido!" : "Misión fallida"}
            </h2>
            <p className="mt-1 text-center text-sm text-[var(--ivory)]/75">
              {findRuletaLevel(result.levelId)?.title}
            </p>

            {result.won ? (
              <div className="my-6 text-center">
                <p className="text-4xl">
                  {"★".repeat(result.stars)}
                  <span className="text-[var(--ivory)]/20">{"★".repeat(3 - result.stars)}</span>
                </p>
                <p className="mt-2 font-display text-xs uppercase tracking-[0.25em] text-[var(--smoke)]">
                  {result.spinsUsed} giros · {result.chipsGained >= 0 ? "+" : ""}
                  {result.chipsGained.toLocaleString("es-AR")} neto
                </p>
                <p className="mt-4 font-display text-lg font-semibold text-[var(--brass-bright)]">
                  +{result.reward.toLocaleString("es-AR")} fichas
                </p>
              </div>
            ) : (
              <div className="my-6 text-center text-sm text-[var(--ivory)]/60">
                La rueda sigue girando. Volvé a apostar cuando estés listo.
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={ack}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ivory)]/75 hover:border-[var(--brass)]/50 hover:text-[var(--brass-bright)]"
              >
                Volver al mapa
              </button>
              {result.won ? (
                (() => {
                  const cur = RULETA_LEVELS.find((l) => l.id === result.levelId);
                  const next = cur ? RULETA_LEVELS[cur.order] : undefined;
                  if (!next) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        ack();
                        startRun(next.id);
                      }}
                      className="flex-1 rounded-full border border-[var(--brass)] bg-[var(--brass)] px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-[var(--noir)] hover:bg-[var(--brass-bright)]"
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
                  className="flex-1 rounded-full border border-[var(--blood)] bg-[var(--blood)]/20 px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blood)] hover:bg-[var(--blood)]/30"
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
