import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GameTopBar } from "@/components/casino/GameTopBar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, HelpCircle, RotateCcw, Layers, X } from "lucide-react";
import { MobileSheet } from "@/components/ui/MobileSheet";
import {
  autoAdvance,
  auditPlayerMove,
  newMatch,
  playCard,
  type EscobaState,
} from "@/lib/games/escoba/engine";
import { capturesFor } from "@/lib/games/escoba/rules";
import { stemOf, type Card } from "@/lib/games/escoba/deck";
import { TARGET_SCORE } from "@/lib/games/escoba/scoring";
import { findCardArt } from "@/lib/games/chinchon/chinchon-deck";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";
import { hostessForGame } from "@/lib/single-hostess";
import { Suspense } from "react";
// Import estático a propósito: con lazy(), si el jugador sale de la sala antes
// de que resuelva el chunk, React avisa de una actualización en un componente
// que nunca se montó. El retrato pesa poco, así que viaja con la sala.
import { NpcPortraitCard } from "@/components/casino/NpcPortraitCard";
function PortraitFallback({ src, name }: { src: string; name: string }) {
  return (
    <div className="rounded-2xl border border-[var(--oro)]/25 bg-[var(--verde-noche)]/70 p-3">
      <img
        src={src}
        alt={name}
        width={168}
        height={224}
        loading="eager"
        decoding="async"
        className="h-56 w-full rounded-lg object-cover opacity-90"
      />
      <div className="mt-2 text-center text-[11px] uppercase tracking-[0.24em] text-[var(--oro)]/80">
        {name}
      </div>
    </div>
  );
}
import { getHostessAiProfile } from "@/lib/hostess-ai";
import { reportAffinity } from "@/store/single-affinity";
import {
  reportCpuMistake,
  reportGameOutcome,
  reportOutcomeMistakes,
  useNemesisSession,
} from "@/lib/nemesis";
import { reportSingleScore } from "@/store/single-scores";
import { useCasino } from "@/store/casino";
import cardBack from "@/assets/chinchon-v2/card-back.webp";
import { useLockGame } from "@/store/gameLock";
import { useSurrender } from "@/components/casino/SurrenderButton";
import { NoLivesGate } from "@/components/casino/NoLivesGate";
import { useTryStart } from "@/hooks/use-try-start";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { useCampaignBridge, bumpCampaignEvent } from "@/hooks/use-campaign-bridge";
import { useHaptics } from "@/hooks/use-haptics";
import bgEscoba from "@/assets/bg-escoba.webp";
import bettiePortraitSrc from "@/assets/bettie-portrait.webp";

type BettieMood = "idle" | "win" | "lose" | "tense" | "angry";
const BETTIE_BY_MOOD: Record<BettieMood, string> = {
  idle: bettiePortraitSrc,
  win: bettiePortraitSrc,
  lose: bettiePortraitSrc,
  tense: bettiePortraitSrc,
  angry: bettiePortraitSrc,
};

import { lazyNamed } from "@/lib/lazy";
const EscobaVictoryScreen = lazyNamed(
  () => import("@/components/casino/escoba/EscobaVictoryScreen"),
  "EscobaVictoryScreen",
);
import { useEscobaRun } from "@/store/games/escoba/escoba-run";
import { trackEscobaEvent } from "@/lib/games/escoba/escoba-tracker";
import { useGameAutosave, loadGameSave } from "@/lib/game-autosave";

interface EscobaSave {
  state: EscobaState;
  started: boolean;
}

function isValidEscobaSave(v: unknown): v is EscobaSave {
  if (!v || typeof v !== "object") return false;
  const s = (v as EscobaSave).state;
  return (
    !!s &&
    typeof s === "object" &&
    Array.isArray(s.table) &&
    !!s.hands &&
    Array.isArray(s.hands.player) &&
    Array.isArray(s.hands.cpu) &&
    !!s.piles &&
    typeof s.turn === "string" &&
    typeof (v as EscobaSave).started === "boolean"
  );
}

export const Route = createFileRoute("/escoba")({
  // El reparto es aleatorio en el cliente: sin SSR no hay desajuste de hidratación.
  ssr: false,

  head: () => ({
    links: [],
    meta: [
      { title: "Barrido de Quince — El Cuervo Dorado" },
      { name: "description", content: "Escoba de 15 contra la casa. Sumá quince, barrí la mesa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EscobaPage,
});

function EscobaPage() {
  useSingleHostessCorner("escoba");
  useCampaignBridge("escoba");
  const hostess = hostessForGame("escoba");
  const haptic = useHaptics();
  const navigate = useNavigate();

  const [state, setState] = useState<EscobaState | null>(null);
  const [started, setStarted] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [pickedIdsInProgress, setPickedIdsInProgress] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [bettieMood, setBettieMood] = useState<BettieMood>("idle");
  const bettiePortrait = BETTIE_BY_MOOD[bettieMood];

  // Economía: la Escoba ahora se juega por fichas, igual que el resto de la casa.
  const chips = useCasino((s) => s.chips);
  const spend = useCasino((s) => s.spend);
  const addChips = useCasino((s) => s.addChips);
  const [ante, setAnte] = useState(100);
  const anteRef = useRef(ante);
  useEffect(() => {
    anteRef.current = ante;
  }, [ante]);
  const nem = useNemesisSession("escoba");
  const { tryStart, gateOpen, closeGate } = useTryStart();

  const beginMatch = useCallback(() => {
    // La mesa cuesta una vida, igual que el resto de la casa.
    tryStart(() => {
      if (!spend(ante)) return;
      setSurrendered(false);
      setSelectedCardIdx(null);
      setPickedIdsInProgress(new Set());
      const restr = useEscobaRun.getState().restrictions();
      setState(autoAdvance(newMatch(Math.random, { weakHand: restr.weakHand })));
      setStarted(true);
    });
  }, [spend, ante, tryStart]);

  // Reanudación silenciosa: si Android mató la app a mitad de mano, volvemos
  // exactamente donde estaba. Si el guardado no cierra (forma vieja/corrupta),
  // lo ignoramos y arrancamos limpio.
  useEffect(() => {
    const saved = loadGameSave("escoba", 1);
    if (isValidEscobaSave(saved)) {
      setState(saved.state);
      setStarted(saved.started);
      setSurrendered(false);
    }
  }, []);

  const matchActive = !!state && state.status !== "match-end" && !surrendered && started;
  useLockGame(matchActive);

  useGameAutosave(
    {
      game: "escoba",
      version: 1,
      active: matchActive,
      snapshot: () => (state && started ? { state, started } : null),
    },
    [state, started],
  );
  useSurrender(
    matchActive
      ? () => {
          setSurrendered(true);
          setStarted(false);
          setState(null);
          setSelectedCardIdx(null);
          setPickedIdsInProgress(new Set());
          navigate({ to: "/single" });
        }
      : null,
    "Rendirse",
  );

  const selectedCard =
    selectedCardIdx == null || !state ? null : state.hands.player[selectedCardIdx];
  const options = useMemo(
    () => (selectedCard && state ? capturesFor(state.table, selectedCard) : []),
    [selectedCard, state],
  );
  const hasCapture = options.length > 0;

  useEffect(() => {
    if (!state?.event) return;
    if (state.event.type === "capture") {
      const ev = state.event;
      const who = ev.by === "player" ? "Levantás" : "La casa levanta";
      const sweep = ev.sweep ? " ¡Escoba!" : "";
      setToast(`${who} ${ev.picked.length} carta${ev.picked.length === 1 ? "" : "s"}.${sweep}`);
      if (ev.by === "player") haptic(ev.sweep ? "heavy" : "success");
      setBettieMood(
        ev.by === "player" ? (ev.sweep ? "angry" : "tense") : ev.sweep ? "win" : "idle",
      );
      const allCards = [ev.played, ...ev.picked];
      const oros = allCards.filter((c) => c.suit === "oros").length;
      const siete = allCards.some((c) => c.suit === "oros" && c.rank === 7);
      trackEscobaEvent({
        kind: "capture",
        by: ev.by,
        cards: allCards.length,
        sweep: ev.sweep,
        oros,
        siete,
      });
    } else if (state.event.type === "round-end") {
      const bd = state.event.breakdown;
      setToast(`Ronda cerrada — vos ${bd.player.total}, casa ${bd.cpu.total}.`);
      setBettieMood(
        bd.player.total > bd.cpu.total ? "lose" : bd.cpu.total > bd.player.total ? "win" : "tense",
      );
      trackEscobaEvent({
        kind: "round-end",
        playerPoints: bd.player.total,
        cpuPoints: bd.cpu.total,
        playerWonRound: bd.player.total > bd.cpu.total,
      });
    } else if (state.event.type === "match-end") {
      const winner = state.event.winner;
      const won = winner === "player";
      const draw = winner === "draw";
      const stake = anteRef.current;
      const pts = state.totals.player ?? 0;
      const cpuPts = state.totals.cpu ?? 0;
      const prize = won ? Math.round(stake * 2.4) : draw ? stake : 0;
      if (prize > 0) addChips(prize);
      reportSingleScore("escoba", pts);
      reportOutcomeMistakes({
        game: "escoba",
        playerWon: won,
        draw,
        playerPoints: pts,
        cpuPoints: cpuPts,
      });
      nem.markResolved();
      setToast(
        draw
          ? "Empate: se juega otra ronda."
          : won
            ? `Barriste al Cuervo. +${prize} fichas.`
            : "La casa se lleva la banca.",
      );
      reportAffinity(hostess?.npcId ?? "bettie", won ? "win" : draw ? "draw" : "loss");
      reportGameOutcome("escoba", draw ? "draw" : won ? "win" : "loss");
      // Puntaje de liga por resultado, además del movimiento de fichas.
      void import("@/store/league-progress").then(({ awardLeaguePoints }) =>
        awardLeaguePoints("escoba", won ? 120 : draw ? 40 : 15),
      );
      if (won) bumpCampaignEvent("escoba");
      trackEscobaEvent({ kind: "match-end", won });
      haptic(won ? "success" : draw ? "warning" : "error");
      setBettieMood(draw ? "tense" : won ? "lose" : "win");
    }
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.event, hostess?.npcId, haptic, addChips]);

  useEffect(() => {
    if (!state || state.status !== "playing" || state.turn !== "cpu") return;
    const t = window.setTimeout(() => {
      setState((s) => (s ? autoAdvance(s) : s));
    }, 650);
    return () => window.clearTimeout(t);
  }, [state?.turn, state?.status]);

  const commitPlay = useCallback((cardIdx: number, captureIdx = 0) => {
    setState((s) => {
      if (!s) return s;
      const tags = auditPlayerMove(s, cardIdx, captureIdx);
      for (const t of tags) reportCpuMistake("escoba", t);
      return playCard(s, "player", cardIdx, captureIdx);
    });
    setSelectedCardIdx(null);
    setPickedIdsInProgress(new Set());
  }, []);

  const onHandCardClick = (idx: number) => {
    if (!state || state.turn !== "player" || state.status !== "playing") return;
    setSelectedCardIdx((cur) => (cur === idx ? null : idx));
    setPickedIdsInProgress(new Set());
    haptic("select");
  };

  const onTableCardClick = (card: Card) => {
    if (!selectedCard || !hasCapture) return;
    const inSome = options.some((o) => o.some((c) => c.id === card.id));
    if (!inSome) return;
    setPickedIdsInProgress((prev) => {
      const next = new Set(prev);
      if (next.has(card.id)) next.delete(card.id);
      else next.add(card.id);
      return next;
    });
    haptic("tap");
  };

  const matchedOptionIdx = useMemo(() => {
    if (!selectedCard || pickedIdsInProgress.size === 0) return -1;
    for (let i = 0; i < options.length; i++) {
      const ids = new Set(options[i].map((c) => c.id));
      if (
        ids.size === pickedIdsInProgress.size &&
        [...pickedIdsInProgress].every((id) => ids.has(id))
      )
        return i;
    }
    return -1;
  }, [options, pickedIdsInProgress, selectedCard]);

  const canConfirm = selectedCard != null && (options.length === 0 || matchedOptionIdx >= 0);

  const needed = selectedCard ? 15 - selectedCard.value : null;

  const legality = !selectedCard
    ? "Elegí una carta de tu mano."
    : options.length === 0
      ? "No suma 15 con nada de la mesa. Al confirmar, se descarta."
      : matchedOptionIdx >= 0
        ? `Suma 15 exacta. ${state && pickedIdsInProgress.size === state.table.length ? "¡Va a ser escoba!" : "Confirmá la captura."}`
        : `Necesitás sumar ${needed} en la mesa · ${options.length} combinación${options.length === 1 ? "" : "es"} posible${options.length === 1 ? "" : "s"}.`;

  const doConfirm = () => {
    if (selectedCardIdx == null) return;
    commitPlay(selectedCardIdx, Math.max(0, matchedOptionIdx));
  };

  if (!state) {
    return (
      <GameRoomShell
        bg={bgEscoba}
        room="escoba"
        title="Barrido de Quince"
        subtitle="mesa de fieltro clandestino"
        npcId={hostess?.npcId}
        npcRoom="/escoba"
      >
        <div
          className="cuervo-mobile-compact mobile-stack-grid mx-auto grid min-h-[70vh] max-w-6xl grid-cols-1 gap-4 px-3 pb-6 sm:px-5 lg:grid-cols-[260px_minmax(0,1fr)]"
          style={{
            paddingTop: "calc(var(--hud-h, 56px) + 12px)",
            fontFamily: "'Barlow', system-ui, sans-serif",
          }}
        >
          {hostess && (
            <div className="desktop-rail hidden lg:block lg:sticky lg:top-[calc(var(--hud-h,56px)+16px)] lg:self-start">
              <Suspense fallback={<PortraitFallback src={bettiePortrait} name={hostess.name} />}>
                <NpcPortraitCard
                  src={bettiePortrait}
                  alt={hostess.name}
                  name={hostess.name}
                  line={hostess.greet}
                  npcId={hostess.npcId}
                  bgSrc={bgEscoba}
                  bgFilter="brightness(0.5) saturate(1.1) contrast(1.05)"
                />
              </Suspense>
            </div>
          )}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-[var(--oro)]/40 bg-[var(--verde-noche)]/80 px-6 py-8 text-center backdrop-blur-md shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
              <div
                className="mb-2 text-3xl text-[var(--oro)]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.2em" }}
              >
                ESCOBA · 15
              </div>
              <p className="mb-1 text-[11px] uppercase tracking-[0.28em] text-[var(--marfil)]/65">
                {surrendered ? "Te retiraste de la mesa" : "Sumá quince, barrí la mesa"}
              </p>
              <p className="mb-5 text-[13px] leading-relaxed text-[var(--marfil)]/80">
                Meta {TARGET_SCORE} puntos. Iniciar la partida bloquea la salida: solo salís
                ganando, perdiendo o rindiéndote (cuesta 1 vida).
              </p>
              <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[var(--oro)]/80">
                Apuesta · paga ×2.4
              </p>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {[50, 100, 250].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAnte(p)}
                    disabled={chips < p}
                    className={`min-h-11 rounded-md border px-2 py-2 text-[12px] font-semibold tabular-nums transition disabled:opacity-35 ${
                      ante === p
                        ? "border-[var(--oro)] bg-[var(--oro)]/25 text-[var(--oro-claro)]"
                        : "border-[var(--oro)]/30 bg-[var(--verde-noche)]/60 text-[var(--marfil)]/80"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[var(--marfil)]/65 tabular-nums">
                tu bolsa · {chips} fichas
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={beginMatch}
                  disabled={chips < ante}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-[var(--oro)]/70 bg-gradient-to-b from-[var(--oro)]/30 to-[var(--oro)]/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--oro-claro)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:from-[var(--oro)]/50 hover:to-[var(--oro)]/20 disabled:opacity-40"
                >
                  {chips < ante ? "Fichas insuficientes" : `Empezar · ${ante}`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRules(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[var(--oro)]/25 bg-[var(--verde-noche)]/60 px-3 py-2.5 text-[11px] uppercase tracking-[0.22em] text-[var(--marfil)]/80 transition hover:border-[var(--oro)]/60 hover:text-[var(--oro)]"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Ver reglas
                </button>
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {showRules && <RulesDialog onClose={() => setShowRules(false)} />}
        </AnimatePresence>
        <NoLivesGate
          open={gateOpen}
          onClose={closeGate}
          line={'"Sin corazones no se barre, querido. Volvé cuando descanses."'}
        />
      </GameRoomShell>
    );
  }

  const cpuActive = state.turn === "cpu" && state.status === "playing";
  const playerActive = state.turn === "player" && state.status === "playing";

  const hostessLine =
    hostess?.chatter[state.round % (hostess.chatter.length || 1)] ?? hostess?.greet ?? "";
  const archetype = hostess ? getHostessAiProfile(hostess.npcId).label : "";

  return (
    <GameRoomShell
      bg={bgEscoba}
      room="escoba"
      title="Barrido de Quince"
      subtitle="mesa de fieltro clandestino"
      npcId={hostess?.npcId}
      npcRoom="/escoba"
    >
      <div
        className="cuervo-game-root text-[var(--marfil)]"
        style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
      >
        <EscobaCampaignMount />

        <main
          className="cuervo-mobile-compact mobile-stack-grid relative z-0 mx-auto grid max-w-6xl grid-cols-1 gap-4 px-3 pb-6 sm:px-5 lg:grid-cols-[260px_minmax(0,1fr)]"
          style={{ paddingTop: "calc(var(--hud-h, 56px) + 12px)" }}
        >
          {}
          {hostess && (
            <div className="desktop-rail hidden lg:block lg:sticky lg:top-[calc(var(--hud-h,56px)+16px)] lg:self-start">
              <Suspense fallback={<PortraitFallback src={bettiePortrait} name={hostess.name} />}>
                <NpcPortraitCard
                  src={bettiePortrait}
                  alt={hostess.name}
                  name={hostess.name}
                  line={hostessLine}
                  npcId={hostess.npcId}
                  bgSrc={bgEscoba}
                  bgFilter="brightness(0.5) saturate(1.1) contrast(1.05)"
                  archetype={archetype}
                />
              </Suspense>
            </div>
          )}

          <div className="game-focus flex min-w-0 flex-col gap-3">
            {}
            <GameTopBar
              title="BARRIDO DE QUINCE"
              subtitle={`Ronda ${state.round} · Meta ${TARGET_SCORE} pts`}
              leading={
                <button
                  type="button"
                  onClick={() => setShowRules(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--oro)]/25 bg-[var(--verde-noche)]/60 text-[var(--marfil)]/80 transition hover:border-[var(--oro)]/60 hover:text-[var(--oro)]"
                  aria-label="Ver reglas"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              }
              chips={
                <>
                  <ScoreChip label="Vos" value={state.totals.player} highlight />
                  <ScoreChip label="Casa" value={state.totals.cpu} />
                </>
              }
            />

            {}
            <section className="flex items-center justify-between gap-3">
              <SeatBadge label="La Casa" active={cpuActive} />
              <div className="flex -space-x-5">
                {state.hands.cpu.map((c, i) => (
                  <CardBack key={c.id + i} thinking={cpuActive} idx={i} />
                ))}
                {state.hands.cpu.length === 0 && (
                  <div className="text-[11px] italic text-[var(--marfil)]/65">sin cartas</div>
                )}
              </div>
              <PileBadge count={state.piles.cpu.captured.length} sweeps={state.piles.cpu.sweeps} />
            </section>

            {}
            <section
              className="relative overflow-hidden rounded-3xl border border-[var(--oro)]/25 p-4 sm:p-6"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(30,82,54,0.55) 0%, rgba(20,61,40,0.55) 55%, rgba(12,40,26,0.6) 100%)",
                boxShadow:
                  "inset 0 0 40px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(201,168,76,0.15), 0 20px 60px -20px rgba(0,0,0,0.7)",
              }}
            >
              {}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-3 rounded-2xl border border-dashed border-[var(--oro)]/15"
              />
              {}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                <span className="text-[7rem] font-bold tracking-[0.3em] text-[var(--oro)]/[0.04] sm:text-[10rem]">
                  15
                </span>
              </div>

              {}
              <div className="pointer-events-none absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-full border border-[var(--oro)]/25 bg-[var(--verde-noche)]/85 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-[var(--marfil)]/80 sm:bottom-3 sm:right-3 sm:gap-2 sm:px-2.5 sm:py-1 sm:text-[11px]">
                <Layers className="h-3 w-3 text-[var(--oro)]/80" />
                <span>Mazo</span>
                <span className="text-[var(--oro)]">{state.deck.length}</span>
              </div>

              {}
              <div className="relative flex min-h-[170px] flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                {state.table.length === 0 && (
                  <div className="text-xs italic text-[var(--marfil)]/65">
                    Mesa limpia — mesa vacía tras la captura.
                  </div>
                )}
                {state.table.map((c) => {
                  const legal = !selectedCard
                    ? false
                    : options.some((o) => o.some((x) => x.id === c.id));
                  const picked = pickedIdsInProgress.has(c.id);
                  const dimmed = !!selectedCard && !legal;
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: picked ? -8 : 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    >
                      <CardTile
                        card={c}
                        onClick={() => onTableCardClick(c)}
                        className={[
                          legal
                            ? "cursor-pointer ring-2 ring-[var(--oro)]/70 shadow-[0_0_18px_-4px_rgba(247,210,113,0.6)]"
                            : "",
                          picked ? "ring-4 ring-[var(--oro-claro)]" : "",
                          dimmed ? "opacity-40 saturate-50" : "",
                        ].join(" ")}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {}
            <section
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--oro)]/20 px-4 py-2.5"
              style={{
                background: "linear-gradient(180deg, rgba(11,21,18,0.9), rgba(6,13,10,0.85))",
              }}
            >
              <div className="flex flex-1 items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] uppercase tracking-widest ${
                    playerActive
                      ? "bg-[var(--oro)]/20 text-[var(--oro-claro)]"
                      : "bg-[var(--marfil)]/10 text-[var(--marfil)]/65"
                  }`}
                >
                  {playerActive && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--oro-claro)]" />
                  )}
                  Turno
                </span>
                <p className="flex-1 text-[13px] text-[var(--marfil)]/85">
                  {state.status === "playing"
                    ? playerActive
                      ? legality
                      : "La casa piensa la jugada…"
                    : state.status === "round-end"
                      ? "Ronda cerrada. Repartiendo la próxima…"
                      : state.totals.player === state.totals.cpu
                        ? "Empate en la meta — desempate."
                        : `Fin de partida — ganó ${state.totals.player > state.totals.cpu ? "vos" : "la casa"}.`}
                </p>
                {needed != null && options.length > 0 && matchedOptionIdx < 0 && (
                  <span className="hidden shrink-0 rounded-full border border-[var(--oro)]/40 bg-[var(--oro)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--oro-claro)] sm:inline">
                    Falta {needed}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCardIdx(null);
                    setPickedIdsInProgress(new Set());
                  }}
                  disabled={selectedCardIdx == null}
                  className="rounded-md border border-[var(--marfil)]/20 px-3 py-1.5 text-[11px] uppercase tracking-widest text-[var(--marfil)]/80 transition hover:border-[var(--oro)]/60 hover:text-[var(--oro)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={doConfirm}
                  disabled={!canConfirm || !playerActive}
                  className="rounded-md border border-[var(--oro)]/70 bg-gradient-to-b from-[var(--oro)]/30 to-[var(--oro)]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--oro-claro)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:from-[var(--oro)]/50 hover:to-[var(--oro)]/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {options.length === 0 && selectedCard ? "Descartar" : "Jugar"}
                </button>
                {state.status === "match-end" && (
                  <button
                    type="button"
                    onClick={() => setState(autoAdvance(newMatch()))}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--oro)]/70 bg-[var(--carmin)]/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--oro-claro)] transition hover:bg-[var(--carmin)]/80"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Otra
                  </button>
                )}
              </div>
            </section>

            {}
            <section className="relative flex items-end justify-center gap-0 pb-16 sm:justify-between sm:gap-3 sm:pb-0">
              <div className="absolute bottom-0 left-0 sm:static">
                <PileBadge
                  count={state.piles.player.captured.length}
                  sweeps={state.piles.player.sweeps}
                  mine
                />
              </div>
              <div className="flex w-full min-w-0 flex-1 justify-center gap-1 sm:gap-2">
                {state.hands.player.map((c, i) => {
                  const isSel = selectedCardIdx === i;
                  const rot = (i - (state.hands.player.length - 1) / 2) * 4;
                  return (
                    <motion.button
                      type="button"
                      key={c.id}
                      onClick={() => onHandCardClick(i)}
                      layout
                      whileHover={{ y: -6 }}
                      animate={{ y: isSel ? -18 : 0, rotate: isSel ? 0 : rot }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="focus:outline-none"
                      style={{ transformOrigin: "50% 100%" }}
                      aria-label={`Carta ${c.label} de ${c.suit}`}
                    >
                      <CardTile
                        card={c}
                        className={
                          isSel
                            ? "ring-4 ring-[var(--oro-claro)] shadow-[0_10px_30px_-6px_rgba(247,210,113,0.55)]"
                            : "shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6)]"
                        }
                      />
                    </motion.button>
                  );
                })}
                {state.hands.player.length === 0 && (
                  <div className="text-sm italic text-[var(--marfil)]/65">
                    Repartiendo la próxima mano…
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 sm:static">
                <SeatBadge label="Vos" active={playerActive} />
              </div>
            </section>

            {}
            {state.lastBreakdown && state.status !== "playing" && (
              <BreakdownPanel bd={state.lastBreakdown} />
            )}
          </div>
        </main>

        {}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--sa-bottom)+6rem)] z-40 flex justify-center px-4"
            >
              <div className="flex items-center gap-2 rounded-lg border border-[var(--oro)]/50 bg-[var(--verde-noche)]/95 px-4 py-2 text-sm text-[var(--oro-claro)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]">
                <Sparkles className="h-3.5 w-3.5" />
                {toast}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {}
        <AnimatePresence>
          {showRules && <RulesDialog onClose={() => setShowRules(false)} />}
        </AnimatePresence>
      </div>
    </GameRoomShell>
  );

  function BreakdownPanel({ bd }: { bd: NonNullable<EscobaState["lastBreakdown"]> }) {
    type Line = {
      label: string;
      playerVal: number;
      cpuVal: number;
      playerWon: boolean;
      cpuWon: boolean;
    };
    const lines: Line[] = [
      {
        label: "Más cartas",
        playerVal: bd.player.cards,
        cpuVal: bd.cpu.cards,
        playerWon: bd.player.cards > 0,
        cpuWon: bd.cpu.cards > 0,
      },
      {
        label: "Más oros",
        playerVal: bd.player.oros,
        cpuVal: bd.cpu.oros,
        playerWon: bd.player.oros > 0,
        cpuWon: bd.cpu.oros > 0,
      },
      {
        label: "Siete de oros",
        playerVal: bd.player.siete,
        cpuVal: bd.cpu.siete,
        playerWon: bd.player.siete > 0,
        cpuWon: bd.cpu.siete > 0,
      },
      {
        label: "Más sietes (setenta)",
        playerVal: bd.player.setenta,
        cpuVal: bd.cpu.setenta,
        playerWon: bd.player.setenta > 0,
        cpuWon: bd.cpu.setenta > 0,
      },
      {
        label: "Escobas",
        playerVal: bd.player.sweeps,
        cpuVal: bd.cpu.sweeps,
        playerWon: bd.player.sweeps > bd.cpu.sweeps,
        cpuWon: bd.cpu.sweeps > bd.player.sweeps,
      },
    ];
    return (
      <section className="rounded-xl border border-[var(--oro)]/20 bg-[var(--verde-noche)]/70 px-3 py-2.5 text-xs text-[var(--marfil)]/80">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--oro)]">
          <span>Desglose de ronda</span>
          <span className="normal-case tracking-normal text-[var(--marfil)]/65">Vos · Casa</span>
        </div>
        <ul className="space-y-1">
          {lines.map((l, i) => (
            <motion.li
              key={l.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 * i, duration: 0.25, ease: "easeOut" }}
              className="flex items-center justify-between gap-2 rounded-md border border-[var(--marfil)]/10 bg-[#0f1f19]/60 px-2 py-1"
            >
              <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--marfil)]/80">
                {l.label}
              </span>
              <span
                className={`w-5 text-center text-[11px] font-semibold ${
                  l.playerWon ? "text-[var(--oro-claro)]" : "text-[var(--marfil)]/65"
                }`}
              >
                {l.playerVal}
              </span>
              <span className="text-[11px] text-[var(--marfil)]/65">·</span>
              <span
                className={`w-5 text-center text-[11px] font-semibold ${
                  l.cpuWon ? "text-[var(--oro-claro)]" : "text-[var(--marfil)]/65"
                }`}
              >
                {l.cpuVal}
              </span>
              <span
                className={`w-14 shrink-0 rounded-sm border px-1 py-0.5 text-center text-[11px] uppercase tracking-widest ${
                  l.playerWon
                    ? "border-[var(--oro)]/60 bg-[var(--oro)]/15 text-[var(--oro-claro)]"
                    : l.cpuWon
                      ? "border-[var(--carmin)]/60 bg-[var(--carmin)]/20 text-[#e8a2a2]"
                      : "border-[var(--marfil)]/10 text-[var(--marfil)]/65"
                }`}
              >
                {l.playerWon ? "Vos" : l.cpuWon ? "Casa" : "—"}
              </span>
            </motion.li>
          ))}
        </ul>
        <div className="mt-1.5 flex items-center justify-between border-t border-[var(--marfil)]/10 pt-1.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--oro)]/85">
            Total
          </span>
          <span className="flex items-center gap-2">
            <span
              className="text-lg font-semibold text-[var(--oro-claro)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {bd.player.total}
            </span>
            <span className="text-[11px] text-[var(--marfil)]/65">vs</span>
            <span
              className="text-lg font-semibold text-[var(--oro-claro)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {bd.cpu.total}
            </span>
          </span>
        </div>
      </section>
    );
  }
}

function ScoreChip({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`min-w-[44px] shrink-0 rounded-md border px-1.5 py-0.5 text-center sm:min-w-[58px] sm:px-2 sm:py-1 ${
        highlight
          ? "border-[var(--oro)]/70 bg-gradient-to-b from-[var(--oro)]/20 to-[var(--oro)]/5"
          : "border-[var(--marfil)]/20 bg-[var(--verde-noche)]/60"
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--marfil)]/65 sm:text-[11px] sm:tracking-[0.2em]">
        {label}
      </div>
      <div
        className={`text-base font-semibold leading-tight sm:text-lg ${highlight ? "text-[var(--oro-claro)]" : "text-[var(--marfil)]"}`}
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
      >
        {value}
      </div>
    </div>
  );
}

function SeatBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] transition ${
        active
          ? "border-[var(--oro)]/70 bg-[var(--oro)]/15 text-[var(--oro-claro)] shadow-[0_0_12px_-2px_rgba(247,210,113,0.4)]"
          : "border-[var(--marfil)]/15 text-[var(--marfil)]/65"
      }`}
    >
      {active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--oro-claro)]" />}
      {label}
    </div>
  );
}

function PileBadge({
  count,
  sweeps,
  mine = false,
}: {
  count: number;
  sweeps: number;
  mine?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] ${
        mine
          ? "border-[var(--oro)]/50 bg-[var(--oro)]/10"
          : "border-[var(--marfil)]/15 bg-[var(--verde-noche)]/60"
      }`}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--marfil)]/65">
          Bandeja
        </span>
        <span className="text-[var(--marfil)]/85">{count} cartas</span>
      </div>
      {sweeps > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--oro)]/40 bg-[var(--carmin)]/50 px-2 py-0.5 text-[11px] font-semibold text-[var(--oro-claro)]">
          <Sparkles className="h-3 w-3" />
          {sweeps}
        </span>
      )}
    </div>
  );
}

function CardTile({
  card,
  onClick,
  className = "",
}: {
  card: Card;
  onClick?: () => void;
  className?: string;
}) {
  const art = findCardArt(stemOf(card));
  // El arte compartido con chinchón imprime "11/12" en caballos/reyes.
  // Superponemos el valor real de escoba (Sota=8, Caballo=9, Rey=10) para
  // que el usuario vea la numeración correcta al sumar 15.
  const rankBadge =
    card.rank <= 7 ? String(card.rank) : card.rank === 8 ? "8" : card.rank === 9 ? "9" : "10";
  return (
    <div
      onClick={onClick}
      className={`relative h-[118px] w-[80px] shrink-0 overflow-hidden rounded-lg border border-[var(--oro)]/40 bg-[var(--crema-clara)] transition-all duration-200 min-[380px]:h-[132px] min-[380px]:w-[90px] min-[420px]:h-[146px] min-[420px]:w-[100px] sm:h-[176px] sm:w-[122px] ${className}`}
    >
      {art ? (
        <img src={art} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center text-[#1a1a1a]">
          <span className="text-2xl font-bold">{card.label}</span>
          <span className="text-[11px] uppercase">{card.suit}</span>
        </div>
      )}
      {}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent"
      />
      {}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1 top-1 flex min-w-[22px] items-center justify-center rounded-md border border-[var(--oro)]/70 bg-[var(--verde-noche)]/85 px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--oro-claro)] shadow-[0_2px_6px_-2px_rgba(0,0,0,0.6)] sm:text-[13px]"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
      >
        {rankBadge}
      </div>
    </div>
  );
}

function CardBack({ thinking = false, idx = 0 }: { thinking?: boolean; idx?: number }) {
  return (
    <motion.div
      animate={thinking ? { y: [0, -3, 0] } : { y: 0 }}
      transition={
        thinking ? { duration: 1.4, repeat: Infinity, delay: idx * 0.12 } : { duration: 0.2 }
      }
      className="h-[78px] w-[54px] shrink-0 overflow-hidden rounded-md border border-[var(--oro)]/40 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.7)] min-[380px]:h-[92px] min-[380px]:w-[64px] sm:h-[120px] sm:w-[86px]"
    >
      <img src={cardBack} alt="" className="h-full w-full object-cover" />
    </motion.div>
  );
}

function RulesDialog({ onClose }: { onClose: () => void }) {
  return (
    <MobileSheet
      open
      onClose={onClose}
      eyebrow="Reglamento del garito"
      title="BARRIDO DE QUINCE"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="tap-comfort mx-auto w-full max-w-md rounded-md border border-[var(--oro)]/60 bg-[var(--oro)]/15 px-4 text-xs font-semibold uppercase tracking-widest text-[var(--oro-claro)] active:bg-[var(--oro)]/30"
        >
          A jugar
        </button>
      }
    >
      <div
        className="space-y-3 px-4 py-4 text-[13px] leading-relaxed text-[var(--marfil)]/85"
        style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}
      >
        <p>
          <strong className="text-[var(--oro-claro)]">Objetivo:</strong> ser el primero en llegar a{" "}
          <strong>{TARGET_SCORE} puntos</strong> capturando cartas cuya suma dé <strong>15</strong>.
        </p>
        <div>
          <strong className="text-[var(--oro-claro)]">Cómo jugar:</strong>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Se reparten 3 cartas a cada uno y 4 a la mesa.</li>
            <li>En tu turno tirás una carta: si suma 15 con una o más de la mesa, las levantás.</li>
            <li>Si no hay combinación, la carta queda en la mesa.</li>
            <li>Sota=8, Caballo=9, Rey=10.</li>
          </ul>
        </div>
        <div>
          <strong className="text-[var(--oro-claro)]">Escoba:</strong> si tu captura deja la mesa{" "}
          <strong>vacía</strong>, ganás 1 punto extra.
        </div>
        <div>
          <strong className="text-[var(--oro-claro)]">Puntos por ronda:</strong>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              <strong>Cartas:</strong> el que capturó más (1 pto).
            </li>
            <li>
              <strong>Oros:</strong> el que juntó más oros (1 pto).
            </li>
            <li>
              <strong>Velo:</strong> el que se llevó el 7 de oros (1 pto).
            </li>
            <li>
              <strong>Setenta:</strong> mejor combinación de puntos por palo (1 pto).
            </li>
            <li>
              <strong>Escobas:</strong> 1 pto por cada barrida.
            </li>
          </ul>
        </div>
      </div>
    </MobileSheet>
  );
}

function EscobaCampaignMount() {
  const activeLevel = useEscobaRun((s) => s.activeLevel);
  void activeLevel;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3">
      <EscobaVictoryScreen />
    </div>
  );
}
