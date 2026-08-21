import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { BrassButton } from "@/components/casino/BrassButton";
import { ArtDecoToast } from "@/components/casino/ArtDecoToast";
import { CardFace, CornerIndex, getCardArtSrc } from "@/components/casino/chinchon/CardFace";
import {
  type AiExplanation,
  type Card as ChCard,
  type MatchState,
  type Partition,
  type RoundResult,
  type Suit,
  bestPartition,
  cardValue,
  partitionFromGroups,
  validateMeld,
} from "@/lib/games/chinchon/chinchon";
import { useChinchonSettings } from "@/lib/games/chinchon/chinchon-settings";

export interface PendingClose {
  round: { hands: { user: ChCard[]; ai: ChCard[] } };
  closer: "user" | "ai";
  badClose: boolean;
  chinchon: boolean;
}

export function MiniCard({ card }: { card: ChCard }) {
  const artSrc = getCardArtSrc(card);
  return (
    <div
      className="relative h-[68px] w-[46px] shrink-0 overflow-hidden rounded-[4px]"
      style={{
        background: "#0d0708",
        boxShadow: "0 3px 8px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.6)",
      }}
    >
      {artSrc && (
        <img
          src={artSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}
      {!card.isJoker ? (
        <CornerIndex rank={card.rank as number} suit={card.suit as Suit} size="sm" />
      ) : (
        <span className="pointer-events-none absolute left-[2px] top-[1px] rounded-[2px] bg-black/80 px-[3px] py-0 font-display text-[11px] leading-none text-[var(--brass-bright)] shadow">
          ★
        </span>
      )}
    </div>
  );
}

export function PlayerBreakdown({
  who,
  partition,
  delta,
  badClose,
  isCloser,
  step,
  totalSteps,
}: {
  who: "user" | "ai";
  partition: Partition;
  delta: number;
  badClose: boolean;
  isCloser: boolean;
  step: number;
  totalSteps: number;
}) {
  const label = who === "user" ? "VOS" : "LUISA";
  const accent = who === "user" ? "oklch(0.78 0.18 60)" : "oklch(0.68 0.20 25)";

  const items: Array<
    | { kind: "meld"; meld: (typeof partition.melds)[number]; idx: number }
    | { kind: "loose"; card: ChCard; idx: number }
  > = [
    ...partition.melds.map((m, i) => ({ kind: "meld" as const, meld: m, idx: i })),
    ...partition.loose.map((c, i) => ({
      kind: "loose" as const,
      card: c,
      idx: partition.melds.length + i,
    })),
  ];
  const revealed = items.slice(0, step);
  const looseRunningSum = revealed
    .filter((it) => it.kind === "loose")
    .reduce((s, it) => s + cardValue((it as { card: ChCard }).card), 0);
  const done = step >= totalSteps;
  return (
    <div className="rounded border border-[var(--brass)]/25 bg-black/45 p-3">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span
            className="font-display text-[11px] uppercase tracking-[0.3em]"
            style={{ color: accent }}
          >
            {label}
          </span>
          {isCloser && (
            <span className="rounded-sm border border-[var(--brass)]/40 bg-[var(--brass)]/15 px-1.5 py-[1px] font-display text-[11px] uppercase tracking-widest text-[var(--brass)]">
              {badClose ? "mal corte" : "cerró"}
            </span>
          )}
        </div>
        <motion.div
          key={`sum-${who}-${step}`}
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-numerals text-lg tabular-nums text-[var(--ivory)]"
        >
          sueltas <b style={{ color: accent }}>{looseRunningSum}</b>
        </motion.div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {revealed.map((it) => {
            if (it.kind === "meld") {
              return (
                <motion.div
                  key={`m-${it.idx}`}
                  initial={{ y: -16, opacity: 0, scale: 0.85 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  className="flex items-center gap-1 rounded border border-[oklch(0.6_0.16_140)]/50 bg-[oklch(0.6_0.16_140)]/10 p-1.5"
                >
                  <div className="flex gap-0.5">
                    {it.meld.cards.map((c) => (
                      <MiniCard key={c.id} card={c} />
                    ))}
                  </div>
                  <span className="ml-1 self-end font-display text-[11px] uppercase tracking-widest text-[oklch(0.78_0.16_140)]">
                    {it.meld.kind === "set" ? "trío" : "escalera"} · 0
                  </span>
                </motion.div>
              );
            }
            return (
              <motion.div
                key={`l-${it.idx}-${it.card.id}`}
                initial={{ y: -16, opacity: 0, scale: 0.85, rotate: -4 }}
                animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className="relative"
              >
                <MiniCard card={it.card} />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-sm bg-[oklch(0.55_0.20_25)] px-1 font-numerals text-[11px] font-bold text-[var(--ivory)] shadow">
                  +{cardValue(it.card)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-between border-t border-[var(--brass)]/20 pt-2"
        >
          <span className="font-display text-[11px] uppercase tracking-widest text-[var(--brass)]/90">
            suma de la mano
          </span>
          <span
            className="font-numerals text-2xl tabular-nums"
            style={{ color: delta < 0 ? "oklch(0.78 0.18 140)" : accent }}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        </motion.div>
      )}
    </div>
  );
}

export function RoundEndModal({
  result,
  match,
  onNext,
}: {
  result: RoundResult;
  match: MatchState;
  onNext: () => void;
}) {
  const closer = result.closer;
  const title = result.chinchon
    ? "¡CHINCHÓN!"
    : result.badClose
      ? "Mal cierre"
      : result.jokeredChinchon
        ? "Escalera falsa −50"
        : closer === "user"
          ? "Cerraste"
          : "Luisa cerró";

  const closerKey: "user" | "ai" = closer ?? "user";
  const otherKey: "user" | "ai" = closerKey === "user" ? "ai" : "user";
  const closerSteps = result.closerPartition.melds.length + result.closerPartition.loose.length;
  const otherSteps = result.otherPartition.melds.length + result.otherPartition.loose.length;

  const [step, setStep] = useState(0);
  const totalSteps = closerSteps + otherSteps;

  useEffect(() => {
    if (step >= totalSteps) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), 280);
    return () => window.clearTimeout(t);
  }, [step, totalSteps]);

  const closerStep = Math.min(step, closerSteps);
  const otherStep = Math.max(0, Math.min(step - closerSteps, otherSteps));
  const allDone = step >= totalSteps;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 pb-[max(0.75rem,var(--sa-bottom))] sm:items-center"
    >
      <motion.div
        initial={{ scale: 0.92, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="max-h-[80svh] w-full max-w-2xl overflow-y-auto rounded-md border-2 border-[var(--brass)]/70 p-4"
        style={{ background: "linear-gradient(180deg, oklch(0.18 0.04 30), oklch(0.08 0.02 30))" }}
      >
        <div className="text-center">
          <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
            — recuento de la mano —
          </div>
          <h2 className="font-script text-4xl text-[oklch(0.72_0.18_30)]">{title}</h2>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <PlayerBreakdown
            who={closerKey}
            partition={result.closerPartition}
            delta={result.delta[closerKey]}
            badClose={result.badClose}
            isCloser
            step={closerStep}
            totalSteps={closerSteps}
          />
          <PlayerBreakdown
            who={otherKey}
            partition={result.otherPartition}
            delta={result.delta[otherKey]}
            badClose={false}
            isCloser={false}
            step={otherStep}
            totalSteps={otherSteps}
          />
        </div>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid grid-cols-2 gap-3 text-center text-[var(--ivory)]"
          >
            <div className="rounded border border-[var(--brass)]/30 bg-black/40 p-2">
              <div className="font-display text-[11px] uppercase tracking-widest opacity-60">
                vos · total
              </div>
              <div className="font-numerals text-3xl tabular-nums">
                {match.scores.user + result.delta.user}
              </div>
            </div>
            <div className="rounded border border-[var(--brass)]/30 bg-black/40 p-2">
              <div className="font-display text-[11px] uppercase tracking-widest opacity-60">
                luisa · total
              </div>
              <div className="font-numerals text-3xl tabular-nums">
                {match.scores.ai + result.delta.ai}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-5 flex justify-center gap-3">
          {!allDone && (
            <BrassButton onClick={() => setStep(totalSteps)} variant="blood">
              Saltar recuento
            </BrassButton>
          )}
          <BrassButton onClick={onNext} variant="primary" disabled={!allDone}>
            Siguiente mano
          </BrassButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MatchEndModal({
  winner,
  reason,
  scores,
  ante,
  onAgain,
  hostName,
  canSecondLife,
  onSecondLife,
}: {
  winner: "user" | "ai";
  reason: "score" | "chinchon";
  scores: { user: number; ai: number };
  ante: number;
  onAgain: () => void;
  hostName: string;
  canSecondLife?: boolean;
  onSecondLife?: () => void;
}) {
  const youWon = winner === "user";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 pb-[max(0.75rem,var(--sa-bottom))] sm:items-center"
    >
      <motion.div
        initial={{ scale: 0.85, rotate: -1 }}
        animate={{ scale: 1, rotate: 0 }}
        className="max-h-[80svh] w-full max-w-md overflow-y-auto rounded-md border-2 p-5 text-center"
        style={{
          borderColor: youWon ? "oklch(0.7 0.22 60)" : "oklch(0.55 0.18 25)",
          background: "linear-gradient(180deg, oklch(0.20 0.05 30), oklch(0.08 0.02 30))",
        }}
      >
        <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
          — el cuervo dorado —
        </div>
        <h2
          className="font-script text-5xl"
          style={{ color: youWon ? "oklch(0.78 0.20 60)" : "oklch(0.65 0.22 25)" }}
        >
          {youWon ? "Te llevás la mesa" : `${hostName} se queda con todo`}
        </h2>
        <p className="mt-2 font-script text-base text-[var(--ivory)]/80">
          {reason === "chinchon"
            ? "Una escalera entera. Cosa de leyenda."
            : "Marcador final: la paciencia paga, las prisas no."}
        </p>
        <div className="mt-4 flex justify-center gap-6 font-numerals text-3xl tabular-nums text-[var(--ivory)]">
          <div>
            <div className="font-display text-[11px] uppercase tracking-widest opacity-60">vos</div>
            {scores.user}
          </div>
          <div>
            <div className="font-display text-[11px] uppercase tracking-widest opacity-60">
              {hostName.toLowerCase()}
            </div>
            {scores.ai}
          </div>
        </div>
        <div className="mt-3 font-display text-[11px] uppercase tracking-widest text-[var(--brass)]/90">
          {youWon ? `+${Math.round(ante * 2.5)} fichas a tu bolsa` : `−${ante} fichas`}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {canSecondLife && onSecondLife && (
            <BrassButton onClick={onSecondLife} variant="blood">
              Pedir segunda vida
            </BrassButton>
          )}
          <BrassButton onClick={onAgain} variant="primary">
            Otra mano
          </BrassButton>
          <Link to="/" className="inline-flex">
            <BrassButton variant="ghost">Salir al salón</BrassButton>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ToastAuto({
  toast,
  onClear,
}: {
  toast: { msg: string; tone: "win" | "lose" | "neutral" } | null;
  onClear: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onClear, 3200);
    return () => window.clearTimeout(t);
  }, [toast, onClear]);
  return <ArtDecoToast tone={toast?.tone ?? "neutral"} message={toast?.msg ?? null} floating />;
}

export function ArrangeModal({
  pending,
  onConfirm,
}: {
  pending: PendingClose;
  onConfirm: (partition: Partition) => void;
}) {
  const userHand = pending.round.hands.user;
  const aiHand = pending.round.hands.ai;

  const initial = useMemo(() => {
    const best = bestPartition(userHand);
    return best.melds.map((m) => m.cards.map((c) => c.id));
  }, [userHand]);

  const [groups, setGroups] = useState<string[][]>(initial);
  const [selected, setSelected] = useState<string[]>([]);

  const meldByCard = useMemo(() => {
    const map = new Map<string, number>();
    groups.forEach((g, i) => g.forEach((id) => map.set(id, i)));
    return map;
  }, [groups]);

  const looseCards = userHand.filter((c) => !meldByCard.has(c.id));

  const partitionResult = useMemo(() => partitionFromGroups(userHand, groups), [userHand, groups]);

  const aiPart = useMemo(() => bestPartition(aiHand), [aiHand]);

  const preview = useMemo(() => {
    if (!partitionResult.ok) return null;
    const userLoose = partitionResult.partition.looseSum;
    const aiLoose = aiPart.looseSum;

    return {
      user: userLoose,
      ai: aiLoose === 0 ? -10 : aiLoose,
    };
  }, [partitionResult, aiPart]);

  function toggleSelect(id: string) {
    if (meldByCard.has(id)) return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function commitMeld() {
    if (selected.length < 3) return;
    const cards = selected.map((id) => userHand.find((c) => c.id === id)!).filter(Boolean);
    if (!validateMeld(cards)) return;
    setGroups((g) => [...g, [...selected]]);
    setSelected([]);
  }

  function breakMeld(idx: number) {
    setGroups((g) => g.filter((_, i) => i !== idx));
  }

  function resetAll() {
    setGroups([]);
    setSelected([]);
  }

  function autoAgain() {
    setGroups(initial);
    setSelected([]);
  }

  const selectedCards = selected
    .map((id) => userHand.find((c) => c.id === id))
    .filter(Boolean) as ChCard[];
  const selectedValid = selected.length >= 3 && validateMeld(selectedCards) !== null;

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="flex max-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col overflow-y-auto overscroll-contain rounded-xl border border-[var(--brass)]/40 bg-[var(--noir)]/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
      >
        <div className="mb-3 text-center">
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
            Luisa cortó
          </div>
          <h2 className="font-display text-2xl text-[var(--ivory)]">Ordená tu mano</h2>
          <p className="mt-1 text-xs text-[var(--ivory)]/60">
            Armá tus combinaciones. Las cartas sueltas suman puntos en contra.
          </p>
        </div>

        <div className="mb-3 space-y-2">
          {groups.length === 0 && (
            <div className="rounded border border-dashed border-[var(--brass)]/30 p-2 text-center text-[11px] uppercase tracking-widest text-[var(--ivory)]/40">
              Sin combinaciones — todas sueltas
            </div>
          )}
          {groups.map((g, i) => {
            const cards = g.map((id) => userHand.find((c) => c.id === id)!).filter(Boolean);
            const meld = validateMeld(cards);
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded border border-[oklch(0.6_0.16_140)]/40 bg-[oklch(0.6_0.16_140)]/10 p-2"
              >
                <span className="font-display text-[11px] uppercase tracking-widest text-[oklch(0.75_0.18_140)]">
                  {meld?.kind === "set" ? "trío" : meld?.kind === "run" ? "escalera" : "?"}
                </span>
                <div className="flex flex-1 -space-x-3">
                  {cards.map((c) => (
                    <CardFace key={c.id} card={c} size="sm" state="meld" />
                  ))}
                </div>
                <button
                  onClick={() => breakMeld(i)}
                  className="rounded border border-[var(--brass)]/40 px-2 py-1 font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/80 hover:bg-[var(--brass)]/20"
                >
                  ✕ deshacer
                </button>
              </div>
            );
          })}
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/60">
              Sueltas — tocá para seleccionar
            </span>
            <span className="font-numerals text-xs tabular-nums text-[var(--ivory)]/70">
              {selected.length} elegidas
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {looseCards.map((c) => (
              <CardFace
                key={c.id}
                card={c}
                size="sm"
                state={selected.includes(c.id) ? "selected" : "loose"}
                onClick={() => toggleSelect(c.id)}
              />
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            disabled={!selectedValid}
            onClick={commitMeld}
            className="rounded border border-[var(--brass)]/60 bg-[var(--brass)]/15 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-[var(--ivory)] hover:bg-[var(--brass)]/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✓ crear combinación
          </button>
          <button
            onClick={autoAgain}
            className="rounded border border-[var(--brass)]/30 px-3 py-1.5 font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/70 hover:bg-[var(--brass)]/10"
          >
            sugerencia
          </button>
          <button
            onClick={resetAll}
            className="rounded border border-[var(--brass)]/30 px-3 py-1.5 font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/70 hover:bg-[var(--brass)]/10"
          >
            reiniciar
          </button>
          {selected.length >= 3 && !selectedValid && (
            <span className="font-display text-[11px] uppercase tracking-widest text-[oklch(0.7_0.2_25)]">
              selección no forma combinación
            </span>
          )}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 rounded border border-[var(--brass)]/30 bg-black/40 p-3">
          <div>
            <div className="font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/50">
              vos · sueltas
            </div>
            <div className="font-numerals text-2xl tabular-nums text-[var(--ivory)]">
              {partitionResult.ok ? `+${partitionResult.partition.looseSum}` : "—"}
            </div>
          </div>
          <div>
            <div className="font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/50">
              luisa (cortó)
            </div>
            <div className="font-numerals text-2xl tabular-nums text-[var(--ivory)]">
              {preview ? (preview.ai < 0 ? preview.ai : `+${preview.ai}`) : "—"}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-5 -mb-5 bg-[var(--noir)]/95 px-5 pb-5 pt-2">
          <BrassButton
            onClick={() => partitionResult.ok && onConfirm(partitionResult.partition)}
            disabled={!partitionResult.ok}
            className="w-full"
          >
            Confirmar puntaje
          </BrassButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ChinchonAiExplainPanel({
  data,
  hostShort,
  onClose,
}: {
  data: AiExplanation;
  hostShort: string;
  onClose: () => void;
}) {
  const riskPct = Math.round(data.risk * 100);
  const riskColor =
    data.risk >= 0.7
      ? "oklch(0.65 0.22 25)"
      : data.risk >= 0.35
        ? "oklch(0.75 0.18 75)"
        : "oklch(0.72 0.18 145)";
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="pointer-events-auto absolute left-1/2 top-16 z-30 w-[min(92vw,420px)] -translate-x-1/2 rounded-md border border-[var(--brass)]/40 bg-black/80 p-3 shadow-lg backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/80">
          {hostShort} · decisión
        </div>
        <button
          onClick={onClose}
          className="rounded px-1 font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/60 hover:text-[var(--ivory)]"
        >
          cerrar
        </button>
      </div>
      <div className="mt-1 font-script text-sm text-[var(--ivory)]/95">{data.summary}</div>
      <div className="mt-2 grid grid-cols-3 gap-2 font-display text-[11px] uppercase tracking-widest">
        <div className="rounded bg-black/40 px-2 py-1">
          <div className="text-[var(--ivory)]/50">EV loose</div>
          <div className="mt-0.5 font-numerals text-base text-[var(--ivory)] tabular-nums">
            {data.ev.toFixed(1)}
          </div>
        </div>
        <div className="rounded bg-black/40 px-2 py-1">
          <div className="text-[var(--ivory)]/50">Ligadas</div>
          <div className="mt-0.5 font-numerals text-base text-[var(--ivory)] tabular-nums">
            {data.melds}/7
          </div>
        </div>
        <div className="rounded bg-black/40 px-2 py-1" style={{ color: riskColor }}>
          <div className="text-[var(--ivory)]/50">Feed rival</div>
          <div className="mt-0.5 font-numerals text-base tabular-nums">{riskPct}%</div>
        </div>
      </div>
      <div className="mt-2 font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/45">
        robó {data.drewFrom === "pile" ? "del pozo" : "del mazo"} · {data.reason}
      </div>
    </motion.div>
  );
}

export function ChinchonSettingsModal({ onClose }: { onClose: () => void }) {
  const s = useChinchonSettings();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-md border-2 border-[var(--brass)]/50 bg-[oklch(0.15_0.03_30)] p-5"
      >
        <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
          — preferencias —
        </div>
        <h3 className="mt-1 font-script text-3xl text-[var(--ivory)]">Chinchón</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/70">
              Segundas vidas por partida
            </label>
            <div className="mt-2 flex gap-2">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => s.set({ secondLivesAllowed: n })}
                  className={`flex-1 rounded border px-3 py-2 font-numerals text-lg tabular-nums transition ${
                    s.secondLivesAllowed === n
                      ? "border-[var(--brass)] bg-[var(--brass)]/20 text-[var(--ivory)]"
                      : "border-[var(--brass)]/30 bg-black/30 text-[var(--ivory)]/70 hover:bg-black/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/45">
              0 = deshabilitado. El rival también usa este límite.
            </div>
          </div>

          <label className="flex items-start gap-3 rounded border border-[var(--brass)]/30 bg-black/30 p-3">
            <input
              type="checkbox"
              checked={s.allowSecondLifeOnChinchon}
              onChange={(e) => s.set({ allowSecondLifeOnChinchon: e.target.checked })}
              className="mt-1"
            />
            <div>
              <div className="font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]">
                Permitir tras chinchón puro
              </div>
              <div className="mt-0.5 font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/50">
                Por defecto la escalera de 7 cierra sin revancha. Actívalo para permitirla igual.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded border border-[var(--brass)]/30 bg-black/30 p-3">
            <input
              type="checkbox"
              checked={s.showAiExplain}
              onChange={(e) => s.set({ showAiExplain: e.target.checked })}
              className="mt-1"
            />
            <div>
              <div className="font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]">
                Mostrar por qué juega el rival
              </div>
              <div className="mt-0.5 font-display text-[11px] uppercase tracking-widest text-[var(--ivory)]/50">
                Después de cada turno del rival, aparece un panel con EV, cartas ligadas y riesgo de
                feed.
              </div>
            </div>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <BrassButton onClick={() => s.reset()} variant="ghost">
            Restaurar
          </BrassButton>
          <BrassButton onClick={onClose} variant="primary">
            Listo
          </BrassButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
