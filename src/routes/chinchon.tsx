import { createFileRoute, Link } from "@tanstack/react-router";
import { reportSingleScore } from "@/store/single-scores";
import { useNemesisSession } from "@/lib/nemesis";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup, Reorder, useAnimationControls } from "framer-motion";
import { useChinchonSfx } from "@/hooks/use-chinchon-sfx";
import { useHaptics } from "@/hooks/use-haptics";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { lazyNamed } from "@/lib/lazy";
import { OpponentPill } from "@/components/casino/OpponentPill";
const ChinchonVictoryScreen = lazyNamed(
  () => import("@/components/casino/chinchon/ChinchonVictoryScreen"),
  "ChinchonVictoryScreen",
);
import { trackChinchonMatchEnd } from "@/lib/games/chinchon/chinchon-tracker";
import { useChinchonRun } from "@/store/games/chinchon/chinchon-run";

import { BrassButton } from "@/components/casino/BrassButton";
import { ArtDecoToast } from "@/components/casino/ArtDecoToast";

import { useCasino } from "@/store/casino";
import { useLockGame } from "@/store/gameLock";
import { useSurrender } from "@/components/casino/SurrenderButton";

import { NoLivesGate } from "@/components/casino/NoLivesGate";
import { useTryStart } from "@/hooks/use-try-start";
const ChinchonTutorial = lazyNamed(
  () => import("@/components/casino/chinchon/ChinchonTutorial"),
  "ChinchonTutorial",
);
import { NpcPortraitCard } from "@/components/casino/NpcPortraitCard";
import { getCurrentHostess } from "@/lib/hostess-rotation";
import { getHostessAiProfile, profileToChinchonDifficulty } from "@/lib/hostess-ai";
import { getEffectiveProfile } from "@/lib/hostess-tuning";
import { useHostessMatch } from "@/hooks/use-hostess-match";
import { describeHostess } from "@/lib/hostess-personality";
import zoneBg from "@/assets/zone-chinchon-v12.webp";
import luisaIdle from "@/assets/luisa-portrait.webp";
import luisaWin from "@/assets/luisa-portrait.webp";
import luisaLose from "@/assets/luisa-portrait.webp";
import luisaSmug from "@/assets/luisa-portrait.webp";
import luisaTense from "@/assets/luisa-portrait.webp";
import luisaShocked from "@/assets/luisa-portrait.webp";

const LUISA_BY_MOOD: Record<string, string> = {
  idle: luisaIdle,
  smug: luisaSmug,
  warn: luisaTense,
  win: luisaWin,
  lose: luisaLose,
  shocked: luisaShocked,
  danger: luisaLose,
  struggling: luisaTense,
};

import cardBack from "@/assets/chinchon-v2/card-back.webp";

import { usePrestige } from "@/store/prestige";
import { useCpuTraining } from "@/store/cpu-training";
import { CHINCHON_TIERS } from "@/lib/games/chinchon/chinchon-tiers";
import { DifficultyBadge } from "@/components/casino/DifficultyBadge";
import { announceProgress } from "@/components/casino/PrestigeUnlockToast";

import {
  type Card as ChCard,
  type MatchState,
  type Partition,
  type RoundResult,
  type RoundState,
  type Suit,
  DIRTY_PENALTY,
  aiDecide,
  aiDirtyChoice,
  applyResult,
  bestPartition,
  canCloseDiscarding,
  canDrawFromPile,
  cardValue,
  discard,
  drawFromDeck,
  drawFromPile,
  grantSecondLife,
  isChinchon,
  markDirtyCard,
  partitionFromGroups,
  resolveRound,
  startMatch,
  validateMeld,
} from "@/lib/games/chinchon/chinchon";
import { currentChinchonWeights } from "@/lib/ai/chinchon/weights";
import { useChinchonSettings } from "@/lib/games/chinchon/chinchon-settings";
import type { AiExplanation } from "@/lib/games/chinchon/chinchon";
import {
  clearChinchonSnapshot,
  loadChinchonSnapshot,
  saveChinchonSnapshot,
  type ChinchonSnapshot,
} from "@/lib/games/chinchon/chinchon-resume";

export const Route = createFileRoute("/chinchon")({
  ssr: false,
  component: ChinchonPage,
  head: () => ({
    meta: [
      { title: "El Corte Sucio — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Luisa «La Chinchonera» reparte el Chinchón clásico en la mesa de cartas españolas del Cuervo Dorado. Cerrá con tres o menos, o cantá chinchón y limpiá la noche.",
      },
      { property: "og:image", content: zoneBg },
      { property: "og:url", content: "/chinchon" },
    ],
    links: [{ rel: "canonical", href: "/chinchon" }],
  }),
});

import {
  SUIT_LABEL,
  SUIT_STYLE,
  RANK_LABEL,
  RANK_NUM_GLYPH,
  RANK_FILE,
  SUIT_PIP_COLOR,
  getCardArtSrc,
  SuitEmblem,
  CornerIndex,
  CardFace,
  FallbackFace,
  CardBack,
  LINES,
  pick,
  type Mood,
} from "@/components/casino/chinchon/CardFace";
import {
  ArrangeModal,
  ChinchonAiExplainPanel as AiExplainPanel,
  ChinchonSettingsModal,
  MatchEndModal,
  MiniCard,
  PlayerBreakdown,
  RoundEndModal,
  ToastAuto,
} from "@/components/casino/chinchon/ChinchonModals";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";

type GameStage = "ante" | "playing" | "user_arrange" | "round_end" | "match_end";

interface PendingClose {
  round: RoundState;
  closer: "user" | "ai";
  badClose: boolean;
  chinchon: boolean;
}

function ChinchonPage() {
  const nem = useNemesisSession("chinchon");
  const haptic = useHaptics();
  useSingleHostessCorner("chinchon");
  useEffect(() => {
    void import("@/lib/games/chinchon/chinchon-deck").then((m) => m.preloadDeck());
  }, []);
  const chips = useCasino((s) => s.chips);
  const addChips = useCasino((s) => s.addChips);
  const spendChips = useCasino((s) => s.spend);
  const trackMission = useCasino((s) => s.trackMission);
  const registerWin = useCasino((s) => s.registerWin);
  const registerLoss = useCasino((s) => s.registerLoss);
  const playSfx = useChinchonSfx();

  const hostNpcId = "luisa";
  const learn = useHostessMatch(hostNpcId);

  const hostShort = "Luisa";
  const hostName = "Luisa «La Chinchona» Ferrari";
  const hostMoodMap = LUISA_BY_MOOD;
  const hostFallback = luisaIdle;

  const [stage, setStage] = useState<GameStage>("ante");
  // El bloqueo cubre toda la partida (no sólo el turno jugable): al cortar,
  // las etapas de recuento no deben liberar gestos ni salidas accidentales.
  useLockGame(stage !== "ante");

  const handleSurrender = useCallback(() => {
    registerLoss();
    setStage("ante");
    setMatch(null);
    setLastRound(null);
    setSelectedId(null);
    setMood("win");
    setLine(pick(LINES.win));
    setToast({ msg: `Tiraste la toalla. ${hostShort} se queda con la mano.`, tone: "lose" });
  }, [registerLoss]);
  useSurrender(stage === "playing" ? handleSurrender : null, "Rendirse");

  const [ante, setAnte] = useState<number>(100);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [mood, setMood] = useState<Mood>("idle");
  const [line, setLine] = useState<string>(LINES.idle[0]);
  const [toast, setToast] = useState<{ msg: string; tone: "win" | "lose" | "neutral" } | null>(
    null,
  );
  const [lastRound, setLastRound] = useState<RoundResult | null>(null);
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);
  const [shake, setShake] = useState(0);
  const [chinchonFlash, setChinchonFlash] = useState(false);

  const [userPilePicks, setUserPilePicks] = useState<ChCard[]>([]);

  const [userDiscards, setUserDiscards] = useState<ChCard[]>([]);

  const [pileTopBy, setPileTopBy] = useState<"user" | "ai" | null>(null);

  const [aiTookFromPile, setAiTookFromPile] = useState(false);
  const aiTimer = useRef<number | null>(null);
  const { tryStart, gateOpen, closeGate } = useTryStart();

  const handleStart = useCallback(() => {
    if (ante < 20) {
      setToast({ msg: "Mínimo 20 fichas en la mesa.", tone: "neutral" });
      return;
    }
    if (chips < ante) {
      setToast({ msg: "No te alcanzan las fichas, mi vida.", tone: "lose" });
      return;
    }
    tryStart(() => {
      if (!spendChips(ante)) return;
      setMatch(startMatch("user"));
      matchStartedAt.current = Date.now();
      learn.begin();

      setStage("playing");
      setMood("idle");
      setLine(pick(LINES.idle));
      setUserPilePicks([]);
      setUserDiscards([]);
      setPileTopBy(null);
      setAiTookFromPile(false);
      playSfx("shuffle");
    });
  }, [ante, chips, spendChips, tryStart, playSfx]);

  const anteDiff: 0 | 1 | 2 = ante >= 250 ? 2 : ante >= 100 ? 1 : 0;
  const hostessDiff = profileToChinchonDifficulty(getEffectiveProfile(hostNpcId));
  const nemDiff: 0 | 1 | 2 =
    nem.active && nem.difficulty >= 1.5 ? 2 : nem.active && nem.difficulty >= 1.3 ? 1 : 0;

  const prestigeByGame = usePrestige((s) => s.byGame.chinchon);
  const trainingXp = useCpuTraining((s) => s.byGame.chinchon?.xp ?? 0);
  const resolvedDiff = useMemo(
    () => usePrestige.getState().resolve("chinchon", CHINCHON_TIERS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prestigeByGame?.tierId, prestigeByGame?.prestige],
  );
  const tierAccuracy = resolvedDiff.tuning.accuracy;
  const trainingBoost = useMemo(
    () => useCpuTraining.getState().boost("chinchon"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trainingXp],
  );

  const tierDiff: 0 | 1 | 2 =
    tierAccuracy + trainingBoost.accuracy >= 0.75
      ? 2
      : tierAccuracy + trainingBoost.accuracy >= 0.55
        ? 1
        : 0;
  const difficulty: 0 | 1 | 2 = Math.max(anteDiff, hostessDiff, nemDiff, tierDiff) as 0 | 1 | 2;
  const matchStartedAt = useRef<number>(0);

  const settings = useChinchonSettings();

  // Poll del reloj del encargo (time-cap). Marca lost-clock si vence.
  useEffect(() => {
    const id = window.setInterval(() => {
      try {
        useChinchonRun.getState().pollClock();
      } catch {
        /* ignore */
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const [aiExplain, setAiExplain] = useState<AiExplanation | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const aiExplainTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (aiExplainTimerRef.current) window.clearTimeout(aiExplainTimerRef.current);
    },
    [],
  );

  useEffect(
    () => () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    },
    [],
  );

  const auxTimersRef = useRef<Set<number>>(new Set());
  const scheduleAux = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      auxTimersRef.current.delete(id);
      fn();
    }, ms);
    auxTimersRef.current.add(id);
    return id;
  }, []);
  useEffect(
    () => () => {
      for (const id of auxTimersRef.current) window.clearTimeout(id);
      auxTimersRef.current.clear();
    },
    [],
  );

  const matchRef = useRef<MatchState | null>(null);
  useEffect(() => {
    matchRef.current = match;
  }, [match]);
  const aiActingRef = useRef(false);

  // --- Autosave / Reanudar (Android offline) ---
  const [savedSnap, setSavedSnap] = useState<ChinchonSnapshot | null>(null);
  useEffect(() => {
    setSavedSnap(loadChinchonSnapshot());
  }, []);
  useEffect(() => {
    if (stage !== "playing" || !match || match.over) return;
    const snap: ChinchonSnapshot = {
      match,
      ante,
      userPilePicks,
      userDiscards,
      pileTopBy,
      aiTookFromPile,
      savedAt: Date.now(),
    };
    saveChinchonSnapshot(snap);
  }, [stage, match, ante, userPilePicks, userDiscards, pileTopBy, aiTookFromPile]);
  useEffect(() => {
    if (stage === "ante" || (match && match.over)) {
      clearChinchonSnapshot();
    }
  }, [stage, match]);

  const handleResume = useCallback(() => {
    const snap = savedSnap ?? loadChinchonSnapshot();
    if (!snap) return;
    setMatch(snap.match);
    setAnte(snap.ante);
    setUserPilePicks(snap.userPilePicks ?? []);
    setUserDiscards(snap.userDiscards ?? []);
    setPileTopBy(snap.pileTopBy ?? null);
    setAiTookFromPile(!!snap.aiTookFromPile);
    setStage("playing");
    setMood("idle");
    setLine(pick(LINES.idle));
    matchStartedAt.current = Date.now();
    setSavedSnap(null);
    setToast({ msg: "Partida reanudada.", tone: "neutral" });
  }, [savedSnap]);

  useEffect(() => {
    if (!match || stage !== "playing") return;
    if (match.round.turn !== "ai") return;
    if (aiTimer.current) window.clearTimeout(aiTimer.current);
    aiTimer.current = window.setTimeout(() => {
      runAiTurn();
    }, 900);
    return () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.round.turn, match?.round.phase, stage]);

  function runAiTurn() {
    let m = matchRef.current;
    if (!m || m.round.turn !== "ai") return;
    if (aiActingRef.current) return;
    aiActingRef.current = true;
    try {
      const dirtyId = aiDirtyChoice(m);
      if (dirtyId) {
        m = markDirtyCard(m, "ai", dirtyId);
        matchRef.current = m;
        setMatch(m);
        setMood("smug");
        setLine(`${hostShort} marca una carta con la uña. Juega sucio.`);
        setToast({ msg: `${hostShort} usó su Carta Sucia.`, tone: "lose" });
      }
      const decision = aiDecide(m.round, Math.random, {
        rivalPilePicks: userPilePicks,
        rivalDiscards: userDiscards,
        difficulty,
        depth: Math.max(1, Math.min(2, Math.round(resolvedDiff.tuning.depth))) as 0 | 1 | 2,
        weights: currentChinchonWeights(),
      });
      if (settings.showAiExplain && decision.explanation) {
        setAiExplain(decision.explanation);
        if (aiExplainTimerRef.current) window.clearTimeout(aiExplainTimerRef.current);
        aiExplainTimerRef.current = window.setTimeout(() => setAiExplain(null), 5200);
      }
      const pileTopCard = m.round.pile[m.round.pile.length - 1];
      const afterDraw = decision.draw === "pile" ? drawFromPile(m.round) : drawFromDeck(m.round);
      playSfx(decision.draw === "pile" ? "drawPile" : "draw");
      if (decision.draw === "pile" && pileTopCard) {
        setAiTookFromPile(true);
        scheduleAux(() => setAiTookFromPile(false), 1500);
      }
      let res = discard(afterDraw, decision.discardId, decision.close);
      if (res.round === afterDraw) {
        // Salvaguarda: si el descarte elegido no era legal, la rival tira igual
        // una carta válida en vez de dejar la mano congelada.
        const fallback = afterDraw.hands.ai.find((c) => c.id !== afterDraw.pileDrawnCardId);
        if (fallback) res = discard(afterDraw, fallback.id, false);
      }

      setMatch({ ...m, round: res.round });

      setPileTopBy("ai");
      if (res.closed) {
        const closeInfo = res.closed;
        setMood(closeInfo.chinchon ? "win" : closeInfo.badClose ? "lose" : "smug");
        setLine(
          closeInfo.chinchon
            ? pick(LINES.win)
            : closeInfo.badClose
              ? pick(LINES.lose)
              : pick(LINES.smug),
        );
        scheduleAux(() => {
          playSfx(closeInfo.chinchon ? "chinchon" : closeInfo.badClose ? "badClose" : "aiClose");
        }, 240);

        // Sólo pedimos ordenar la mano si el jugador tiene alguna combinación
        // posible. Sin combinaciones no hay nada que elegir: todo suma y la
        // ronda se resuelve sola (antes el paso quedaba trabado).
        const userCanMeld = bestPartition(res.round.hands.user).melds.length > 0;
        if (!closeInfo.chinchon && !closeInfo.badClose && userCanMeld) {
          setPendingClose({
            round: res.round,
            closer: closeInfo.closer,
            badClose: closeInfo.badClose,
            chinchon: closeInfo.chinchon,
          });
          setStage("user_arrange");
        } else {
          const cleanResult = resolveRound(res.round, closeInfo);
          setLastRound(cleanResult);
          setStage("round_end");
        }
      } else {
        scheduleAux(() => playSfx("snap"), 220);
        setMood("idle");
        setLine(pick(LINES.idle));
      }
    } finally {
      window.setTimeout(() => {
        aiActingRef.current = false;
      }, 0);
    }
  }

  const onDraw = (from: "deck" | "pile") => {
    if (!match || stage !== "playing") return;
    if (match.round.turn !== "user" || match.round.phase !== "draw") return;
    const pileTopCard = match.round.pile[match.round.pile.length - 1];
    const round = from === "pile" ? drawFromPile(match.round) : drawFromDeck(match.round);
    setMatch({ ...match, round });
    setSelectedId(null);
    if (from === "pile" && pileTopCard) {
      setUserPilePicks((prev) => [...prev, pileTopCard]);
    }
    playSfx(from === "pile" ? "drawPile" : "draw");
  };

  const userHand = match?.round.hands.user ?? [];
  const userPartition = useMemo(() => bestPartition(userHand), [userHand]);
  const meldCardIds = useMemo(() => {
    const s = new Set<string>();
    for (const m of userPartition.melds) for (const c of m.cards) s.add(c.id);
    return s;
  }, [userPartition]);

  useEffect(() => {
    const handIds = userHand.map((c) => c.id);
    setUserOrder((prev) => {
      const set = new Set(handIds);
      const kept = prev.filter((id) => set.has(id));
      const keptSet = new Set(kept);
      const appended = handIds.filter((id) => !keptSet.has(id));
      const next = [...kept, ...appended];
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [userHand]);

  const orderedHand = useMemo(() => {
    const byId = new Map(userHand.map((c) => [c.id, c]));
    const arr: ChCard[] = [];
    for (const id of userOrder) {
      const c = byId.get(id);
      if (c) arr.push(c);
    }

    for (const c of userHand) if (!userOrder.includes(c.id)) arr.push(c);
    return arr;
  }, [userHand, userOrder]);

  const autoOrder = () => {
    const ordered: string[] = [];
    for (const m of userPartition.melds) {
      let sorted: typeof m.cards;
      if (m.kind === "set") {
        sorted = [...m.cards].sort((a, b) => {
          if (a.isJoker !== b.isJoker) return a.isJoker ? 1 : -1;
          return (a.rank as number) - (b.rank as number);
        });
      } else {
        const reals = m.cards
          .filter((c) => !c.isJoker)
          .sort((a, b) => (a.rank as number) - (b.rank as number));
        const jokers = m.cards.filter((c) => c.isJoker);
        if (reals.length === 0) {
          sorted = jokers;
        } else {
          const size = m.cards.length;
          const minR = reals[0].rank as number;
          const maxR = reals[reals.length - 1].rank as number;

          const startLow = Math.max(1, maxR - size + 1);
          const startHigh = Math.min(12 - size + 1, minR);
          const start = startLow <= startHigh ? startLow : minR;
          const slots: ((typeof m.cards)[number] | null)[] = Array.from(
            { length: size },
            () => null,
          );
          for (const c of reals) slots[(c.rank as number) - start] = c;
          const jq = [...jokers];
          for (let i = 0; i < size; i++) if (!slots[i] && jq.length) slots[i] = jq.shift()!;
          sorted = slots.filter((x): x is (typeof m.cards)[number] => x !== null);
        }
      }
      for (const c of sorted) ordered.push(c.id);
    }
    const loose = [...userPartition.loose].sort((a, b) => {
      if (a.isJoker !== b.isJoker) return a.isJoker ? -1 : 1;
      return (b.rank as number) - (a.rank as number);
    });
    for (const c of loose) ordered.push(c.id);

    const set = new Set(ordered);
    for (const c of userHand) if (!set.has(c.id)) ordered.push(c.id);
    setUserOrder(ordered);
  };

  const pileDrawnCardId = match?.round.pileDrawnCardId ?? null;
  const canCloseNow =
    match?.round.phase === "discard" &&
    match?.round.turn === "user" &&
    selectedId !== null &&
    selectedId !== pileDrawnCardId &&
    canCloseDiscarding(userHand, selectedId);

  const remainingAfterDiscard = useMemo(
    () => (selectedId ? userHand.filter((c) => c.id !== selectedId) : userHand),
    [userHand, selectedId],
  );
  const previewPartition = useMemo(
    () => (selectedId ? bestPartition(remainingAfterDiscard) : null),
    [remainingAfterDiscard, selectedId],
  );
  const canChinchon =
    match?.round.phase === "discard" &&
    match?.round.turn === "user" &&
    selectedId !== null &&
    selectedId !== pileDrawnCardId &&
    remainingAfterDiscard.length === 7 &&
    isChinchon(remainingAfterDiscard);

  const closeableIds = useMemo(() => {
    if (match?.round.phase !== "discard" || match?.round.turn !== "user") return new Set<string>();
    const s = new Set<string>();
    for (const c of userHand) {
      if (c.id === pileDrawnCardId) continue;
      if (canCloseDiscarding(userHand, c.id)) s.add(c.id);
    }
    return s;
  }, [userHand, match?.round.phase, match?.round.turn, pileDrawnCardId]);

  const pileGivesClosure = useMemo(() => {
    if (!match) return false;
    if (match.round.turn !== "user" || match.round.phase !== "draw") return false;
    if (!canDrawFromPile(match.round)) return false;
    const top = match.round.pile[match.round.pile.length - 1];
    if (!top) return false;
    const handPlus = [...userHand, top];
    return handPlus.some((c) => c.id !== top.id && canCloseDiscarding(handPlus, c.id));
  }, [match, userHand]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (!match || stage !== "playing") return;
    setMood((prev) => {
      if (prev !== "idle") return prev;
      if (match.scores.user >= 75) {
        setLine(pick(LINES.danger));
        return "danger";
      }
      if (match.scores.ai >= 75 && match.scores.user < 60) {
        setLine(pick(LINES.struggling));
        return "struggling";
      }
      return prev;
    });
  }, [match?.scores.user, match?.scores.ai, stage, match]);

  const dirtyUsedUser = match?.dirtyUsed?.user ?? false;
  const dirtyCardId = match?.round.hands.user.find((c) => c.dirty)?.id ?? null;

  const onMarkDirty = () => {
    if (!match || !selectedId) return;
    if (match.round.turn !== "user") return;
    if (dirtyUsedUser) return;
    const card = match.round.hands.user.find((c) => c.id === selectedId);
    if (!card || card.isJoker) return;
    const next = markDirtyCard(match, "user", selectedId);
    if (next === match) return;
    setMatch(next);
    setSelectedId(null);
    setMood("shocked");
    setLine("Marcaste una carta con la uña… no me hago cargo.");
    setToast({
      msg: `Carta Sucia: comodín por esta ronda. Si cerrás con ella pagás ${DIRTY_PENALTY} de soborno.`,
      tone: "neutral",
    });
    haptic("heavy");
    playSfx("cortar");
  };

  const onDiscard = (close: boolean) => {
    if (!match || !selectedId) return;
    if (match.round.phase !== "discard" || match.round.turn !== "user") return;
    const discardCard = match.round.hands.user.find((c) => c.id === selectedId) ?? null;
    const res = discard(match.round, selectedId, close);
    if (discardCard) setUserDiscards((prev) => [...prev, discardCard]);
    if (res.closed) {
      const cleanRound = { ...res.round };
      const result = resolveRound(cleanRound, res.closed);
      setLastRound(result);
      setStage("round_end");
      if (res.closed.chinchon) {
        setMood("shocked");
        setLine(pick(LINES.shocked));
        playSfx("chinchon");
        haptic("win");
        setChinchonFlash(true);
        scheduleAux(() => setChinchonFlash(false), 1400);
      } else if (res.closed.badClose) {
        setMood("smug");
        setLine("Mal cierre. Te penalizo, encanto.");
        playSfx("badClose");
        haptic("error");
        playSfx("shake");
        setShake((s) => s + 1);
      } else {
        setMood("warn");
        setLine("Cerrás… veamos qué te queda.");
        haptic("heavy");
        playSfx("cortar");
      }
      setMatch({ ...match, round: res.round });
      setSelectedId(null);
      return;
    }
    setMatch({ ...match, round: res.round });
    setSelectedId(null);
    setPileTopBy("user");
    haptic("card");
    playSfx("snap");
  };

  const handleNextRound = () => {
    if (!match || !lastRound) return;
    const next = applyResult(match, lastRound);
    setLastRound(null);
    if (next.over) {
      const cpuMayRevive =
        next.over.winner === "user" &&
        (next.over.reason === "score" || settings.allowSecondLifeOnChinchon) &&
        next.secondLivesUsed < settings.secondLivesAllowed;
      if (cpuMayRevive) {
        const revived = grantSecondLife(next, {
          maxAllowed: settings.secondLivesAllowed,
          allowOnChinchon: settings.allowSecondLifeOnChinchon,
        });
        setMatch(revived);
        setStage("playing");
        setLastRound(null);
        setSelectedId(null);
        setUserPilePicks([]);
        setUserDiscards([]);
        setPileTopBy(null);
        setAiTookFromPile(false);
        setMood("smug");
        setLine(`${hostShort} pide segunda vida — arrancamos parejos.`);
        setToast({
          msg: `${hostShort} usa su segunda vida: iguala tu marcador.`,
          tone: "neutral",
        });
        playSfx("shuffle");
        return;
      }
      setStage("match_end");
      if (next.over.winner === "user") {
        const prize = Math.round(ante * 2.5);
        addChips(prize);

        registerWin(prize);
        trackMission("win_chips", prize);
        setToast({ msg: `+${prize} fichas — la mesa es tuya.`, tone: "win" });
        setMood("lose");
        setLine(pick(LINES.lose));
      } else {
        registerLoss();
        setMood("win");
        setLine(pick(LINES.win));
        setToast({ msg: `${hostShort} se queda con la apuesta.`, tone: "lose" });
      }

      learn.event(next.over.winner === "ai" ? "won" : "lost", `chinchon:${next.over.winner}`);
      learn.finish({
        hostessWon: next.over.winner === "ai",
        durationMs: matchStartedAt.current ? Date.now() - matchStartedAt.current : undefined,
      });
      const winner = next.over.winner;
      void import("@/lib/narrative-hooks").then(({ recordGameOutcome }) => {
        recordGameOutcome({
          hostessId: hostNpcId,
          delta: winner === "user" ? Math.round(ante * 2.5) : -ante,
        });
      });

      void import("@/lib/nemesis").then(({ reportGameOutcome, reportOutcomeMistakes }) => {
        reportOutcomeMistakes({
          game: "chinchon",
          playerWon: winner === "user",
          ante,
        });
        reportGameOutcome("chinchon", winner === "user" ? "win" : "loss");
      });
      trackChinchonMatchEnd(winner === "user");
      reportSingleScore(
        "chinchon",
        Math.max(0, 100 - (match.scores.user ?? 0)) + (winner === "user" ? 100 : 0),
      );

      const spread = Math.abs(match.scores.user - match.scores.ai);
      const evt = usePrestige
        .getState()
        .reportResult("chinchon", CHINCHON_TIERS, winner === "user");
      announceProgress("El Corte Sucio", evt);

      useCpuTraining.getState().report("chinchon", {
        playerWon: winner === "user",
        spread,
      });

      matchStartedAt.current = 0;
      setMatch(next);
      return;
    }
    setMatch(next);
    setStage("playing");
    setMood("idle");
    setLine(pick(LINES.idle));
    setSelectedId(null);
    setShake(0);
    setChinchonFlash(false);
    setUserPilePicks([]);
    setUserDiscards([]);
    setPileTopBy(null);
    setAiTookFromPile(false);
    playSfx("shuffle");
  };

  const handleNewMatch = () => {
    setMatch(null);
    setLastRound(null);
    setStage("ante");
    setMood("idle");
    setSelectedId(null);
    setUserOrder([]);
    setShake(0);
    setChinchonFlash(false);
    setLine(pick(LINES.idle));
  };

  const handleSecondLife = useCallback(() => {
    if (!match || !match.over) return;
    if (match.over.reason === "chinchon" && !settings.allowSecondLifeOnChinchon) return;
    if (match.secondLivesUsed >= settings.secondLivesAllowed) return;
    const revived = grantSecondLife(match, {
      maxAllowed: settings.secondLivesAllowed,
      allowOnChinchon: settings.allowSecondLifeOnChinchon,
    });
    setMatch(revived);
    setStage("playing");
    setLastRound(null);
    setSelectedId(null);
    setUserPilePicks([]);
    setUserDiscards([]);
    setPileTopBy(null);
    setAiTookFromPile(false);
    setMood("warn");
    setLine("Segunda vida. Se empareja el marcador y volvemos a barajar.");
    setToast({ msg: "Segunda vida concedida — marcadores emparejados.", tone: "neutral" });
    playSfx("shuffle");
  }, [match, playSfx, settings.allowSecondLifeOnChinchon, settings.secondLivesAllowed]);

  return (
    <>
      <ChinchonVictoryScreen />
      <GameRoomShell
        bg={zoneBg}
        room="chinchon"
        title="El Corte Sucio"
        subtitle="cartas españolas · 100 puntos"
        npcId={hostNpcId}
        npcRoom="/chinchon"
      >
        {/* Los controles de Ajustes/Aprendiz para la fase ante se renderizan
            inline sobre AnteCard (ver más abajo) para no solapar el título en móvil. */}
        {aiExplain && settings.showAiExplain && (
          <AiExplainPanel
            data={aiExplain}
            hostShort={hostShort}
            onClose={() => setAiExplain(null)}
          />
        )}
        {showSettings && <ChinchonSettingsModal onClose={() => setShowSettings(false)} />}

        <div className="cuervo-mobile-compact mobile-stack-grid relative z-10 mx-auto my-auto grid w-full max-w-[520px] grid-cols-1 gap-3 px-2 pb-4 sm:px-3 sm:pb-12 xl:max-w-5xl xl:grid-cols-[190px_minmax(0,1fr)] xl:gap-4">
          <div className="desktop-rail hidden xl:block xl:sticky xl:top-[calc(var(--hud-h,56px)+12px)] xl:self-start">
            <LuisaPanel
              mood={mood}
              line={line}
              scores={match?.scores}
              portrait={hostMoodMap[mood] ?? hostFallback}
              name={hostName}
              shortName={hostShort}
              npcId={hostNpcId}
              archetype={describeHostess(getHostessAiProfile(hostNpcId).label, hostNpcId)}
            />
          </div>

          <div className="game-focus flex min-w-0 flex-col gap-3">
            {stage === "ante" && (
              <>
                <div className="pointer-events-auto flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="rounded-md border border-[var(--brass)]/40 bg-black/60 px-2 py-1 font-display text-[11px] uppercase tracking-widest text-[var(--brass)] hover:bg-black/80 backdrop-blur-sm"
                    title="Preferencias de Chinchón"
                    aria-label="Ajustes de Chinchón"
                  >
                    Ajustes
                  </button>
                  <DifficultyBadge
                    resolved={resolvedDiff}
                    title={`${resolvedDiff.tier.hint} · CPU ${trainingBoost.stage}`}
                  />
                </div>
                {savedSnap && (
                  <div className="rounded-xl border border-amber-400/40 bg-black/40 p-3 text-sm text-amber-100/95 shadow-lg">
                    <div className="mb-2 font-semibold text-amber-200">Partida en curso</div>
                    <div className="mb-2 text-amber-100/80">
                      Ronda {savedSnap.match.roundNo} — vos {savedSnap.match.scores.user} ·{" "}
                      {hostShort} {savedSnap.match.scores.ai}. Podés continuarla o descartarla.
                    </div>
                    <div className="flex gap-2">
                      <BrassButton onClick={handleResume} variant="primary">
                        Reanudar
                      </BrassButton>
                      <BrassButton
                        onClick={() => {
                          clearChinchonSnapshot();
                          setSavedSnap(null);
                        }}
                        variant="ghost"
                      >
                        Descartar
                      </BrassButton>
                    </div>
                  </div>
                )}
                <AnteCard chips={chips} ante={ante} onAnte={setAnte} onStart={handleStart} />
              </>
            )}

            {match && stage !== "ante" && (
              <LayoutGroup>
                <ScoreBar
                  scores={match.scores}
                  roundNo={match.roundNo}
                  turn={match.round.turn}
                  phase={match.round.phase}
                />

                {}
                <CenterArea
                  deckCount={match.round.deck.length}
                  pileTop={match.round.pile[match.round.pile.length - 1]}
                  pileCount={match.round.pile.length}
                  canDraw={match.round.turn === "user" && match.round.phase === "draw"}
                  canDrawPile={match.round.turn === "user" && canDrawFromPile(match.round)}
                  onDrawDeck={() => onDraw("deck")}
                  onDrawPile={() => onDraw("pile")}
                  pileGivesClosure={pileGivesClosure}
                  pileTopBy={pileTopBy}
                  aiTookFromPile={aiTookFromPile}
                />

                {}
                <UserHand
                  orderedHand={orderedHand}
                  onReorder={(ids) => setUserOrder(ids)}
                  onAutoOrder={autoOrder}
                  partition={userPartition}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  meldCardIds={meldCardIds}
                  disabled={match.round.turn !== "user" || match.round.phase !== "discard"}
                  pileDrawnCardId={pileDrawnCardId}
                  previewLooseSum={previewPartition?.looseSum ?? null}
                  closeableIds={closeableIds}
                  dirtyCardId={dirtyCardId}
                  shake={shake}
                />

                {}
                <ActionBar
                  partition={userPartition}
                  previewLooseSum={previewPartition?.looseSum ?? null}
                  selectedId={selectedId}
                  canClose={!!canCloseNow}
                  canCloseAny={closeableIds.size > 0}
                  canChinchon={!!canChinchon}
                  blockedByPile={selectedId !== null && selectedId === pileDrawnCardId}
                  disabled={match.round.turn !== "user" || match.round.phase !== "discard"}
                  onDiscard={() => onDiscard(false)}
                  onClose={() => onDiscard(true)}
                  dirtyUsed={dirtyUsedUser}
                  onMarkDirty={onMarkDirty}
                  canMarkDirty={
                    !dirtyUsedUser &&
                    match.round.turn === "user" &&
                    !!selectedId &&
                    !match.round.hands.user.find((c) => c.id === selectedId)?.isJoker
                  }
                />
              </LayoutGroup>
            )}
          </div>
        </div>

        {}
        <AnimatePresence>
          {stage === "user_arrange" && pendingClose && (
            <ArrangeModal
              key="arrange"
              pending={pendingClose}
              onConfirm={(partition) => {
                const result = resolveRound(
                  pendingClose.round,
                  {
                    closer: pendingClose.closer,
                    badClose: pendingClose.badClose,
                    chinchon: pendingClose.chinchon,
                  },
                  { player: "user", partition },
                );
                setLastRound(result);
                setPendingClose(null);
                setStage("round_end");
              }}
            />
          )}
          {stage === "round_end" && lastRound && match && (
            <RoundEndModal result={lastRound} match={match} onNext={handleNextRound} />
          )}
          {stage === "match_end" && match && match.over && (
            <MatchEndModal
              winner={match.over.winner}
              reason={match.over.reason}
              scores={match.scores}
              ante={ante}
              onAgain={handleNewMatch}
              hostName="Luisa"
              canSecondLife={
                !useChinchonRun.getState().noSecondLife() &&
                match.secondLivesUsed < settings.secondLivesAllowed &&
                (match.over.reason === "score" || settings.allowSecondLifeOnChinchon) &&
                match.over.winner === "ai"
              }
              onSecondLife={handleSecondLife}
            />
          )}
        </AnimatePresence>
        <ChinchonTutorial />

        <ToastAuto toast={toast} onClear={() => setToast(null)} />
        <AnimatePresence>
          {chinchonFlash && (
            <motion.div
              key="chinchon-flash"
              className="pointer-events-none absolute inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0.3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
              style={{
                background:
                  "radial-gradient(circle at center, oklch(0.85 0.22 90 / 0.55), transparent 65%)",
                mixBlendMode: "screen",
              }}
            />
          )}
        </AnimatePresence>
      </GameRoomShell>
      <NoLivesGate
        open={gateOpen}
        onClose={closeGate}
        line={'"Sin corazones no se reparte, mi amor. Esperá un rato o conseguí más."'}
      />
    </>
  );
}

function scoreColor(score: number): string {
  if (score >= 90) return "oklch(0.62 0.24 25)";
  if (score >= 75) return "oklch(0.72 0.20 35)";
  if (score >= 50) return "oklch(0.80 0.16 70)";
  return "var(--ivory)";
}

function LuisaPanel({
  mood,
  line,
  scores,
  portrait,
  name,
  shortName,
  npcId,
  archetype,
}: {
  mood: Mood;
  line: string;
  scores?: { user: number; ai: number };
  portrait: string;
  name: string;
  shortName: string;
  npcId?: string;
  archetype?: string;
}) {
  return (
    <aside className="flex max-w-[190px] flex-col gap-2 md:sticky md:top-3 md:self-start">
      <NpcPortraitCard
        src={portrait}
        alt={`${name} (${mood})`}
        name={name}
        line={line}
        compact
        npcId={npcId}
        archetype={archetype}
      />

      {scores && (
        <div
          className="rounded-md border border-[var(--brass)]/30 bg-black/60 p-2 text-center"
          aria-live="polite"
        >
          <div className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
            marcador
          </div>
          <div className="mt-0.5 grid grid-cols-2 gap-2 text-[var(--ivory)]">
            <div>
              <div className="font-display text-[11px] uppercase tracking-widest opacity-60">
                vos
              </div>
              <div
                className="font-numerals text-2xl tabular-nums"
                style={{ color: scoreColor(scores.user) }}
              >
                {scores.user}
              </div>
            </div>
            <div>
              <div className="font-display text-[11px] uppercase tracking-widest opacity-60">
                {shortName.toLowerCase()}
              </div>
              <div
                className="font-numerals text-2xl tabular-nums"
                style={{ color: scoreColor(scores.ai) }}
              >
                {scores.ai}
              </div>
            </div>
          </div>
          <div className="mt-0.5 font-display text-[11px] uppercase tracking-widest text-[var(--brass)]/90">
            pierde al llegar a 100
          </div>
        </div>
      )}
    </aside>
  );
}

function AnteCard({
  chips,
  ante,
  onAnte,
  onStart,
}: {
  chips: number;
  ante: number;
  onAnte: (n: number) => void;
  onStart: () => void;
}) {
  const presets = [50, 100, 250, 500];
  return (
    <div
      className="rounded-md border-2 border-[var(--brass)]/60 p-5 text-center"
      style={{
        background: "linear-gradient(180deg, oklch(0.20 0.04 30 / 0.9), oklch(0.10 0.03 30 / 0.9))",
      }}
    >
      <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
        — la mesa —
      </div>
      <h2 className="font-script text-3xl text-[var(--ivory)]">Apostá tu entrada</h2>
      <p className="mt-2 font-script text-base text-[var(--ivory)]/80">
        Luisa te paga <b>×2.5</b> si dejás su marcador en 100 antes que el tuyo.
      </p>
      <ul className="mt-3 mx-auto max-w-md space-y-1 text-center font-display text-[11px] uppercase tracking-[0.16em] text-[var(--brass)]/90">
        <li>cortás con 3 sueltos o menos · chinchón paga ×4</li>
        <li>una carta sucia por partida: comodín, pero paga soborno</li>
        <li>el comodín ★ suma 25 si queda suelto</li>
      </ul>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onAnte(p)}
            className={`rounded-sm border px-3 py-1.5 font-numerals text-lg tabular-nums transition ${
              ante === p
                ? "border-[var(--brass)] bg-[var(--brass)]/20 text-[var(--ivory)]"
                : "border-[var(--brass)]/30 bg-black/40 text-[var(--ivory)]/70 hover:border-[var(--brass)]/70"
            }`}
            disabled={chips < p}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="mt-4 font-display text-[11px] uppercase tracking-widest text-[var(--brass)]/90">
        tu bolsa · {chips} fichas
      </div>
      <div className="mt-4 flex justify-center">
        <BrassButton onClick={onStart} variant="primary" disabled={chips < ante}>
          Repartir
        </BrassButton>
      </div>
    </div>
  );
}

function ScoreBar({
  scores,
  roundNo,
  turn,
  phase,
}: {
  scores: { user: number; ai: number };
  roundNo: number;
  turn: "user" | "ai";
  phase: "draw" | "discard";
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-sm border border-[var(--brass)]/30 bg-[var(--noir)]/70 px-2.5 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-3 sm:py-1.5">
      <div className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--brass)]/90 sm:text-[11px] sm:tracking-[0.3em]">
        Mano {roundNo}
      </div>
      <div className="min-w-0 truncate text-right font-display text-[11px] uppercase tracking-[0.18em] text-[var(--ivory)] sm:text-center sm:text-[11px] sm:tracking-[0.3em]">
        {turn === "user" ? "tu turno" : "luisa piensa"}
        <span className="ml-1 text-[var(--brass)]/90 sm:ml-2">
          · {phase === "draw" ? "robar" : "descartar"}
        </span>
      </div>
      <div className="col-span-2 justify-self-center font-numerals text-sm tabular-nums text-[var(--ivory)] sm:col-span-1 sm:justify-self-end">
        <span className="text-[var(--brass)]/90">vos</span> {scores.user}{" "}
        <span className="px-1 text-[var(--brass)]/90">|</span> {scores.ai}{" "}
        <span className="text-[var(--brass)]/90">luisa</span>
      </div>
    </div>
  );
}

function CenterArea({
  deckCount,
  pileTop,
  pileCount,
  canDraw,
  canDrawPile,
  onDrawDeck,
  onDrawPile,
  pileGivesClosure,
  pileTopBy,
  aiTookFromPile,
}: {
  deckCount: number;
  pileTop: ChCard | undefined;
  pileCount: number;
  canDraw: boolean;
  canDrawPile: boolean;
  onDrawDeck: () => void;
  onDrawPile: () => void;
  pileGivesClosure: boolean;
  pileTopBy: "user" | "ai" | null;
  aiTookFromPile: boolean;
}) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-3 rounded-md border border-[var(--brass)]/30 px-2.5 py-2"
      style={{
        background:
          "radial-gradient(ellipse at center, oklch(0.30 0.10 145 / 0.55), oklch(0.18 0.05 30 / 0.7))",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.55)",
      }}
    >
      <div className="flex flex-col items-center justify-end text-center">
        <button
          onClick={onDrawDeck}
          disabled={!canDraw || deckCount === 0}
          className="relative min-h-0 min-w-0 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Robar del mazo"
        >
          <CardBack size="sm" />
        </button>
        <div className="mt-1 font-display text-[11px] uppercase tracking-[0.18em] text-[var(--brass)]/90">
          mazo · {deckCount}
        </div>
      </div>
      <div className="flex flex-col items-center justify-end text-center">
        <div className="relative h-[122px] w-[82px]">
          <div className="absolute inset-0 rounded-md border border-dashed border-[var(--brass)]/40" />
          <AnimatePresence initial={false}>
            {pileTop && (
              <motion.button
                key={pileTop.id}
                layoutId={`card-${pileTop.id}`}
                onClick={onDrawPile}
                disabled={!canDrawPile}
                className={`absolute inset-0 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
                  pileGivesClosure
                    ? "ring-2 ring-[oklch(0.78_0.18_140)]/80 ring-offset-2 ring-offset-transparent shadow-[0_0_22px_oklch(0.78_0.18_140/0.45)] animate-pulse rounded-md"
                    : ""
                }`}
                aria-label={
                  pileGivesClosure ? "Tomar del descarte — te permite cortar" : "Tomar del descarte"
                }
                initial={false}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
              >
                <CardFace card={pileTop} size="sm" />
              </motion.button>
            )}
          </AnimatePresence>
          {pileGivesClosure && (
            <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-[oklch(0.78_0.18_140)]/70 bg-[oklch(0.18_0.06_140)]/95 px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.12em] text-[oklch(0.85_0.18_140)] shadow">
              corta
            </span>
          )}
          {}
          {pileTop && pileTopBy && !pileGivesClosure && (
            <span
              className={`pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.25em] shadow ${
                pileTopBy === "ai"
                  ? "border-[oklch(0.55_0.2_25)]/70 bg-[oklch(0.18_0.06_25)]/95 text-[oklch(0.78_0.18_25)]"
                  : "border-[var(--brass)]/50 bg-[var(--noir)]/90 text-[var(--brass)]"
              }`}
            >
              {pileTopBy === "ai" ? "luisa" : "vos"}
            </span>
          )}
          {}
          <AnimatePresence>
            {aiTookFromPile && (
              <motion.span
                key="ai-took"
                initial={{ opacity: 0, y: -6, scale: 0.9 }}
                animate={{ opacity: 1, y: -12, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-[oklch(0.55_0.2_25)]/80 bg-[oklch(0.18_0.06_25)]/95 px-2 py-[2px] font-display text-[11px] uppercase tracking-[0.12em] text-[oklch(0.85_0.2_25)] shadow-lg"
              >
                luisa robó descarte
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-0.5 font-display text-[11px] uppercase tracking-widest text-[var(--brass)]/90">
          descarte · {pileCount}
        </div>
      </div>
    </div>
  );
}

function UserHand({
  orderedHand,
  onReorder,
  onAutoOrder,
  partition,
  selectedId,
  onSelect,
  meldCardIds,
  disabled,
  pileDrawnCardId,
  previewLooseSum,
  closeableIds,
  dirtyCardId,
  shake,
}: {
  orderedHand: ChCard[];
  onReorder: (ids: string[]) => void;
  onAutoOrder: () => void;
  partition: Partition;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  meldCardIds: Set<string>;
  disabled: boolean;
  pileDrawnCardId: string | null;
  previewLooseSum: number | null;
  closeableIds: Set<string>;
  dirtyCardId: string | null;
  shake: number;
}) {
  const shakeControls = useAnimationControls();
  useEffect(() => {
    if (shake > 0) {
      shakeControls.start({
        x: [0, -10, 10, -8, 8, -4, 4, 0],
        transition: { duration: 0.5 },
      });
    }
  }, [shake, shakeControls]);
  return (
    <motion.div animate={shakeControls}>
      <div className="mb-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1">
        <span className="min-w-0 truncate font-display text-[11px] uppercase tracking-[0.16em] text-[var(--brass)]/90 sm:text-[11px] sm:tracking-[0.3em]">
          tu mano
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onAutoOrder}
            data-inline-chip
            className="min-h-9 rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/70 px-2 py-1 font-display text-[11px] uppercase tracking-[0.1em] text-[var(--brass)] transition-colors hover:bg-[var(--brass)]/15 sm:min-h-11 sm:px-3 sm:text-[11px] sm:tracking-[0.14em]"
          >
            Ordenar
          </button>
          <span className="whitespace-nowrap font-display text-[11px] uppercase tracking-[0.14em] text-[var(--ivory)]/80 sm:text-[11px] sm:tracking-[0.24em]">
            sueltas{" "}
            <span className="font-numerals text-base tabular-nums text-[oklch(0.7_0.18_25)]">
              {partition.looseSum}
            </span>
            {previewLooseSum !== null && previewLooseSum !== partition.looseSum && (
              <span className="ml-2 text-[var(--brass)]/90">
                →{" "}
                <span
                  className={`font-numerals tabular-nums ${previewLooseSum <= 3 ? "text-[oklch(0.78_0.18_140)]" : "text-[var(--ivory)]"}`}
                >
                  {previewLooseSum}
                </span>
              </span>
            )}
          </span>
        </div>
      </div>
      <Reorder.Group
        axis="x"
        values={orderedHand}
        onReorder={(next: ChCard[]) => onReorder(next.map((c) => c.id))}
        as="div"
        className="chinchon-hand flex flex-nowrap items-end justify-center overflow-x-clip rounded-md border border-[var(--brass)]/20 bg-[var(--noir)]/70 px-2 pb-4 pt-5"
        style={{
          // Cartas grandes y legibles: se solapan un poco (como un abanico real)
          // y el ancho se calcula con la cantidad real de cartas en mano
          // (7 u 8 tras robar) para que nunca se recorte la última en Android.
          // Con 8 cartas reducimos el solape para que se lea el palo y el número
          // de cada carta y no queden tapadas a medias.
          ["--chinchon-hand-overlap" as string]: orderedHand.length >= 8 ? "8px" : "13px",
          ["--chinchon-hand-card-w" as string]: `max(42px, min(84px, calc((100vw - 62px) / ${Math.max(orderedHand.length, 1)} + var(--chinchon-hand-overlap, 13px))))`,
        }}
      >
        {orderedHand.map((c, i) => {
          const inMeld = meldCardIds.has(c.id);
          const isBlocked = c.id === pileDrawnCardId;
          const isCloseable = closeableIds.has(c.id);
          const state =
            selectedId === c.id ? "selected" : isBlocked ? "dim" : inMeld ? "meld" : "loose";
          return (
            <Reorder.Item
              key={c.id}
              value={c}
              layoutId={`card-${c.id}`}
              dragListener
              whileDrag={{ scale: 1.06, zIndex: 50, cursor: "grabbing" as const }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative shrink-0 cursor-grab touch-pan-x active:cursor-grabbing"
              style={{
                listStyle: "none",
                transformPerspective: 900,
                zIndex: selectedId === c.id ? 30 : i,
                marginLeft: i === 0 ? 0 : "calc(var(--chinchon-hand-overlap, 13px) * -1)",
              }}

              initial={{ opacity: 0, y: -120, rotateY: 180, rotateZ: -8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, rotateY: 0, rotateZ: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.9, transition: { duration: 0.18 } }}
            >
              <CardFace
                card={c}
                size="hand"
                state={state as "selected" | "meld" | "loose" | "dim"}
                onClick={() => !disabled && onSelect(selectedId === c.id ? null : c.id)}
              />
              {isBlocked && (
                <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-sm border border-[var(--brass)]/60 bg-[var(--noir)]/95 px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.12em] text-[var(--brass-bright)] shadow">
                  nueva
                </span>
              )}
              {c.id === dirtyCardId && (
                <span
                  className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-sm border border-[oklch(0.65_0.19_25)]/70 bg-[oklch(0.16_0.06_25)]/95 px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.12em] text-[oklch(0.82_0.16_25)] shadow"
                  title="Carta Sucia: vale como comodín, pero 25 si queda suelta"
                >
                  sucia
                </span>
              )}
              {isCloseable && selectedId !== c.id && !isBlocked && (
                <span
                  className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-sm border border-[oklch(0.78_0.18_140)]/70 bg-[oklch(0.18_0.06_140)]/90 px-1.5 py-[1px] font-display text-[11px] uppercase tracking-[0.12em] text-[oklch(0.85_0.18_140)] shadow"
                  title="Descartá esta carta para cortar"
                >
                  corte
                </span>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </motion.div>
  );
}

function ActionBar({
  partition,
  previewLooseSum,
  selectedId,
  canClose,
  canCloseAny,
  canChinchon,
  blockedByPile,
  disabled,
  onDiscard,
  onClose,
  dirtyUsed,
  canMarkDirty,
  onMarkDirty,
}: {
  partition: Partition;
  previewLooseSum: number | null;
  selectedId: string | null;
  canClose: boolean;
  canCloseAny: boolean;
  canChinchon: boolean;
  blockedByPile: boolean;
  disabled: boolean;
  onDiscard: () => void;
  onClose: () => void;
  dirtyUsed: boolean;
  canMarkDirty: boolean;
  onMarkDirty: () => void;
}) {
  const closeHint = canCloseAny && !canClose && !blockedByPile;

  const sueltoTras = previewLooseSum ?? partition.looseSum;
  const cortarHelp = !selectedId
    ? "tocá una carta, luego CORTAR si cerrás"
    : blockedByPile
      ? "no podés cortar con la carta del pozo"
      : !canClose
        ? `quedarían ${sueltoTras} sueltos · necesitás 3 o menos`
        : canChinchon
          ? "¡siete en escalera del mismo palo!"
          : `cortás con ${sueltoTras} sueltos`;

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-md border border-[var(--brass)]/20 bg-[var(--noir)]/55 p-2">
      {blockedByPile && (
        <div className="text-center font-display text-[11px] uppercase tracking-[0.12em] text-[oklch(0.7_0.18_25)]">
          esa carta no puede volver al descarte
        </div>
      )}
      {closeHint && (
        <div className="text-center font-display text-[11px] uppercase tracking-[0.12em] text-[oklch(0.78_0.18_140)]">
          hay corte disponible
        </div>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-2">
        <div className="flex min-w-0 flex-col items-stretch gap-1">
          <BrassButton
            onClick={onDiscard}
            variant="ghost"
            disabled={disabled || !selectedId || blockedByPile}
          >
            Descartar
          </BrassButton>
          <span className="text-center font-display text-[11px] uppercase leading-tight tracking-[0.12em] text-[var(--brass)]/90">
            al descarte
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-stretch gap-1">
          <div
            className={
              canClose
                ? "rounded-md ring-2 ring-[oklch(0.78_0.18_140)]/80 ring-offset-2 ring-offset-transparent shadow-[0_0_22px_oklch(0.78_0.18_140/0.35)] animate-pulse"
                : ""
            }
          >
            <BrassButton
              onClick={onClose}
              variant={canChinchon ? "primary" : "blood"}
              disabled={disabled || !selectedId || !canClose}
            >
              {canChinchon ? "Chinchón" : `Cortar · ${sueltoTras}`}
            </BrassButton>
          </div>
          <span
            className={`text-balance text-center font-display text-[11px] uppercase leading-tight tracking-[0.12em] ${
              canClose ? "text-[oklch(0.78_0.18_140)]" : "text-[var(--brass)]/90"
            }`}
          >
            {cortarHelp}
          </span>
        </div>
      </div>
      {!dirtyUsed && (
        <div className="flex flex-col items-stretch gap-1 border-t border-[var(--brass)]/20 pt-2">
          <BrassButton onClick={onMarkDirty} variant="ghost" disabled={disabled || !canMarkDirty}>
            Carta Sucia
          </BrassButton>
          <span className="text-balance text-center font-display text-[11px] uppercase leading-tight tracking-[0.12em] text-[oklch(0.8_0.14_25)]">
            {canMarkDirty
              ? `la marcás y vale como comodín · ${DIRTY_PENALTY} de soborno si cerrás con ella`
              : "una por partida · elegí una carta primero"}
          </span>
        </div>
      )}
    </div>
  );
}
