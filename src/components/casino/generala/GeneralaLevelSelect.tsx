import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { GENERALA_LEVELS, type GeneralaLevelDef } from "@/lib/generala-levels";
import { useGeneralaProgression } from "@/hooks/use-generala-progression";
import { useCasino } from "@/store/casino";

interface Props {
  open: boolean;
  currentLevelId: string;
  onClose: () => void;
  onPick: (id: string) => void;
}

export function GeneralaLevelSelect({ open, currentLevelId, onClose, onPick }: Props) {
  const prog = useGeneralaProgression();
  const addChips = useCasino((s) => s.addChips);
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-[oklch(0_0_0/0.85)] p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl rounded-sm border-2 border-[var(--brass)]/60 bg-[var(--noir)] p-5 shadow-deep"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--brass)]/30 pb-3">
            <div>
              <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
                — Salones de Generala —
              </div>
              <h2 className="font-script text-3xl text-[var(--brass-bright)]">
                Sentate donde te llamen
              </h2>
              <div className="mt-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                Rango · <span className="text-[var(--ivory)]">{prog.rank.current.name}</span>
                {" · "}★ {prog.totalStars}/{prog.maxStars} · {prog.state.xp} XP
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-[var(--brass)]/50 bg-[var(--noir-soft)] px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/80 hover:bg-[var(--mahogany)]"
            >
              Cerrar
            </button>
          </div>

          <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
            {GENERALA_LEVELS.map((lv) => {
              const p = prog.getProgress(lv.id);
              const unlocked = prog.isUnlocked(lv.id);
              const pending = prog.pendingReward(lv.id).amount;
              const claimedTier = prog.state.claimed[lv.id] ?? 0;
              return (
                <Card
                  key={lv.id}
                  level={lv}
                  stars={p.stars}
                  matchesWon={p.matchesWon}
                  bestScore={p.bestScore}
                  bestStreak={p.bestStreak}
                  unlocked={unlocked}
                  current={currentLevelId === lv.id}
                  pendingAmount={pending}
                  claimedTier={claimedTier}
                  onPick={() => {
                    if (!unlocked) return;
                    onPick(lv.id);
                    onClose();
                  }}
                  onClaim={() => {
                    const got = prog.claimRewards(lv.id);
                    if (got > 0) {
                      addChips(got);
                      toast.success(`Cobraste ${got} fichas en ${lv.title}`, {
                        description: "Recompensa de mesa · Generala",
                      });
                    }
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Card({
  level,
  stars,
  matchesWon,
  bestScore,
  bestStreak,
  unlocked,
  current,
  pendingAmount,
  claimedTier,
  onPick,
  onClaim,
}: {
  level: GeneralaLevelDef;
  stars: 0 | 1 | 2 | 3;
  matchesWon: number;
  bestScore: number;
  bestStreak: number;
  unlocked: boolean;
  current: boolean;
  pendingAmount: number;
  claimedTier: number;
  onPick: () => void;
  onClaim: () => void;
}) {
  const skillLabel =
    level.aiSkill === "rookie"
      ? "Zelda · distraída"
      : level.aiSkill === "normal"
        ? "Zelda · atenta"
        : "Zelda · afilada";
  return (
    <motion.div
      whileHover={unlocked ? { y: -3 } : undefined}
      className={`relative overflow-hidden rounded-sm border-2 p-3 ${
        current
          ? "border-[var(--brass-bright)] bg-[var(--mahogany)]/40"
          : unlocked
            ? "border-[var(--brass)]/40 bg-[var(--noir-soft)]"
            : "border-[var(--brass)]/20 bg-[var(--noir-soft)]/40"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
          Mesa {level.order} · {skillLabel}
        </div>
        <Stars value={stars} />
      </div>
      <div
        className={`font-script text-xl ${unlocked ? "text-[var(--ivory)]" : "text-[var(--brass)]/90"}`}
      >
        {level.title}
      </div>
      <div className="mb-1 font-display text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90">
        {level.subtitle}
      </div>
      <p className="mb-2 min-h-[36px] font-serif text-xs italic leading-snug text-[var(--smoke)]">
        «{level.blurb}»
      </p>

      <div className="grid grid-cols-3 gap-1 mb-2">
        {[1, 2, 3].map((t) => {
          const earned = stars >= t;
          const claimed = claimedTier >= t;
          return (
            <div
              key={t}
              className={`rounded-sm border px-1.5 py-1 text-center ${
                claimed
                  ? "border-[var(--brass)]/20 bg-[var(--noir)]/50"
                  : earned
                    ? "border-[oklch(0.78_0.16_70)]/70 bg-[oklch(0.30_0.10_50)]/40"
                    : "border-[var(--brass)]/20 bg-[var(--noir)]/30"
              }`}
            >
              <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                {"★".repeat(t)} · {level.starThresholds[t - 1]}g
              </div>
              <div
                className={`font-script text-sm ${
                  claimed
                    ? "text-[var(--brass)]/90 line-through"
                    : earned
                      ? "text-[oklch(0.92_0.18_75)]"
                      : "text-[var(--brass)]/90"
                }`}
              >
                +{level.rewards[t - 1]}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-2 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        <span>
          ficha · {level.wagerChips[0]}–{level.wagerChips[level.wagerChips.length - 1]}
        </span>
        <span>pago · {level.payoutMult}×</span>
        <span>
          ganadas · <span className="text-[var(--brass-bright)]">{matchesWon}</span>
        </span>
        {bestScore > 0 && <span>mejor · {bestScore}</span>}
        {bestStreak > 0 && <span>racha · {bestStreak}</span>}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={!unlocked}
          className={`flex-1 rounded-sm border px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] transition-colors ${
            unlocked
              ? "border-[var(--brass)]/60 bg-[var(--mahogany)]/30 text-[var(--ivory)] hover:bg-[var(--mahogany)]/60"
              : "cursor-not-allowed border-[var(--brass)]/20 bg-[var(--noir)]/40 text-[var(--brass)]/90"
          }`}
        >
          {current ? "Jugando" : "Sentarse"}
        </button>
        {pendingAmount > 0 && (
          <motion.button
            type="button"
            onClick={onClaim}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-sm border border-[oklch(0.78_0.16_70)] bg-gradient-to-br from-[oklch(0.45_0.12_60)] to-[oklch(0.30_0.10_50)] px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-[oklch(0.98_0.06_85)] shadow-[0_0_12px_oklch(0.7_0.18_75/0.4)]"
          >
            Cobrar +{pendingAmount}
          </motion.button>
        )}
      </div>

      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0_0_0/0.65)]">
          <div className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/80">
            Ganá ★ en la mesa previa
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Stars({ value }: { value: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
            fill={i <= value ? "oklch(0.92 0.18 80)" : "oklch(0.25 0.02 60)"}
            stroke={i <= value ? "oklch(0.78 0.16 70)" : "oklch(0.35 0.02 60)"}
            strokeWidth="1"
            style={{ filter: i <= value ? "drop-shadow(0 0 4px oklch(0.85 0.18 75))" : "none" }}
          />
        </svg>
      ))}
    </div>
  );
}
