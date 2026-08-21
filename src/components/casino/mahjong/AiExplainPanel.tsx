import { motion, AnimatePresence } from "framer-motion";
import type { MahjongAiExplanation } from "@/lib/games/mahjong/mahjong-ai";

export function MahjongAiExplainPanel({
  explain,
  onFollow,
}: {
  explain: MahjongAiExplanation | null;
  onFollow?: () => void;
}) {
  return (
    <AnimatePresence>
      {explain && (
        <motion.div
          key={explain.tileId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
          className="mt-2 flex items-center gap-2 overflow-hidden rounded-sm border border-[var(--brass)]/25 bg-[var(--noir)]/70 px-2 py-1 text-[11px] text-[var(--ivory)]/85 shadow-inner"
        >
          <span
            aria-hidden
            className="shrink-0 font-display text-[11px] uppercase tracking-[0.28em] text-[var(--brass)]/90"
          >
            🐉
          </span>
          <span className="min-w-0 flex-1 truncate leading-tight">{explain.reason}</span>
          <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-[var(--brass)]/90">
            {explain.completesMatch
              ? "·par"
              : explain.isSpecial
                ? "·esp"
                : `EV ${Math.round(explain.score)}`}
          </span>
          {onFollow && (
            <button
              type="button"
              onClick={onFollow}
              className="shrink-0 rounded-sm border border-[var(--brass)]/40 bg-[var(--mahogany)]/60 px-2 py-0.5 font-display text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]/90 hover:bg-[var(--blood)]/60"
            >
              Ver
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
