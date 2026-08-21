import { useEncargoHudBlocked } from "@/lib/encargos-guard";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  findBlackjackLevel,
  blackjackLevelLabel,
  blackjackModifierLabel,
} from "@/lib/games/blackjack/blackjack-levels";
import { useBlackjackRun } from "@/store/games/blackjack/blackjack-run";
import { AbandonEncargoButton } from "@/components/casino/AbandonEncargoButton";

function fmtClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function BlackjackRunHUD() {
  const hudBlocked = useEncargoHudBlocked("BlackjackRunHUD");
  const activeLevel = useBlackjackRun((s) => s.activeLevel);
  const handsUsed = useBlackjackRun((s) => s.handsUsed);
  const chipsGained = useBlackjackRun((s) => s.chipsGained);
  const budgetLeft = useBlackjackRun((s) => s.budgetLeft);
  const progress = useBlackjackRun((s) => s.progress);
  const winStreak = useBlackjackRun((s) => s.winStreak);
  const blackjacks = useBlackjackRun((s) => s.blackjacks);
  const abandon = useBlackjackRun((s) => s.abandon);
  const pollClock = useBlackjackRun((s) => s.pollClock);
  const clockRemaining = useBlackjackRun((s) => s.clockRemaining);
  const minBet = useBlackjackRun((s) => s.minBet);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      pollClock();
    }, 500);
    return () => window.clearInterval(id);
  }, [pollClock]);

  if (hudBlocked || !activeLevel) return null;
  const level = findBlackjackLevel(activeLevel);
  if (!level) return null;
  void tick;

  const target =
    level.objective.kind === "profit"
      ? level.objective.target
      : level.objective.kind === "blackjacks"
        ? level.objective.count
        : level.objective.kind === "streak"
          ? level.objective.length
          : level.objective.kind === "wins"
            ? level.objective.count
            : level.objective.count;
  const current =
    level.objective.kind === "streak"
      ? winStreak
      : level.objective.kind === "blackjacks"
        ? blackjacks
        : progress;
  const pct = Math.min(100, Math.round((current / target) * 100));
  const handsLeft = Math.max(0, level.handLimit - handsUsed);
  const remaining = clockRemaining();
  const betMin = minBet();

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="hud-panel mx-auto mb-3 max-w-5xl rounded-sm p-3"
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <p className="hud-eyebrow">
            {level.boss ? "JEFE · " : ""}
            {level.id} · Encargo
          </p>
          <h3 className="hud-title">{level.title}</h3>
          <p className="hud-sub">{blackjackLevelLabel(level)}</p>
        </div>
        <AbandonEncargoButton onAbandon={abandon} />
      </header>

      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="hud-label">Progreso</span>
          <span className="hud-label text-[#e8d47a]">
            {current.toLocaleString("es-AR")}/{target.toLocaleString("es-AR")} · {pct}%
          </span>
        </div>
        <div className="hud-bar">
          <div className="hud-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <Stat label="Manos" value={String(handsLeft)} warn={handsLeft <= 3} />
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
        {betMin != null ? <span className="hud-tag">ficha ≥ {betMin}</span> : null}
        {winStreak >= 2 ? <span className="hud-tag">racha ×{winStreak}</span> : null}
        {level.modifiers.map((m, i) => (
          <span key={i} className="hud-tag hud-tag-blood">
            {blackjackModifierLabel(m)}
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
