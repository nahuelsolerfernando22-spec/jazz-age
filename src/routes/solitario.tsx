import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { useHaptics } from "@/hooks/use-haptics";

import { useCampaignBridge, bumpCampaignEvent } from "@/hooks/use-campaign-bridge";
import { BoardFit } from "@/components/casino/BoardFit";
import { FreeModeBadge } from "@/components/casino/FreeModeBadge";
import { lazyNamed } from "@/lib/lazy";
import { NpcPortraitCard } from "@/components/casino/NpcPortraitCard";
import { BrassButton } from "@/components/casino/BrassButton";
import {
  type Card as SCard,
  type GameState,
  type Hostess,
  type SourceLocation,
  type TargetLocation,
  type Suit,
  RANK_FILE,
  SUIT_FILE,
  RANK_LABEL,
  SUIT_COLOR,
  SUITS,
  autoSendToFoundation,
  currentSolitaireHostess,
  dealNewGame,
  drawFromStock,
  autoComplete,
  isAutoCompletable,
  pickHostessLine,
  sliceSource,
  tryMove,
} from "@/lib/games/solitario/solitaire";
import { dailySeed, hashSeed } from "@/lib/seededRng";
import { submitScore } from "@/lib/leaderboard";
import { reportSingleScore } from "@/store/single-scores";
import { useCasino } from "@/store/casino";
import { submitTourneyScore, activeTourneyGame } from "@/lib/daily-tournament";
import { TourneyRoundBadge } from "@/components/casino/TourneyRoundBadge";
import { useHostessMatch } from "@/hooks/use-hostess-match";
import { useLockGame } from "@/store/gameLock";
import { useSurrender } from "@/components/casino/SurrenderButton";
import { NoLivesGate } from "@/components/casino/NoLivesGate";
import { useTryStart } from "@/hooks/use-try-start";
import { useSolitarioRun } from "@/store/games/solitario/solitario-run";
import { trackSolitarioMove, trackSolitarioWon } from "@/lib/games/solitario/solitario-tracker";
import { useGameAutosave, loadGameSave } from "@/lib/game-autosave";
import { useSolitarioObjectives } from "@/store/games/solitario/solitario-objectives";
import {
  dailyObjectives as dailySolitarioObjectivesFor,
  isObjectiveMet,
  type SolitarioObjective,
} from "@/lib/games/solitario/solitario-objectives";

const SolitarioVictoryScreen = lazyNamed(
  () => import("@/components/casino/solitario/SolitarioVictoryScreen"),
  "SolitarioVictoryScreen",
);

import zoneSolitario from "@/assets/zone-solitario-v11.webp";
import cardBackAsset from "@/assets/cards/solitario-back.webp";
const cardBack = cardBackAsset;
import jadeIdle from "@/assets/jade-portrait.webp";
import jadeWin from "@/assets/jade-portrait.webp";
import jadeLose from "@/assets/jade-portrait.webp";
import jadeTense from "@/assets/jade-portrait.webp";
import jadeFlirty from "@/assets/jade-portrait.webp";
import jadeAngry from "@/assets/jade-portrait.webp";
import { useNpcDialogue } from "@/hooks/use-npc-dialogue";
import type { Situation } from "@/lib/dialogue";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";
type HostessCue = "idle" | "draw" | "stuck" | "win" | "lose" | "angry";
const JADE_BY_CUE: Record<HostessCue, string> = {
  idle: jadeIdle,
  draw: jadeFlirty,
  stuck: jadeTense,
  angry: jadeAngry,
  lose: jadeLose,
  win: jadeWin,
};

const CARD_ART = import.meta.glob("@/assets/cards-ivory/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const CARD_URL: Record<string, string> = Object.fromEntries(
  Object.entries(CARD_ART).map(([path, url]) => {
    const file = path.split("/").pop()!.replace(".webp", "");
    return [file, url];
  }),
);

function artFor(card: SCard): string {
  const key = `${RANK_FILE[card.rank]}${SUIT_FILE[card.suit]}`;
  return CARD_URL[key] ?? cardBack;
}

const SUIT_GLYPH: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const Route = createFileRoute("/solitario")({
  ssr: false,
  component: SolitarioPage,
  head: () => ({
    meta: [
      { title: "La Mano Muerta — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Klondike con la baraja de Madame Corvina. Jade «Ojo de Dragón» custodia la mesa íntima del primer piso.",
      },
      { property: "og:image", content: zoneSolitario },
      { property: "og:url", content: "/solitario" },
    ],
    links: [{ rel: "canonical", href: "/solitario" }],
  }),
});

const HOSTESS_META: Record<Hostess, { name: string; portrait: string; subtitle: string }> = {
  jade: {
    name: "Jade «Ojo de Dragón»",
    portrait: jadeIdle,
    subtitle: "turno de Jade",
  },
};

interface SolitarioSave {
  game: GameState;
  isDaily: boolean;
  hasStarted: boolean;
}

function isValidSolitarioSave(v: unknown): v is SolitarioSave {
  if (!v || typeof v !== "object") return false;
  const g = (v as SolitarioSave).game;
  return (
    !!g &&
    typeof g === "object" &&
    Array.isArray(g.tableau) &&
    Array.isArray(g.stock) &&
    Array.isArray(g.waste) &&
    !!g.foundations &&
    typeof (v as SolitarioSave).isDaily === "boolean" &&
    typeof (v as SolitarioSave).hasStarted === "boolean"
  );
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "ya mismo";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h} h ${m.toString().padStart(2, "0")} min`;
  return `${m} min`;
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function SolitarioPage() {
  useSingleHostessCorner("solitario");
  useCampaignBridge("solitario");
  useEffect(() => {
    void import("@/lib/games/chinchon/chinchon-deck").then((m) => m.preloadDeck());
  }, []);
  const runLevel = useSolitarioRun((s) => s.activeLevel);
  const runStartedAt = useSolitarioRun((s) => s.startedAt);
  const [isDaily, setIsDaily] = useState(true);
  const dailySeedStr = useMemo(() => dailySeed("solitario"), []);
  const [game, setGame] = useState<GameState>(() =>
    dealNewGame(hashSeed(runLevel ? `solitario:encargo:${runLevel}` : dailySeedStr)),
  );

  const [history, setHistory] = useState<GameState[]>([]);
  const [selected, setSelected] = useState<SourceLocation | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [deadlock, setDeadlock] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const startedAtRef = useRef<number>(Date.now());
  const recordedRef = useRef<boolean>(false);
  const usedUndoRef = useRef<boolean>(false);
  const closedSuitsRef = useRef<number>(0);
  const [closingSuit, setClosingSuit] = useState<Suit | null>(null);
  const [objectivesReward, setObjectivesReward] = useState(0);
  const dailyObjectivesList = useMemo(() => dailySolitarioObjectivesFor(), []);
  const claimedObjectiveIds = useSolitarioObjectives((s) => s.claimed);

  useEffect(() => {
    if (!runLevel) return;
    setGame(dealNewGame(hashSeed(`solitario:encargo:${runLevel}`)));
    setHistory([]);
    setSelected(null);
    setSubmitted(false);
    setDeadlock(false);
    setHasStarted(false);
    recordedRef.current = false;
    startedAtRef.current = runStartedAt ?? Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runLevel]);

  // Reanudación silenciosa (Android mata la app sin avisar): si hay un
  // encargo activo, ese manda; si no, restauramos la partida libre/diaria
  // guardada, silenciosamente y sin preguntar.
  useEffect(() => {
    if (runLevel) return;
    const saved = loadGameSave("solitario", 1);
    if (isValidSolitarioSave(saved)) {
      setGame(saved.game);
      setIsDaily(saved.isDaily);
      setHasStarted(saved.hasStarted);
      startedAtRef.current = Date.now();
    }
    // Sólo al montar: es un rescate de arranque, no una sincronización continua.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = useCallback((next: GameState) => {
    setGame((prev) => {
      setHistory((h) => [...h.slice(-49), prev]);
      return next;
    });
    trackSolitarioMove();
  }, []);

  const undo = useCallback(() => {
    // Respeta el modificador de encargo "no-undo".
    if (useSolitarioRun.getState().noUndo()) return;
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      usedUndoRef.current = true;
      setGame(prev);
      setSelected(null);
      setDeadlock(false);
      setCue("idle");
      return h.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(t);
  }, []);

  const rotation = useMemo(() => currentSolitaireHostess(now), [now]);
  const hostess = HOSTESS_META[rotation.active];
  const learn = useHostessMatch(rotation.active);

  const [cue, setCue] = useState<HostessCue>("idle");
  const [stuckStreak, setStuckStreak] = useState(0);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const matchActive = hasStarted && !game.won && !deadlock && !submitted;
  useLockGame(matchActive, hasStarted);

  useGameAutosave(
    {
      game: "solitario",
      version: 1,
      active: hasStarted && !game.won && !deadlock,
      snapshot: () => ({ game, isDaily, hasStarted }),
    },
    [game, isDaily, hasStarted],
  );
  useSurrender(
    matchActive
      ? () => {
          setDeadlock(true);
          setHasStarted(false);
          setSelected(null);
          setCue("idle");
        }
      : null,
    "Rendirse",
  );

  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem("solitario:reduced-motion");
      if (saved != null) return saved === "1";
    } catch {}
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("solitario:reduced-motion", reduced ? "1" : "0");
    } catch {}
  }, [reduced]);

  // Ayuda de lectura: con una carta elegida, marcamos en verde los destinos
  // legales. Antes esto dependía de un drag que nunca se activaba en táctil.
  const canDropOn = useCallback(
    (t: TargetLocation): boolean => (selected ? tryMove(game, selected, t) !== null : false),
    [selected, game],
  );


  const baseLine = useMemo(
    () =>
      pickHostessLine(
        rotation.active,
        cue === "angry" || cue === "lose" ? "stuck" : cue,
        game.moves,
      ),
    [rotation.active, cue, game.moves],
  );
  const npcOutcome: Situation | null =
    cue === "win" ? "win" : cue === "lose" ? "lose" : cue === "angry" ? "angry" : null;
  const { line: dynamicLine } = useNpcDialogue(rotation.active, "/solitario", npcOutcome, baseLine);
  const line = dynamicLine || baseLine;

  // Bonus por cada palo cerrado (feedback visual + fichas), no espera al cierre total de la mano.
  useEffect(() => {
    const closedCount = SUITS.filter((s) => game.foundations[s].length === 13).length;
    if (closedCount > closedSuitsRef.current) {
      const justClosed = SUITS.find((s) => game.foundations[s].length === 13) as Suit | undefined;
      const newest = SUITS.filter((s) => game.foundations[s].length === 13).slice(-1)[0];
      closedSuitsRef.current = closedCount;
      useCasino.getState().addChips(25);
      setClosingSuit(newest ?? justClosed ?? null);
      window.setTimeout(() => {
        setClosingSuit((c) => (c === (newest ?? justClosed) ? null : c));
      }, 1500);
    }
  }, [game.foundations]);

  useEffect(() => {
    if (game.won && !submitted) {
      setCue("win");
      setStuckStreak(0);
      setSubmitted(true);
      setDeadlock(false);
      setElapsedMs(Date.now() - startedAtRef.current);
      trackSolitarioWon(Date.now() - startedAtRef.current);

      const score = Math.max(100, 5000 - game.moves * 8);
      reportSingleScore("solitario", score);
      // Economía: el solitario ahora paga fichas según lo limpia que salga la mano.
      useCasino.getState().addChips(Math.max(40, Math.round(score / 12)));
      // Objetivos diarios: se acreditan una sola vez por día vía useSolitarioObjectives.
      const suitsClosedNow = SUITS.filter((s) => game.foundations[s].length === 13).length;
      const objStats = {
        won: true,
        moves: game.moves,
        suitsClosed: suitsClosedNow,
        usedUndo: usedUndoRef.current,
      };
      let earnedFromObjectives = 0;
      for (const o of dailyObjectivesList) {
        earnedFromObjectives += useSolitarioObjectives.getState().claim(o.id, objStats);
      }
      if (earnedFromObjectives > 0) setObjectivesReward(earnedFromObjectives);
      if (activeTourneyGame() === "solitario") {
        void submitTourneyScore("solitario", score);
      }
      bumpCampaignEvent("solitario");
      void submitScore({
        game: "solitario",
        mode: isDaily ? "daily" : "freeplay",
        seed: isDaily ? dailySeedStr : null,
        score,
        meta: { moves: game.moves },
      });
      if (!recordedRef.current) {
        recordedRef.current = true;
        learn.tag("clear", "loss");
        learn.event("lost", "clear");
        learn.finish({
          hostessWon: false,
          playerPatienceRate: 0.7,
          playerAggressionRate: game.moves < 120 ? 0.65 : 0.4,
          durationMs: Date.now() - startedAtRef.current,
        });
      }
    }
  }, [game.won, game.moves, submitted, isDaily, dailySeedStr, rotation.active, learn]);

  useEffect(() => {
    if (!deadlock || game.won || submitted) return;
    // La mano trabada todavía puede haber cumplido "completar N palos".
    const suitsClosedNow = SUITS.filter((s) => game.foundations[s].length === 13).length;
    let earnedFromObjectives = 0;
    for (const o of dailyObjectivesList) {
      earnedFromObjectives += useSolitarioObjectives.getState().claim(o.id, {
        won: false,
        moves: game.moves,
        suitsClosed: suitsClosedNow,
        usedUndo: usedUndoRef.current,
      });
    }
    if (earnedFromObjectives > 0) setObjectivesReward((n) => n + earnedFromObjectives);
    if (recordedRef.current) return;
    recordedRef.current = true;
    learn.tag("stuck", "win");
    learn.event("won", "stuck");
    learn.finish({
      hostessWon: true,
      playerPatienceRate: 0.35,
      playerAggressionRate: 0.5,
      durationMs: Date.now() - startedAtRef.current,
    });
  }, [deadlock, game.won, submitted, rotation.active, learn]);

  useEffect(() => {
    if (!hasStarted) return;
    if (game.won || deadlock || submitted) return;
    if (hasProductiveMoveInCycle(game, useSolitarioRun.getState().drawThree() ? 3 : 1)) return;
    setDeadlock(true);
    setCue("lose");
  }, [game, deadlock, submitted, hasStarted]);

  const { tryStart, gateOpen, closeGate } = useTryStart();

  const abandonAndDeal = useCallback(
    (seed?: number, autoStart = false) => {
      setGame(dealNewGame(seed));
      setHistory([]);
      setSelected(null);
      setStuckStreak(0);
      setSubmitted(false);
      setElapsedMs(null);
      setDeadlock(false);
      setHasStarted(autoStart);
      startedAtRef.current = Date.now();
      recordedRef.current = false;
      usedUndoRef.current = false;
      closedSuitsRef.current = 0;
      setClosingSuit(null);
      setObjectivesReward(0);
      learn.begin();
    },
    [learn],
  );

  const startCurrentGame = useCallback(() => {
    tryStart(() => {
      setHasStarted(true);
      startedAtRef.current = Date.now();
      recordedRef.current = false;
      learn.begin();
      setCue("idle");
    });
  }, [learn, tryStart]);

  const newGame = useCallback(() => {
    const abandoning = !game.won && game.moves > 0;
    tryStart(() => {
      if (abandoning) {
        setCue("lose");
        window.setTimeout(() => {
          abandonAndDeal(undefined, true);
          setIsDaily(false);
          setCue("idle");
        }, 1400);
      } else {
        abandonAndDeal(undefined, true);
        setIsDaily(false);
        setCue("idle");
      }
    });
  }, [game.won, game.moves, abandonAndDeal, tryStart]);

  const replayDaily = useCallback(() => {
    const abandoning = !game.won && game.moves > 0;
    tryStart(() => {
      if (abandoning) {
        setCue("lose");
        window.setTimeout(() => {
          abandonAndDeal(hashSeed(dailySeedStr), true);
          setIsDaily(true);
          setCue("idle");
        }, 1400);
      } else {
        abandonAndDeal(hashSeed(dailySeedStr), true);
        setIsDaily(true);
        setCue("idle");
      }
    });
  }, [dailySeedStr, game.won, game.moves, abandonAndDeal, tryStart]);

  const handleDrawStock = () => {
    if (!hasStarted) return;
    // Encargo "draw-3" reparte 3 cartas por robo.
    const count = useSolitarioRun.getState().drawThree() ? 3 : 1;
    const next = drawFromStock(game, count);
    commit(next);
    setSelected(null);
    setStuckStreak(0);
    setCue("draw");
  };

  const autoAllToFoundations = useCallback(() => {
    if (!hasStarted) return;
    let g = game;
    let changed = false;

    for (let i = 0; i < 60; i++) {
      const cands: SourceLocation[] = [];
      if (g.waste.length > 0) cands.push({ kind: "waste" });
      for (let col = 0; col < g.tableau.length; col++) {
        const c = g.tableau[col];
        if (c.length > 0 && c[c.length - 1].faceUp) {
          cands.push({ kind: "tableau", col, index: c.length - 1 });
        }
      }
      let moved = false;
      for (const s of cands) {
        const nxt = autoSendToFoundation(g, s);
        if (nxt) {
          g = nxt;
          moved = true;
          changed = true;
          break;
        }
      }
      if (!moved) break;
    }
    if (changed) {
      commit(g);
      setSelected(null);
      setCue("idle");
    }
  }, [game, commit, hasStarted]);

  const hint = useMemo<SourceLocation | null>(() => {
    if (game.won || selected) return null;
    if (game.waste.length > 0) {
      if (autoSendToFoundation(game, { kind: "waste" })) return { kind: "waste" };
    }
    for (let col = 0; col < game.tableau.length; col++) {
      const c = game.tableau[col];
      if (c.length === 0) continue;
      const idx = c.length - 1;
      if (!c[idx].faceUp) continue;
      if (autoSendToFoundation(game, { kind: "tableau", col, index: idx })) {
        return { kind: "tableau", col, index: idx };
      }
    }
    return null;
  }, [game, selected]);

  // Mano ya destapada: se puede resolver sola sin que el jugador siga tocando.
  const canFinish = useMemo(() => hasStarted && isAutoCompletable(game), [game, hasStarted]);
  const finishGame = useCallback(() => {
    if (!canFinish) return;
    const next = autoComplete(game);
    if (next.moves !== game.moves) {
      commit(next);
      setSelected(null);
      setCue("idle");
    }
  }, [canFinish, game, commit]);

  const handleClick = (loc: SourceLocation | TargetLocation, asSource: boolean) => {
    if (!hasStarted) return;
    if (game.won) return;

    if (!selected) {
      if (!asSource) return;
      const slice = sliceSource(game, loc as SourceLocation);
      if (slice && slice.length > 0) {
        setSelected(loc as SourceLocation);
      }
      return;
    }

    if (asSource && sameLoc(selected, loc as SourceLocation)) {
      setSelected(null);
      return;
    }

    if (!asSource) {
      const next = tryMove(game, selected, loc as TargetLocation);
      if (next) {
        commit(next);
        setSelected(null);
        setStuckStreak(0);
        setCue("idle");
        return;
      }

      setSelected(null);
      setStuckStreak((n) => {
        const next = n + 1;
        setCue(next >= 3 ? "angry" : "stuck");
        return next;
      });
      return;
    }

    const target = loc as SourceLocation;
    if (target.kind === "tableau") {
      const next = tryMove(game, selected, { kind: "tableau", col: target.col });
      if (next) {
        commit(next);
        setSelected(null);
        setStuckStreak(0);
        setCue("idle");
        return;
      }

      const slice = sliceSource(game, target);
      if (slice && slice.length > 0) {
        setSelected(target);
        return;
      }
      setSelected(null);
      setStuckStreak((n) => {
        const next = n + 1;
        setCue(next >= 3 ? "angry" : "stuck");
        return next;
      });
    } else {
      setSelected(null);
    }
  };

  const handleDoubleClick = (src: SourceLocation) => {
    const next = autoSendToFoundation(game, src);
    if (next) {
      commit(next);
      setSelected(null);
      setStuckStreak(0);
      setCue("idle");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "z" || k === "u") {
        e.preventDefault();
        undo();
      } else if (k === "a") {
        e.preventDefault();
        autoAllToFoundations();
      } else if (k === "d") {
        e.preventDefault();
        handleDrawStock();
      } else if (k === "escape") {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, autoAllToFoundations, game]);

  return (
    <GameRoomShell
      bg={zoneSolitario}
      room="solitario"
      title="La Mano Muerta"
      subtitle={hostess.subtitle}
    >
      <SolitarioVictoryScreen />

      <div className="mx-auto mt-2 flex max-w-7xl flex-wrap items-center justify-end gap-2 px-4 sm:justify-start">
        <TourneyRoundBadge game="solitario" />
        <FreeModeBadge />
      </div>

      <div className="cuervo-mobile-compact mx-auto max-w-7xl px-4 pb-10">
        <div className="mobile-stack-grid grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-[168px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="desktop-rail space-y-4 lg:order-1">
            <NpcPortraitCard
              src={JADE_BY_CUE[cue]}
              alt={hostess.name}
              name={hostess.name}
              line={line}
              npcId={rotation.active}
            />
            <div className="rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/82 p-3 text-center backdrop-blur">
              <div className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
                rotación de la mesa
              </div>
              <div className="mt-1 font-script text-base text-[var(--brass-bright)]">
                {hostess.name.split(" ")[0]} mantiene la mesa
              </div>
              <div className="mt-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--smoke)]">
                revisión del mazo en {formatRemaining(rotation.next.getTime() - now)}
              </div>
            </div>
            <div className="rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/82 p-3">
              <div className="font-display text-[11px] uppercase tracking-[0.4em] text-[var(--brass)]/90">
                objetivos del día
              </div>
              <SolitarioObjectivesList
                objectives={dailyObjectivesList}
                claimedIds={claimedObjectiveIds}
              />
            </div>
            <div className="flex flex-col gap-2">
              <BrassButton onClick={replayDaily} variant={isDaily ? "primary" : "ghost"} size="sm">
                {isDaily ? "Reto del día activo" : "Volver al reto del día"}
              </BrassButton>
            </div>
          </aside>

          {}
          <div className="game-focus lg:order-2 min-w-0 max-w-full">
            <BoardFit>
              <div
                // En móvil el ancho de carta se deriva del viewport para que las
                // 7 columnas del tableau entren completas sin recortar la última.
                className="relative rounded-[20px] border-4 border-[oklch(0.35_0.04_60)] p-1 shadow-deep sm:rounded-[24px] sm:p-5 [--soli-w:calc((100vw-1rem-6*0.2rem)/7)] [--soli-h:calc(var(--soli-w)/0.7)] sm:[--soli-h:176px] sm:[--soli-w:calc(var(--soli-h)*0.7)] lg:[--soli-h:192px] [--soli-o:calc(var(--soli-h)*0.26)] [--soli-od:calc(var(--soli-h)*0.13)]"
                style={{
                  background:
                    "radial-gradient(ellipse at center, oklch(0.32 0.10 145) 0%, oklch(0.16 0.06 145) 85%)",
                  boxShadow:
                    "inset 0 0 80px oklch(0 0 0 / 0.7), inset 0 0 0 1px oklch(0.65 0.14 75 / 0.25), 0 30px 60px -20px rgba(0,0,0,0.95)",
                }}
              >
                {}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-2 rounded-[18px] border border-[var(--brass)]/25"
                  style={{ boxShadow: "inset 0 0 40px oklch(0 0 0 / 0.35)" }}
                />
                {!hasStarted && !game.won && !deadlock && (
                  <div className="absolute inset-0 z-20 grid place-items-center rounded-[18px] bg-[var(--noir)]/76 px-4 text-center backdrop-blur-[2px]">
                    <div className="max-w-xs">
                      <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/90">
                        ─ mesa en silencio ─
                      </div>
                      <h2 className="mt-2 font-script text-3xl text-[var(--brass-bright)]">
                        Empezar juego
                      </h2>
                      <p className="mt-1 text-xs text-[var(--ivory)]/70">
                        Mirá la mesa sin quedar encerrado. Al empezar se bloquea la salida y aparece
                        Rendirse.
                      </p>
                      <BrassButton
                        onClick={startCurrentGame}
                        variant="primary"
                        size="sm"
                        className="mt-4"
                      >
                        Empezar partida
                      </BrassButton>
                    </div>
                  </div>
                )}
                {}
                <div className="relative mb-3 flex items-start justify-between gap-1.5 sm:mb-4 sm:gap-3">
                  <div className="flex items-end gap-1 sm:gap-2">
                    {}
                    <button
                      type="button"
                      onClick={handleDrawStock}
                      className="relative transition-transform hover:-translate-y-0.5"
                      aria-label="Robar del mazo"
                    >
                      {game.stock.length > 0 ? (
                        <CardBack />
                      ) : (
                        <RecycleSlot empty={game.waste.length === 0} />
                      )}
                    </button>
                    {}
                    <div className="relative">
                      {game.waste.length === 0 ? (
                        <CardSlot glyph="↷" />
                      ) : (
                        <ClickableCard
                          card={game.waste[game.waste.length - 1]}
                          selected={selected?.kind === "waste" || (false as boolean)}
                          hint={hint?.kind === "waste"}
                          reduced={reduced}
                          onClick={() => handleClick({ kind: "waste" }, true)}
                          onDoubleClick={() => handleDoubleClick({ kind: "waste" })}
                        />
                      )}
                    </div>
                  </div>

                  {}
                  <div className="flex items-end gap-1 sm:gap-2">
                    {SUITS.map((s) => {
                      const stack = game.foundations[s];
                      const top = stack[stack.length - 1] ?? null;
                      const isSel = selected?.kind === "foundation" && selected.suit === s;
                      const red = SUIT_COLOR[s] === "red";
                      const isDropOk = canDropOn({ kind: "foundation", suit: s });
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              handleClick({ kind: "foundation", suit: s }, false);
                            } else if (top) {
                              handleClick({ kind: "foundation", suit: s }, true);
                            }
                          }}
                          className={`relative rounded-md transition-transform ${
                            closingSuit === s
                              ? "ring-4 ring-[oklch(0.88_0.19_90/0.95)] animate-pulse"
                              : isDropOk
                                ? "animate-pulse ring-2 ring-[oklch(0.82_0.18_140/0.85)] ring-offset-2 ring-offset-[oklch(0.16_0.06_145)]"
                                : ""
                          }`}

                          aria-label={`Pila de ${s}`}
                        >
                          {top ? (
                            <CardFace card={top} selected={isSel} reduced={reduced} />
                          ) : (
                            <CardSlot glyph={SUIT_GLYPH[s]} tone={red ? "red" : "dark"} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="my-3 h-px bg-gradient-to-r from-transparent via-[var(--brass)]/40 to-transparent" />

                {}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {game.tableau.map((col, ci) => {
                    const isEmpty = col.length === 0;
                    const isSelTarget = selected != null && !isSameTarget(selected, ci);
                    const topIdx = col.length - 1;
                    const isDropOk = canDropOn({ kind: "tableau", col: ci });
                    // Abanico asimétrico: los dorsos se apilan compactos y las
                    // cartas dadas vuelta respiran, para leer la columna de un vistazo.
                    let down = 0;
                    let up = 0;
                    const tops = col.map((card) => {
                      const top = `calc(${down} * var(--soli-od) + ${up} * var(--soli-o))`;
                      if (card.faceUp) up += 1;
                      else down += 1;
                      return top;
                    });
                    const colHeight = isEmpty
                      ? "var(--soli-h)"
                      : `calc(var(--soli-h) + ${Math.max(0, down - (col[topIdx]?.faceUp ? 0 : 1))} * var(--soli-od) + ${Math.max(0, up - (col[topIdx]?.faceUp ? 1 : 0))} * var(--soli-o))`;
                    return (
                      <div
                        key={ci}
                        className={`relative rounded-md ${
                          isDropOk
                            ? "ring-2 ring-[oklch(0.82_0.18_140/0.85)] ring-offset-2 ring-offset-[oklch(0.16_0.06_145)]"
                            : ""
                        }`}
                        style={{ height: colHeight }}
                      >
                        {isEmpty ? (
                          <button
                            type="button"
                            onClick={() =>
                              selected ? handleClick({ kind: "tableau", col: ci }, false) : null
                            }
                            className="block h-full w-full rounded-md border-2 border-dashed border-[var(--brass)]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)]/80"
                            aria-label={`Columna ${ci + 1} vacía`}
                            style={{ width: "var(--soli-w)" }}
                          />
                        ) : (
                          col.map((card, ri) => {
                            const isSel =
                              selected?.kind === "tableau" &&
                              selected.col === ci &&
                              ri >= selected.index;
                            const isHint =
                              hint?.kind === "tableau" && hint.col === ci && ri === topIdx;
                            return (
                              <div key={card.id} className="absolute left-0" style={{ top: tops[ri] }}>
                                {card.faceUp ? (
                                  <ClickableCard
                                    card={card}
                                    selected={isSel}
                                    hint={isHint}
                                    reduced={reduced}
                                    onClick={() =>
                                      handleClick({ kind: "tableau", col: ci, index: ri }, true)
                                    }
                                    onDoubleClick={() =>
                                      handleDoubleClick({
                                        kind: "tableau",
                                        col: ci,
                                        index: ri,
                                      })
                                    }
                                  />
                                ) : (
                                  <CardBack />
                                )}
                              </div>
                            );
                          })
                        )}

                        {!isEmpty && selected && isSelTarget && (
                          <button
                            type="button"
                            onClick={() => handleClick({ kind: "tableau", col: ci }, false)}
                            className="absolute inset-x-0 -bottom-2 h-6 opacity-0"
                            aria-label={`Soltar en columna ${ci + 1}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {}
                <div className="h-4" />
                <style>{`
                @keyframes soli-hint-pulse {
                  0%, 100% { filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
                  50% { filter: drop-shadow(0 0 12px oklch(0.85 0.18 85 / 0.55)); }
                }
              `}</style>
              </div>

              {}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-[var(--brass)]/25 bg-[var(--noir)]/85 p-2 backdrop-blur-sm sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:p-3">
                <div className="col-span-2 text-center font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90 sm:col-auto sm:text-left">
                  movimientos · <span className="text-[var(--brass-bright)]">{game.moves}</span>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-auto sm:flex sm:flex-wrap sm:items-center">
                  <BrassButton
                    onClick={undo}
                    variant="ghost"
                    size="sm"
                    disabled={history.length === 0}
                    aria-label="Deshacer último movimiento (Z)"
                  >
                    ↶ Deshacer
                  </BrassButton>
                  <BrassButton
                    onClick={autoAllToFoundations}
                    variant="ghost"
                    size="sm"
                    disabled={!hint}
                    aria-label="Enviar todas las cartas posibles a las pilas (A)"
                  >
                    ⇪ Auto a pilas
                  </BrassButton>
                  {canFinish && (
                    <BrassButton
                      onClick={finishGame}
                      variant="primary"
                      size="sm"
                      aria-label="Completar la partida automáticamente"
                    >
                      Completar
                    </BrassButton>
                  )}
                  <button
                    type="button"
                    onClick={() => setReduced((r) => !r)}
                    aria-pressed={reduced}
                    className={`whitespace-nowrap rounded-sm border px-2 py-1 font-display text-[11px] uppercase tracking-[0.2em] transition ${
                      reduced
                        ? "border-[var(--brass-bright)]/70 bg-[var(--brass)]/15 text-[var(--brass-bright)]"
                        : "border-[var(--brass)]/40 text-[var(--brass)]/90 hover:text-[var(--brass-bright)]"
                    }`}
                    title="Reduce animaciones y giros"
                  >
                    {reduced ? "◐ animación off" : "◑ animación on"}
                  </button>
                  <BrassButton onClick={newGame} variant="ghost" size="sm" shape="ingot">
                    Repartir nueva
                  </BrassButton>
                </div>
              </div>

              {/* En móvil el riel lateral no existe: los objetivos del día viven
                  acá abajo, donde antes había un hueco muerto de mesa. */}
              <div className="mt-3 rounded-md border border-[var(--brass)]/25 bg-[var(--noir)]/85 p-3 backdrop-blur-sm lg:hidden">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                    objetivos del día
                  </div>
                  <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--smoke)]">
                    {isDaily ? "reto del día" : "salón libre"}
                  </div>
                </div>
                <SolitarioObjectivesList
                  objectives={dailyObjectivesList}
                  claimedIds={claimedObjectiveIds}
                  compact
                />
                <div className="mt-2">
                  <BrassButton
                    onClick={replayDaily}
                    variant={isDaily ? "primary" : "ghost"}
                    size="sm"
                  >
                    {isDaily ? "Reto del día activo" : "Volver al reto del día"}
                  </BrassButton>
                </div>
              </div>



              <AnimatePresence>
                {game.won && (
                  <motion.div
                    key="win-modal"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={
                      reduced ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 22 }
                    }
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="soli-win-title"
                  >
                    <div
                      className="relative max-h-[78svh] w-full max-w-md overflow-y-auto rounded-lg border-2 border-[var(--brass-bright)]/70 bg-[var(--noir)]/95 p-5 text-center shadow-2xl"
                      style={{
                        boxShadow:
                          "0 30px 60px -12px rgba(0,0,0,0.9), inset 0 0 0 1px oklch(0.65 0.14 75 / 0.35)",
                      }}
                    >
                      <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/90">
                        ─ las cuatro torres en pie ─
                      </div>
                      <div
                        id="soli-win-title"
                        className="mt-2 font-script text-3xl text-[var(--brass-bright)]"
                      >
                        Mesa limpia
                      </div>
                      <p className="mt-1 text-xs text-[var(--ivory)]/70">
                        {hostess.name.split(" ")[0]} deja el naipe en la mesa.
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/70 p-3">
                          <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                            tiempo
                          </div>
                          <div className="mt-1 font-script text-2xl text-[var(--ivory)]">
                            {formatElapsed(elapsedMs ?? 0)}
                          </div>
                        </div>
                        <div className="rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/70 p-3">
                          <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                            movimientos
                          </div>
                          <div className="mt-1 font-script text-2xl text-[var(--ivory)]">
                            {game.moves}
                          </div>
                        </div>
                      </div>

                      {objectivesReward > 0 && (
                        <div className="mt-3 rounded-sm border border-[var(--brass-bright)]/50 bg-[var(--brass)]/10 p-2 text-center">
                          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                            objetivos cumplidos
                          </div>
                          <div className="mt-0.5 font-numerals text-lg text-[var(--brass-bright)]">
                            +{objectivesReward}¢
                          </div>
                        </div>
                      )}
                      <div className="mt-3 text-left">
                        <SolitarioObjectivesList
                          objectives={dailyObjectivesList}
                          claimedIds={claimedObjectiveIds}
                          compact
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <BrassButton onClick={newGame} variant="primary" size="sm" autoFocus>
                          Nueva partida
                        </BrassButton>
                        {isDaily && (
                          <BrassButton onClick={replayDaily} variant="ghost" size="sm">
                            Reintentar diario
                          </BrassButton>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {deadlock && !game.won && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 rounded-sm border border-[var(--oxblood)]/70 bg-[var(--noir)]/90 p-4 text-center"
                  >
                    <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--oxblood-bright)]/85">
                      ─ mano trabada ─
                    </div>
                    <div className="mt-1 font-script text-2xl text-[var(--ivory)]/90">
                      Sin cartas en el mazo y sin jugadas legales
                    </div>
                    <p className="mt-1 text-xs text-[var(--ivory)]/60">
                      {hostess.name.split(" ")[0]} te ofrece repartir otra vez.
                    </p>
                    {objectivesReward > 0 && (
                      <div className="mt-3 font-numerals text-sm text-[var(--brass-bright)]">
                        Objetivos cumplidos: +{objectivesReward}¢
                      </div>
                    )}
                    <div className="mt-3 text-left">
                      <SolitarioObjectivesList
                        objectives={dailyObjectivesList}
                        claimedIds={claimedObjectiveIds}
                        compact
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <BrassButton onClick={newGame} variant="primary" size="sm">
                        Repartir otra
                      </BrassButton>
                      {isDaily && (
                        <BrassButton onClick={replayDaily} variant="ghost" size="sm">
                          Reintentar diario
                        </BrassButton>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </BoardFit>
          </div>
        </div>
      </div>
      <NoLivesGate open={gateOpen} onClose={closeGate} />
    </GameRoomShell>
  );
}

function SolitarioObjectivesList({
  objectives,
  claimedIds,
  compact = false,
}: {
  objectives: SolitarioObjective[];
  claimedIds: string[];
  compact?: boolean;
}) {
  return (
    <ul className={compact ? "mt-1 space-y-1 text-left" : "mt-2 space-y-1.5 text-left"}>
      {objectives.map((o) => {
        const done = claimedIds.includes(o.id);
        return (
          <li
            key={o.id}
            className={`flex items-start gap-2 rounded-sm border px-2 py-1 text-[11px] ${
              done
                ? "border-[var(--brass-bright)]/60 bg-[var(--brass)]/10 text-[var(--brass-bright)]"
                : "border-[var(--brass)]/25 text-[var(--ivory)]/80"
            }`}
          >
            <span className="mt-[1px] font-display text-[11px]">{done ? "✓" : "•"}</span>
            <span className="flex-1">{o.label}</span>
            <span className="whitespace-nowrap font-numerals text-[11px] text-[var(--brass)]/80">
              +{o.reward}¢
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function hasAnyLegalMove(game: GameState): boolean {
  const sources: SourceLocation[] = [];
  if (game.waste.length > 0) sources.push({ kind: "waste" });
  for (let col = 0; col < game.tableau.length; col++) {
    const column = game.tableau[col];
    for (let i = 0; i < column.length; i++) {
      if (column[i].faceUp) sources.push({ kind: "tableau", col, index: i });
    }
  }
  const targets: TargetLocation[] = [];
  for (const suit of SUITS) targets.push({ kind: "foundation", suit });
  for (let col = 0; col < game.tableau.length; col++) targets.push({ kind: "tableau", col });
  for (const src of sources) {
    for (const tgt of targets) {
      const next = tryMove(game, src, tgt);
      if (!next) continue;
      // Mover un rey entre columnas vacías no destraba nada: no cuenta.
      if (
        tgt.kind === "tableau" &&
        src.kind === "tableau" &&
        src.index === 0 &&
        game.tableau[tgt.col].length === 0
      ) {
        continue;
      }
      return true;
    }
  }
  return false;
}

/**
 * Bloqueo real: no hay jugada útil ahora ni en ningún punto del ciclo completo
 * del mazo (robando hasta dar la vuelta entera).
 */
function hasProductiveMoveInCycle(game: GameState, drawCount: number): boolean {
  let g = game;
  const total = g.stock.length + g.waste.length;
  const steps = Math.ceil(total / Math.max(1, drawCount)) + 1;
  for (let i = 0; i <= steps; i++) {
    if (hasAnyLegalMove(g)) return true;
    if (g.stock.length === 0 && g.waste.length === 0) break;
    g = drawFromStock(g, drawCount);
  }
  return false;
}

function sameLoc(a: SourceLocation, b: SourceLocation): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "waste") return true;
  if (a.kind === "foundation" && b.kind === "foundation") return a.suit === b.suit;
  if (a.kind === "tableau" && b.kind === "tableau") return a.col === b.col && a.index === b.index;
  return false;
}

function isSameTarget(sel: SourceLocation, col: number): boolean {
  return sel.kind === "tableau" && sel.col === col;
}

function ClickableCard({
  card,
  selected,
  hint = false,
  reduced = false,
  onClick,
  onDoubleClick,
}: {
  card: SCard;
  selected: boolean;
  hint?: boolean;
  reduced?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const haptic = useHaptics();
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const lastTapAt = useRef(0);
  const clearTimer = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  return (
    <button
      type="button"
      onClick={() => {
        if (longPressed.current) {
          longPressed.current = false;
          return;
        }
        // Doble toque rápido = mandar a las pilas, como en cualquier solitario móvil.
        const now = Date.now();
        if (now - lastTapAt.current < 300) {
          lastTapAt.current = 0;
          haptic("success");
          onDoubleClick();
          return;
        }
        lastTapAt.current = now;
        haptic("card");
        onClick();
      }}
      onPointerDown={() => {
        longPressed.current = false;
        clearTimer();
        pressTimer.current = window.setTimeout(() => {
          longPressed.current = true;
          haptic("success");
          onDoubleClick();
        }, 420);
      }}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onPointerCancel={clearTimer}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      className="block rounded-md active:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass-bright)]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.16_0.06_145)]"
      aria-label={`${RANK_LABEL[card.rank]} de ${card.suit} — doble toque o mantené presionado para enviar a las pilas`}
      aria-pressed={selected}

    >
      <CardFace card={card} selected={selected} hint={hint} reduced={reduced} />
    </button>
  );
}

function CardFace({
  card,
  selected,
  hint = false,
  reduced = false,
}: {
  card: SCard;
  selected?: boolean;
  hint?: boolean;
  reduced?: boolean;
}) {
  const commonStyle: React.CSSProperties = {
    height: "var(--soli-h)",
    width: "var(--soli-w)",
    borderColor: selected
      ? "var(--brass-bright)"
      : hint
        ? "oklch(0.82 0.18 85 / 0.85)"
        : SUIT_COLOR[card.suit] === "red"
          ? "oklch(0.55 0.18 25 / 0.7)"
          : "oklch(0.35 0.04 60)",
    boxShadow: selected
      ? "0 0 0 3px oklch(0.85 0.18 75 / 0.9), 0 10px 22px -6px rgba(0,0,0,0.9)"
      : hint
        ? "0 0 0 2px oklch(0.85 0.18 85 / 0.7), 0 6px 14px -4px rgba(0,0,0,0.85)"
        : "0 6px 14px -4px rgba(0,0,0,0.85)",
    transform: selected ? "translateY(-8px)" : "translateY(0)",
    transition: "transform 0.18s ease, box-shadow 0.2s ease",
    animation: hint && !reduced ? "soli-hint-pulse 1.6s ease-in-out infinite" : undefined,
  };
  const inner = (
    <img
      src={artFor(card)}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      draggable={false}
    />
  );
  if (reduced) {
    return (
      <div className="relative overflow-hidden rounded-md border-2" style={commonStyle}>
        {inner}
      </div>
    );
  }
  return (
    <motion.div
      layout
      layoutId={`card-${card.id}`}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="relative overflow-hidden rounded-md border-2"
      style={commonStyle}
    >
      {inner}
    </motion.div>
  );
}

function CardBack() {
  return (
    <div
      className="overflow-hidden rounded-md border-2 border-[var(--brass)]/70"
      style={{
        height: "var(--soli-h)",
        width: "var(--soli-w)",
        boxShadow: "0 6px 14px -4px rgba(0,0,0,0.85)",
      }}
    >
      <img src={cardBack} alt="" className="h-full w-full object-cover" draggable={false} />
    </div>
  );
}

function CardSlot({ glyph, tone = "muted" }: { glyph: string; tone?: "red" | "dark" | "muted" }) {
  const color =
    tone === "red"
      ? "oklch(0.62 0.16 25 / 0.55)"
      : tone === "dark"
        ? "oklch(0.85 0.06 75 / 0.35)"
        : "oklch(0.75 0.10 75 / 0.40)";
  return (
    <div
      className="grid place-items-center rounded-md border-2 border-dashed border-[var(--brass)]/30"
      style={{
        height: "var(--soli-h)",
        width: "var(--soli-w)",
        boxShadow: "inset 0 0 24px oklch(0 0 0 / 0.35)",
      }}
    >
      <span
        className="leading-none"
        style={{
          fontSize: "calc(var(--soli-h) * 0.4)",
          color,
          textShadow: "0 2px 6px rgba(0,0,0,0.6)",
        }}
      >
        {glyph}
      </span>
    </div>
  );
}

function RecycleSlot({ empty }: { empty: boolean }) {
  return (
    <div
      className="grid place-items-center rounded-md border-2 border-[var(--brass)]/40 bg-[var(--noir)]/40"
      style={{ height: "var(--soli-h)", width: "var(--soli-w)" }}
    >
      <span className="font-display text-[11px] uppercase tracking-[0.25em] text-[var(--brass)]/90">
        {empty ? "—" : "↻"}
      </span>
    </div>
  );
}

export type _SuitAlias = Suit;
