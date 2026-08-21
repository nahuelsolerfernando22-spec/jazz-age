import { useEncargoHudBlocked } from "@/lib/encargos-guard";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  findRuletaLevel,
  ruletaLevelLabel,
  ruletaModifierLabel,
} from "@/lib/games/ruleta/ruleta-levels";
import { useRuletaRun } from "@/store/games/ruleta/ruleta-run";
import { AbandonEncargoButton } from "@/components/casino/AbandonEncargoButton";

function fmtClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RuletaRunHUD() {
  const hudBlocked = useEncargoHudBlocked("RuletaRunHUD");
  const activeLevel = useRuletaRun((s) => s.activeLevel);
  const spinsUsed = useRuletaRun((s) => s.spinsUsed);
  const chipsGained = useRuletaRun((s) => s.chipsGained);
  const budgetLeft = useRuletaRun((s) => s.budgetLeft);
  const progress = useRuletaRun((s) => s.progress);
  const outsideStreak = useRuletaRun((s) => s.outsideStreak);
  const forbidden = useRuletaRun((s) => s.forbiddenNumber);
  const abandon = useRuletaRun((s) => s.abandon);
  const pollClock = useRuletaRun((s) => s.pollClock);
  const clockRemaining = useRuletaRun((s) => s.clockRemaining);
  const betCap = useRuletaRun((s) => s.betCap);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      pollClock();
    }, 500);
    return () => window.clearInterval(id);
  }, [pollClock]);

  if (hudBlocked || !activeLevel) return null;
  const level = findRuletaLevel(activeLevel);
  if (!level) return null;
  void tick;

  const target =
    level.objective.kind === "bankroll"
      ? level.objective.target
      : level.objective.kind === "full-hits"
        ? level.objective.count
        : level.objective.count;
  const current = level.objective.kind === "outside-streak" ? outsideStreak : progress;
  const pct = Math.min(100, Math.round((current / target) * 100));
  const spinsLeft = Math.max(0, level.spinLimit - spinsUsed);
  const remaining = clockRemaining();
  const cap = betCap();

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="hud-panel mx-auto mb-3 max-w-6xl rounded-sm p-3"
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <p className="hud-eyebrow">
            {level.boss ? "JEFE · " : ""}
            {level.id} · Encargo
          </p>
          <h3 className="hud-title">{level.title}</h3>
          <p className="hud-sub">{ruletaLevelLabel(level)}</p>
        </div>
        <AbandonEncargoButton onAbandon={abandon} />
      </header>

      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="hud-label">Progreso</span>
          <span className="hud-label text-[var(--brass-bright)]">
            {current.toLocaleString("es-AR")}/{target.toLocaleString("es-AR")} · {pct}%
          </span>
        </div>
        <div className="hud-bar">
          <div className="hud-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <Stat label="Giros" value={String(spinsLeft)} warn={spinsLeft <= 5} />
        <Stat
          label="Neto"
          value={`${chipsGained >= 0 ? "+" : ""}${chipsGained.toLocaleString("es-AR")}`}
          warn={chipsGained < 0}
        />
        <Stat
          label="Margen"
          value={`${budgetLeft >= 0 ? "+" : ""}${budgetLeft.toLocaleString("es-AR")}`}
          warn={budgetLeft < 0}
        />
        <Stat
          label="Reloj"
          value={remaining != null ? fmtClock(remaining) : "—"}
          warn={remaining != null && remaining < 30}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {cap != null ? <span className="hud-tag">ficha máx {cap}</span> : null}
        {forbidden != null ? (
          <span className="hud-tag hud-tag-cold">número frío: {forbidden}</span>
        ) : null}
        {level.modifiers.map((m, i) => (
          <span key={i} className="hud-tag hud-tag-blood">
            {ruletaModifierLabel(m)}
          </span>
        ))}
      </div>

      {level.bossQuote ? <p className="hud-quote">&ldquo;{level.bossQuote}&rdquo;</p> : null}
    </motion.section>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`hud-plate hud-cell ${warn ? "hud-plate-blood" : ""}`}>
      <p className="hud-label">{label}</p>
      <p className={warn ? "hud-value hud-value-warn" : "hud-value"}>{value}</p>
    </div>
  );
}
