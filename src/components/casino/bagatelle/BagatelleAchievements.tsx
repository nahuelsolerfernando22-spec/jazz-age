import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_ID,
  loadUnlocked,
  subscribeAchievementUnlocks,
  type BagatelleAchievementId,
} from "@/lib/games/bagatelle/bagatelle-achievements";
import { getDailyChallenge, loadDailyProgress } from "@/lib/games/bagatelle/bagatelle-daily";

export function BagatelleAchievementToast() {
  const [queue, setQueue] = useState<BagatelleAchievementId[]>([]);

  useEffect(() => {
    const unsub = subscribeAchievementUnlocks((id) => {
      setQueue((q) => (q.includes(id) ? q : [...q, id]));
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const t = window.setTimeout(() => {
      setQueue((q) => q.slice(1));
    }, 3600);
    return () => window.clearTimeout(t);
  }, [queue]);

  const current = queue[0];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-2 z-[70] flex justify-center px-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:justify-end sm:px-0"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current}
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="w-full max-w-xs rounded-xl border border-amber-400/60 bg-gradient-to-b from-black/95 to-amber-950/95 px-3 py-2 shadow-2xl backdrop-blur sm:max-w-sm"
          >
            <div className="flex items-start gap-2.5">
              <div
                aria-hidden
                className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rotate-45 border border-amber-300"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300/80">
                  Logro desbloqueado
                </div>
                <div className="truncate text-sm font-semibold text-amber-100">
                  {ACHIEVEMENTS_BY_ID[current].title}
                </div>
                <div className="line-clamp-2 text-[11px] leading-snug text-amber-200/70">
                  {ACHIEVEMENTS_BY_ID[current].desc}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BagatelleAchievementsPanel({ onClose }: { onClose: () => void }) {
  const [unlocked, setUnlocked] = useState<Set<BagatelleAchievementId>>(() => loadUnlocked());
  const [daily, setDaily] = useState(() => ({
    ch: getDailyChallenge(),
    p: loadDailyProgress(),
  }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const u = subscribeAchievementUnlocks(() => setUnlocked(loadUnlocked()));
    const t = window.setInterval(() => {
      setDaily({ ch: getDailyChallenge(), p: loadDailyProgress() });
    }, 2000);
    return () => {
      u();
      window.clearInterval(t);
    };
  }, []);

  const pct = Math.min(
    100,
    Math.max(0, Math.round((daily.p.best / Math.max(1, daily.ch.target)) * 100)),
  );

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Vitrina de logros"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border border-amber-400/40 bg-gradient-to-b from-neutral-950 to-amber-950/40 shadow-2xl sm:rounded-2xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-amber-400/20 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300/80">
              El Tablero de Clavos
            </div>
            <h2 className="truncate text-lg font-bold text-amber-100 sm:text-xl">
              Vitrina de honor
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-amber-400/40 px-3 py-1 text-xs text-amber-200 transition hover:bg-amber-500/10"
          >
            Cerrar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {}
          <section className="mb-4 rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-950/60 to-red-950/40 p-3 sm:p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
              <div className="min-w-0 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300">
                <span className="truncate">Reto del día · {daily.ch.dateKey}</span>
              </div>
              <div className="inline-flex shrink-0 items-center gap-1 text-[11px] text-amber-300/80">
                Racha: {daily.p.streak}
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rotate-45 border border-amber-300/80"
                />
              </div>
            </div>
            <div className="mt-1 text-base font-semibold text-amber-100">{daily.ch.title}</div>
            <div className="text-xs text-amber-200/80">{daily.ch.desc}</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
              <motion.div
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 22 }}
                className={`h-full ${daily.p.beat ? "bg-green-400" : "bg-amber-400"}`}
              />
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-amber-200/70">
              <span className="truncate">Mejor hoy: {daily.p.best.toLocaleString("es-AR")}</span>
              <span className="truncate text-right">
                Objetivo: {daily.ch.target.toLocaleString("es-AR")}
              </span>
            </div>
            {daily.p.beat && (
              <div className="mt-2 text-center text-xs font-semibold text-green-300">
                ✓ Reto superado
              </div>
            )}
          </section>

          {}
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300/80">
              Logros
            </div>
            <div className="text-[11px] text-amber-300/80">
              {unlocked.size}/{ACHIEVEMENTS.length}
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ACHIEVEMENTS.map((a) => {
              const got = unlocked.has(a.id);
              return (
                <li
                  key={a.id}
                  className={`rounded-lg border p-2 text-xs transition ${
                    got
                      ? "border-amber-400/70 bg-amber-500/10 text-amber-100"
                      : "border-neutral-700/60 bg-neutral-900/40 text-neutral-500"
                  }`}
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
                    <span
                      aria-hidden
                      className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rotate-45 border ${got ? "border-amber-300 bg-amber-300/30" : "border-neutral-600"}`}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{a.title}</div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] leading-tight">{a.desc}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
