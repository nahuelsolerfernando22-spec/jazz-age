import { motion, AnimatePresence } from "framer-motion";
import { useSolitarioRun } from "@/store/games/solitario/solitario-run";
import { useGameOutcome } from "@/hooks/use-game-outcome";

export function SolitarioVictoryScreen() {
  const result = useSolitarioRun((s) => s.lastResult);
  useGameOutcome(result ? (result.won ? "win" : "loss") : null);
  const reason = useSolitarioRun((s) => s.lastEndReason);
  const ack = useSolitarioRun((s) => s.ackResult);
  if (!result || !reason) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={ack}
      >
        <motion.div
          initial={{ scale: 0.9, y: 8 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-h-[78svh] max-w-md overflow-y-auto rounded-md border-2 p-5 text-center ${
            result.won ? "border-[var(--oro)] bg-[#12100c]" : "border-red-500 bg-[#180a0a]"
          }`}
        >
          <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--oro)]/80">
            Encargo · {result.levelId}
          </div>
          <h2 className="mt-2 font-display text-3xl uppercase tracking-[0.2em] text-[var(--oro-claro)]">
            {result.won
              ? "Ganaste"
              : reason === "lost-clock"
                ? "Se acabó el reloj"
                : reason === "lost-moves"
                  ? "Sin jugadas"
                  : "Abandonaste"}
          </h2>
          <div className="mt-3 font-display text-3xl text-[var(--oro-claro)]">
            {"★".repeat(result.stars)}
            <span className="text-[var(--marfil)]/65">{"★".repeat(3 - result.stars)}</span>
          </div>
          <div className="mt-2 text-sm text-[var(--marfil)]/80">
            {Math.floor(result.seconds / 60)}:{(result.seconds % 60).toString().padStart(2, "0")}
          </div>
          {result.reward > 0 ? (
            <div className="mt-4 font-numerals text-2xl text-[var(--oro-claro)]">
              +{result.reward.toLocaleString("es-AR")}¢
            </div>
          ) : null}
          <button
            type="button"
            onClick={ack}
            className="mt-6 rounded-full bg-[var(--oro)] px-6 py-2 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--tinta)] hover:bg-[var(--oro-claro)]"
          >
            Cerrar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
