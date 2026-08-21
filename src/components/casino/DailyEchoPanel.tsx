import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useDailyEcho } from "@/store/daily-echo";
import { useSettings } from "@/store/settings";
import missionBoardBg from "@/assets/hub/mission-board-bg.webp";
import { IconLlamaRacha, IconLacre, IconPlumaTilde } from "@/components/casino/DecoIcons";

export function DailyEchoPanel() {
  const state = useDailyEcho();
  const reduceMotion = useSettings((s) => s.reduceMotion);

  useEffect(() => {
    state.ensureFresh();
    const onFocus = () => state.ensureFresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = state.challenges.length;
  const done = state.completed.length;
  const allDone = done >= total && total > 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="relative overflow-hidden" aria-labelledby="daily-echo-heading">
      {}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${missionBoardBg})`,
          filter: "brightness(0.6) contrast(1.2)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#050402]/85 via-[#050402]/92 to-[#050402]"
      />

      <div className="relative p-4 sm:p-5">
        <header className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--oro-viejo)] font-black drop-shadow-md">
              Corvina · ecos del día
            </p>
            <h2
              id="daily-echo-heading"
              className="mt-0.5 text-xl text-[var(--crema-brillo)] drop-shadow-[0_2px_12px_rgba(255,243,196,0.4)] sm:text-2xl"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}
            >
              {done}/{total} misiones del día
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--marfil)]/80">Racha</p>
            <p
              className="inline-flex items-center gap-1.5 text-2xl font-bold text-[var(--oro-claro)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              <IconLlamaRacha size={18} className="text-[var(--oro-claro)]" />
              {state.streak}
            </p>
          </div>
        </header>

        {}
        <div className="mb-4">
          {/* Progreso segmentado (mejor legibilidad que barra continua) */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(total, 1) }).map((_, i) => {
              const filled = i < done;
              return (
                <motion.span
                  key={i}
                  className={`h-2.5 flex-1 rounded-full ${
                    filled
                      ? "bg-gradient-to-r from-[var(--oro-viejo)] to-[var(--crema-brillo)] shadow-[0_0_12px_rgba(255,243,196,0.6)]"
                      : "bg-white/12"
                  }`}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.4, delay: i * 0.08 }}
                />
              );
            })}
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[var(--marfil)]/65">
            {pct}% completado
          </p>
        </div>

        <ul className="space-y-2">
          {state.challenges.map((c) => {
            const isDone = state.completed.includes(c.id);
            const cur = Math.min(c.target, state.progress[c.id] ?? 0);
            return (
              <li key={c.id}>
                <Link
                  to={c.route}
                  className={`group flex items-start gap-3 rounded-xl border px-3 py-3 backdrop-blur-sm transition ${
                    isDone
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-white/10 bg-black/40 hover:border-[var(--oro)]/60 hover:bg-black/55"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      isDone
                        ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300"
                        : "border-[var(--oro)]/50 bg-[var(--verde-noche)]/60 text-[var(--oro)]"
                    }`}
                  >
                    {isDone ? <IconPlumaTilde size={16} /> : <IconLacre size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isDone
                          ? "text-emerald-300 line-through font-bold"
                          : "text-[var(--crema-clara)] font-bold"
                      }`}
                    >
                      {c.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--crema-clara)]/80">{c.description}</p>
                    {c.hint ? (
                      <p className="mt-0.5 text-[11px] italic text-[var(--marfil)]/65">{c.hint}</p>
                    ) : null}
                    {c.target > 1 && !isDone ? (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--oro)]/80">
                        {cur}/{c.target}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 self-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                      isDone
                        ? "border-emerald-400/50 text-emerald-200"
                        : "border-[var(--oro)]/50 text-[var(--oro)]"
                    }`}
                  >
                    {isDone ? "cobrado" : `+${c.reward} ¢`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <footer className="mt-4 border-t border-white/10 pt-3">
          <motion.button
            type="button"
            disabled={!allDone || state.bonusClaimed}
            onClick={() => {
              state.claimBonus();
            }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className={`flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-[0.25em] transition sm:w-auto ${
              allDone && !state.bonusClaimed
                ? "border-[var(--oro)] bg-gradient-to-r from-[var(--oro)] to-[var(--oro-claro)] text-[var(--verde-noche)] shadow-[0_8px_24px_-6px_rgba(247,210,113,0.55)] hover:brightness-110"
                : state.bonusClaimed
                  ? "cursor-not-allowed border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  : "cursor-not-allowed border-white/10 bg-black/40 text-[var(--marfil)]/65"
            }`}
          >
            {state.bonusClaimed
              ? "✓ Bono cobrado"
              : allDone
                ? "Cobrar bono · +500 ¢"
                : `Faltan ${total - done} para el bono`}
          </motion.button>
        </footer>
      </div>
    </section>
  );
}
