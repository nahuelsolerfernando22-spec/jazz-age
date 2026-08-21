import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useScrimLock } from "@/store/ui-scrim";
import { ThematicSpinner } from "@/components/casino/ThematicSpinner";
import { WANDERERS } from "@/lib/salon-wanderers";
import { allSingleHostesses } from "@/lib/single-hostess";
import {
  calcEnvido,
  cardLabel,
  type Card,
  type GameState,
  type Player,
} from "@/lib/games/truco/truco";
import { cardArt } from "@/lib/games/truco/truco-page";

export function HandSummaryModal({
  g,
  onClose,
  hostShort,
  mudaBonus,
}: {
  g: GameState;
  onClose: () => void;
  hostShort: string;
  mudaBonus?: boolean;
}) {
  const h = g.hand;
  const youWon = (h.handResult?.you ?? 0) > (h.handResult?.ai ?? 0);
  const pts = Math.max(h.handResult?.you ?? 0, h.handResult?.ai ?? 0);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <motion.div
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-sm border-2 border-[var(--brass)] bg-[var(--noir)] p-5 text-[var(--ivory)] shadow-deep"
      >
        <h3 className="font-display text-xl text-[var(--brass)] mb-1">
          {youWon ? "Mano para vos" : `Mano para ${hostShort}`}{" "}
          <span className="text-[var(--ivory)]/70 text-base">+{pts}</span>
        </h3>
        <p className="text-xs text-[var(--ivory)]/60 mb-1">
          Marcador: vos {g.scores.you} · {hostShort} {g.scores.ai}
        </p>
        {mudaBonus && (
          <p
            className="mb-3 border border-[var(--brass)]/50 bg-[var(--brass)]/10 rounded-sm px-3 py-1 inline-flex items-center gap-2 text-[var(--brass)]"
            title="Mano muda · +8¢ de bonus"
            aria-label="Mano muda, bonus de 8 fichas"
          >
            <span className="text-xl leading-none" aria-hidden>
              ♪
            </span>
            <span className="font-numerals text-sm leading-none">+8¢</span>
          </p>
        )}
        {(h.envidoAccepted || h.florCalled) && (
          <div className="space-y-2 mb-4">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90">
              Lo que tenía {hostShort}
            </div>
            <div className="flex gap-2 justify-center">
              {h.aiHand.length === 0 &&
                h.table.map(
                  (t, i) =>
                    t.ai && (
                      <img
                        key={`r${i}`}
                        src={cardArt(t.ai)}
                        alt={cardLabel(t.ai)}
                        className="w-12 h-16 rounded-sm border border-[var(--brass)]/40"
                      />
                    ),
                )}
              {h.aiHand.map((c) => (
                <img
                  key={c.id}
                  src={cardArt(c)}
                  alt={cardLabel(c)}
                  className="w-12 h-16 rounded-sm border border-[var(--brass)]/40"
                />
              ))}
            </div>
            {h.envidoAccepted && (
              <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90 mt-2">
                Su envido era{" "}
                {calcEnvido(h.aiHand.concat(h.table.map((t) => t.ai).filter(Boolean) as Card[]))}
              </div>
            )}
          </div>
        )}
        {h.envidoAccepted &&
          (h.envidoDeclared.you !== null || h.envidoDeclared.ai !== null) &&
          h.envidoActual && <PicardiaReveal g={g} hostShort={hostShort} />}
        <button
          onClick={onClose}
          className="w-full min-h-[48px] px-4 py-3 rounded-sm border-2 border-[var(--brass)] bg-[var(--brass)] text-[var(--noir)] font-display uppercase tracking-[0.3em] text-sm active:brightness-110"
        >
          Siguiente mano →
        </button>
      </motion.div>
    </motion.div>
  );
}

export function CantoFlash({
  flash,
  hostShort,
}: {
  flash: { text: string; by: Player } | null;
  hostShort: string;
}) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.text + flash.by}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/45" />
          <motion.div
            initial={{ scale: 0.4, rotate: -6, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 1.25, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className="relative mx-4 max-w-[92vw] px-6 py-5 sm:px-10 border-y-2 border-[var(--brass)] bg-[var(--noir)]/85 shadow-[0_0_60px_rgba(212,175,55,0.5)]"
            style={{ transform: "skewX(-6deg)" }}
          >
            <div
              className={`font-display tracking-[0.12em] text-[var(--brass)] leading-none text-center break-words ${
                flash.text.length > 12
                  ? "text-[clamp(1.4rem,6vw,3rem)]"
                  : "text-[clamp(2.5rem,10vw,6rem)]"
              }`}
              style={{ textShadow: "0 3px 0 rgba(0,0,0,0.6), 0 0 24px rgba(212,175,55,0.7)" }}
            >
              {flash.text}
            </div>
            <div className="text-center text-[11px] uppercase tracking-[0.35em] text-[var(--ivory)]/70 mt-1">
              {flash.by === "ai" ? `Canta ${hostShort}` : "Cantás vos"}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PicardiaReveal({ g, hostShort }: { g: GameState; hostShort: string }) {
  const [openExpl, setOpenExpl] = useState<null | "you" | "ai">(null);
  const h = g.hand;
  const actual = h.envidoActual;
  if (!actual) return null;
  const youAll = h.yourHand.concat(h.table.map((t) => t.you).filter(Boolean) as Card[]);
  const aiAll = h.aiHand.concat(h.table.map((t) => t.ai).filter(Boolean) as Card[]);
  const declYou = h.envidoDeclared.you;
  const declAi = h.envidoDeclared.ai;
  const youLied = declYou !== null && declYou !== actual.you;
  const aiLied = declAi !== null && declAi !== actual.ai;
  const wasChallenged = h.envidoChallengeUsed;

  const winner = h.envidoDeclaredWinner;
  const pts = h.envidoAwardedPoints;

  const envidoImpact = { you: 0, ai: 0 };
  if (winner && pts > 0) {
    envidoImpact[winner] = pts;
  }
  const handRes = h.handResult ?? { you: 0, ai: 0 };
  const trucoImpact = {
    you: Math.max(0, handRes.you - envidoImpact.you),
    ai: Math.max(0, handRes.ai - envidoImpact.ai),
  };
  const explain = (side: "you" | "ai") => {
    const decl = side === "you" ? declYou : declAi;
    const real = side === "you" ? actual.you : actual.ai;
    const lied = side === "you" ? youLied : aiLied;
    const who = side === "you" ? "Vos" : hostShort;
    if (decl === null) return `${who} no declaró envido en esta mano.`;
    const base = lied
      ? `${who} declaró ${decl} pero el envido real era ${real} → declaración ≠ real, por eso Mintió.`
      : `${who} declaró ${decl} y el envido real era ${real} → coinciden, por eso Verdad.`;
    const challengeLine = wasChallenged
      ? lied
        ? " Hubo reclamo de cartas: los puntos del envido pasaron al reclamante."
        : " Hubo reclamo de cartas: al ser honesto, los puntos quedaron firmes."
      : " Nadie reclamó: los puntos quedaron como se declararon.";
    return base + challengeLine;
  };
  const row = (
    side: "you" | "ai",
    label: string,
    decl: number | null,
    real: number,
    lied: boolean,
    cards: Card[],
  ) => (
    <div className="rounded-sm border border-[var(--brass)]/30 bg-black/30 p-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--ivory)]/70">{label}</div>
        {decl !== null && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[var(--ivory)]/60">dijo</span>
            <b className="text-[var(--brass)]">{decl}</b>
            <span className="text-[var(--ivory)]/40">·</span>
            <span className="text-[var(--ivory)]/60">real</span>
            <b className="text-[var(--ivory)]">{real}</b>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-sm text-[11px] uppercase tracking-wider ${
                lied
                  ? "bg-[var(--oxblood)]/70 text-[var(--ivory)] border border-red-400/60"
                  : "bg-emerald-800/50 text-emerald-100 border border-emerald-400/40"
              }`}
            >
              {lied ? "Mintió" : "Verdad"}
            </span>
            <button
              type="button"
              onClick={() => setOpenExpl((s) => (s === side ? null : side))}
              aria-expanded={openExpl === side}
              className="ml-1 w-5 h-5 rounded-sm border border-[var(--brass)]/50 text-[var(--brass)] text-[11px] leading-none hover:bg-[var(--brass)]/10"
              title="Por qué"
            >
              {openExpl === side ? "×" : "?"}
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-1.5 justify-center">
        {cards.map((c) => (
          <img
            key={c.id}
            src={cardArt(c)}
            alt={cardLabel(c)}
            className="w-9 h-12 rounded-sm border border-[var(--brass)]/40"
          />
        ))}
      </div>
      {openExpl === side && decl !== null && (
        <div className="mt-2 text-[11px] leading-snug text-[var(--ivory)]/80 border-t border-[var(--brass)]/20 pt-1.5">
          {explain(side)}
        </div>
      )}
    </div>
  );
  return (
    <div className="mb-4 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90 flex items-center gap-2">
        <span>Envido · revelado</span>
        {wasChallenged && (
          <span className="px-1.5 py-0.5 rounded-sm text-[11px] bg-[var(--brass)]/20 text-[var(--brass)] border border-[var(--brass)]/40">
            reclamado
          </span>
        )}
      </div>
      {row("you", "Vos", declYou, actual.you, youLied, youAll)}
      {row("ai", hostShort, declAi, actual.ai, aiLied, aiAll)}
      <div className="rounded-sm border border-[var(--brass)]/30 bg-[var(--brass)]/5 p-2 text-[11px] text-[var(--ivory)]/85">
        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--brass)]/90 mb-1">
          Impacto en el marcador
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div>Vos · envido</div>
          <div className="text-right font-numerals">+{envidoImpact.you}</div>
          <div>Vos · truco/mano</div>
          <div className="text-right font-numerals">+{trucoImpact.you}</div>
          <div className="border-t border-[var(--brass)]/20 pt-0.5">Vos · total</div>
          <div className="text-right font-numerals border-t border-[var(--brass)]/20 pt-0.5">
            +{handRes.you}
          </div>
          <div className="mt-1">{hostShort} · envido</div>
          <div className="text-right font-numerals mt-1">+{envidoImpact.ai}</div>
          <div>{hostShort} · truco/mano</div>
          <div className="text-right font-numerals">+{trucoImpact.ai}</div>
          <div className="border-t border-[var(--brass)]/20 pt-0.5">{hostShort} · total</div>
          <div className="text-right font-numerals border-t border-[var(--brass)]/20 pt-0.5">
            +{handRes.ai}
          </div>
        </div>
        {wasChallenged && winner && (youLied || aiLied) && (
          <div className="mt-1.5 text-[11px] text-[var(--brass)]/80">
            Reclamo: los {pts} pts. del envido pasaron a {winner === "you" ? "vos" : hostShort} tras
            revelar la mentira.
          </div>
        )}
      </div>
    </div>
  );
}

export function EnvidoReplay({ cards, label }: { cards: Card[]; label: string }) {
  const dominantSuit = (cs: Card[]): Card["suit"] | null => {
    const count = new Map<Card["suit"], number>();
    for (const c of cs) count.set(c.suit, (count.get(c.suit) ?? 0) + 1);
    for (const [s, n] of count) if (n >= 2) return s;
    return null;
  };
  const suit = dominantSuit(cards);
  return (
    <div className="space-y-1.5 pt-1 border-t border-[var(--brass)]/15">
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--ivory)]/50 w-12 shrink-0">
          {label}
        </span>
        <div className="flex gap-1.5">
          {cards.map((c) => {
            const highlight = suit !== null && c.suit === suit;
            return (
              <div
                key={c.id}
                className={`relative w-9 h-12 rounded-sm border overflow-hidden shrink-0 transition ${
                  highlight
                    ? "border-[var(--brass)] shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                    : "border-white/10 opacity-55"
                }`}
              >
                <img src={cardArt(c)} alt={cardLabel(c)} className="w-full h-full object-cover" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ModePicker({
  onPick,
  onRules,
}: {
  onPick: (m: "solo") => void;
  onRules?: () => void;
}) {
  useScrimLock(true);
  return (
    <PickerPortal>
      <div className="relative rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/95 p-4 sm:p-6 text-center shadow-2xl mx-3 max-w-[520px] w-[calc(100%-1.5rem)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90">
            Truco · Eulalia
          </span>
          {onRules && (
            <button
              type="button"
              onClick={onRules}
              className="rounded-full border border-[var(--brass)]/50 bg-[var(--noir)]/70 pl-3 pr-[calc(0.75rem+0.25em)] py-1 text-[11px] uppercase tracking-[0.25em] text-[var(--brass)] hover:bg-[var(--brass)]/10"
            >
              Reglas
            </button>
          )}
        </div>
        <h2 className="font-display text-xl sm:text-2xl text-[var(--ivory)] mb-1.5">
          ¿Cómo se juega?
        </h2>
        <p className="text-xs sm:text-sm text-[var(--ivory)]/70 mb-4 sm:mb-5">
          Mano a mano con la anfitriona: cantos, envido y flor opcional.
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
          <button
            onClick={() => onPick("solo")}
            aria-label="Modo Mano a Mano (1 vs 1)"
            className="min-h-[64px] px-4 py-3 rounded-sm border border-[var(--brass)]/60 bg-[var(--mahogany)]/40 text-[var(--ivory)] hover:bg-[var(--mahogany)]/60 active:brightness-125 transition"
          >
            <div className="font-display text-lg">Mano a Mano</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass)]/90 mt-1">
              1 vs 1 · con flor opcional
            </div>
          </button>
        </div>
      </div>
    </PickerPortal>
  );
}

export function PickerPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[280] flex items-center justify-center p-3"
      style={{
        // Sin backdrop-filter: en WebView de Android el blur a pantalla
        // completa cuesta caro y hace tironear las animaciones.
        // Velo en degradé en vez de negro parejo: el 78% plano borraba el
        // retrato de la anfitriona que vive detrás del panel.
        background:
          "linear-gradient(180deg, rgba(20,13,10,0.34) 0%, rgba(16,11,9,0.52) 38%, rgba(10,8,8,0.78) 100%)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function pickRandomTrucoWanderer(): { name: string; portrait: string } {
  const pool = allSingleHostesses().filter(({ hostess }) => hostess.npcId !== "eulalia");
  if (pool.length === 0) {
    const w = WANDERERS[Math.floor(Math.random() * WANDERERS.length)]!;
    return { name: w.name, portrait: w.portrait };
  }
  const pick = pool[Math.floor(Math.random() * pool.length)]!;
  return { name: pick.hostess.name, portrait: pick.hostess.portrait };
}

export function DeclareEnvidoModal({
  real,
  label,
  onSubmit,
  onCancel,
}: {
  real: number;
  label: string;
  onSubmit: (v: number) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState<number>(real);
  const lied = val !== real;
  useScrimLock(true);
  return (
    <PickerPortal>
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="rounded-sm border border-[var(--brass)] bg-[var(--noir)] p-5 max-w-sm w-full space-y-4 shadow-2xl"
      >
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]">{label}</div>
          <div className="text-sm text-[var(--ivory)]/80 mt-1">
            Tu envido real es <b className="text-[var(--brass)]">{real}</b>. Podés mentir arriba o
            abajo — cuidado con el reclamo.
          </div>
        </div>
        <div className="text-center">
          <div
            className={`text-4xl font-numerals ${lied ? "text-[var(--oxblood)]" : "text-[var(--ivory)]"}`}
          >
            {val}
          </div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]/50 mt-1">
            {lied ? "mentira" : "verdad"}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={33}
          value={val}
          onChange={(e) => setVal(parseInt(e.target.value, 10))}
          className="w-full accent-[var(--brass)]"
        />
        <div className="flex gap-2">
          <button
            className="flex-1 px-3 py-2 rounded-sm border border-[var(--brass)] bg-[var(--oxblood)]/60 text-[var(--ivory)] text-sm"
            onClick={() => onSubmit(val)}
          >
            Decir {val}
          </button>
          <button
            className="px-3 py-2 rounded-sm border border-[var(--brass)]/40 text-[var(--ivory)]/70 text-sm"
            onClick={() => {
              setVal(real);
              onSubmit(real);
            }}
          >
            Verdad ({real})
          </button>
          <button
            className="px-3 py-2 rounded-sm text-[var(--ivory)]/50 text-sm"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
      </motion.div>
    </PickerPortal>
  );
}
