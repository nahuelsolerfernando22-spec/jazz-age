import { createFileRoute } from "@tanstack/react-router";
import { reportSingleScore } from "@/store/single-scores";
import { useScrimLock } from "@/store/ui-scrim";
import { useNemesisSession } from "@/lib/nemesis";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bazaEmblem from "@/assets/truco-baza-emblem.webp";
import { OpponentPill } from "@/components/casino/OpponentPill";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { TourneyRoundBadge } from "@/components/casino/TourneyRoundBadge";
import { lazyNamed } from "@/lib/lazy";
const TrucoVictoryScreen = lazyNamed(
  () => import("@/components/casino/truco/TrucoVictoryScreen"),
  "TrucoVictoryScreen",
);
const TrucoRulesDialog = lazyNamed(
  () => import("@/components/truco/TrucoRulesDialog"),
  "TrucoRulesDialog",
);
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { trackTrucoMatchEnd } from "@/lib/games/truco/truco-tracker";
import { useTrucoRun } from "@/store/games/truco/truco-run";
import { playCardsDeal } from "@/lib/cards-deal-sfx";
import { playCardSlam } from "@/lib/card-slam-sfx";
import { useSettings } from "@/store/settings";

import { NpcPortraitCard } from "@/components/casino/NpcPortraitCard";

import { useCasino } from "@/store/casino";
import { useLockGame } from "@/store/gameLock";
import { usePrestige } from "@/store/prestige";
import { TRUCO_TIERS } from "@/lib/games/truco/truco-tiers";
import { cantoLabel, cantoLabelUpper } from "@/lib/games/truco/canto-labels";
import { DifficultyBadge } from "@/components/casino/DifficultyBadge";
import { announceProgress } from "@/components/casino/PrestigeUnlockToast";
import { useCpuTraining } from "@/store/cpu-training";
import { useTrucoWeights } from "@/store/ai/truco-weights";
import { useTrucoPlayerModel } from "@/store/ai/truco-player-model";
import type { PlayerEvent } from "@/store/ai/truco-player-model";
import { useActiveChallenge, clearActiveChallenge } from "@/lib/active-challenge";
import { NoLivesGate } from "@/components/casino/NoLivesGate";
import { useTryStart } from "@/hooks/use-try-start";
import {
  CantoFlash,
  DeclareEnvidoModal,
  EnvidoReplay,
  HandSummaryModal,
  ModePicker,
  PickerPortal,
} from "@/components/casino/truco/TrucoModals";
import { useSurrender } from "@/components/casino/SurrenderButton";
import { TrucoTellHint } from "@/components/casino/truco/TrucoTellHint";
import { leerTell } from "@/lib/games/truco/truco-tells";

import eulaliaPortrait from "@/assets/eulalia-portrait.webp";
const eulaliaIdle = eulaliaPortrait;
const eulaliaWin = eulaliaPortrait;
const eulaliaLose = eulaliaPortrait;
const eulaliaAngry = eulaliaPortrait;
const eulaliaFlirty = eulaliaPortrait;
const eulaliaTense = eulaliaPortrait;
const eulaliaGiftVestidoNegro = eulaliaPortrait;
import { getEquippedGiftsForNpc, getGift, subscribeGifts } from "@/lib/hostess-gifts";
import { getHostessAiProfile } from "@/lib/hostess-ai";
import { getEffectiveProfile } from "@/lib/hostess-tuning";
import { useHostessMatch } from "@/hooks/use-hostess-match";
import { describeHostess } from "@/lib/hostess-personality";
type EulaliaCue = "idle" | "win" | "lose" | "angry" | "flirty" | "tense";
const EULALIA_BY_CUE: Record<EulaliaCue, string> = {
  idle: eulaliaIdle,
  win: eulaliaWin,
  lose: eulaliaLose,
  angry: eulaliaAngry,
  flirty: eulaliaFlirty,
  tense: eulaliaTense,
};
function deriveEulaliaCue(g: GameState | null): EulaliaCue {
  if (!g) return "flirty";
  if (g.winner === "you") return "lose";
  if (g.winner === "ai") return "win";
  const h = g.hand;
  if (h.pending?.by === "ai") return "angry";
  if (h.pending?.by === "you") return "tense";
  if (h.turn === "ai") return "tense";
  if (h.trick === 0 && hasFlor(h.yourHand)) return "flirty";
  return "idle";
}
import zoneBg from "@/assets/zone-truco-v2.webp";
import cardBack from "@/assets/chinchon-v2/card-back.webp";

import {
  startHand,
  playCard,
  cantarTruco,
  responderTruco,
  cantarEnvido,
  responderEnvido,
  cantarFlor,
  responderFlor,
  canCantarTruco,
  canCantarEnvido,
  canCantarEnvidoLevel,
  canCantarFlor,
  canIrseAlMazo,
  irseAlMazo,
  aiDecide,
  aiShouldReclamar,
  reclamarEnvido,
  pasarReclamoEnvido,
  calcEnvido,
  calcFlor,
  hasFlor,
  trucoPower,
  cardLabel,
  explainEnvido,
  type GameState,
  type Card,
  type Player,
} from "@/lib/games/truco/truco";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";
import { useHaptics } from "@/hooks/use-haptics";
import { TrucoHistoryRail } from "@/components/truco/TrucoHistoryRail";
import { useStableViewport } from "@/hooks/use-stable-viewport";

export const Route = createFileRoute("/truco")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mentira Criolla — El Cuervo Dorado" },
      {
        name: "description",
        content: "Truco a 15 o 30 con la Parda Eulalia: envido, flor, mentiras y rendiciones.",
      },
      { property: "og:title", content: "Truco del Sótano — El Cuervo Dorado" },
      {
        property: "og:description",
        content: "Truco a 15 o 30 con la Parda Eulalia: envido, flor, mentiras y rendiciones.",
      },
      { property: "og:url", content: "/truco" },
    ],
    links: [{ rel: "canonical", href: "/truco" }],
  }),
  component: TrucoPage,
});

import {
  cardArt,
  reducer,
  closeTrucoAudio,
  playCantoSfx,
  loadSave,
  saveGame,
  loadZoom,
  saveZoom,
  eulaliaLine,
  ZOOM_STEPS,
  trucoRivalJitter,
  type Action,
  type SavedMode,
  type ZoomLevel,
} from "@/lib/games/truco/truco-page";

function TrucoPage() {
  // Sólo el fondo: la anfitriona ya está presente en la mesa (OpponentPill),
  // el retrato flotante duplicaba a Eulalia y tapaba el marcador.
  useSingleHostessCorner("truco", { backdropOnly: true });
  const nem = useNemesisSession("truco");
  useEffect(() => {
    void import("@/lib/games/chinchon/chinchon-deck").then((m) => m.preloadDeck());
    return () => {
      closeTrucoAudio();
    };
  }, []);
  const activeChallenge = useActiveChallenge();
  const [mode, setMode] = useState<"solo" | null>(null);
  const [florChoice, setFlorChoice] = useState<boolean | null>(null);
  const [pointGoal, setPointGoal] = useState<number | null>(null);
  const [g, dispatch] = useReducer(reducer, null as GameState | null);
  const { tryStart, gateOpen, closeGate } = useTryStart();
  const audioMuted = useSettings((s) => s.muted);
  const audioMaster = useSettings((s) => s.masterVolume);
  const audioSfx = useSettings((s) => s.sfxVolume);
  const dealSfx = useCallback(() => {
    playCardsDeal({ muted: audioMuted, master: audioMaster, sfx: audioSfx });
  }, [audioMuted, audioMaster, audioSfx]);

  useEffect(() => {
    if (activeChallenge && activeChallenge.gameRoute === "/truco" && mode === null) {
      setMode("solo");
    }
  }, [activeChallenge, mode]);
  useLockGame(!!g && !g.winner);

  const handKey = g?.hand
    ? `${g.hand.yourHand
        .map((c) => `${c.suit}-${c.rank}`)
        .sort()
        .join(",")}|${g.hand.aiHand
        .map((c) => `${c.suit}-${c.rank}`)
        .sort()
        .join(",")}`
    : "";
  useEffect(() => {
    if (!g?.hand) return;
    const rankName = (r: number) =>
      r >= 10 ? (r === 10 ? "sota" : r === 11 ? "caballo" : "rey") : String(r);
    const stems = [...g.hand.yourHand, ...g.hand.aiHand].map(
      (c) => `${c.suit}-${rankName(c.rank)}`,
    );
    void import("@/lib/games/chinchon/chinchon-deck").then((m) => m.prefetchCards(stems));
  }, [handKey]);

  const [, setGiftTick] = useState(0);
  useEffect(() => subscribeGifts(() => setGiftTick((t) => t + 1)), []);
  function pickEulaliaGiftPortrait(): string | null {
    const equipped = getEquippedGiftsForNpc("eulalia");
    const ids = Object.values(equipped).filter(Boolean) as string[];
    for (const id of ids) {
      const v = getGift(id)?.portraitVariant;
      if (v === "eulalia-gift-vestido-negro") return eulaliaGiftVestidoNegro;
    }
    return null;
  }
  const HOST_BY_CUE = EULALIA_BY_CUE;
  const hostName = "La Parda Eulalia";
  const hostNpcId = "eulalia";
  const learn = useHostessMatch(hostNpcId);

  const hostSubtitle = "Eulalia «La Parda» · cartas españolas";
  const hostTutorialTitle = "El Envite del Puerto · con la Parda Eulalia";
  const hostTutorialLine = "«Sentate, criatura. Te enseño una vez. Después te cobro.»";
  const lineFor = eulaliaLine;
  const hostessProfile = useMemo(() => getEffectiveProfile(hostNpcId), [hostNpcId]);

  const prestigeByGame = usePrestige((s) => s.byGame.truco);
  const trainingXp = useCpuTraining((s) => s.byGame.truco?.xp ?? 0);
  const resolvedDiff = useMemo(
    () => usePrestige.getState().resolve("truco", TRUCO_TIERS),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prestigeByGame?.tierId, prestigeByGame?.prestige],
  );
  const trainingBoost = useMemo(
    () => useCpuTraining.getState().boost("truco"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trainingXp],
  );

  const learnedWeights = useTrucoWeights((s) => s.champion);
  // Blofeo/umbrales/cadencia varían con el historial del nemesis (manos
  // ganadas/perdidas, rachas, errores repetidos) para que el rival no sea
  // predecible entre partidas ni dentro de la misma mano.
  const rivalJitter = useMemo(() => trucoRivalJitter(handKey, nem.nemesis), [handKey, nem.nemesis]);
  const aiProfile = useMemo(() => {
    const boost = nem.active ? Math.min(0.3, (nem.difficulty - 1) * 0.6) : 0;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));

    const t = resolvedDiff.tuning;
    const tr = trainingBoost;
    return {
      skill: clamp(Math.max(hostessProfile.skill, t.accuracy) + boost + tr.accuracy),
      aggression: clamp(
        Math.max(hostessProfile.aggression, t.accuracy * 0.85) + boost * 0.8 + tr.accuracy * 0.6,
      ),
      bluff: clamp(Math.min(hostessProfile.bluff, t.bluff) - tr.bluffCut + boost * 0.3),
      patience: hostessProfile.patience,
      memory: clamp(Math.max(hostessProfile.memory, t.memory) + boost * 0.6 + tr.memory),

      depth: Math.max(3, t.depth + tr.depth),
      weights: { ...learnedWeights, ...rivalJitter.weights },
    };
  }, [
    hostessProfile,
    nem.active,
    nem.difficulty,
    resolvedDiff.tuning,
    trainingBoost,
    learnedWeights,
    rivalJitter,
  ]);

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [showHandSummary, setShowHandSummary] = useState(false);

  const [declarePrompt, setDeclarePrompt] = useState<{
    real: number;
    onSubmit: (v: number) => void;
    label: string;
  } | null>(null);
  const [reclamoToast, setReclamoToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [scorePulse, setScorePulse] = useState<{ you: boolean; ai: boolean }>({
    you: false,
    ai: false,
  });
  const [drawnScores, setDrawnScores] = useState<{ you: number; ai: number }>({ you: 0, ai: 0 });
  const [cantoFlash, setCantoFlash] = useState<{ text: string; by: Player } | null>(null);
  const [mudaBonus, setMudaBonus] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const prevScoresRef = useRef<{ you: number; ai: number }>({ you: 0, ai: 0 });
  const recordTruco = useCasino((s) => s.recordTrucoResult);
  const addChips = useCasino((s) => s.addChips);
  const recordedRef = useRef<GameState | null>(null);

  useSurrender(g && !g.winner ? () => dispatch({ t: "surrender", who: "you" }) : null, "Rendirse");

  useEffect(() => {
    const save = loadSave();
    const rs = useTrucoRun.getState();
    const enc = rs.activeLevel ? { pg: rs.pointGoal(), noFlor: rs.noFlor() } : null;
    if (save && !enc) {
      // Sin encargo: restauramos la partida guardada tal cual.
      setFlorChoice(save.flor);
      setPointGoal(save.g.pointGoal ?? 30);
      setMode(save.mode ?? "solo");
      dispatch({ t: "hydrate", g: save.g });
    } else if (enc) {
      // Encargo activo: sobrescribe los ajustes del jugador con los del nivel.
      if (enc.pg) setPointGoal(enc.pg);
      if (enc.noFlor) setFlorChoice(false);
      setMode("solo");
    }
    setHydrated(true);
  }, []);

  // Poll del reloj del encargo (time-cap). Marca lost-clock si vence.
  useEffect(() => {
    const id = window.setInterval(() => {
      try {
        useTrucoRun.getState().pollClock();
      } catch {
        /* ignore */
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (hydrated) saveGame(g, florChoice, mode || "solo");
  }, [g, florChoice, mode, hydrated]);

  const haptic = useHaptics();

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const prevGRef = useRef<typeof g>(null);
  useEffect(() => {
    if (!g) {
      prevGRef.current = g;
      return;
    }
    const prev = prevGRef.current;
    prevGRef.current = g;
    if (!prev) return;
    const events: PlayerEvent[] = [];

    if (!prev.hand.pending && g.hand.pending && g.hand.pending.by === "you") {
      if (g.hand.pending.kind === "envido") {
        events.push({ kind: "envido:called", asMano: g.hand.mano === "you" });
      } else if (g.hand.pending.kind === "truco") {
        events.push({ kind: "truco:called" });
      }
    }

    if (prev.hand.pending && prev.hand.pending.by === "ai" && !g.hand.pending) {
      const k = prev.hand.pending.kind;
      const lvl = prev.hand.pending.level;

      if (k === "envido") {
        const reveal = g.hand.envidoReveal;
        if (reveal) {
          events.push({ kind: "envido:accepted", value: reveal.you });
        } else if (g.hand.envidoResolved) {
          events.push({ kind: "envido:declined" });
        }
      } else if (k === "truco" && (lvl === "truco" || lvl === "retruco" || lvl === "vale4")) {
        const accepted = g.hand.trucoLevel === lvl;
        events.push(
          accepted
            ? { kind: "truco:accepted", level: lvl }
            : { kind: "truco:declined", level: lvl },
        );
      }
    }

    if (events.length > 0) useTrucoPlayerModel.getState().record(events);
  }, [g]);

  useEffect(() => {
    if (hydrated && florChoice !== null && pointGoal !== null && !g) {
      const ok = tryStart(() => {
        dispatch({ t: "start", flor: florChoice, pointGoal, aiName: "Eulalia" });
        dealSfx();
        learn.begin();
      });
      if (!ok) setFlorChoice(null);
    }
  }, [florChoice, pointGoal, g, hydrated, learn, dealSfx, tryStart]);

  useEffect(() => {
    if (!g || g.winner || g.hand.handOver) return;
    const myTurn = g.hand.pending ? g.hand.pending.by === "you" : g.hand.turn === "ai";
    if (!myTurn) {
      setAiThinking(false);
      return;
    }
    setAiThinking(true);
    const decision = aiDecide(g, undefined, aiProfile, useTrucoPlayerModel.getState().stats());
    const snapshotPendingKind = g.hand.pending?.kind ?? null;
    const snapshotPendingLevel = g.hand.pending?.level ?? null;
    const id = setTimeout(
      () => {
        if (!mountedRef.current) return;
        setAiThinking(false);

        const stillPending =
          g.hand.pending?.kind === snapshotPendingKind &&
          g.hand.pending?.level === snapshotPendingLevel &&
          g.hand.pending?.by === "you";
        // Salvaguarda anti-bloqueo: si hay un canto del jugador esperando respuesta,
        // la IA nunca puede "pasar": responde o sube. Antes se trababa el retruco.
        const answerPending = () => {
          if (!stillPending) return true;
          if (snapshotPendingKind === "truco") {
            setBubble("¡Quiero!");
            dispatch({ t: "respTruco", who: "ai", ok: true });
            return true;
          }
          if (snapshotPendingKind === "envido") {
            setBubble("No quiero");
            dispatch({ t: "respEnvido", who: "ai", ok: false });
            return true;
          }
          if (snapshotPendingKind === "flor") {
            dispatch({ t: "respFlor", who: "ai", act: "achicar" });
            return true;
          }
          return false;
        };

        if (decision.kind === "playCard" && decision.cardId) {
          if (g.hand.pending) {
            answerPending();
            return;
          }
          if (g.hand.turn !== "ai") return;
          playCantoSfx("card");
          dispatch({ t: "play", who: "ai", cardId: decision.cardId });
        } else if (decision.kind === "mazo") {
          setBubble("Me voy al mazo…");
          dispatch({ t: "mazo", who: "ai" });
        } else if (decision.kind === "respond" && snapshotPendingKind === "envido") {
          if (!stillPending) return;
          setBubble(decision.accept ? "¡Quiero!" : "No quiero");
          const ok = decision.accept ?? false;
          if (!ok) {
            dispatch({ t: "respEnvido", who: "ai", ok: false });
          } else {
            const myReal = calcEnvido(g.hand.origYourHand);
            const lieRate = useTrucoWeights.getState().champion.envidoLieRate ?? 0;
            setDeclarePrompt({
              real: myReal,
              label: "¡Quiero! ¿Cuánto decís?",
              onSubmit: (val) => {
                setDeclarePrompt(null);
                dispatch({
                  t: "respEnvido",
                  who: "ai",
                  ok: true,
                  playerDeclared: val,
                  aiLieRate: lieRate,
                });
              },
            });
          }
        } else if (decision.kind === "respond" && snapshotPendingKind === "truco") {
          if (!stillPending) return;
          setBubble(decision.accept ? "¡Quiero!" : "No quiero");
          dispatch({ t: "respTruco", who: "ai", ok: decision.accept ?? false });
        } else if (
          decision.kind === "respond" &&
          snapshotPendingKind === "flor" &&
          decision.florAction
        ) {
          if (!stillPending) return;
          dispatch({ t: "respFlor", who: "ai", act: decision.florAction });
        } else if (decision.kind === "canto" && decision.canto) {
          const c = decision.canto.type;
          if (c === "truco" || c === "retruco" || c === "vale4") {
            // Subir sobre un canto pendiente exige aceptarlo primero.
            if (snapshotPendingKind === "truco") {
              if (!stillPending) return;
              setBubble(`¡Quiero y ${cantoLabel("truco", c).toUpperCase()}!`);
              dispatch({ t: "respTruco", who: "ai", ok: true });
            } else if (g.hand.pending) {
              answerPending();
              return;
            }
            dispatch({ t: "truco", who: "ai" });
          } else if (c === "envido" || c === "real" || c === "falta") {
            dispatch({ t: "envido", who: "ai", level: c });
          } else if (c === "flor") {
            dispatch({ t: "flor", who: "ai" });
          } else if (c === "contraflor" || c === "contrarresto") {
            if (!stillPending) return;
            dispatch({ t: "respFlor", who: "ai", act: "subir" });
          }
        } else if (g.hand.pending?.by === "you") {
          answerPending();
        }
      },
      Math.round(decision.thinkMs * rivalJitter.paceFactor),
    );
    return () => {
      clearTimeout(id);
      setAiThinking(false);
    };
  }, [g, rivalJitter]);

  useEffect(() => {
    if (!g) return;
    const prev = prevScoresRef.current;
    const pulse = { you: g.scores.you > prev.you, ai: g.scores.ai > prev.ai };
    if (pulse.you || pulse.ai) {
      setScorePulse(pulse);

      const deltaYou = Math.max(0, g.scores.you - prev.you);
      const deltaAi = Math.max(0, g.scores.ai - prev.ai);
      const totalTicks = Math.min(6, deltaYou + deltaAi);
      const timers: ReturnType<typeof setTimeout>[] = [];
      for (let i = 0; i < totalTicks; i++) {
        timers.push(setTimeout(() => playCantoSfx("tick"), 60 + i * 90));
      }
      const id = setTimeout(() => {
        setScorePulse({ you: false, ai: false });
        setDrawnScores({ you: g.scores.you, ai: g.scores.ai });
      }, 900);
      prevScoresRef.current = { ...g.scores };
      return () => {
        clearTimeout(id);
        timers.forEach(clearTimeout);
      };
    }
    prevScoresRef.current = { ...g.scores };
    setDrawnScores({ you: g.scores.you, ai: g.scores.ai });
  }, [g?.scores.you, g?.scores.ai, g]);

  const prevPendingRef = useRef<string | null>(null);
  const prevAcceptedRef = useRef<{ envido: boolean; truco: string | null }>({
    envido: false,
    truco: null,
  });
  useEffect(() => {
    const cur = g?.hand.pending
      ? `${g.hand.pending.kind}:${g.hand.pending.level}:${g.hand.pending.by}`
      : null;
    if (prevPendingRef.current && !cur) {
      const envidoNow = g?.hand.envidoAccepted ?? false;
      const trucoNow = g?.hand.trucoLevel ?? null;
      const acceptedEnvido = envidoNow && !prevAcceptedRef.current.envido;
      const acceptedTruco = trucoNow !== null && trucoNow !== prevAcceptedRef.current.truco;
      if (acceptedEnvido || acceptedTruco) playCantoSfx("quiero");
      else if (!g?.hand.handOver) playCantoSfx("noquiero");
      else playCantoSfx("resolved");
    }
    prevPendingRef.current = cur;
    prevAcceptedRef.current = {
      envido: g?.hand.envidoAccepted ?? false,
      truco: g?.hand.trucoLevel ?? null,
    };
  }, [
    g?.hand.pending?.kind,
    g?.hand.pending?.level,
    g?.hand.pending?.by,
    g?.hand.envidoAccepted,
    g?.hand.trucoLevel,
    g?.hand.handOver,
  ]);

  useEffect(() => {
    if (g?.hand.handOver && !g.winner) {
      const h = g.hand;
      const youWon = (h.handResult?.you ?? 0) > (h.handResult?.ai ?? 0);
      const muda = youWon && h.trucoLevel === null && !h.pending;
      if (muda) {
        addChips(8);
        setMudaBonus(true);
      } else setMudaBonus(false);
      playCantoSfx(youWon ? "handwin" : "handlose");
      setShowHandSummary(true);
    }
  }, [g?.hand.handOver, g?.winner, g, addChips]);

  useEffect(() => {
    if (!g || g.winner) return;
    if (!g.hand.handOver) return;
    if (!g.hand.envidoChallengeOpen || g.hand.envidoChallengeUsed) return;
    if (g.hand.envidoDeclaredWinner !== "you") return;
    const id = setTimeout(() => {
      if (
        aiShouldReclamar(
          g,
          undefined,
          aiProfile.aggression,
          aiProfile.memory ?? 0.5,
          aiProfile.weights?.envidoChallengeBias ?? 0,
        )
      ) {
        const before = g.scores.ai;
        dispatch({ t: "reclamar", who: "ai" });
        setTimeout(() => {
          setReclamoToast(before < g.scores.ai + 999 ? `${"Eulalia"}: «A ver las cartas.»` : "");
        }, 200);
      } else {
        dispatch({ t: "pasarReclamo", who: "you" });
      }
    }, 1400);
    return () => clearTimeout(id);
  }, [
    g?.hand.handOver,
    g?.hand.envidoChallengeOpen,
    g?.hand.envidoDeclaredWinner,
    g,
    aiProfile.aggression,
    aiProfile.memory,
  ]);

  useEffect(() => {
    if (!reclamoToast) return;
    const id = setTimeout(() => setReclamoToast(null), 2600);
    return () => clearTimeout(id);
  }, [reclamoToast]);

  const turnLockKey = `${g?.hand.turn}-${g?.hand.pending?.by ?? "x"}-${g?.hand.handOver ? "1" : "0"}-${g?.hand.trick ?? 0}`;
  useEffect(() => {
    setSelectedCard(null);
  }, [turnLockKey]);

  const pendingKind = g?.hand.pending?.kind ?? null;
  const pendingBy = g?.hand.pending?.by ?? null;
  const pendingLevel = g?.hand.pending?.level ?? null;
  // Lectura del canto de la rival: cuanto más paciente/compuesta, menos se le nota.
  const tellActual = useMemo(
    () =>
      pendingBy === "ai"
        ? leerTell(g ?? null, pendingKind, pendingLevel, aiProfile.patience)
        : null,
    [g, pendingKind, pendingBy, pendingLevel, aiProfile.patience],
  );
  useEffect(() => {
    if (pendingKind) {
      playCantoSfx(pendingKind);
      // El cartel debe decir el nivel real (RETRUCO, VALE CUATRO, CONTRAFLOR AL
      // RESTO…), no sólo la familia del canto.
      const label = cantoLabelUpper(pendingKind, pendingLevel);
      if (pendingBy === "ai") setBubble(`¡${label}!`);
      setCantoFlash({ text: `¡${label}!`, by: pendingBy ?? "you" });
      if (pendingBy === "ai") {
        haptic(pendingKind === "truco" ? "warning" : pendingKind === "flor" ? "success" : "select");
      } else {
        haptic("tap");
      }
      const id = setTimeout(() => setCantoFlash(null), 1450);
      return () => {
        clearTimeout(id);

        setCantoFlash(null);
      };
    }

    setCantoFlash(null);
  }, [pendingKind, pendingBy, pendingLevel, haptic]);

  useEffect(() => {
    if (!bubble) return;
    const id = setTimeout(() => setBubble(null), 2200);
    return () => clearTimeout(id);
  }, [bubble]);

  useEffect(() => {
    if (g?.winner && recordedRef.current !== g) {
      recordedRef.current = g;
      const spread = Math.abs(g.scores.you - g.scores.ai);
      const won = g.winner === "you";

      const evt = usePrestige.getState().reportResult("truco", TRUCO_TIERS, won);
      announceProgress("Mentira Criolla", evt);
      useCpuTraining.getState().report("truco", { playerWon: won, spread });
      recordTruco({ won, pointSpread: spread });

      learn.event(g.winner === "ai" ? "won" : "lost", `truco:${g.winner}`);
      learn.finish({
        hostessWon: g.winner === "ai",
        margin: spread,
        bigWin: won && spread >= 15,
        playerAggressionRate: Math.min(1, g.scores.you / Math.max(1, g.scores.you + g.scores.ai)),
        playerPatienceRate: Math.min(1, g.scores.ai > 0 ? spread / (g.scores.ai + spread) : 0.5),
      });

      reportSingleScore("truco", g.scores.you * 10 + (won ? 100 : 0));

      void import("@/store/league-progress").then(({ awardLeaguePoints }) => {
        const pts = g.winner === "you" ? 80 + spread * 4 : Math.max(0, 20 - spread);
        if (pts > 0) awardLeaguePoints("truco", pts);
      });
      void import("@/lib/narrative-hooks").then(({ recordGameOutcome }) => {
        recordGameOutcome({
          hostessId: hostNpcId,
          delta: won ? 500 + spread * 20 : -(200 + spread * 10),
          clutch: won && spread <= 3,
        });
      });

      void import("@/lib/nemesis").then(({ reportGameOutcome, reportOutcomeMistakes }) => {
        reportOutcomeMistakes({
          game: "truco",
          playerWon: won,
          spread,
          playerScore: g.scores.you,
          cpuScore: g.scores.ai,
        });
        reportGameOutcome("truco", won ? "win" : "loss");
      });
      // Torneo semanal: una mano completa = una ronda
      void import("@/lib/daily-tournament").then(({ submitTourneyScore, activeTourneyGame }) => {
        if (activeTourneyGame() !== "truco") return;
        const tourneyScore = won ? 150 + spread * 15 : Math.max(0, spread * 3);
        void submitTourneyScore("truco", tourneyScore);
      });
      trackTrucoMatchEnd(won);
    }
  }, [g, recordTruco, hostNpcId, learn]);

  const canPlayNow =
    !!g && !g.winner && !g.hand.handOver && !g.hand.pending && g.hand.turn === "you";
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!g) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (canPlayNow && (k === "1" || k === "2" || k === "3")) {
        const idx = parseInt(k, 10) - 1;
        const c = g.hand.yourHand[idx];
        if (c) {
          playCantoSfx("card");
          dispatch({ t: "play", who: "you", cardId: c.id });
        }
        return;
      }
      if (g.hand.pending?.by === "ai") {
        if (g.hand.pending.kind === "envido") {
          if (k === "q") {
            const myReal = calcEnvido(g.hand.origYourHand);
            const lieRate = useTrucoWeights.getState().champion.envidoLieRate ?? 0;
            setDeclarePrompt({
              real: myReal,
              label: "¡Quiero! ¿Cuánto decís?",
              onSubmit: (val) => {
                setDeclarePrompt(null);
                dispatch({
                  t: "respEnvido",
                  who: "you",
                  ok: true,
                  playerDeclared: val,
                  aiLieRate: lieRate,
                });
              },
            });
          }
          if (k === "n") dispatch({ t: "respEnvido", who: "you", ok: false });
        } else if (g.hand.pending.kind === "truco") {
          if (k === "q") dispatch({ t: "respTruco", who: "you", ok: true });
          if (k === "n") dispatch({ t: "respTruco", who: "you", ok: false });
        }
        return;
      }
      if (canPlayNow || (!g.hand.pending && !g.hand.handOver)) {
        if (k === "e" && canCantarEnvido(g, "you"))
          dispatch({ t: "envido", who: "you", level: "envido" });
        if (k === "t" && canCantarTruco(g, "you")) dispatch({ t: "truco", who: "you" });
        if (k === "f" && canCantarFlor(g, "you")) dispatch({ t: "flor", who: "you" });
      }
    },
    [g, canPlayNow],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const portraitLine = bubble ?? lineFor(g);

  return (
    <>
      <TrucoVictoryScreen />
      <GameRoomShell
        bg={zoneBg}
        room="truco"
        title="Mentira Criolla"
        subtitle={hostSubtitle}
        npcId={hostNpcId}
        npcRoom="/truco"
      >
        <div className="mx-auto flex max-w-7xl justify-end px-4">
          <TourneyRoundBadge game="truco" />
        </div>

        {mode !== null && g && !g.winner && (
          <div className="absolute top-3 right-3 z-30 hidden items-center gap-2 xl:flex">
            <DifficultyBadge
              resolved={resolvedDiff}
              title={`${resolvedDiff.tier.hint} · ${resolvedDiff.tier.unlockAt} seguidas para subir`}
            />
          </div>
        )}

        <TrucoRulesDialog open={showRules} onClose={() => setShowRules(false)} />
        <div
          className={`cuervo-mobile-compact mobile-stack-grid grid gap-3 sm:gap-4 px-2 sm:px-3 py-2 sm:py-4 ${
            mode !== null && g && !g.winner
              ? "grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]"
              : "grid-cols-1 sm:grid-cols-[168px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]"
          }`}
          style={{
            paddingTop: "max(var(--sa-top), 0.5rem)",
            paddingLeft: "max(var(--sa-left), 0.5rem)",
            paddingRight: "max(var(--sa-right), 0.5rem)",
            paddingBottom: "calc(max(var(--sa-bottom), 1rem) + 64px)",
          }}
        >
          <div
            className={`desktop-rail lg:order-1 relative ${mode !== null && g && !g.winner ? "hidden lg:block" : ""}`}
          >
            <NpcPortraitCard
              src={pickEulaliaGiftPortrait() ?? HOST_BY_CUE[deriveEulaliaCue(g)]}
              alt={hostName}
              name={hostName}
              line={portraitLine}
              npcId="eulalia"
              archetype={describeHostess(hostessProfile.label, hostNpcId)}
            />

            <AnimatePresence>
              {(bubble || aiThinking) && (
                <motion.div
                  key={bubble ?? "thinking"}
                  initial={{ scale: 0.6, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute -top-2 right-3 z-20 px-3 py-1.5 rounded-full bg-[var(--brass)] text-[var(--noir)] font-display tracking-widest text-sm shadow-xl"
                  style={{ textShadow: "0 1px 0 rgba(0,0,0,0.2)" }}
                >
                  {bubble ?? <ThinkingDots />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className="game-focus truco-focus lg:order-2 flex min-h-0 min-w-0 max-w-full flex-col gap-3 overflow-x-hidden sm:overflow-x-auto overflow-y-auto"
            style={{
              // svh = alto "chico" del viewport: constante aunque la barra del
              // navegador de Android aparezca o desaparezca (con dvh el layout
              // se re-escalaba y la pantalla subía y bajaba).
              height:
                "calc(100svh - var(--sa-top) - var(--sa-bottom) - 64px)",

              paddingBottom: "calc(max(var(--sa-bottom), 0.5rem) + 8px)",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorY: "contain",
            }}
          >
            {!hydrated ? null : mode === null ? (
              <ModePicker onPick={setMode} onRules={() => setShowRules(true)} />
            ) : pointGoal === null ? (
              <PointGoalPicker onPick={setPointGoal} />
            ) : florChoice === null ? (
              <FlorPicker
                onPick={setFlorChoice}
                pointGoal={pointGoal}
                onBack={() => setPointGoal(null)}
              />
            ) : !g ? null : g.winner ? (
              <EndScreen
                winner={g.winner}
                scores={g.scores}
                pointGoal={g.pointGoal}
                hostShort={"Eulalia"}
                onRematch={() => {
                  // Revancha: misma configuración, sin volver a pasar por los
                  // tres selectores (el efecto de arranque re-reparte solo).
                  saveGame(null, null);
                  recordedRef.current = null;
                  dispatch({ t: "hydrate", g: null as unknown as GameState });
                }}
                onChangeMode={() => {
                  saveGame(null, null);
                  recordedRef.current = null;
                  setMode(null);
                  setFlorChoice(null);
                  setPointGoal(null);
                  dispatch({ t: "hydrate", g: null as unknown as GameState });
                }}
              />
            ) : (
              <Table
                g={g}
                dispatch={dispatch}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
                scorePulse={scorePulse}
                drawnScores={drawnScores}
                hostShort={"Eulalia"}
                onEnvidoAccept={() => {
                  const myReal = calcEnvido(g.hand.origYourHand);
                  const lieRate = useTrucoWeights.getState().champion.envidoLieRate ?? 0;
                  setDeclarePrompt({
                    real: myReal,
                    label: "¡Quiero! ¿Cuánto decís?",
                    onSubmit: (val) => {
                      setDeclarePrompt(null);
                      dispatch({
                        t: "respEnvido",
                        who: "you",
                        ok: true,
                        playerDeclared: val,
                        aiLieRate: lieRate,
                      });
                    },
                  });
                }}
              />
            )}
          </div>
        </div>

        <AnimatePresence>
          {showHandSummary && g && g.hand.handOver && !g.winner && (
            <HandSummaryModal
              g={g}
              hostShort={"Eulalia"}
              mudaBonus={mudaBonus}
              onClose={() => {
                setShowHandSummary(false);
                setMudaBonus(false);
                if (g.hand.envidoChallengeOpen && !g.hand.envidoChallengeUsed) {
                  dispatch({ t: "pasarReclamo", who: "you" });
                }
                dispatch({ t: "nextHand" });
                dealSfx();
              }}
            />
          )}
        </AnimatePresence>

        {}
        {g &&
          g.hand.handOver &&
          !g.winner &&
          !showHandSummary &&
          g.hand.envidoChallengeOpen &&
          !g.hand.envidoChallengeUsed &&
          g.hand.envidoDeclaredWinner === "ai" && (
            <div
              className="fixed inset-x-0 z-40 flex justify-center px-4"
              style={{ bottom: "calc(var(--sa-bottom) + 148px)" }}
            >
              <div className="rounded-sm border border-[var(--brass)] bg-[var(--noir)]/95 px-4 py-3 shadow-xl max-w-md w-full">
                <div className="text-sm text-[var(--ivory)] mb-2">
                  La banca declaró <b className="text-[var(--brass)]">{g.hand.envidoDeclared.ai}</b>{" "}
                  de envido y se llevó <b>{g.hand.envidoAwardedPoints}</b>. ¿Le pedís las cartas?
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 min-h-[44px] px-3 py-3 rounded-sm bg-[var(--oxblood)]/60 border border-[var(--brass)] text-[var(--ivory)] text-sm active:brightness-125"
                    onClick={() => {
                      const beforeYou = g.scores.you;
                      dispatch({ t: "reclamar", who: "you" });
                      setTimeout(() => {
                        setReclamoToast(
                          beforeYou < g.scores.you + 999 ? "Cartas mostradas." : "Ok.",
                        );
                      }, 0);
                    }}
                  >
                    Mostrame las cartas
                  </button>
                  <button
                    className="flex-1 min-h-[44px] px-3 py-3 rounded-sm bg-[var(--mahogany)]/40 border border-[var(--brass)]/50 text-[var(--ivory)]/80 text-sm active:brightness-125"
                    onClick={() => dispatch({ t: "pasarReclamo", who: "you" })}
                  >
                    Confío, sigamos
                  </button>
                </div>
              </div>
            </div>
          )}

        {}
        <AnimatePresence>
          {declarePrompt && (
            <DeclareEnvidoModal
              real={declarePrompt.real}
              label={declarePrompt.label}
              onSubmit={declarePrompt.onSubmit}
              onCancel={() => setDeclarePrompt(null)}
            />
          )}
        </AnimatePresence>

        {}
        {reclamoToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-sm bg-[var(--noir)] border border-[var(--brass)] text-[var(--ivory)] text-sm shadow-lg">
            {reclamoToast}
          </div>
        )}

        <CantoFlash flash={cantoFlash} hostShort={"Eulalia"} />

        {}
        <TrucoTellHint tell={tellActual} />

        {g && !g.winner && mode !== null && (
          <>
            {}
            <TrucoHistoryRail g={g} hostShort={"Eulalia"} onHaptic={() => haptic("tap")} />
          </>
        )}
      </GameRoomShell>
      <NoLivesGate open={gateOpen} onClose={closeGate} />
    </>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--noir)] animate-[pulse_1s_ease-in-out_0s_infinite]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--noir)] animate-[pulse_1s_ease-in-out_0.15s_infinite]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--noir)] animate-[pulse_1s_ease-in-out_0.3s_infinite]" />
    </span>
  );
}

function PointGoalPicker({ onPick }: { onPick: (n: number) => void }) {
  useScrimLock(true);
  return (
    <PickerPortal>
      <div className="relative rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/95 p-6 text-center shadow-2xl mx-3 max-w-[440px] w-[calc(100%-1.5rem)]">
        <h2 className="font-display text-2xl text-[var(--ivory)] mb-2">¿A cuánto jugamos?</h2>
        <p className="text-sm text-[var(--ivory)]/70 mb-5">
          Elegí los puntos. Quince es una partida rápida (2–4 min); treinta es la noche entera (8–12
          min).
        </p>
        <div className="grid grid-cols-2 gap-3 justify-center max-w-[420px] mx-auto">
          <button
            onClick={() => onPick(15)}
            aria-label="Partida a 15 puntos"
            className="min-h-[72px] min-w-[128px] px-6 py-3 rounded-sm border border-[var(--brass)]/60 bg-[var(--mahogany)]/40 text-[var(--ivory)] hover:bg-[var(--mahogany)]/60 active:brightness-125 transition"
          >
            <div className="font-display text-2xl leading-none">15</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass)]/80 mt-1">
              Rápida · ~3 min
            </div>
          </button>
          <button
            onClick={() => onPick(30)}
            aria-label="Partida a 30 puntos"
            className="min-h-[72px] min-w-[128px] px-6 py-3 rounded-sm border border-[var(--brass)] bg-[var(--oxblood)]/50 text-[var(--ivory)] hover:bg-[var(--oxblood)]/70 active:brightness-125 transition"
          >
            <div className="font-display text-2xl leading-none">30</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass)]/80 mt-1">
              Larga · ~10 min
            </div>
          </button>
        </div>
      </div>
    </PickerPortal>
  );
}

function FlorPicker({
  onPick,
  pointGoal,
  onBack,
}: {
  onPick: (flor: boolean) => void;
  pointGoal: number;
  onBack: () => void;
}) {
  useScrimLock(true);
  return (
    <PickerPortal>
      <div className="relative rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/95 p-6 text-center shadow-2xl mx-3 max-w-[440px] w-[calc(100%-1.5rem)]">
        <h2 className="font-display text-2xl text-[var(--ivory)] mb-2">Antes de cortar</h2>
        <p className="text-sm text-[var(--ivory)]/70 mb-1">
          ¿Jugamos con flor o sin flor? La banca respeta lo que decidas.
        </p>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90 mb-4">
          Partida a {pointGoal} puntos
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => onPick(true)}
            className="min-h-[48px] px-5 py-3 rounded-sm border border-[var(--brass)]/60 bg-[var(--oxblood)]/40 text-[var(--ivory)] active:brightness-125 transition"
          >
            Con flor
          </button>
          <button
            onClick={() => onPick(false)}
            className="min-h-[48px] px-5 py-3 rounded-sm border border-[var(--brass)]/60 bg-[var(--mahogany)]/40 text-[var(--ivory)] active:brightness-125 transition"
          >
            Sin flor
          </button>
        </div>
        <button
          onClick={onBack}
          className="mt-4 min-h-[44px] px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]/60 active:text-[var(--brass)] transition"
        >
          ← Cambiar puntos
        </button>

        <p className="hidden xl:block mt-3 text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90">
          Atajos: 1·2·3 jugar carta · E envido · T truco · F flor · Q quiero · N no quiero
        </p>
      </div>
    </PickerPortal>
  );
}

function EndScreen({
  winner,
  scores,
  pointGoal,
  onRematch,
  onChangeMode,
  hostShort,
}: {
  winner: Player;
  scores: { you: number; ai: number };
  pointGoal: number;
  onRematch: () => void;
  onChangeMode: () => void;
  hostShort: string;
}) {
  return (
    <div className="rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/85 p-6 sm:p-8 text-center">
      <h2 className="font-display text-2xl sm:text-3xl text-[var(--brass)] mb-3">
        {winner === "you" ? "¡Te llevás la noche!" : `${hostShort} te ganó la partida`}
      </h2>
      <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90 mb-2">
        Partida a {pointGoal} puntos
      </p>
      <p className="text-sm text-[var(--ivory)]/75 mb-4">
        Vos {scores.you} · {hostShort} {scores.ai}
      </p>
      {winner === "ai" && (
        <p className="text-xs text-[var(--brass)]/80 italic mb-4">
          {hostShort} llegó a {pointGoal} antes que vos. La partida se cierra al alcanzar el
          objetivo.
        </p>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <button
          onClick={onRematch}
          className="min-h-[48px] px-6 py-3 rounded-sm border border-[var(--brass)] bg-[var(--oxblood)]/60 text-[var(--ivory)] font-display uppercase tracking-[0.25em] text-sm active:brightness-125"
        >
          Revancha
        </button>
        <button
          onClick={onChangeMode}
          className="min-h-[44px] px-6 py-2.5 rounded-sm border border-[var(--brass)]/40 text-[var(--ivory)]/75 text-xs uppercase tracking-[0.25em] active:brightness-125"
        >
          Cambiar modo o puntos
        </button>
      </div>
    </div>
  );
}

function MatchGroup({
  count,
  drawn,
  ink,
  pulse,
}: {
  count: number;
  drawn: number;
  ink: string;
  pulse?: boolean;
}) {
  const c = Math.max(0, Math.min(5, count));
  const d = Math.max(0, Math.min(c, drawn));
  const stroke = ink;
  const w = 1.6;
  const jitter = (seed: number) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return (x - Math.floor(x) - 0.5) * 1.2;
  };
  const j = [0, 1, 2, 3, 4].map((i) => ({
    dx: jitter(i + 1),
    dy: jitter(i + 7),
    r: jitter(i + 13) * 4,
  }));

  const strokeStyle = (i: number): React.CSSProperties => {
    const isNew = i >= d;
    return isNew
      ? {
          strokeDasharray: 32,
          strokeDashoffset: 32,
          animation: `truco-draw 380ms ${(i - d) * 90}ms ease-out forwards`,
        }
      : {};
  };
  return (
    <svg
      viewBox="0 0 22 26"
      className={`w-[22px] h-[26px] transition-transform ${pulse ? "scale-110" : ""}`}
      style={{ overflow: "visible" }}
    >
      {c >= 1 && (
        <line
          x1={3 + j[0].dx}
          y1={3 + j[0].dy}
          x2={3 + j[0].dx}
          y2={23 + j[0].dy}
          stroke={stroke}
          strokeWidth={w}
          strokeLinecap="round"
          transform={`rotate(${j[0].r} 3 13)`}
          style={strokeStyle(0)}
        />
      )}
      {c >= 2 && (
        <line
          x1={3 + j[1].dx}
          y1={3 + j[1].dy}
          x2={19 + j[1].dx}
          y2={3 + j[1].dy}
          stroke={stroke}
          strokeWidth={w}
          strokeLinecap="round"
          transform={`rotate(${j[1].r} 11 3)`}
          style={strokeStyle(1)}
        />
      )}
      {c >= 3 && (
        <line
          x1={19 + j[2].dx}
          y1={3 + j[2].dy}
          x2={19 + j[2].dx}
          y2={23 + j[2].dy}
          stroke={stroke}
          strokeWidth={w}
          strokeLinecap="round"
          transform={`rotate(${j[2].r} 19 13)`}
          style={strokeStyle(2)}
        />
      )}
      {c >= 4 && (
        <line
          x1={3 + j[3].dx}
          y1={23 + j[3].dy}
          x2={19 + j[3].dx}
          y2={23 + j[3].dy}
          stroke={stroke}
          strokeWidth={w}
          strokeLinecap="round"
          transform={`rotate(${j[3].r} 11 23)`}
          style={strokeStyle(3)}
        />
      )}
      {c >= 5 && (
        <line
          x1={2 + j[4].dx}
          y1={24 + j[4].dy}
          x2={20 + j[4].dx}
          y2={2 + j[4].dy}
          stroke={stroke}
          strokeWidth={w + 0.3}
          strokeLinecap="round"
          style={strokeStyle(4)}
        />
      )}
    </svg>
  );
}

function PalitosRow({
  score,
  drawn,
  cap,
  ink,
  pulse,
}: {
  score: number;
  drawn: number;
  cap: number;
  ink: string;
  pulse?: boolean;
}) {
  const groups = Math.ceil(cap / 5);
  const displayed = Math.max(0, Math.min(cap, score));
  const drawnDisplay = Math.max(0, Math.min(cap, drawn));
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: groups }).map((_, i) => {
        const inGroup = Math.max(0, Math.min(5, displayed - i * 5));
        const drawnGroup = Math.max(0, Math.min(5, drawnDisplay - i * 5));
        const isLastActive = displayed > i * 5 && displayed <= (i + 1) * 5;
        return (
          <MatchGroup
            key={i}
            count={inGroup}
            drawn={drawnGroup}
            ink={ink}
            pulse={pulse && isLastActive}
          />
        );
      })}
    </div>
  );
}

function PaperColumn({
  label,
  mano,
  score,
  drawn,
  pulse,
  cap,
  showBuenas,
}: {
  label: string;
  mano: boolean;
  score: number;
  drawn: number;
  pulse?: boolean;
  cap: number;
  showBuenas: boolean;
}) {
  const malas = Math.min(score, cap);
  const malasDrawn = Math.min(drawn, cap);
  const buenas = Math.max(0, score - cap);
  const buenasDrawn = Math.max(0, drawn - cap);
  return (
    <div className="flex-1 px-2.5 py-1.5 sm:px-3 sm:py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-[12px] sm:text-[13px] text-[var(--cd-ink)] tracking-wide">
            {label}
          </span>
          {mano && (
            <span className="px-1 py-0 text-[11px] uppercase tracking-[0.15em] rounded-sm bg-[var(--cd-ink)] text-[#f4e8cf] font-bold">
              mano
            </span>
          )}
        </div>
        <span
          className="font-numerals text-base sm:text-lg text-[var(--cd-ink)] transition-all"
          style={{
            textShadow: pulse ? "0 0 8px var(--brass)" : "none",
            transform: pulse ? "scale(1.15)" : "scale(1)",
          }}
        >
          {score}
        </span>
      </div>
      <div className="space-y-1">
        <div>
          <div className="hidden sm:block text-[11px] uppercase tracking-[0.25em] text-[#8b3a2e]/80 mb-0.5">
            malas
          </div>
          <PalitosRow
            score={malas}
            drawn={malasDrawn}
            cap={cap}
            ink="var(--cd-red-deep)"
            pulse={pulse && score <= cap}
          />
        </div>
        {showBuenas && (
          <div>
            <div className="hidden sm:block text-[11px] uppercase tracking-[0.25em] text-[var(--cd-ink)]/80 mb-0.5">
              buenas
            </div>
            <PalitosRow
              score={buenas}
              drawn={buenasDrawn}
              cap={cap}
              ink="#1a1208"
              pulse={pulse && score > cap}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBoard({
  g,
  scorePulse,
  drawnScores,
  hostShort,
}: {
  g: GameState;
  scorePulse?: { you: boolean; ai: boolean };
  drawnScores?: { you: number; ai: number };
  hostShort: string;
}) {
  const manoYou = g.hand.mano === "you";
  const chicoCap = g.pointGoal > 15 ? 15 : g.pointGoal;
  const showBuenas = g.pointGoal > 15;
  const stake = g.hand.trucoStake > 1 ? g.hand.trucoStake : null;
  const Side = ({
    label,
    mano,
    score,
    pulse,
    align,
  }: {
    label: string;
    mano: boolean;
    score: number;
    pulse?: boolean;
    align: "left" | "right";
  }) => {
    const malas = Math.min(score, chicoCap);
    const buenas = Math.max(0, score - chicoCap);
    return (
      <div
        className={`flex min-w-0 flex-1 items-center gap-1 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
      >
        <div
          className={`flex min-w-0 items-baseline gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          <span
            className="font-numerals text-[17px] leading-none text-[var(--cd-ink-deep)] tabular-nums transition-transform"
            style={{
              textShadow: pulse ? "0 0 6px var(--brass)" : "none",
              transform: pulse ? "scale(1.15)" : "scale(1)",
            }}
          >
            {score}
          </span>
          <span className="font-display text-[11px] leading-none text-[var(--cd-ink-deep)]/85 whitespace-nowrap">
            {label}
          </span>
          {mano && (
            <span className="px-1 py-[1px] text-[11px] uppercase tracking-[0.12em] rounded-[2px] bg-[var(--cd-ink)] text-[#f4e8cf] font-bold leading-none">
              mano
            </span>
          )}
        </div>
        <div
          className={`flex items-center gap-0.5 min-w-0 overflow-hidden ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          <PalitosRow
            score={malas}
            drawn={malas}
            cap={chicoCap}
            ink="var(--cd-red-deep)"
            pulse={pulse && score <= chicoCap}
          />
          {showBuenas && buenas > 0 && (
            <PalitosRow
              score={buenas}
              drawn={buenas}
              cap={chicoCap}
              ink="#1a1208"
              pulse={pulse && score > chicoCap}
            />
          )}
        </div>
      </div>
    );
  };
  return (
    <div
      className="relative rounded-[3px] border border-[var(--cd-ink)]/40 shadow-[0_2px_8px_rgba(0,0,0,0.45)] overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f2e3c1 0%, #e6d1a2 100%)" }}
    >
      <div className="relative flex items-center gap-2 px-2 py-1.5">
        <Side
          label="Vos"
          mano={manoYou}
          score={g.scores.you}
          pulse={scorePulse?.you}
          align="left"
        />
        <div className="flex flex-col items-center gap-0.5 shrink-0 px-1 border-x border-[var(--cd-ink)]/25">
          <span className="font-display text-[11px] leading-none tracking-[0.15em] text-[var(--cd-ink)]/80">
            A{g.pointGoal}
          </span>
          <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--cd-ink)]/65 leading-none">
            {g.florEnabled ? "flor" : "s/flor"}
          </span>
        </div>
        <Side
          label={hostShort}
          mano={!manoYou}
          score={g.scores.ai}
          pulse={scorePulse?.ai}
          align="right"
        />
        <button
          type="button"
          aria-label="Abrir historial"
          onClick={() => window.dispatchEvent(new Event("truco:open-history"))}
          className="cd-hit-44 shrink-0 grid h-7 w-7 place-items-center rounded-full border border-[var(--cd-ink)]/40 bg-[var(--cd-ink)]/10 text-[var(--cd-ink-deep)] active:brightness-125"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {}
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M3 3.5h10M3 8h10M3 12.5h6" />
          </svg>
        </button>
      </div>
      {(g.hand.trucoLevel || stake) && (
        <div className="relative flex items-center justify-between gap-2 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-[var(--cd-ink)]/85 border-t border-[var(--cd-ink)]/25 bg-[#e0c893]/60">
          <span>{g.hand.trucoLevel ? cantoLabelUpper("truco", g.hand.trucoLevel) : ""}</span>
          {stake && <span className="text-[var(--cd-red-deep)] font-bold">En juego: {stake} pts</span>}
        </div>
      )}
    </div>
  );
}

function Table({
  g,
  dispatch,
  selectedCard,
  setSelectedCard,
  scorePulse,
  drawnScores,
  hostShort,
  onEnvidoAccept,
}: {
  g: GameState;
  dispatch: React.Dispatch<Action>;
  selectedCard: string | null;
  setSelectedCard: (id: string | null) => void;
  scorePulse?: { you: boolean; ai: boolean };
  drawnScores?: { you: number; ai: number };
  hostShort: string;
  onEnvidoAccept: () => void;
}) {
  const h = g.hand;
  const pendingMine = h.pending?.by === "ai" && !h.handOver;
  const canPlay = !h.pending && h.turn === "you" && !h.handOver;
  const myEnvido = useMemo(() => calcEnvido(h.yourHand), [h.yourHand]);
  const myEnvidoBreak = useMemo(() => explainEnvido(h.yourHand), [h.yourHand]);
  const myFlor = useMemo(() => calcFlor(h.yourHand), [h.yourHand]);
  const showFlor = g.florEnabled && hasFlor(h.yourHand);

  const activeChips: { k: string; label: string; done: boolean }[] = [];
  if (h.trucoLevel)
    activeChips.push({
      k: "t",
      label: `${cantoLabelUpper("truco", h.trucoLevel)} · ${h.trucoStake} pts`,
      done: true,
    });
  if (h.pending?.kind === "truco")
    activeChips.push({
      k: "tp",
      label: `${cantoLabelUpper("truco", h.pending.level)}?`,
      done: false,
    });
  if (h.envidoResolved) activeChips.push({ k: "e", label: "Envido resuelto", done: true });
  if (h.pending?.kind === "envido")
    activeChips.push({
      k: "ep",
      label: `${cantoLabelUpper("envido", h.pending.level)}?`,
      done: false,
    });
  if (g.florEnabled && h.florResolved && h.trick === 0)
    activeChips.push({ k: "f", label: "Flor resuelta", done: true });
  if (h.pending?.kind === "flor")
    activeChips.push({
      k: "fp",
      label: `${cantoLabelUpper("flor", h.pending.level)}?`,
      done: false,
    });

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0">
        <ScoreBoard g={g} scorePulse={scorePulse} drawnScores={drawnScores} hostShort={hostShort} />
      </div>

      {}
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border-2 border-[var(--brass)]/50 p-1.5 sm:p-3 shadow-[inset_0_0_40px_rgba(0,0,0,0.7)]"

        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.28 0.06 25 / 0.85) 0%, oklch(0.14 0.03 25 / 0.95) 70%), repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0 2px, transparent 2px 6px)",
        }}
      >
        {}

        {(() => {
          const youWon = h.trickWinners.filter((w) => w === "you").length;
          const aiWon = h.trickWinners.filter((w) => w === "ai").length;
          const ties = h.trickWinners.filter((w) => w === "tie").length;
          const Pip = ({ filled, tone }: { filled: boolean; tone: "you" | "ai" | "tie" }) => (
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full border ${
                filled
                  ? tone === "you"
                    ? "bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                    : tone === "ai"
                      ? "bg-red-400 border-red-300 shadow-[0_0_6px_rgba(248,113,113,0.7)]"
                      : "bg-[var(--brass)]/60 border-[var(--brass)]"
                  : "border-[var(--brass)]/30 bg-transparent"
              }`}
            />
          );
          return (
            <div className="mb-1.5 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]/60">
              {}
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <Pip key={i} filled={i < youWon} tone="you" />
                  ))}
                </div>
                <span className="text-[var(--brass)]/90">·</span>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <Pip key={i} filled={i < aiWon} tone="ai" />
                  ))}
                </div>
                {ties > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--brass)]/90">Pardas</span>
                    {Array.from({ length: ties }).map((_, i) => (
                      <Pip key={i} filled tone="tie" />
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0">
                <OpponentPill
                  name={hostShort}
                  avatar={eulaliaIdle}
                  npcId="eulalia"
                  cards={h.aiHand.length}
                  active={h.turn === "ai" && !h.handOver}
                  size="lg"
                  align="right"
                  showCards={false}
                  showName={false}
                />
              </div>
            </div>
          );
        })()}
        <div
          className="mx-auto grid w-full min-h-0 flex-1 grid-cols-3 gap-1 sm:gap-2 items-stretch overflow-hidden"
          style={{ maxHeight: "min(62svh, 520px)", maxWidth: "min(100%, 560px)" }}
        >

          {h.table.map((t, i) => {
            const winner = h.trickWinners[i];
            const isActive = i === h.trick && !h.handOver && winner == null;
            return (
              <div
                key={i}
                className="relative grid min-w-0 min-h-0 grid-rows-2 gap-1 sm:gap-2 justify-items-center"
              >
                <div className="min-h-0 w-full flex items-end justify-center">
                  <CardSlot card={t.ai} label={hostShort} winner={winner === "ai"} />
                </div>
                <div className="min-h-0 w-full flex items-start justify-center">
                  <CardSlot
                    card={t.you}
                    label="Vos"
                    highlight={isActive && canPlay}
                    winner={winner === "you"}
                  />
                </div>
                {winner === "tie" && i < h.trickWinners.length && (
                  <span className="absolute top-0 right-0 text-[11px] uppercase tracking-[0.2em] text-[var(--brass)]/90 font-display">
                    parda
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {h.log.length > 0 && (
          <div
            className="mt-1.5 text-[11px] text-[var(--ivory)]/75 italic text-center truncate"
            key={h.log.length}
          >
            · {h.log[h.log.length - 1]}
          </div>
        )}
      </div>

      {}
      {h.envidoReveal && (
        <div className="rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/80 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]/60">
                Envido
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--ivory)]/50">
                  Vos
                </span>
                <span
                  className={`font-numerals text-lg px-2 py-0.5 rounded-sm border ${
                    h.envidoReveal.winner === "you"
                      ? "bg-emerald-900/40 border-emerald-500/60 text-emerald-300"
                      : "bg-red-950/50 border-red-500/60 text-red-300"
                  }`}
                >
                  {h.envidoReveal.you}
                </span>
              </div>
              <span className="text-[var(--brass)]/90">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--ivory)]/50">
                  {hostShort}
                </span>
                <span
                  className={`font-numerals text-lg px-2 py-0.5 rounded-sm border ${
                    h.envidoReveal.winner === "ai"
                      ? "bg-emerald-900/40 border-emerald-500/60 text-emerald-300"
                      : "bg-red-950/50 border-red-500/60 text-red-300"
                  }`}
                >
                  {h.envidoReveal.ai}
                </span>
              </div>
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]">
              Gana {h.envidoReveal.winner === "you" ? "vos" : hostShort} +{h.envidoReveal.points}
            </span>
          </div>
          {}
          {h.handOver && (
            <EnvidoReplay
              cards={
                h.envidoReveal.winner === "you" ? h.envidoReveal.yourCards : h.envidoReveal.aiCards
              }
              label={h.envidoReveal.winner === "you" ? "Vos" : hostShort}
            />
          )}
        </div>
      )}

      {}
      <div className="flex items-center justify-between gap-2 flex-wrap rounded-sm border border-[var(--brass)]/25 bg-[var(--noir)]/75 px-2 py-1.5">
        <div className="flex gap-2 items-center flex-wrap">
          {h.envidoAccepted && (
            <span
              title={`Cálculo: ${myEnvidoBreak.text}`}
              className="px-2 py-1 rounded-sm bg-[var(--noir)]/70 border border-[var(--brass)]/30 text-[11px] uppercase tracking-[0.2em] text-[var(--brass)]/80 cursor-help"
            >
              Envido <span className="font-numerals text-[var(--brass)] ml-1">{myEnvido}</span>
            </span>
          )}
          {showFlor && (
            <span
              title={`Flor: ${h.yourHand.map((c) => (c.rank >= 10 ? (c.rank === 10 ? "sota" : c.rank === 11 ? "caballo" : "rey") : c.rank)).join(" + ")} = ${myFlor}`}
              className="px-2 py-1 rounded-sm bg-[var(--brass)]/15 border border-[var(--brass)] text-[11px] uppercase tracking-[0.2em] text-[var(--brass)] cursor-help"
            >
              ¡Flor! <span className="font-numerals ml-1">{myFlor}</span>
            </span>
          )}
          {activeChips.map((c) => (
            <span
              key={c.k}
              className={`px-2 py-1 rounded-sm text-[11px] uppercase tracking-[0.2em] border ${
                c.done
                  ? "bg-[var(--mahogany)]/40 border-[var(--brass)]/40 text-[var(--ivory)]/70"
                  : "bg-[var(--oxblood)]/50 border-[var(--brass)] text-[var(--brass)] animate-pulse"
              }`}
            >
              {c.label}
            </span>
          ))}
        </div>
        <span className="shrink-0 whitespace-nowrap pr-[0.25em] text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]/60">
          {h.pending
            ? "Esperando respuesta"
            : h.turn === "you"
              ? "Tu turno"
              : `Juega ${hostShort}…`}
        </span>
      </div>

      {}
      <BigHand
        cards={h.yourHand}
        canPlay={canPlay}
        selectedCard={selectedCard}
        onSelect={(id) => {
          if (!canPlay) return;
          if (selectedCard === id) {
            playCantoSfx("card");
            dispatch({ t: "play", who: "you", cardId: id });
            setSelectedCard(null);
          } else setSelectedCard(id);
        }}
      />

      {}
      <div className="rounded-sm border border-[var(--brass)]/30 bg-[var(--noir)]/70 p-3 space-y-2">
        {pendingMine ? (
          <ResponseButtons
            g={g}
            dispatch={dispatch}
            hostShort={hostShort}
            onEnvidoAccept={onEnvidoAccept}
          />
        ) : (
          <CantoButtons g={g} dispatch={dispatch} />
        )}
        <p className="hidden xl:block text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90 pt-1">
          1·2·3 jugar · E envido · T truco · F flor · Q quiero · N no
        </p>
      </div>

      {}
      <details className="hidden sm:block rounded-sm border border-[var(--brass)]/20 bg-[var(--noir)]/60 p-2">
        <summary className="cursor-pointer text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]/50">
          Historial de la mesa ({h.log.length})
        </summary>
        <div className="mt-2 max-h-32 overflow-y-auto text-xs font-mono text-[var(--ivory)]/70 space-y-0.5">
          {h.log.slice(-30).map((l, i) => (
            <div key={i}>· {l}</div>
          ))}
        </div>
      </details>

      {}
      {g.history.length > 0 && (
        <details className="hidden sm:block rounded-sm border border-[var(--brass)]/20 bg-[var(--noir)]/60 p-2">
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.25em] text-[var(--ivory)]/50">
            Manos jugadas ({g.history.length})
          </summary>
          <div className="mt-2 max-h-40 overflow-y-auto text-xs text-[var(--ivory)]/75 space-y-1">
            {g.history
              .slice()
              .reverse()
              .map((e, i) => {
                const n = g.history.length - i;
                const winnerLabel = e.winner === "you" ? "Vos" : e.winner === "ai" ? g.aiName : "—";
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 border-b border-[var(--brass)]/10 pb-0.5"
                  >
                    <span className="text-[var(--brass)]/90 font-numerals">#{n}</span>
                    <span className="flex-1">
                      Mano:{" "}
                      <span className="text-[var(--ivory)]">
                        {e.mano === "you" ? "vos" : g.aiName}
                      </span>
                      {e.envido && (
                        <span className="ml-2 text-[11px] text-[var(--ivory)]/60">
                          env {e.envido.you}·{e.envido.ai}
                        </span>
                      )}
                      {e.wentToMazo && (
                        <span className="ml-2 text-[11px] text-red-300/80">
                          mazo ({e.wentToMazo === "you" ? "vos" : g.aiName})
                        </span>
                      )}
                    </span>
                    <span className="text-[var(--brass)]">
                      {winnerLabel} <span className="font-numerals">+{e.points}</span>
                    </span>
                  </div>
                );
              })}
          </div>
        </details>
      )}
    </div>
  );
}

const SUIT_GLYPH: Record<string, string> = {
  oros: "OR",
  copas: "CO",
  espadas: "ES",
  bastos: "BA",
};
const SUIT_COLOR: Record<string, string> = {
  oros: "#e6b23a",
  copas: "#d97a5a",
  espadas: "#e8dfc7",
  bastos: "#c9a06a",
};
function rankShort(r: number): string {
  return String(r);
}

function BigHand({
  cards,
  canPlay,
  selectedCard,
  onSelect,
}: {
  cards: Card[];
  canPlay: boolean;
  selectedCard: string | null;
  onSelect: (id: string) => void;
}) {
  const n = cards.length;
  const { vw, vh, landscape } = useStableViewport();

  const [zoom] = useState<ZoomLevel>(() => loadZoom());
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<{ id: string; y0: number; x0: number } | null>(null);
  const onCardPointerDown = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    gestureRef.current = { id, y0: e.clientY, x0: e.clientX };
  };
  const onCardPointerUp = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g || g.id !== id) return;
    const dy = e.clientY - g.y0;
    const dx = Math.abs(e.clientX - g.x0);
    if (canPlay && dy < -34 && dx < 40) {
      onSelect(id);
      requestAnimationFrame(() => onSelect(id));
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!canPlay) return;
    const el = rootRef.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      try {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch {
        el.scrollIntoView();
      }
    }, 120);
    return () => window.clearTimeout(id);
  }, [canPlay, cards.length]);
  const tiny = vw < 360;
  const compact = vw < 480;
  let cardW = tiny ? 108 : compact ? 128 : 190;
  let cardH = tiny ? 156 : compact ? 184 : 274;
  if (landscape) {
    cardH = Math.max(120, Math.min(180, Math.floor(vh * 0.42)));
    cardW = Math.floor(cardH * (108 / 156));
  } else if (compact) {
    // La mano nunca puede empujar la mesa fuera de pantalla (estilo Truco Blyts:
    // todo entra en un solo pantallazo, sin scroll).
    const capH = Math.floor(vh * 0.215);
    if (capH > 90 && capH < cardH) {
      cardW = Math.floor(cardW * (capH / cardH));
      cardH = capH;
    }
  }
  cardW = Math.round(cardW * zoom);
  cardH = Math.round(cardH * zoom);
  const spread =
    compact || landscape ? Math.max(56, Math.min(96, (vw - cardW - 24) / Math.max(1, n))) : 138;
  return (
    <div
      ref={rootRef}
      className="space-y-1"
      style={{ scrollMarginBottom: "calc(var(--sa-bottom) + 96px)" }}
    >
      <div
        className="relative flex items-end justify-center"
        style={{
          height: cardH + 32,
          contain: "layout paint",
          transform: "translateZ(0)",
          touchAction: "pan-y",
        }}
      >
        {cards.map((c, i) => {
          const mid = (n - 1) / 2;
          const offset = i - mid;
          const rot = offset * 4;
          const x = offset * spread;
          const y = Math.abs(offset) * 6;
          const selected = selectedCard === c.id;
          const glyph = SUIT_GLYPH[c.suit] ?? "";
          const color = SUIT_COLOR[c.suit] ?? "var(--brass)";
          return (
            <button
              key={c.id}
              disabled={!canPlay}
              onClick={() => onSelect(c.id)}
              onPointerDown={onCardPointerDown(c.id)}
              onPointerUp={onCardPointerUp(c.id)}
              title={`${cardLabel(c)}${canPlay ? (selected ? " — tocá de nuevo para jugarla" : " — tocá para seleccionar") : ""}`}
              aria-label={cardLabel(c)}
              aria-pressed={selected}
              className={`absolute bottom-0 transition-transform duration-200 ease-out touch-manipulation ${canPlay ? "active:brightness-125" : "opacity-80"}`}
              style={{
                transform: `translate3d(${x}px, ${selected ? -40 : y}px, 0) rotate(${selected ? 0 : rot}deg) scale(${selected ? 1.12 : 1})`,
                zIndex: selected ? 30 : 10 + i,
                willChange: "transform",
                backfaceVisibility: "hidden",
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <div className="relative">
                <img
                  src={cardArt(c)}
                  alt=""
                  style={{
                    width: cardW,
                    height: cardH,
                    filter: "contrast(1.12) saturate(1.08) brightness(1.05)",
                  }}
                  className={`block rounded-[6px] border-2 shadow-deep ${selected ? "border-[var(--brass)] shadow-[0_0_22px_var(--brass)]" : "border-[var(--brass)]/50"}`}

                  draggable={false}
                  decoding="async"
                  loading="eager"
                  fetchPriority="high"
                />
                {}
                <span
                  className="pointer-events-none absolute top-1 left-1 flex flex-col items-center leading-none rounded-sm px-1 py-0.5 font-display"
                  style={{
                    background: "rgba(10,6,4,0.82)",
                    border: "1px solid rgba(212,175,86,0.55)",
                    color,
                    textShadow: "0 1px 0 rgba(0,0,0,0.9)",
                  }}
                >
                  <span style={{ fontSize: compact ? 12 : 15, letterSpacing: "0.05em" }}>
                    {rankShort(c.rank)}
                  </span>
                  <span
                    style={{ fontSize: compact ? 9 : 11, letterSpacing: "0.15em", marginTop: 1 }}
                  >
                    {glyph}
                  </span>
                </span>
              </div>
              {selected && canPlay && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.25em] text-[var(--brass)] whitespace-nowrap">
                  Tocá o deslizá ↑
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Matadoras: el golpe se siente y se escucha más fuerte. */
function isMatadora(card: Card): boolean {
  const r = card.rank as number;
  return (
    (r === 1 && (card.suit === "espadas" || card.suit === "bastos")) ||
    (r === 7 && (card.suit === "espadas" || card.suit === "oros"))
  );
}

function CardSlot({
  card,
  label,
  highlight,
  winner,
}: {
  card: Card | null;
  label: string;
  highlight?: boolean;
  winner?: boolean;
}) {
  const muted = useSettings((s) => s.muted);
  const master = useSettings((s) => s.masterVolume);
  const sfx = useSettings((s) => s.sfxVolume);
  const haptic = useHaptics();
  const heavy = !!card && isMatadora(card);
  const lastSlam = useRef<string | null>(null);

  useEffect(() => {
    if (!card) {
      lastSlam.current = null;
      return;
    }
    if (lastSlam.current === card.id) return;
    lastSlam.current = card.id;
    playCardSlam({ muted, master, sfx, heavy });
    haptic(heavy ? "slam" : "card");
  }, [card, heavy, muted, master, sfx, haptic]);

  return (
    <div
      className={`relative h-auto max-h-full w-full max-w-full min-h-[64px] aspect-[7/10] rounded-[7px] border transition-all ${
        highlight
          ? "border-[var(--brass)]/80 shadow-[0_0_16px_rgba(212,175,86,0.35)]"
          : winner
            ? "border-[var(--brass)]/70 shadow-[0_0_12px_rgba(212,175,86,0.28)]"
            : card
              ? "border-[var(--brass)]/45 shadow-[0_4px_14px_rgba(0,0,0,0.55)]"
              : "border-dashed border-[var(--brass)]/20"
      } flex items-center justify-center overflow-hidden`}
      style={{
        contain: "layout paint",
        background: card
          ? "rgba(8,5,3,0.55)"
          : // Hueco vacío: apenas un velo. Con el rayado diagonal parecía una
            // carta dada vuelta y confundía sobre qué ya se jugó.
            "rgba(0,0,0,0.22)",
      }}
    >
      <AnimatePresence>
        {card && (
          <motion.img
            key={card.id}
            // Hachazo: la carta cae de golpe, aplasta al tocar la mesa y rebota.
            initial={{ scale: heavy ? 1.5 : 1.32, opacity: 0, rotate: heavy ? -18 : -12, y: -46 }}
            animate={{
              scale: [heavy ? 1.5 : 1.32, heavy ? 0.9 : 0.94, 1],
              opacity: 1,
              rotate: [heavy ? -18 : -12, heavy ? 3 : 2, 0],
              y: [-46, 3, 0],
            }}
            transition={{ duration: heavy ? 0.3 : 0.24, times: [0, 0.6, 1], ease: "easeIn" }}
            src={cardArt(card)}
            alt={cardLabel(card)}
            className="absolute inset-0 w-full h-full object-contain rounded-[5px]"
            style={{ filter: "contrast(1.14) saturate(1.1) brightness(1.06)" }}
            decoding="async"
            loading="eager"
            fetchPriority="high"
          />
        )}
      </AnimatePresence>
      {card && heavy && (
        <motion.span
          key={`impact-${card.id}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[7px]"
          initial={{ opacity: 0.85, scale: 0.7 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            boxShadow: "0 0 0 2px rgba(212,175,86,0.55), 0 0 22px 6px rgba(212,175,86,0.35)",
          }}
        />
      )}

      {card && (
        <span
          className="pointer-events-none absolute top-0.5 left-0.5 flex flex-col items-center leading-none rounded-sm px-1 py-0.5 font-display"
          style={{
            background: "rgba(10,6,4,0.85)",
            border: "1px solid rgba(212,175,86,0.6)",
            color: SUIT_COLOR[card.suit] ?? "var(--brass)",
            textShadow: "0 1px 0 rgba(0,0,0,0.9)",
          }}
        >
          <span style={{ fontSize: 11, letterSpacing: "0.04em" }}>{rankShort(card.rank)}</span>
          <span style={{ fontSize: 9, letterSpacing: "0.12em" }}>
            {SUIT_GLYPH[card.suit] ?? ""}
          </span>
        </span>
      )}

      {!card && (
        <div className="flex flex-col items-center gap-1 sm:gap-1.5 opacity-25">
          <img
            src={bazaEmblem}
            alt=""
            aria-hidden
            className="w-6 h-6 sm:w-10 sm:h-10 object-contain"
            loading="lazy"
            decoding="async"
          />
          <span className="text-[11px] sm:text-[11px] uppercase tracking-[0.24em] sm:tracking-[0.3em] text-[var(--brass)]/90">
            {label}
          </span>
        </div>
      )}
      {winner && card && (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--brass)] text-[var(--noir)] text-[13px] font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.7)] border-2 border-[var(--noir)]"
        >
          ✓
        </motion.span>
      )}
    </div>
  );
}

function CantoButtons({ g, dispatch }: { g: GameState; dispatch: React.Dispatch<Action> }) {
  const [envMenu, setEnvMenu] = useState(false);
  const [confirmMazo, setConfirmMazo] = useState(false);
  const canT = canCantarTruco(g, "you");
  const canE = canCantarEnvido(g, "you");
  const canF = canCantarFlor(g, "you");
  const canM = canIrseAlMazo(g, "you");
  const nextTruco =
    g.hand.trucoLevel === "truco"
      ? "RETRUCO"
      : g.hand.trucoLevel === "retruco"
        ? "VALE CUATRO"
        : "TRUCO";
  return (
    <div className="flex flex-wrap gap-2">
      {canE && !envMenu && <Btn onClick={() => setEnvMenu(true)}>Envido ▾</Btn>}
      {canE && envMenu && (
        <>
          <Btn
            onClick={() => {
              setEnvMenu(false);
              dispatch({ t: "envido", who: "you", level: "envido" });
            }}
          >
            Envido
          </Btn>
          <Btn
            onClick={() => {
              setEnvMenu(false);
              dispatch({ t: "envido", who: "you", level: "real" });
            }}
          >
            Real envido
          </Btn>
          <Btn
            onClick={() => {
              setEnvMenu(false);
              dispatch({ t: "envido", who: "you", level: "falta" });
            }}
          >
            Falta envido
          </Btn>
          <Btn onClick={() => setEnvMenu(false)}>Cancelar</Btn>
        </>
      )}
      {canF && (
        <Btn primary onClick={() => dispatch({ t: "flor", who: "you" })}>
          ¡Flor!
        </Btn>
      )}
      {canT && <Btn onClick={() => dispatch({ t: "truco", who: "you" })}>{nextTruco}</Btn>}
      {canM && <Btn onClick={() => setConfirmMazo(true)}>Me voy al mazo</Btn>}
      {!canE && !canT && !canF && (
        <span className="text-[11px] text-[var(--ivory)]/50">
          Sin cantos disponibles. Jugá una carta.
        </span>
      )}
      <ConfirmSheet
        open={confirmMazo}
        title="¿Irte al mazo?"
        description="Perdés esta mano y lo que hayas cantado."
        confirmLabel="Sí, al mazo"
        cancelLabel="Seguir"
        destructive
        onConfirm={() => {
          setConfirmMazo(false);
          dispatch({ t: "mazo", who: "you" });
        }}
        onCancel={() => setConfirmMazo(false)}
      />
    </div>
  );
}

function ResponseButtons({
  g,
  dispatch,
  hostShort,
  onEnvidoAccept,
}: {
  g: GameState;
  dispatch: React.Dispatch<Action>;
  hostShort: string;
  onEnvidoAccept: () => void;
}) {
  const [confirmMazo, setConfirmMazo] = useState(false);
  const p = g.hand.pending!;
  return (
    <div className="space-y-2">
      <div className="text-sm text-[var(--ivory)]/90">
        {hostShort} canta{" "}
        <span className="text-[var(--brass)] font-semibold">
          {cantoLabelUpper(p.kind, p.level)}
        </span>
        . ¿Qué hacés?
      </div>
      <div className="flex flex-wrap gap-2">
        {p.kind === "envido" && (
          <>
            <Btn primary onClick={() => onEnvidoAccept()}>
              Quiero
            </Btn>
            <Btn onClick={() => dispatch({ t: "respEnvido", who: "you", ok: false })}>
              No quiero
            </Btn>
            {canCantarEnvidoLevel(g, "you", "envido") && (
              <Btn onClick={() => dispatch({ t: "envido", who: "you", level: "envido" })}>
                + Envido
              </Btn>
            )}
            {canCantarEnvidoLevel(g, "you", "real") && (
              <Btn onClick={() => dispatch({ t: "envido", who: "you", level: "real" })}>
                Real envido
              </Btn>
            )}
            {canCantarEnvidoLevel(g, "you", "falta") && (
              <Btn onClick={() => dispatch({ t: "envido", who: "you", level: "falta" })}>
                Falta envido
              </Btn>
            )}
          </>
        )}
        {p.kind === "truco" && (
          <>
            <Btn primary onClick={() => dispatch({ t: "respTruco", who: "you", ok: true })}>
              Quiero
            </Btn>
            <Btn onClick={() => dispatch({ t: "respTruco", who: "you", ok: false })}>No quiero</Btn>
            {canCantarTruco(g, "you") && (
              <Btn onClick={() => dispatch({ t: "truco", who: "you" })}>
                {p.level === "truco" ? "Retruco" : p.level === "retruco" ? "Vale cuatro" : ""}
              </Btn>
            )}
            {canCantarEnvido(g, "you") && (
              <>
                <Btn onClick={() => dispatch({ t: "envido", who: "you", level: "envido" })}>
                  Envido primero
                </Btn>
                <Btn onClick={() => dispatch({ t: "envido", who: "you", level: "real" })}>
                  Real primero
                </Btn>
                <Btn onClick={() => dispatch({ t: "envido", who: "you", level: "falta" })}>
                  Falta primero
                </Btn>
              </>
            )}
            {canIrseAlMazo(g, "you") && (
              <Btn onClick={() => setConfirmMazo(true)}>Me voy al mazo</Btn>
            )}
          </>
        )}
        {p.kind === "flor" && (
          <>
            <Btn onClick={() => dispatch({ t: "respFlor", who: "you", act: "achicar" })}>
              {hasFlor(g.hand.yourHand) ? "Con flor me achico" : "Te la dejo"}
            </Btn>
            {hasFlor(g.hand.yourHand) && (
              <>
                <Btn primary onClick={() => dispatch({ t: "respFlor", who: "you", act: "subir" })}>
                  {p.level === "flor" ? "Contraflor" : "Contraflor al resto"}
                </Btn>
                <Btn onClick={() => dispatch({ t: "respFlor", who: "you", act: "noquiero" })}>
                  No quiero
                </Btn>
              </>
            )}
          </>
        )}
      </div>
      <ConfirmSheet
        open={confirmMazo}
        title="¿Irte al mazo?"
        confirmLabel="Sí, al mazo"
        cancelLabel="Seguir"
        destructive
        onConfirm={() => {
          setConfirmMazo(false);
          dispatch({ t: "mazo", who: "you" });
        }}
        onCancel={() => setConfirmMazo(false)}
      />
    </div>
  );
}

function Btn({
  onClick,
  children,
  primary,
}: {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] min-w-[44px] px-4 py-2 text-sm rounded-sm border transition active:brightness-125 touch-manipulation select-none ${
        primary
          ? "border-[var(--brass)] bg-[var(--brass)] text-[var(--noir)] hover:bg-[var(--brass-bright,var(--brass))]"
          : "border-[var(--brass)]/50 bg-[var(--oxblood)]/40 text-[var(--ivory)] hover:bg-[var(--oxblood)]/70"
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {children}
    </button>
  );
}
