import { createFileRoute } from "@tanstack/react-router";
import { reportSingleScore } from "@/store/single-scores";
import { useNemesisSession } from "@/lib/nemesis";
import { motion, AnimatePresence } from "framer-motion";
import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { TourneyRoundBadge } from "@/components/casino/TourneyRoundBadge";
import { useSurrender } from "@/components/casino/SurrenderButton";

import { lazyNamed } from "@/lib/lazy";
const MahjongBoard = lazyNamed(
  () => import("@/components/casino/mahjong/MahjongBoard"),
  "MahjongBoard",
);
import { ThematicSpinner } from "@/components/casino/ThematicSpinner";
import { MahjongTray } from "@/components/casino/mahjong/MahjongTray";
const LevelSelect = lazyNamed(
  () => import("@/components/casino/mahjong/LevelSelect"),
  "LevelSelect",
);
import { useMahjongGame, DEFAULT_LEVEL } from "@/hooks/use-mahjong-game";
import {
  getLastMahjongDifficulty,
  hasMahjongSave,
  setLastMahjongDifficulty,
} from "@/lib/games/mahjong/mahjong-resume";
import { useGamePause } from "@/store/game-pause";
import { useSwipe } from "@/hooks/use-swipe";
import { useHaptics } from "@/hooks/use-haptics";
import { useMahjongRun } from "@/store/games/mahjong/mahjong-run";
import { ReliquiaOfferModal } from "@/components/casino/mahjong/ReliquiaOfferModal";
import { ofrecerReliquias, type ReliquiaDef } from "@/lib/games/mahjong/mahjong-reliquias";
import { useMahjongSfx } from "@/hooks/use-mahjong-sfx";
import { useMahjongProgression } from "@/hooks/use-mahjong-progression";
import { useMahjongDaily } from "@/hooks/use-mahjong-daily";
import { MahjongDailyObjectives } from "@/components/casino/mahjong/MahjongDailyObjectives";
import { getLevel, nextLevelId } from "@/lib/games/mahjong/mahjong-levels";
import {
  abilityDef,
  isAbilityUnlocked,
  reachedRound,
  type AbilityId,
} from "@/lib/games/mahjong/mahjong-abilities";
import { getTableEconomy, markHighStakesWaiverUsed, formatEconomyLine } from "@/lib/economy";
import { useCasino } from "@/store/casino";
import { HINT_LIMIT, REORDER_LIMIT, REORDER_CHIP_COST } from "@/lib/games/mahjong/mahjong-tension";
import { useFavors } from "@/store/favors";
import mahjongBg from "@/assets/zone-mahjong-v3.webp";
import mahjongSheet1 from "@/assets/mahjong-tiles-sheet.webp";
import mahjongSheet2 from "@/assets/mahjong-tiles-sheet-2.webp";
import mahjongSheet3 from "@/assets/mahjong-tiles-sheet-3.webp";
import mahjongSheet4 from "@/assets/mahjong-tiles-sheet-4.webp";
import mahjongSheet5 from "@/assets/mahjong-tiles-sheet-5.webp";
import mahjongSpec1 from "@/assets/mahjong-specials-sheet.webp";
import mahjongSpec2 from "@/assets/mahjong-specials-sheet-2.webp";
import mahjongSpec3 from "@/assets/mahjong-specials-sheet-3.webp";
import mahjongSpec4 from "@/assets/mahjong-specials-sheet-4.webp";
import mahjongSpec5 from "@/assets/mahjong-specials-sheet-5.webp";
import linIdleAsset from "@/assets/lin-portrait.webp";
import linWinAsset from "@/assets/lin-portrait.webp";
import linLoseAsset from "@/assets/lin-portrait.webp";
import linAngryAsset from "@/assets/lin-portrait.webp";
import linFlirtyAsset from "@/assets/lin-portrait.webp";
import linTenseAsset from "@/assets/lin-portrait.webp";
import { getCurrentHostess } from "@/lib/hostess-rotation";
import { useHostessMatch } from "@/hooks/use-hostess-match";
import { playMahjongRow } from "@/lib/games/mahjong/mahjong-row-sfx";
import {
  playMahjongClick,
  playMahjongError,
  playMahjongWin,
  playMahjongLose,
} from "@/lib/games/mahjong/mahjong-sfx";
import { MahjongBoardZoom } from "@/components/casino/mahjong/MahjongBoardZoom";
import { BrassButton } from "@/components/casino/BrassButton";
import { NoLivesGate } from "@/components/casino/NoLivesGate";
import { useTryStart } from "@/hooks/use-try-start";
import { useLockGame } from "@/store/gameLock";
import { HostessHudStrip } from "@/components/casino/HostessHudStrip";
import { NpcPortraitCard } from "@/components/casino/NpcPortraitCard";
import { submitTourneyScore, activeTourneyGame } from "@/lib/daily-tournament";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";
import { mahjongAiSuggest, type MahjongAiExplanation } from "@/lib/games/mahjong/mahjong-ai";
import { useMahjongSettings } from "@/lib/games/mahjong/mahjong-settings";
import { MahjongAiExplainPanel } from "@/components/casino/mahjong/AiExplainPanel";
import { MahjongSettingsDialog } from "@/components/casino/mahjong/MahjongSettingsDialog";
const AlbumPanel = lazyNamed(() => import("@/components/casino/mahjong/AlbumPanel"), "AlbumPanel");
import { SpecialSynergyBadge } from "@/components/casino/mahjong/SpecialSynergyBadge";
import { PresagioBadge } from "@/components/casino/mahjong/PresagioBadge";
import { reviveBrokenImages } from "@/lib/asset-manager";

export const Route = createFileRoute("/mahjong")({
  ssr: false,
  component: MahjongPage,
  head: () => ({
    meta: [
      { title: "Marfil Paciente — Lin «Pluma de Tinta» · 1928" },
      {
        name: "description",
        content:
          "Mahjong tile-match en el salón de Lin «Pluma de Tinta», dentro del speakeasy de Madame Corvina. Junta tres pecadores iguales antes de que se llene la bandeja.",
      },
      { property: "og:title", content: "El Salón de Mahjong — Lin «Pluma de Tinta»" },
      {
        property: "og:description",
        content: "Tres pecados iguales y la mesa olvida tu deuda.",
      },
      { property: "og:image", content: mahjongBg },
      { property: "og:url", content: "/mahjong" },
    ],
    links: [{ rel: "canonical", href: "/mahjong" }],
  }),
});

import {
  JADE_LINES,
  LIN_LINES,
  pickLine as pick,
  preloadMahjongSheets,
  sheetsInUse,
} from "@/lib/games/mahjong/mahjong-page-helpers";
import {
  ActionBtn,
  BackIcon,
  BulbIcon,
  ComboBadge,
  DoorOpenReveal,
  FeverOverlay,
  Lives,
  MagnetIcon,
  MatchSparkles,
  PlusSlotIcon,
  ProgressBar,
  RefreshIcon,
  ResponsiveBoard,
  ScorePop,
  ShuffleIcon,
  Stat,
  SummaryRow,
  UndoIcon,
} from "@/components/casino/mahjong/MahjongHudBits";

function MahjongPage() {
  useSingleHostessCorner("mahjong");
  const [tileSheetsReady, setTileSheetsReady] = useState(false);
  const nem = useNemesisSession("mahjong");
  const nemChallenge = nem.active ? Math.max(0, nem.difficulty - 1) : 0;
  const initialLevel = useMemo(() => getLastMahjongDifficulty() ?? DEFAULT_LEVEL, []);
  const [hasStarted, setHasStarted] = useState(() => hasMahjongSave(initialLevel));
  const paused = useGamePause((s) => s.paused);
  const requestPause = useGamePause((s) => s.requestPause);
  const running = hasStarted && !paused;
  const game = useMahjongGame(initialLevel, nemChallenge, running);
  const haptic = useHaptics();
  const hapticAsync = (kind: Parameters<typeof haptic>[0]) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => haptic(kind));
    } else {
      haptic(kind);
    }
  };
  const handleUndo = () => {
    // `round` se calcula más abajo; al ser un manejador de eventos ya existe.
    if (!isAbilityUnlocked("deshacer", round)) return;
    if (game.undoCount === 0 || game.undosLeft <= 0) return;
    hapticAsync("warning");
    game.undo();
  };
  // Sólo las hojas de sprites que este tablero usa: decodificar las 10 cuesta
  // ~100 MB en la WebView y es lo que hacía tardar la apertura en el APK.
  const usedSheets = useMemo(() => sheetsInUse(game.tiles), [game.tiles]);
  const usedSheetsKey = usedSheets.join("|");
  useEffect(() => {
    let alive = true;
    const failOpen = window.setTimeout(() => {
      if (alive) setTileSheetsReady(true);
    }, 3800);
    preloadMahjongSheets(usedSheetsKey ? usedSheetsKey.split("|") : undefined).then((ok) => {
      if (alive) {
        setTileSheetsReady(true);
        if (!ok) reviveBrokenImages('[data-mahjong-sheet="true"]');
      }
    });
    return () => {
      alive = false;
      window.clearTimeout(failOpen);
    };
  }, [usedSheetsKey]);

  // Android APK: al volver del background WebView puede descartar los sprites
  // por presión de RAM. Forzamos re-decode de las hojas de fichas.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.visibilityState === "hidden") return;
      reviveBrokenImages('[data-mahjong-sheet="true"]');
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    setLastMahjongDifficulty(game.difficulty);
  }, [game.difficulty]);

  // La orientación se bloquea globalmente (native-bridge + PortraitGate); no duplicar acá.

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (hasStarted) return;
      if (hasMahjongSave(game.difficulty)) setHasStarted(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [hasStarted, game.difficulty]);

  const panelRef = useRef<HTMLElement | null>(null);
  useSwipe(panelRef, {
    threshold: 90,
    maxDurationMs: 700,
    onSwipeRight: () => {
      if (!hasStarted || paused || game.won || game.lost) return;
      if (!isAbilityUnlocked("deshacer", round)) return;
      if (game.undoCount === 0 || game.undosLeft <= 0) return;
      hapticAsync("warning");
      game.undo();
    },
    onSwipeDown: () => {
      if (!hasStarted || game.won || game.lost) return;
      hapticAsync("select");
      requestPause();
    },
  });

  const prog = useMahjongProgression();
  const currentLevel = getLevel(game.difficulty);
  // Las habilidades se ganan avanzando de ronda, no están todas de entrada.
  const round = reachedRound(game.difficulty, prog.state.perLevel);
  const skill = useCallback(
    (id: AbilityId) => {
      const def = abilityDef(id);
      const unlocked = isAbilityUnlocked(id, round);
      return {
        unlocked,
        lockedBadge: unlocked ? undefined : `R${def.unlocksAt}`,
        lockedBadgeLabel: unlocked ? undefined : `se desbloquea en la ronda ${def.unlocksAt}`,
        lockedTitle: `${def.label} bloqueada — ${def.hint}`,
      };
    },
    [round],
  );
  const run = useMahjongRun();
  const [reliquiaOffer, setReliquiaOffer] = useState<ReliquiaDef[] | null>(null);
  const runStartAtRef = useRef<number | null>(null);
  const matchActive0 = hasStarted && !game.won && !game.lost;
  useEffect(() => {
    if (matchActive0 && runStartAtRef.current == null) {
      runStartAtRef.current = Date.now();
      setHintsUsedInRun(0);
      setHintsLeft(HINT_LIMIT);
      setReordersLeft(REORDER_LIMIT);
      setPrevSpecialTrios(0);
      setPrevScore(0);
    } else if (!matchActive0 && !game.won && !game.lost) {
      runStartAtRef.current = null;
    }
  }, [matchActive0, game.won, game.lost]);
  useMahjongSfx({
    tick: game.lastDeltaTick,
    delta: game.lastDelta,
    combo: game.combo,
    group: game.lastGroup,
  });
  const { tryStart, gateOpen, closeGate } = useTryStart();
  const mahjongEcon = useMemo(() => getTableEconomy("mahjong"), []);
  const spendFavor = useFavors((s) => s.spend);
  const startNewGame = () =>
    tryStart(() => {
      if (mahjongEcon.highStakesEntry > 0) {
        if (!spendFavor(mahjongEcon.highStakesEntry)) return;
      } else if (mahjongEcon.hostess) {
        markHighStakesWaiverUsed(mahjongEcon.hostess);
      }
      if (!useMahjongRun.getState().active) useMahjongRun.getState().startRun();
      game.newGame(useMahjongRun.getState().currentLevelId);
      setHasStarted(true);
    });

  const advanceRun = () =>
    tryStart(() => {
      if (mahjongEcon.highStakesEntry > 0) {
        if (!spendFavor(mahjongEcon.highStakesEntry)) return;
      } else if (mahjongEcon.hostess) {
        markHighStakesWaiverUsed(mahjongEcon.hostess);
      }
      const runApi = useMahjongRun.getState();
      game.newGame(runApi.active ? runApi.currentLevelId : nextLevelId(game.difficulty));
      setHasStarted(true);
    });

  const matchActive = hasStarted && !game.won && !game.lost;
  useLockGame(matchActive, hasStarted);
  useSurrender(
    matchActive
      ? () => {
          game.surrender();
          setHasStarted(false);
        }
      : null,
    "Rendirse",
  );

  const LINES = LIN_LINES;
  const hostessId: string = "lin";
  const match = useHostessMatch(hostessId);

  const startCurrentGame = () =>
    tryStart(() => {
      if (mahjongEcon.highStakesEntry > 0) {
        if (!spendFavor(mahjongEcon.highStakesEntry)) return;
      } else if (mahjongEcon.hostess) {
        markHighStakesWaiverUsed(mahjongEcon.hostess);
      }
      // Toda partida es una vigilia roguelike: si no hay run abierta se sortea
      // el recorrido de la noche y se reparte el tablero de su primer piso.
      const api = useMahjongRun.getState();
      if (!api.active) {
        api.startRun();
        game.newGame(useMahjongRun.getState().currentLevelId);
      }
      setHasStarted(true);
      match.begin();
    });

  const portraits = {
    idle: linIdleAsset,
    win: linWinAsset,
    lose: linLoseAsset,
    angry: linAngryAsset,
    flirty: linFlirtyAsset,
    tense: linTenseAsset,
  };

  const [line, setLine] = useState(LINES.idle[0]);
  useEffect(() => {
    setLine(pick(LINES.idle));
  }, [LINES]);
  const [prevTrios, setPrevTrios] = useState(0);
  const [prevSpecialTrios, setPrevSpecialTrios] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const [hintsUsedInRun, setHintsUsedInRun] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(HINT_LIMIT);
  const [reordersLeft, setReordersLeft] = useState(REORDER_LIMIT);
  const chips = useCasino((s) => s.chips);
  const canAffordReorder = chips >= REORDER_CHIP_COST;
  const handleReorder = () => {
    if (!hasStarted || game.won || game.lost) return;
    if (reordersLeft <= 0 || !canAffordReorder || !game.canReshuffle) return;
    useCasino.getState().addChips(-REORDER_CHIP_COST);
    setReordersLeft((n) => n - 1);
    hapticAsync("select");
    game.reshuffle();
  };
  const handleHint = () => {
    if (!hasStarted || game.won || game.lost || hintsLeft <= 0) return;
    game.showHint();
    setHintsUsedInRun((n) => n + 1);
    setHintsLeft((n) => n - 1);
  };
  const daily = useMahjongDaily();

  const trayDanger = game.tray.length >= game.traySize - 1;
  const fever = game.combo >= 5;
  const jadeImg = game.won
    ? portraits.win
    : game.lost
      ? portraits.lose
      : trayDanger
        ? portraits.angry
        : fever
          ? portraits.flirty
          : game.trios >= 3
            ? ("happy" in portraits && portraits.happy) || portraits.win
            : prevTrios > 0
              ? portraits.tense
              : game.combo > 0
                ? portraits.flirty
                : portraits.idle;
  const [levelSelectOpen, setLevelSelectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const settings = useMahjongSettings();

  // El consejo de la IA es O(n²) sobre el tablero: si se recalcula en el mismo
  // render del toque, la ficha tarda en levantarse. Lo diferimos para que el
  // toque pinte primero y la sugerencia llegue en el render siguiente.
  const deferredTiles = useDeferredValue(game.tiles);
  const deferredTray = useDeferredValue(game.tray);
  const aiExplain: MahjongAiExplanation | null = useMemo(() => {
    if (game.won || game.lost) return null;
    if (!settings.showAiExplain && !settings.showBestMoveGlow) return null;
    return mahjongAiSuggest({
      tiles: deferredTiles,
      tray: deferredTray,
      traySize: game.traySize,
      matchSize: game.matchSize,
    });
  }, [
    deferredTiles,
    deferredTray,
    game.traySize,
    game.matchSize,
    game.won,
    game.lost,
    settings.showAiExplain,
    settings.showBestMoveGlow,
  ]);
  const aiHintId = settings.showBestMoveGlow ? (aiExplain?.tileId ?? null) : null;

  const recordedRef = useRef<string | null>(null);
  const [reward, setReward] = useState<{
    stars: 0 | 1 | 2 | 3;
    xpGain: number;
    won: boolean;
  } | null>(null);

  useEffect(() => {
    if (game.trios > prevTrios) {
      setLine(pick(LINES.trio));
      playMahjongRow();
      daily.tick({ deltaTrios: game.trios - prevTrios });
    }
    setPrevTrios(game.trios);
  }, [game.trios, prevTrios, LINES]);

  useEffect(() => {
    if (game.specialTrios > prevSpecialTrios) {
      daily.tick({ deltaSpecialTrios: game.specialTrios - prevSpecialTrios });
    }
    setPrevSpecialTrios(game.specialTrios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.specialTrios]);

  useEffect(() => {
    if (game.score > prevScore) {
      daily.tick({ deltaScore: game.score - prevScore });
    }
    setPrevScore(game.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.score]);

  useEffect(() => {
    if (game.won) {
      setLine(pick(LINES.win));
      playMahjongWin();
    } else if (game.lost) {
      setLine(pick(LINES.lost));
      playMahjongLose();
    }
  }, [game.won, game.lost, LINES]);

  const idleTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!hasStarted || paused) return;
    if (game.won || game.lost) return;
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(
      () => {
        game.showHintFree();
      },
      Math.max(4, settings.autoHintSeconds) * 1000,
    );
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [
    hasStarted,
    paused,
    game.tray.length,
    game.score,
    game.won,
    game.lost,
    game.showHintFree,
    settings.autoHintSeconds,
  ]);

  useEffect(() => {
    if (!game.won && !game.lost) return;
    const sig = `${game.difficulty}:${game.won ? "w" : "l"}:${game.score}`;
    if (recordedRef.current === sig) return;
    recordedRef.current = sig;
    const startedAt = runStartAtRef.current;
    const elapsedSec = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;
    runStartAtRef.current = null;
    const r = prog.recordGame(game.difficulty, game.score, game.won, elapsedSec);

    if (game.won) {
      daily.tick({ won: true, winTimeSec: elapsedSec, hintsUsedInRun });
      const api = useMahjongRun.getState();
      if (api.active) {
        api.nextFloor();
        setReliquiaOffer(ofrecerReliquias(api.relics, api.floor + game.score));
      }
    } else if (useMahjongRun.getState().active) {
      useMahjongRun.getState().cobrarDerrota();
    }

    const penalizedStars = Math.max(0, r.stars - game.starPenalty) as 0 | 1 | 2 | 3;
    setReward({ ...r, stars: penalizedStars, won: game.won });

    match.event(game.won ? "lost" : "won", `mahjong:${game.difficulty}`);
    match.finish({
      hostessWon: !game.won,
      playerAggressionRate: Math.min(1, game.score / 200),
    });

    if (game.won && activeTourneyGame() === "mahjong") {
      void submitTourneyScore("mahjong", Math.max(0, Math.floor(game.score)));
    }

    reportSingleScore("mahjong", Math.max(0, Math.floor(game.score)));

    void import("@/store/league-progress").then(({ awardLeaguePoints }) => {
      const pts = game.won ? Math.max(50, Math.floor(game.score)) : Math.floor(game.score * 0.3);
      if (pts > 0) awardLeaguePoints("mahjong", pts);
    });
    void import("@/lib/narrative-hooks").then(({ recordGameOutcome }) => {
      recordGameOutcome({
        hostessId: "jade",
        delta: game.won ? 500 + Math.floor(game.score) : -300,
        clutch: game.won && game.tray.length >= 5,
      });
    });

    void import("@/lib/nemesis").then(({ reportGameOutcome, reportOutcomeMistakes }) => {
      reportOutcomeMistakes({
        game: "mahjong",
        won: game.won,
        score: game.score,
        trayRemaining: game.tray.length,
      });
      reportGameOutcome("mahjong", game.won ? "win" : "loss");
    });
  }, [game.won, game.lost, game.difficulty, game.score, prog]);

  useEffect(() => {
    if (!game.won && !game.lost) {
      recordedRef.current = null;
      setReward(null);
      match.begin();
    }
  }, [game.won, game.lost]); // eslint-disable-line react-hooks/exhaustive-deps

  const trayIds = useMemo(() => new Set(game.tray.map((t) => t.id)), [game.tray]);

  return (
    <>
      <DoorOpenReveal />
      <GameRoomShell
        bg={mahjongBg}
        title="Marfil Paciente"
        subtitle="mesa de Lin, pluma de tinta"
        npcId="lin"
        npcRoom="/mahjong"
      >
        <div className="mx-auto flex w-full max-w-[480px] justify-end px-2">
          <TourneyRoundBadge game="mahjong" />
        </div>

        <div className="cuervo-mobile-compact mx-auto flex w-full max-w-[480px] flex-col gap-2 px-2">
          {}
          <motion.section
            ref={panelRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="game-focus mobile-panel relative rounded-none border-0 border-[var(--brass)]/40 bg-[var(--noir)]/75 p-2 pt-3 shadow-deep backdrop-blur sm:rounded-sm sm:border sm:p-6 sm:pt-6"
          >
            {}
            <div className="flex flex-col gap-2 border-b border-[var(--brass)]/20 pb-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:pb-3">
              <div className="cd-scroll-x-fade flex min-w-0 items-center gap-3 overflow-x-auto pl-4 pr-5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-1 sm:flex-wrap sm:gap-x-5 sm:gap-y-2 sm:overflow-visible sm:pl-0 sm:pr-0">
                <div className="relative">
                  <Stat
                    label="Puntos"
                    shortLabel="PTS"
                    value={game.score}
                    accent
                    animateKey={game.score}
                  />
                  <ScorePop delta={game.lastDelta} tick={game.lastDeltaTick} />
                </div>
                <Stat label="Tríos" shortLabel="TRÍ" value={game.trios} animateKey={game.trios} />
                <Stat
                  label="Especiales"
                  shortLabel="ESP"
                  value={game.specialTrios}
                  animateKey={game.specialTrios}
                  glow
                />
                <Stat label="Restan" shortLabel="RES" value={`${game.remaining}/${game.total}`} />
                <ComboBadge combo={game.combo} best={game.comboBest} />
              </div>
              {!hasStarted && !game.won && !game.lost && (
                <div className="-mx-2 flex min-w-0 items-center gap-1.5 overflow-x-auto px-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:shrink-0 sm:overflow-visible sm:px-0 sm:gap-2">
                  <div className="hidden text-right leading-tight sm:block">
                    <div className="font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                      Mesa {currentLevel.order}
                    </div>
                    <div className="font-script text-base text-[var(--ivory)]">
                      {currentLevel.title}
                    </div>
                  </div>
                  {(() => {
                    const total = daily.objectives.length;
                    const done = daily.objectives.filter((o) => o.done).length;
                    const claimable = daily.objectives.some((o) => o.done && !o.claimed);
                    return (
                      <button
                        type="button"
                        onClick={() => setDailyOpen((v) => !v)}
                        aria-expanded={dailyOpen}
                        className={`cd-tap-safe relative rounded-sm border px-2 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] transition-colors sm:px-3 ${
                          dailyOpen
                            ? "border-[var(--brass-bright)] bg-[var(--mahogany)] text-[var(--ivory)]"
                            : "border-[var(--brass)]/60 bg-[var(--noir)] text-[var(--ivory)]/85 hover:bg-[var(--mahogany)]"
                        }`}
                        title={`Objetivos del día — ${done} de ${total}`}
                      >
                        <span aria-hidden className="sm:hidden font-display tracking-[0.15em]">
                          OBJ · {done}/{total}
                        </span>
                        <span className="hidden sm:inline">
                          Objetivos {done}/{total}
                        </span>
                        {claimable && (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0.18_75)] shadow-[0_0_6px_oklch(0.85_0.18_75)]" />
                        )}
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setLevelSelectOpen(true)}
                    className="cd-tap-safe rounded-sm border border-[var(--brass-bright)] bg-[var(--mahogany)] px-2 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--ivory)] hover:bg-[var(--blood)] sm:px-3"
                    title={`Mesa ${currentLevel.order} · ${currentLevel.title}`}
                  >
                    <span className="sm:hidden">M{currentLevel.order}</span>
                    <span className="hidden sm:inline">Salas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlbumOpen(true)}
                    className="cd-tap-safe rounded-sm border border-[var(--brass)]/60 bg-[var(--noir)] px-2 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--ivory)]/85 hover:bg-[var(--mahogany)] sm:px-3"
                    title="Álbum del Cuervo — personajes y reliquias coleccionados"
                  >
                    <span aria-hidden className="sm:hidden font-display tracking-[0.15em]">
                      LIB
                    </span>
                    <span className="hidden sm:inline">Álbum</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="cd-tap-safe rounded-sm border border-[var(--brass)]/60 bg-[var(--noir)] px-2 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--ivory)]/85 hover:bg-[var(--mahogany)] sm:px-3"
                    title="Ajustes del Dragón — consejo del Dragón, pista automática, glow"
                  >
                    <span aria-hidden className="sm:hidden font-display tracking-[0.15em]">
                      CFG
                    </span>
                    <span className="hidden sm:inline">Ajustes</span>
                  </button>
                </div>
              )}
            </div>
            <AnimatePresence initial={false}>
              {dailyOpen && (
                <motion.div
                  key="daily-inline"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2">
                    <MahjongDailyObjectives
                      objectives={daily.objectives}
                      onClaim={daily.claim}
                      compact
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-1 hidden text-center font-display text-[11px] uppercase tracking-[0.4em] text-[var(--smoke)] sm:block">
              {currentLevel.subtitle}
            </div>
            <div className="mt-1 hidden text-center font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90 sm:block">
              {formatEconomyLine(mahjongEcon, { showBaseAnte: false })}
            </div>
            <div className="mt-1 text-center font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass-bright)]/80">
              Caja: {chips.toLocaleString("es-AR")}¢
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-[var(--brass)]/90">
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <span className="inline-block h-2 w-2 rounded-full bg-[oklch(0.85_0.18_75)] shadow-[0_0_6px_oklch(0.85_0.18_75)]" />
                {game.matchSize === 4
                  ? "Cuatro iguales = cuarteto (kong). Especiales x2,2."
                  : game.matchSize === 3
                    ? "Tres iguales = trío (pung). Especiales x1,5."
                    : "Dos iguales = par. Especiales otorgan +60 pts."}
              </span>
              {game.sealedIds.size > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[oklch(0.78_0.14_70)]">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                  >
                    <rect x="5" y="10.5" width="14" height="10" rx="2" />
                    <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
                  </svg>{" "}
                  {game.sealedIds.size}{" "}
                  {game.sealedIds.size === 1 ? "ficha sellada" : "fichas selladas"} · cierra pares
                  para abrirlas
                </span>
              )}
              {game.timeLimit > 0 && (
                <span
                  className={`inline-flex items-center gap-1.5 tabular-nums ${game.secondsLeft <= 20 ? "text-[var(--blood)] animate-pulse" : "text-[var(--brass-bright)]/85"}`}
                >
                  <span aria-hidden className="font-display text-[11px] tracking-[0.2em]">
                    TMP
                  </span>{" "}
                  {Math.floor(game.secondsLeft / 60)}:
                  {String(game.secondsLeft % 60).padStart(2, "0")}
                </span>
              )}
              {trayDanger && !game.won && !game.lost && (
                <span className="inline-flex items-center gap-1.5 text-[var(--blood)] animate-pulse">
                  ⚠ Bandeja casi llena — {game.traySize - game.tray.length}{" "}
                  {game.traySize - game.tray.length === 1 ? "hueco" : "huecos"}: si se completa sin
                  cerrar un trío, perdés
                </span>
              )}
              {game.isDeadlocked && !game.won && !game.lost && (
                <span className="inline-flex items-center gap-1.5 text-[var(--blood)] animate-pulse">
                  ⚠ Sin jugadas — {game.canReshuffle ? "mezclá el tablero" : "no queda salida"}
                </span>
              )}
              {Number.isFinite(game.reshuffleLimit) && (
                <span className="inline-flex items-center gap-1.5 text-[var(--brass-bright)]/80">
                  Mezclas: {Math.max(0, game.reshuffleLimit - game.reshuffleCount)}/
                  {game.reshuffleLimit}
                </span>
              )}
            </div>

            {}
            {run.active && run.relics.length > 0 && (
              <div
                className="mt-2 flex flex-wrap items-center gap-1.5"
                aria-label="Reliquias de la vigilia"
              >
                <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--brass-bright)]/85">
                  Piso {run.floor} ·
                </span>
                {run.relics.map((r, i) => (
                  <span
                    key={`${r.id}-${i}`}
                    title={`${r.name} — ${r.description}`}
                    className="inline-flex items-center gap-1 rounded-sm border border-[var(--brass)]/45 bg-black/45 px-1.5 py-0.5 text-[11px] text-[var(--ivory)]/90"
                  >
                    <span className="text-[var(--brass-bright)]">{r.icon}</span>
                    {r.name}
                  </span>
                ))}
              </div>
            )}

            {}
            <ProgressBar
              cleared={game.total - game.remaining - game.tray.length}
              total={game.total}
            />

            {}
            <div className="relative mt-2 sm:mt-4">
              <PresagioBadge presagio={game.presagio} />
              <MahjongTray
                tray={game.tray}
                size={game.traySize}
                keyRemaining={game.keyRemaining}
                tileKey={game.tileKey}
                matchSize={game.matchSize}
              />
              <MatchSparkles tick={game.lastDeltaTick} delta={game.lastDelta} />
            </div>

            {settings.showAiExplain && !game.won && !game.lost && (
              <MahjongAiExplainPanel explain={aiExplain} />
            )}

            {}
            <div className="relative">
              <ResponsiveBoard>
                <MahjongBoardZoom>
                  {!tileSheetsReady ? (
                    <div className="grid min-h-[360px] place-items-center">
                      <ThematicSpinner variant="coin" label="Cargando fichas…" />
                    </div>
                  ) : (
                    <Suspense
                      fallback={
                        <div className="grid min-h-[360px] place-items-center">
                          <ThematicSpinner variant="coin" label="Preparando tablero…" />
                        </div>
                      }
                    >
                      <MahjongBoard
                        tiles={game.tiles}
                        freeIds={game.freeIds}
                        matchableIds={game.matchableIds}
                        hintId={game.hintId ?? aiHintId}
                        trayIds={trayIds}
                        shuffledIds={game.shuffledIds}
                        lockedShuffleIds={game.lockedShuffleIds}
                        rotLeft={game.rotLeft}
                        onTap={(id) => {
                          if (!hasStarted) return;
                          if (paused) return;
                          const ok = game.tap(id);
                          if (ok) {
                            hapticAsync("card");
                            playMahjongClick();
                          } else {
                            playMahjongError();
                          }
                        }}
                        shuffleNonce={game.shuffleNonce}
                        pairsClosed={game.trios}
                        synergyPulse={game.synergyPulse}
                        matchBurst={game.matchBurst}
                      />
                    </Suspense>
                  )}
                </MahjongBoardZoom>
                <FeverOverlay active={game.fever} intensity={game.combo} />
                <SpecialSynergyBadge flash={game.lastSpecial} />
                <AnimatePresence>
                  {hasStarted && game.isDeadlocked && !game.won && !game.lost && (
                    <motion.div
                      key="deadlock-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 z-30 grid place-items-center rounded-sm bg-[var(--noir)]/85 px-4 text-center backdrop-blur-sm"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        className="max-w-xs rounded-xl border border-[var(--blood)]/60 bg-[var(--noir)]/95 p-5 shadow-2xl"
                      >
                        <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--blood)]/90">
                          ─ sin jugadas ─
                        </div>
                        <h2 className="mt-2 font-script text-3xl text-[var(--brass-bright)]">
                          Tablero trabado
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-[var(--ivory)]/80">
                          {game.canReshuffle
                            ? "No hay pares posibles a la vista. Mezclá el tablero para reordenar las fichas."
                            : "No quedan pares posibles y no hay mezclas disponibles. La mano se cerró."}
                        </p>
                        {Number.isFinite(game.reshuffleLimit) && (
                          <div className="mt-2 text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                            Mezclas: {Math.max(0, game.reshuffleLimit - game.reshuffleCount)}/
                            {game.reshuffleLimit}
                          </div>
                        )}
                        <div className="mt-4 flex flex-col gap-2">
                          {game.canReshuffle && reordersLeft > 0 && canAffordReorder ? (
                            <BrassButton
                              variant="primary"
                              size="sm"
                              onClick={handleReorder}
                              data-haptic="select"
                            >
                              Reordenar mesa (−{REORDER_CHIP_COST}¢)
                            </BrassButton>
                          ) : (
                            <BrassButton
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                hapticAsync("warning");
                                game.surrender();
                                setHasStarted(false);
                              }}
                            >
                              Rendirse
                            </BrassButton>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ResponsiveBoard>
              {!hasStarted && !game.won && !game.lost && (
                <div className="relative z-20 mt-3 rounded-sm border border-[var(--brass)]/55 bg-[var(--noir)]/88 px-3 py-3 text-center shadow-deep sm:absolute sm:inset-0 sm:mt-0 sm:grid sm:place-items-center sm:border-0 sm:bg-[var(--noir)]/76 sm:px-4 sm:py-0">
                  <div className="mx-auto w-full min-w-0 max-w-xs">
                    <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/90">
                      ─ sala en espera ─
                    </div>
                    <h2 className="mt-2 break-words font-script text-2xl text-[var(--brass-bright)] sm:text-3xl">
                      La mesa te espera
                    </h2>
                    <p className="mt-1 hidden text-xs text-[var(--ivory)]/70 sm:block">
                      Podés revisar el tablero y cambiar sala. La mesa cobra recién cuando aceptás
                      jugar.
                    </p>
                    <BrassButton
                      onClick={startCurrentGame}
                      variant="primary"
                      size="sm"
                      className="mt-3 w-full sm:mt-4"
                    >
                      Empezar partida
                    </BrassButton>
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {(game.won || game.lost) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-end justify-center bg-[oklch(0_0_0/0.4)] p-3 sm:items-center"
                >
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 22 }}
                    className={`rounded-sm border bg-[var(--noir)] px-8 py-6 text-center shadow-deep ${
                      game.won ? "border-[var(--brass-bright)]" : "border-[var(--blood)]"
                    }`}
                  >
                    <div className="font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/80">
                      {game.won
                        ? "— La casa se va a dormir —"
                        : game.surrendered
                          ? "— La toalla cayó sobre la mesa —"
                          : "— La casa se queda la noche —"}
                    </div>
                    <h2
                      className={`mt-2 font-script text-4xl ${
                        game.won ? "text-[oklch(0.85_0.18_75)]" : "text-[var(--blood)]"
                      }`}
                    >
                      {game.won
                        ? "Limpiaste la mesa"
                        : game.surrendered
                          ? "Te retiraste"
                          : "Bandeja llena"}
                    </h2>
                    {reward && game.won && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {[1, 2, 3].map((i) => {
                          const on = i <= reward.stars;
                          return (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, rotate: -120, opacity: 0 }}
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              transition={{
                                delay: 0.15 * i,
                                type: "spring",
                                stiffness: 240,
                                damping: 14,
                              }}
                            >
                              <svg viewBox="0 0 24 24" className="h-9 w-9">
                                <path
                                  d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                                  fill={on ? "oklch(0.92 0.18 80)" : "oklch(0.25 0.02 60)"}
                                  stroke={on ? "oklch(0.78 0.16 70)" : "oklch(0.35 0.02 60)"}
                                  strokeWidth="1"
                                  style={{
                                    filter: on
                                      ? "drop-shadow(0 0 8px oklch(0.85 0.18 75))"
                                      : "none",
                                  }}
                                />
                              </svg>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-3 text-left">
                      <SummaryRow label="Puntos" value={game.score} />
                      <SummaryRow label="Tríos" value={game.trios} />
                      <SummaryRow label="Especiales" value={game.specialTrios} />
                      <SummaryRow label="XP ganada" value={`+${reward?.xpGain ?? 0}`} />
                    </div>
                    {(() => {
                      const p = prog.getProgress(game.difficulty);
                      const mm = Math.floor(p.bestTime / 60);
                      const ss = String(p.bestTime % 60).padStart(2, "0");
                      return (
                        <div className="mx-auto mt-3 max-w-xs rounded-sm border border-[var(--brass)]/25 bg-black/30 px-3 py-2">
                          <div className="mb-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
                            Récords · Mesa {currentLevel.order}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-left">
                            <SummaryRow label="Mejor puntaje" value={p.bestScore || "—"} />
                            <SummaryRow
                              label="Mejor tiempo"
                              value={p.bestTime > 0 ? `${mm}:${ss}` : "—"}
                            />
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mx-auto mt-3 max-w-xs">
                      <MahjongDailyObjectives
                        objectives={daily.objectives}
                        onClaim={daily.claim}
                        compact
                      />
                    </div>
                    {(game.undoUses > 0 || game.deadlockShuffles > 0 || game.starPenalty > 0) && (
                      <div className="mx-auto mt-3 max-w-xs rounded-sm border border-[var(--blood)]/60 bg-[oklch(0.15_0.05_25)] px-3 py-2 text-left">
                        <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--blood)]/90">
                          Penalidades de la casa
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-[var(--ivory)]/80">
                          {game.undoUses > 0 && (
                            <div>Deshacer × {game.undoUses} · rebobinado castigado</div>
                          )}
                          {game.deadlockShuffles > 0 && (
                            <div>
                              Mezclas por deadlock × {game.deadlockShuffles} · costo creciente
                            </div>
                          )}
                          {game.starPenalty > 0 && (
                            <div className="text-[var(--blood)]">
                              −{game.starPenalty} estrella{game.starPenalty === 1 ? "" : "s"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      {game.lost && !game.extraSlotUsed && (
                        <BrassButton
                          variant="primary"
                          size="md"
                          onClick={() => game.extraSlot()}
                          title="Amplía la bandeja en +2 huecos y seguís jugando"
                        >
                          Salvarme con espacio extra
                        </BrassButton>
                      )}
                      {game.won ? (
                        <BrassButton
                          variant="blood"
                          size="md"
                          onClick={() => advanceRun()}
                          title="La vigilia no termina: subís a la ronda siguiente"
                        >
                          Siguiente ronda →
                        </BrassButton>
                      ) : (
                        <BrassButton variant="blood" size="md" onClick={() => startNewGame()}>
                          Otra ronda
                        </BrassButton>
                      )}
                      <BrassButton
                        variant="ghost"
                        size="md"
                        onClick={() => setLevelSelectOpen(true)}
                      >
                        Cambiar mesa
                      </BrassButton>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {}
            <div
              role="group"
              aria-label="Habilidades especiales"
              className="cd-scroll-x-fade mt-3 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overflow-y-visible overscroll-x-contain scroll-smooth pt-4 pb-2 [-webkit-overflow-scrolling:touch] [scroll-padding-inline:20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:snap-start sm:mt-4 sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible sm:[&>*]:snap-none"
              style={{
                paddingLeft: "max(var(--sa-left), 4px)",
                paddingRight: "max(var(--sa-right), 4px)",
              }}
            >
              <ActionBtn
                onClick={handleReorder}
                badge={`${reordersLeft}/${REORDER_LIMIT}`}
                badgeLabel={`quedan ${reordersLeft} reordenes · cuesta ${REORDER_CHIP_COST}¢`}
                disabled={
                  !hasStarted ||
                  game.won ||
                  game.lost ||
                  !game.canReshuffle ||
                  reordersLeft <= 0 ||
                  !canAffordReorder
                }
                label="Reordenar"
                title={
                  canAffordReorder
                    ? `Reordena las fichas del tablero (-${REORDER_CHIP_COST}¢) · quedan ${reordersLeft} de ${REORDER_LIMIT}`
                    : `No te alcanzan las fichas (${REORDER_CHIP_COST}¢) para reordenar`
                }
              >
                <ShuffleIcon />
              </ActionBtn>
              <ActionBtn
                onClick={handleHint}
                badge={`${hintsLeft}/${HINT_LIMIT}`}
                badgeLabel={`quedan ${hintsLeft} pistas · -2 pts c/u`}
                disabled={!hasStarted || game.won || game.lost || hintsLeft <= 0}
                label="Pista"
                title={
                  hintsLeft > 0
                    ? `Resalta una jugada (-2 pts) · quedan ${hintsLeft} de ${HINT_LIMIT}`
                    : "Sin pistas disponibles en esta mesa"
                }
              >
                <BulbIcon />
              </ActionBtn>
              <ActionBtn
                mobileHidden={!actionsExpanded}
                onClick={() => game.magnet()}
                badge={skill("iman").lockedBadge ?? (game.magnetUses > 0 ? "1" : undefined)}
                badgeLabel={skill("iman").lockedBadgeLabel ?? "1 uso disponible"}
                disabled={!hasStarted || game.won || game.lost || game.magnetUses <= 0}
                locked={!skill("iman").unlocked}
                label="Imán"
                title={
                  skill("iman").unlocked
                    ? "Elimina automáticamente un par de fichas libres (1 uso)"
                    : skill("iman").lockedTitle
                }
              >
                <MagnetIcon />
              </ActionBtn>
              <ActionBtn
                mobileHidden={!actionsExpanded}
                onClick={() => game.extraSlot()}
                badge={skill("espacio").lockedBadge ?? (game.extraSlotUsed ? undefined : "+2")}
                badgeLabel={skill("espacio").lockedBadgeLabel ?? "suma 2 huecos a la bandeja"}
                disabled={!hasStarted || game.won || game.lost || game.extraSlotUsed}
                locked={!skill("espacio").unlocked}
                label="Espacio"
                title={
                  skill("espacio").unlocked
                    ? "Amplía la bandeja en +2 huecos por el resto de la partida (1 uso)"
                    : skill("espacio").lockedTitle
                }
              >
                <PlusSlotIcon />
              </ActionBtn>
              <ActionBtn
                mobileHidden={!actionsExpanded}
                onClick={() => game.returnTray3()}
                badge={skill("devolver").lockedBadge ?? "-8"}
                badgeLabel={skill("devolver").lockedBadgeLabel ?? "cuesta 8 puntos"}
                disabled={!hasStarted || game.won || game.lost || game.tray.length === 0}
                locked={!skill("devolver").unlocked}
                label="Devolver"
                title={
                  skill("devolver").unlocked
                    ? "Saca las últimas 3 fichas de la bandeja (-8 pts)"
                    : skill("devolver").lockedTitle
                }
              >
                <BackIcon />
              </ActionBtn>
              <ActionBtn
                onClick={handleUndo}
                badge={skill("deshacer").lockedBadge ?? `${game.undosLeft}/${game.undoLimit}`}
                badgeLabel={
                  skill("deshacer").lockedBadgeLabel ??
                  `quedan ${game.undosLeft} de ${game.undoLimit} usos`
                }
                disabled={!hasStarted || game.undoCount === 0 || game.undosLeft <= 0}
                locked={!skill("deshacer").unlocked}
                label="Deshacer"
                title={
                  skill("deshacer").unlocked
                    ? `Devuelve la última ficha — ${game.undosLeft} usos restantes`
                    : skill("deshacer").lockedTitle
                }
              >
                <UndoIcon />
              </ActionBtn>

              <button
                type="button"
                onClick={() => {
                  hapticAsync("select");
                  setActionsExpanded((v) => !v);
                }}
                aria-expanded={actionsExpanded}
                aria-label={actionsExpanded ? "Ver menos acciones" : "Ver más acciones"}
                className="cd-tap-safe relative flex min-h-[54px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-sm border border-[var(--brass)]/60 bg-[var(--noir-soft)] px-2.5 py-2 font-display text-[11px] uppercase leading-none tracking-[0.14em] text-[var(--brass-bright)] transition-colors [touch-action:manipulation] hover:bg-[var(--mahogany)] active:scale-[0.97] sm:hidden"
                title="Más acciones"
              >
                <div className="grid h-[20px] w-[20px] place-items-center text-lg leading-none">
                  {actionsExpanded ? "×" : "⋯"}
                </div>
                <span>{actionsExpanded ? "Menos" : "Más"}</span>
              </button>
              <ActionBtn
                mobileHidden={!actionsExpanded}
                disabled={!hasStarted}
                onClick={() => startNewGame()}
                label="Nueva"
                title="Reparte de cero"
              >
                <RefreshIcon />
              </ActionBtn>
            </div>
          </motion.section>
        </div>
      </GameRoomShell>
      {hasStarted &&
        !paused &&
        !game.won &&
        !game.lost &&
        isAbilityUnlocked("deshacer", round) &&
        game.undoCount > 0 &&
        game.undosLeft > 0 && (
          <button
            type="button"
            onClick={handleUndo}
            aria-label={`Deshacer última ficha, quedan ${game.undosLeft} usos`}
            title={`Deshacer última ficha — ${game.undosLeft}/${game.undoLimit}`}
            className="fixed z-[210] grid place-items-center rounded-full border-2 border-[var(--brass)]/75 bg-[var(--noir)]/95 text-[var(--brass-bright)] shadow-[0_6px_18px_rgba(0,0,0,0.65)] backdrop-blur active:scale-95"
            style={{
              bottom: "calc(var(--sa-bottom) + 16px)",
              left: "calc(var(--sa-left) + 12px)",
              width: "calc(52px * var(--hud-scale, 1))",
              height: "calc(52px * var(--hud-scale, 1))",
              touchAction: "manipulation",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 22, height: 22 }}
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3L3 13" />
            </svg>
            <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[var(--blood)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--ivory)] shadow-md">
              {game.undosLeft}
            </span>
          </button>
        )}
      <LevelSelect
        open={levelSelectOpen}
        currentLevelId={game.difficulty}
        onClose={() => setLevelSelectOpen(false)}
        onPick={(id) => {
          game.setDifficulty(id);
          setHasStarted(false);
        }}
      />
      <MahjongSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AlbumPanel open={albumOpen} onClose={() => setAlbumOpen(false)} />
      <NoLivesGate
        open={gateOpen}
        onClose={closeGate}
        line={'"Sin vidas no se reparten fichas, querida. El salón también respira."'}
      />
      {reliquiaOffer && (
        <ReliquiaOfferModal
          piso={run.floor}
          opciones={reliquiaOffer}
          onElegir={(r) => {
            run.addRelic(r);
            setReliquiaOffer(null);
          }}
          onSaltar={() => setReliquiaOffer(null)}
        />
      )}
    </>
  );
}
