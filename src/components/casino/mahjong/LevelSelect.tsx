import { motion, AnimatePresence } from "framer-motion";
import { LEVELS, type LevelDef } from "@/lib/games/mahjong/mahjong-levels";
import { useMahjongProgression } from "@/hooks/use-mahjong-progression";
import { LayoutPreview } from "./LayoutPreview";

interface Props {
  open: boolean;
  currentLevelId: string;
  onClose: () => void;
  onPick: (levelId: string) => void;
}

export function LevelSelect({ open, currentLevelId, onClose, onPick }: Props) {
  const prog = useMahjongProgression();
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-[oklch(0_0_0/0.85)] p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl rounded-sm border-2 border-[var(--brass)]/60 bg-[var(--noir)] p-6 shadow-deep"
        >
          {}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--brass)]/30 pb-3">
            <div>
              <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
                — Salas del Cuervo —
              </div>
              <h2 className="font-script text-3xl text-[var(--brass-bright)]">
                Elegí mesa, encanto
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <RankCard rank={prog.rank} xp={prog.state.xp} />
              <div className="text-right">
                <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                  Estrellas
                </div>
                <div className="font-script text-2xl text-[oklch(0.92_0.18_75)]">
                  ★ {prog.totalStars}
                  <span className="text-sm text-[var(--brass)]/90">/{prog.maxStars}</span>
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
          </div>

          {}
          <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.filter((l) => !l.practice).map((lv) => {
              const p = prog.getProgress(lv.id);
              const unlocked = prog.isUnlocked(lv.id);
              const isCurrent = currentLevelId === lv.id;
              return (
                <LevelCard
                  key={lv.id}
                  level={lv}
                  stars={p.stars}
                  best={p.bestScore}
                  unlocked={unlocked}
                  current={isCurrent}
                  onPick={() => {
                    if (!unlocked) return;
                    onPick(lv.id);
                    onClose();
                  }}
                />
              );
            })}
          </div>

          {LEVELS.some((l) => l.practice) && (
            <>
              <div className="mt-6 flex items-center gap-3 border-t border-[var(--brass)]/30 pt-3">
                <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
                  — Mesas Libres —
                </div>
                <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                  sin sellos · sin reloj
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {LEVELS.filter((l) => l.practice).map((lv) => {
                  const p = prog.getProgress(lv.id);
                  const isCurrent = currentLevelId === lv.id;
                  return (
                    <LevelCard
                      key={lv.id}
                      level={lv}
                      stars={p.stars}
                      best={p.bestScore}
                      unlocked={true}
                      current={isCurrent}
                      onPick={() => {
                        onPick(lv.id);
                        onClose();
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function LevelCard({
  level,
  stars,
  best,
  unlocked,
  current,
  onPick,
}: {
  level: LevelDef;
  stars: 0 | 1 | 2 | 3;
  best: number;
  unlocked: boolean;
  current: boolean;
  onPick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={!unlocked}
      whileHover={unlocked ? { y: -3 } : undefined}
      whileTap={unlocked ? { scale: 0.97 } : undefined}
      className={`group relative flex flex-col items-stretch overflow-hidden rounded-sm border-2 p-3 text-left transition-colors ${
        current
          ? "border-[var(--brass-bright)] bg-[var(--mahogany)]/40"
          : unlocked
            ? level.boss
              ? "border-[var(--blood)]/70 bg-gradient-to-br from-[var(--mahogany)]/50 to-[var(--noir)] hover:border-[var(--blood)] shadow-[0_0_18px_oklch(0.35_0.18_25_/_0.35)]"
              : "border-[var(--brass)]/40 bg-[var(--noir-soft)] hover:border-[var(--brass-bright)] hover:bg-[var(--mahogany)]/30"
            : "border-[var(--brass)]/20 bg-[var(--noir-soft)]/40"
      }`}
    >
      {level.boss && unlocked && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-sm border border-[var(--blood)]/70 bg-[var(--blood)]/20 px-1.5 py-0.5 font-display text-[11px] uppercase tracking-[0.3em] text-[oklch(0.9_0.15_25)]">
          Jefe
        </div>
      )}
      {}
      <div className="mb-2 flex items-center justify-between">
        <div className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
          Mesa {level.order}
        </div>
        <Stars value={stars} />
      </div>
      <div
        className={`font-script text-xl leading-tight ${
          unlocked ? "text-[var(--ivory)]" : "text-[var(--brass)]/90"
        }`}
      >
        {level.title}
      </div>
      <div className="mb-3 font-display text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90">
        {level.subtitle}
      </div>

      {}
      <div className="mb-3 flex items-center justify-center rounded-sm border border-[var(--brass)]/20 bg-[var(--noir)] p-2">
        <LayoutPreview
          positions={level.positions}
          width={180}
          height={96}
          color={
            current ? "oklch(0.85 0.18 75)" : unlocked ? "oklch(0.7 0.10 65)" : "oklch(0.4 0.04 50)"
          }
        />
      </div>

      <div className="flex items-center justify-between font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        <span>{level.positions.length} fichas</span>
        <span>
          Mejor: <span className="text-[var(--brass-bright)]">{best || "—"}</span>
        </span>
      </div>
      <div className="mt-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        ★ {level.starThresholds[0]} · ★★ {level.starThresholds[1]} · ★★★ {level.starThresholds[2]}
      </div>

      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0_0_0/0.6)]">
          <div className="flex flex-col items-center gap-1 font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/80">
            <LockIcon />
            Ganá ★ en la mesa anterior
          </div>
        </div>
      )}
    </motion.button>
  );
}

function Stars({ value }: { value: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star key={i} on={i <= value} />
      ))}
    </div>
  );
}

function Star({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
        fill={on ? "oklch(0.92 0.18 80)" : "oklch(0.25 0.02 60)"}
        stroke={on ? "oklch(0.78 0.16 70)" : "oklch(0.35 0.02 60)"}
        strokeWidth="1"
        style={{ filter: on ? "drop-shadow(0 0 4px oklch(0.85 0.18 75))" : "none" }}
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function RankCard({
  rank,
  xp,
}: {
  rank: ReturnType<typeof useMahjongProgression>["rank"];
  xp: number;
}) {
  return (
    <div className="min-w-[180px] rounded-sm border border-[var(--brass)]/40 bg-gradient-to-br from-[var(--mahogany)]/60 to-[var(--noir)] px-3 py-2">
      <div className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
        Rango
      </div>
      <div className="font-script text-lg leading-tight text-[var(--brass-bright)]">
        {rank.current.name}
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--noir)]">
        <motion.div
          className="h-full"
          animate={{ width: `${rank.progress * 100}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{
            background: "linear-gradient(90deg, oklch(0.62 0.14 60), oklch(0.92 0.18 75))",
          }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
        <span>{xp} XP</span>
        {rank.next && <span>→ {rank.next.name}</span>}
      </div>
    </div>
  );
}
