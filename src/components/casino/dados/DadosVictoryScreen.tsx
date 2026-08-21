import { AnimatePresence, motion } from "framer-motion";
import { DADOS_LEVELS, findDadosLevel } from "@/lib/games/dados/dados-levels";
import { useDadosRun } from "@/store/games/dados/dados-run";
import { useGameOutcome } from "@/hooks/use-game-outcome";

const REASON_LABEL: Record<string, string> = {
  won: "Encargo cumplido",
  "lost-matches": "Se acabaron las partidas",
  "lost-budget": "Zelda te comió el margen",
  "lost-clock": "El reloj te ganó",
  abandoned: "Abandonaste el encargo",
};

export function DadosVictoryScreen() {
  const result = useDadosRun((s) => s.lastResult);
  useGameOutcome(result ? (result.won ? "win" : "loss") : null);
  const reason = useDadosRun((s) => s.lastEndReason);
  const ack = useDadosRun((s) => s.ackResult);
  const startRun = useDadosRun((s) => s.startRun);

  return (
    <AnimatePresence>
      {result ? (
        <motion.div
          key="dados-result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          onClick={ack}
          style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-h-[78svh] max-w-md overflow-y-auto rounded-sm border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] ${
              result.won
                ? "border-[var(--oro)] bg-[var(--verde-noche)]"
                : "border-[var(--carmin)]/80 bg-[#1a0a0d]"
            }`}
          >
            <p
              className="text-center text-[11px] uppercase tracking-[0.3em] text-[var(--marfil)]/65"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {reason ? REASON_LABEL[reason] : ""}
            </p>
            <h2
              className={`text-center text-4xl ${result.won ? "text-[var(--oro-claro)]" : "text-[#e94b4b]"}`}
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
            >
              {result.won ? "¡Encargo cumplido!" : "Misión fallida"}
            </h2>
            <p className="mt-1 text-center text-sm text-[var(--marfil)]/80">
              {findDadosLevel(result.levelId)?.title}
            </p>

            {result.won ? (
              <div className="my-6 text-center">
                <p className="text-4xl">
                  {"★".repeat(result.stars)}
                  <span className="text-[var(--marfil)]/65">{"★".repeat(3 - result.stars)}</span>
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[var(--marfil)]/65">
                  {result.matchesUsed} partidas · {result.margin >= 0 ? "+" : ""}
                  {result.margin} margen
                </p>
                <p className="mt-4 text-lg font-semibold text-[var(--oro-claro)]">
                  +{result.reward.toLocaleString("es-AR")} fichas
                </p>
              </div>
            ) : (
              <div className="my-6 text-center text-sm text-[var(--marfil)]/80">
                Los cubiletes esperan. Agitá otra vez cuando estés listo.
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={ack}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro-claro)]"
              >
                Volver al mapa
              </button>
              {result.won ? (
                (() => {
                  const cur = DADOS_LEVELS.find((l) => l.id === result.levelId);
                  const next = cur ? DADOS_LEVELS[cur.order] : undefined;
                  if (!next) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        ack();
                        startRun(next.id);
                      }}
                      className="flex-1 rounded-full border border-[var(--oro)] bg-[var(--oro)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--verde-noche)] hover:bg-[var(--oro-claro)]"
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
                  className="flex-1 rounded-full border border-[var(--carmin)] bg-[var(--carmin)]/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e94b4b] hover:bg-[var(--carmin)]/50"
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
