import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { FitBoardArea } from "@/components/casino/FitBoardArea";
import { TourneyRoundBadge } from "@/components/casino/TourneyRoundBadge";
import { useSurrender } from "@/components/casino/SurrenderButton";
import { LolaPortrait, type LolaMood, type LolaPose } from "@/components/casino/LolaPortrait";

import { NpcPortraitCard } from "@/components/casino/NpcPortraitCard";
import { getCurrentHostess } from "@/lib/hostess-rotation";
import shaunaPortraitAsset from "@/assets/shauna-portrait.webp";
import shaunaFlirtyAsset from "@/assets/shauna-portrait.webp";
import shaunaWinAsset from "@/assets/shauna-portrait.webp";
import shaunaLoseAsset from "@/assets/shauna-portrait.webp";
import shaunaTenseAsset from "@/assets/shauna-portrait.webp";
import shaunaAngryAsset from "@/assets/shauna-portrait.webp";
import { useLockGame } from "@/store/gameLock";

import zoneBg from "@/assets/zone-bagatelle-v6.webp";
import cardClover from "@/assets/bagatelle-card-clover.webp";
import cardCoin from "@/assets/bagatelle-card-coin.webp";
import cardCurse from "@/assets/bagatelle-card-curse.webp";
import cardHeart from "@/assets/bagatelle-card-heart.webp";
import cardSkull from "@/assets/bagatelle-card-skull.webp";
import cardStar from "@/assets/bagatelle-card-star.webp";
import pinballBumperCuervo from "@/assets/pinball-bumper-cuervo.webp";
import pinballFlipper from "@/assets/pinball-flipper.webp";
import pinballBall from "@/assets/pinball-ball.webp";

import pinballBackglass from "@/assets/pinball-backglass.webp";

import pinballPlayfieldPainted from "@/assets/pinball-playfield-painted.webp";
import { useCasino } from "@/store/casino";
import { lazyNamed } from "@/lib/lazy";
const BagatelleVictoryScreen = lazyNamed(
  () => import("@/components/casino/bagatelle/BagatelleVictoryScreen"),
  "BagatelleVictoryScreen",
);
import { useBagatelleRun } from "@/store/games/bagatelle/bagatelle-run";

import { trackBagatelleLaunch } from "@/lib/games/bagatelle/bagatelle-tracker";
import {
  BANK_MODE_DURATION_MS,
  getNextRank,
  getRankForMissions,
  loadMissionsCount,
  rollBankMode,
  saveMissionsCount,
  type BankMode,
} from "@/lib/games/bagatelle/bagatelle-ranks";
import { bagatelleAudio } from "@/lib/games/bagatelle/bagatelle-audio";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { submitRun } from "@/lib/pinball.functions";
import { isOfflineDemo } from "@/lib/offline-demo";
import { submitTourneyScore, activeTourneyGame } from "@/lib/daily-tournament";
import { submitScore } from "@/lib/leaderboard";
import { reportSingleScore } from "@/store/single-scores";
import { dailySeed } from "@/lib/seededRng";
import { BrassButton } from "@/components/casino/BrassButton";
import { randomSeed } from "@/lib/rng";
import { PinballLeaderboard } from "@/components/casino/PinballLeaderboard";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";
import { useHaptics } from "@/hooks/use-haptics";
import {
  loadMeterSettings,
  saveMeterSettings,
  sensitivityToSweepSpeed,
  METER_EVENT,
  type BagatelleMeterSettings,
} from "@/lib/games/bagatelle/bagatelle-settings";
import {
  computeWager,
  wagerBeaten,
  bankMultiplier,
  computeCashout,
  bankContribution,
  bankAfterCurse,
} from "@/lib/games/bagatelle/bagatelle-wager";
import {
  reportBall as reportAchievementBall,
  checkLossComeback,
  loadStats as loadBagStats,
} from "@/lib/games/bagatelle/bagatelle-achievements";
import { reportDailyBall, getDailyChallenge } from "@/lib/games/bagatelle/bagatelle-daily";
import {
  playBagatelleLaunch,
  resetBagatelleLaunchSfx,
} from "@/lib/games/bagatelle/bagatelle-ball-sfx";
import { useSettings } from "@/store/settings";
import {
  BagatelleAchievementToast,
  BagatelleAchievementsPanel,
} from "@/components/casino/bagatelle/BagatelleAchievements";

export const Route = createFileRoute("/bagatelle")({
  ssr: false,
  component: PinballPage,
  head: () => ({
    meta: [
      { title: "Clavo y Suerte — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Tablero de clavos clásico del Cuervo Dorado: clavos, bumpers, slingshots, drop-targets y trece ranuras malditas.",
      },
      { property: "og:title", content: "El Tablero de Clavos — El Cuervo Dorado" },
      {
        property: "og:description",
        content: "Trece ranuras, multiplicadores malditos y la palanca de Lola «La Suerte» Vargas.",
      },
      { property: "og:image", content: zoneBg },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: zoneBg },
      { property: "og:url", content: "/bagatelle" },
    ],
    links: [{ rel: "canonical", href: "/bagatelle" }],
  }),
});

import {
  W,
  H,
  PLAYFIELD_BOTTOM,
  SLOT_LEFT,
  SLOT_RIGHT,
  BALL_R,
  FLIPPER_LEN,
  FLIPPER_HALF_THICK,
  FLIPPER_REST,
  FLIPPER_UP,
  FLIPPER_SPEED,
  FIXED_DT,
  PIVOT_L,
  PIVOT_R,
  LEVELS,
  LEVEL_KEY,
  LEVEL_PROG_KEY,
  LEVEL_ADVANCE,
  getLevelMeta,
  OBSTACLES,
  WALLS,
  DROP_TARGETS,
  MAGNET,
  MAGNET_TIME,
  closestOnSeg,
  type LevelMeta,
  type BossId,
  type Seg,
  type Obstacle,
  type DropTarget,
  type WallKind,
  type ObstacleKind,
} from "@/lib/games/bagatelle/engine";
import { useBagatelleLoop } from "@/lib/games/bagatelle/use-bagatelle-loop";
import {
  applyGravityAndDrag,
  applyMagnetForce,
  applyShooterLane,
  clampSpeed,
  collideFlipper,
  decayNumericMap,
  stepFlipperAngle,
  stepSparks,
  stepTrail,
} from "@/lib/games/bagatelle/physics";
import {
  SLOTS,
  MULTIPLIERS,
  STAKES,
  SLOT_LABELS,
  JACKPOT_SLOT,
  SLOT_WEIGHTS,
  SLOT_WEIGHT_TOTAL,
  SLOT_PROBS,
  CARGA_MAX,
  CARGA_INDULTO,
  CARGA_BENDICION,
  CARGA_PLUMAS,
  MULTIBALL_DURATION_MS,
  MODS,
  MISSIONS,
  rollMod,
  rollMission,
  effectiveMult,
  resolvePayout,
  reactionFor,
  phaseBadge,
  shortModName,
  slotTone,
  GREETING,
  PLAYING,
  ZONES,
  ZONE_LABELS,
  ZONE_RANGES,
  applyZoneMult,
  type ModId,
  type Mod,
  type MissionKind,
  type Zone,
  type Mission,
  type Outcome,
} from "@/lib/games/bagatelle/scoring";
import { BagatelleSfxVolumeSlider } from "@/components/casino/bagatelle/BagatelleSfxVolumeSlider";

const SLOT_CARDS = [
  cardSkull,
  cardCurse,
  cardHeart,
  cardClover,
  cardCoin,
  cardHeart,
  cardCoin,
  cardStar,
  cardCoin,
  cardHeart,
  cardCoin,
  cardCurse,
  cardSkull,
];

function PinballPage() {
  useSingleHostessCorner("bagatelle");
  const runActive = useBagatelleRun((s) => s.activeLevel);

  const chips = useCasino((s) => s.chips);
  const spend = useCasino((s) => s.spend);
  const addChips = useCasino((s) => s.addChips);
  const registerWin = useCasino((s) => s.registerWin);
  const registerLoss = useCasino((s) => s.registerLoss);
  const hostess = getCurrentHostess("bagatelle") ?? "lola";
  const isShauna = hostess === "shauna";
  const hostShort = isShauna ? "Shauna" : "Lola";
  const hostFull = isShauna ? "Shauna «La Aprendiz»" : "Lola «La Suerte» Vargas";

  const [stake, setStake] = useState<number>(25);
  const [zone, setZone] = useState<Zone>("centro");
  const [resultZoneHit, setResultZoneHit] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<"idle" | "playing" | "result">("idle");
  useLockGame(phase === "playing");

  const [mod, setMod] = useState<Mod>(() => rollMod());
  const [mission, setMission] = useState<Mission>(() => rollMission(25));
  const [missionProgress, setMissionProgress] = useState(0);
  const [missionDone, setMissionDone] = useState(false);
  const [freeBall, setFreeBall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [dustSlot, setDustSlot] = useState<number>(0);
  const [resultSlot, setResultSlot] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [reaction, setReaction] = useState<{ pose: LolaPose; mood: LolaMood; line: string }>(
    GREETING,
  );
  const [history, setHistory] = useState<
    { slot: number; win: number; stake: number; mod: ModId }[]
  >([]);
  const [jackpotFlash, setJackpotFlash] = useState<number | null>(null);
  const [bumperBonus, setBumperBonus] = useState<{
    id: number;
    amount: number;
    x: number;
    y: number;
  } | null>(null);
  const [resultTrail, setResultTrail] = useState<{ x: number; y: number }[] | null>(null);
  const [resultOutcome, setResultOutcome] = useState<Outcome | null>(null);

  const ballRef = useRef({ x: 89, y: 141, vx: 0, vy: 0, live: false });
  const stakeRef = useRef(stake);
  const zoneRef = useRef(zone);
  const modRef = useRef(mod);
  const dustSlotRef = useRef(dustSlot);
  const leftFlipperRef = useRef({ active: false, angle: FLIPPER_REST });
  const rightFlipperRef = useRef({ active: false, angle: FLIPPER_REST });
  const flashRef = useRef<Record<number, number>>({});
  const hitCooldownRef = useRef<Record<number, number>>({});
  const lossStreakRef = useRef(0);
  const accumBonusRef = useRef(0);
  const resetTimerRef = useRef<number | null>(null);
  const trailRef = useRef<{ x: number; y: number; life: number }[]>([]);
  const sparksRef = useRef<
    { x: number; y: number; vx: number; vy: number; life: number; max: number; gold: boolean }[]
  >([]);
  const meterActiveRef = useRef(false);
  const meterPosRef = useRef({ pos: 0, dir: 1 });

  const [meterSettings, setMeterSettings] = useState<BagatelleMeterSettings>(() =>
    loadMeterSettings(),
  );
  const meterSpeedRef = useRef<number>(sensitivityToSweepSpeed(meterSettings.sensitivity));
  useEffect(() => {
    meterSpeedRef.current = sensitivityToSweepSpeed(meterSettings.sensitivity);
  }, [meterSettings.sensitivity]);
  useEffect(() => {
    return () => {
      try {
        bagatelleAudio.close();
      } catch {
        /* noop */
      }
    };
  }, []);
  useEffect(() => {
    const on = (ev: Event) => {
      const detail = (ev as CustomEvent<BagatelleMeterSettings>).detail;
      if (detail) setMeterSettings(detail);
      else setMeterSettings(loadMeterSettings());
    };
    window.addEventListener(METER_EVENT, on);
    return () => window.removeEventListener(METER_EVENT, on);
  }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const haptic = useHaptics();
  const doHaptic = useCallback(
    (kind: Parameters<typeof haptic>[0]) => {
      if (meterSettings.hapticsEnabled) haptic(kind);
    },
    [haptic, meterSettings.hapticsEnabled],
  );

  const [liveForce, setLiveForce] = useState<number>(0);
  const comboRef = useRef({ count: 0, timer: 0 });
  const [comboDisplay, setComboDisplay] = useState<{
    count: number;
    mult: number;
    key: number;
  } | null>(null);
  const cargaRef = useRef(0);
  const [carga, setCarga] = useState(0);
  const litSlotRef = useRef<number | null>(null);
  const [litSlot, setLitSlot] = useState<number | null>(null);
  const litTimerRef = useRef(0);
  const [litTimer, setLitTimer] = useState(0);
  const [meterArmed, setMeterArmed] = useState(false);
  useEffect(() => {
    if (!meterArmed) return;
    let raf = 0;
    const tick = () => {
      const pos = meterPosRef.current.pos;
      const dist = Math.abs(pos - 0.5);

      const pct = dist <= 0.1 ? 100 : dist <= 0.25 ? 85 : 72;
      setLiveForce(pct);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [meterArmed]);
  const [, forceFrame] = useState(0);
  const missionRef = useRef(mission);
  const missionProgressRef = useRef(0);
  const missionDoneRef = useRef(false);
  const meterTickRef = useRef(0);

  const leftHoldTimer = useRef<number | null>(null);
  const rightHoldTimer = useRef<number | null>(null);

  const nudgeCooldownRef = useRef(0);
  const nudgeHistoryRef = useRef<number[]>([]);
  const tiltUntilRef = useRef(0);
  const [tiltActive, setTiltActive] = useState(false);
  const [nudgeFlash, setNudgeFlash] = useState<{ id: number; dir: -1 | 1 } | null>(null);

  const ballSaveUntilRef = useRef<number>(0);
  const [ballSaveActive, setBallSaveActive] = useState(false);
  const [ballSavedFlash, setBallSavedFlash] = useState<number | null>(null);

  const cuervoIndexRef = useRef(0);
  const [cuervoIndex, setCuervoIndex] = useState(0);
  const cuervoBonusRef = useRef(false);
  const [cuervoBonus, setCuervoBonus] = useState(false);

  const ball2Ref = useRef({ x: 50, y: 66, vx: 0, vy: 0, live: false });
  const multiballUntilRef = useRef(0);
  const [multiballActive, setMultiballActive] = useState(false);
  const multiballActiveRef = useRef(false);
  multiballActiveRef.current = multiballActive;
  const [multiballRemaining, setMultiballRemaining] = useState(0);
  const [multiballFlash, setMultiballFlash] = useState<number | null>(null);
  useEffect(() => {
    if (!multiballFlash) return undefined;
    const t = window.setTimeout(() => setMultiballFlash(null), 1800);
    return () => window.clearTimeout(t);
  }, [multiballFlash]);
  useEffect(() => {
    if (!multiballActive) return undefined;
    let raf = 0;
    const tick = () => {
      const remain = Math.max(0, multiballUntilRef.current - performance.now());
      setMultiballRemaining(remain);
      if (remain <= 0 && !ball2Ref.current.live) {
        setMultiballActive(false);
        multiballActiveRef.current = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [multiballActive]);

  const skillShotUntilRef = useRef<number>(0);
  const skillShotArmedRef = useRef(false);
  const [skillShotFlash, setSkillShotFlash] = useState<number | null>(null);

  const dropDownRef = useRef<boolean[]>(DROP_TARGETS.map(() => false));
  const dropFlashRef = useRef<number[]>(DROP_TARGETS.map(() => 0));
  const dropBanksRef = useRef(0);
  const [dropDown, setDropDown] = useState<boolean[]>(DROP_TARGETS.map(() => false));
  const [dropBanks, setDropBanks] = useState(0);
  const [dropRewardFlash, setDropRewardFlash] = useState<{ amount: number; key: number } | null>(
    null,
  );

  const magnetUntilRef = useRef(0);
  const [magnetActive, setMagnetActive] = useState(false);

  const [missionsTotal, setMissionsTotal] = useState<number>(() => loadMissionsCount());
  const missionsTotalRef = useRef(missionsTotal);
  missionsTotalRef.current = missionsTotal;
  const rank = getRankForMissions(missionsTotal);
  const nextRank = getNextRank(missionsTotal);
  const [rankUpFlash, setRankUpFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!rankUpFlash) return undefined;
    const t = window.setTimeout(() => setRankUpFlash(null), 2400);
    return () => window.clearTimeout(t);
  }, [rankUpFlash]);

  const cuervoHitsBallRef = useRef(0);
  const kickbackUsedBallRef = useRef(false);
  const [kickbackHits, setKickbackHits] = useState(0);
  const [kickbackFlash, setKickbackFlash] = useState<number | null>(null);
  useEffect(() => {
    if (!kickbackFlash) return undefined;
    const t = window.setTimeout(() => setKickbackFlash(null), 1400);
    return () => window.clearTimeout(t);
  }, [kickbackFlash]);

  const [bankMode, setBankMode] = useState<BankMode | null>(null);
  const bankModeRef = useRef<BankMode | null>(null);
  bankModeRef.current = bankMode;
  const bankModeUntilRef = useRef(0);
  const [bankModeRemaining, setBankModeRemaining] = useState(0);
  useEffect(() => {
    if (!bankMode) return undefined;
    let raf = 0;
    const tick = () => {
      const remain = Math.max(0, bankModeUntilRef.current - performance.now());
      setBankModeRemaining(remain);
      if (remain <= 0) {
        setBankMode(null);
        bankModeRef.current = null;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bankMode]);

  const wormReadyRef = useRef(false);
  const [wormReady, setWormReady] = useState(false);
  const [wormFlash, setWormFlash] = useState<number | null>(null);
  useEffect(() => {
    if (!wormFlash) return undefined;
    const t = window.setTimeout(() => setWormFlash(null), 1600);
    return () => window.clearTimeout(t);
  }, [wormFlash]);

  const HS_KEY = "bagatelle:hs:v1";
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(HS_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  });
  const [showAchievementsPanel, setShowAchievementsPanel] = useState(false);

  const [level, setLevel] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const raw = window.localStorage.getItem(LEVEL_KEY);
    const n = raw ? parseInt(raw, 10) : 1;

    return Math.max(1, Number.isFinite(n) ? n : 1);
  });
  const [levelProgress, setLevelProgress] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(LEVEL_PROG_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Math.max(0, Math.min(LEVEL_ADVANCE, Number.isFinite(n) ? n : 0));
  });
  const [levelUpFlash, setLevelUpFlash] = useState<number | null>(null);
  const levelRef = useRef(level);
  levelRef.current = level;
  const levelMeta = getLevelMeta(level);

  const [wager, setWager] = useState<number>(0);
  const wagerRef = useRef(0);
  wagerRef.current = wager;
  const [wagerHit, setWagerHit] = useState<null | boolean>(null);

  const [bank, setBank] = useState<number>(0);
  const bankRef = useRef(0);
  bankRef.current = bank;
  const [bankStreak, setBankStreak] = useState<number>(0);
  const bankStreakRef = useRef(0);
  bankStreakRef.current = bankStreak;
  const cashoutBank = useCallback(() => {
    const b = bankRef.current;
    const s = bankStreakRef.current;
    if (b <= 0) return;
    const raw = computeCashout(b, s);

    const rankMul = getRankForMissions(missionsTotalRef.current).perks.cashoutMul;
    const payout = Math.round(raw * rankMul);
    addChips(payout);
    bagatelleAudio.win();
    doHaptic("heavy");
    bankRef.current = 0;
    bankStreakRef.current = 0;
    setBank(0);
    setBankStreak(0);
  }, [addChips, doHaptic]);

  const handleSurrender = useCallback(() => {
    if (phase !== "playing") return;
    ballRef.current.live = false;
    ballRef.current.vx = 0;
    ballRef.current.vy = 0;
    ball2Ref.current.live = false;
    ball2Ref.current.vx = 0;
    ball2Ref.current.vy = 0;
    meterActiveRef.current = false;
    leftFlipperRef.current.active = false;
    rightFlipperRef.current.active = false;
    if (leftHoldTimer.current) window.clearTimeout(leftHoldTimer.current);
    if (rightHoldTimer.current) window.clearTimeout(rightHoldTimer.current);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetBagatelleLaunchSfx();
    registerLoss();
    lossStreakRef.current += 1;
    setMeterArmed(false);
    setLiveForce(0);
    setMultiballActive(false);
    multiballActiveRef.current = false;
    setBallSaveActive(false);
    setTiltActive(false);
    setResultSlot(null);
    setResultTrail(null);
    setResultOutcome("miss");
    setLastWin(0);
    setJackpotFlash(null);
    setBumperBonus(null);
    setComboDisplay(null);
    setReaction({
      pose: "front",
      mood: "enfadada",
      line: `«Tiraste la toalla. ${hostShort} anota la mesa como abandono.»`,
    });
    setPhase("result");
    resetTimerRef.current = window.setTimeout(() => {
      setPhase("idle");
      setResultOutcome(null);
      setLastWin(null);
      setReaction(GREETING);
    }, 1800);
    void import("@/lib/nemesis").then(({ reportGameOutcome }) =>
      reportGameOutcome("bagatelle", "loss"),
    );
  }, [hostShort, phase, registerLoss]);

  useSurrender(phase === "playing" ? handleSurrender : null, "Rendirse");

  useEffect(() => {
    if (!levelUpFlash) return undefined;
    const t = window.setTimeout(() => setLevelUpFlash(null), 2000);
    return () => window.clearTimeout(t);
  }, [levelUpFlash]);

  const { user } = useAuth();
  const submitRunFn = useServerFn(submitRun);
  const ballStartRef = useRef<number>(0);

  stakeRef.current = stake;
  zoneRef.current = zone;
  modRef.current = mod;
  dustSlotRef.current = dustSlot;
  missionRef.current = mission;
  missionProgressRef.current = missionProgress;
  missionDoneRef.current = missionDone;

  useBagatelleLoop({
    step: (dt) => step(dt),
    onFrame: () => forceFrame((n) => (n + 1) & 2047),
  });

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!bumperBonus) return undefined;
    const timeout = window.setTimeout(() => setBumperBonus(null), 650);
    return () => window.clearTimeout(timeout);
  }, [bumperBonus]);

  useEffect(() => {
    if (!comboDisplay) return undefined;
    const timeout = window.setTimeout(() => setComboDisplay(null), 900);
    return () => window.clearTimeout(timeout);
  }, [comboDisplay]);

  useEffect(() => {
    if (!ballSavedFlash) return undefined;
    const t = window.setTimeout(() => setBallSavedFlash(null), 1400);
    return () => window.clearTimeout(t);
  }, [ballSavedFlash]);

  useEffect(() => {
    if (!dropRewardFlash) return undefined;
    const t = window.setTimeout(() => setDropRewardFlash(null), 1700);
    return () => window.clearTimeout(t);
  }, [dropRewardFlash]);

  useEffect(() => {
    if (skillShotFlash === null) return undefined;
    const t = window.setTimeout(() => setSkillShotFlash(null), 1600);
    return () => window.clearTimeout(t);
  }, [skillShotFlash]);

  const pressLeft = useCallback(() => {
    if (leftFlipperRef.current.active) return;
    leftFlipperRef.current.active = true;
    bagatelleAudio.flipper();
    if (leftHoldTimer.current) window.clearTimeout(leftHoldTimer.current);
    leftHoldTimer.current = window.setTimeout(() => {
      leftFlipperRef.current.active = false;
    }, 1800);
  }, []);

  const releaseLeft = useCallback(() => {
    leftFlipperRef.current.active = false;
    if (leftHoldTimer.current) {
      window.clearTimeout(leftHoldTimer.current);
      leftHoldTimer.current = null;
    }
  }, []);

  const pressRight = useCallback(() => {
    if (rightFlipperRef.current.active) return;
    rightFlipperRef.current.active = true;
    bagatelleAudio.flipper();
    if (rightHoldTimer.current) window.clearTimeout(rightHoldTimer.current);
    rightHoldTimer.current = window.setTimeout(() => {
      rightFlipperRef.current.active = false;
    }, 1800);
  }, []);

  const releaseRight = useCallback(() => {
    rightFlipperRef.current.active = false;
    if (rightHoldTimer.current) {
      window.clearTimeout(rightHoldTimer.current);
      rightHoldTimer.current = null;
    }
  }, []);

  const flipLeft = useCallback(() => {
    pressLeft();
    window.setTimeout(releaseLeft, 150);
  }, [pressLeft, releaseLeft]);
  const flipRight = useCallback(() => {
    pressRight();
    window.setTimeout(releaseRight, 150);
  }, [pressRight, releaseRight]);

  const nudge = useCallback(
    (dir: -1 | 1) => {
      const ball = ballRef.current;
      if (!ball.live) return;
      if (tiltUntilRef.current > performance.now()) return;
      if (nudgeCooldownRef.current > 0) return;
      nudgeCooldownRef.current = 0.55;

      const now = performance.now();
      const hist = nudgeHistoryRef.current.filter((t) => now - t < 4000);
      hist.push(now);
      nudgeHistoryRef.current = hist;

      if (hist.length >= 4) {
        tiltUntilRef.current = now + 2400;
        setTiltActive(true);
        window.setTimeout(() => setTiltActive(false), 2400);
        accumBonusRef.current = 0;
        cargaRef.current = 0;
        setCarga(0);
        litSlotRef.current = null;
        setLitSlot(null);
        litTimerRef.current = 0;
        setLitTimer(0);
        nudgeHistoryRef.current = [];
        bagatelleAudio.tilt();

        drain(50);
        return;
      }

      ball.vx += dir * 18;
      ball.vy -= 5;
      bagatelleAudio.nudge();
      setNudgeFlash({ id: Date.now(), dir });
      window.setTimeout(() => setNudgeFlash(null), 220);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const bumpMission = useCallback(
    (kind: MissionKind, amount: number) => {
      if (missionDoneRef.current) return;
      const m = missionRef.current;
      if (m.kind !== kind) return;
      const next = Math.min(m.target, missionProgressRef.current + amount);
      missionProgressRef.current = next;
      setMissionProgress(next);
      if (next >= m.target) {
        missionDoneRef.current = true;
        setMissionDone(true);
        addChips(m.reward);
        registerWin(m.reward);
        bagatelleAudio.mission();

        const prevTotal = missionsTotalRef.current;
        const nextTotal = prevTotal + 1;
        missionsTotalRef.current = nextTotal;
        setMissionsTotal(nextTotal);
        saveMissionsCount(nextTotal);
        const prevRank = getRankForMissions(prevTotal);
        const newRank = getRankForMissions(nextTotal);
        if (newRank.tier > prevRank.tier) {
          setRankUpFlash(newRank.name);
          setReaction({
            pose: "front",
            mood: "triunfante",
            line: `«¡Ascendiste a ${newRank.name}, cielo! El Cuervo te sonríe.»`,
          });
        } else {
          setReaction({
            pose: "front",
            mood: "triunfante",
            line: `«¡Misión cumplida, cielo! «${m.label}» te suma +${m.reward} fichas.»`,
          });
        }
      }
    },
    [addChips, registerWin],
  );

  const armMeter = useCallback(() => {
    if (phase !== "idle") return;
    if (!freeBall && chips < stake) return;
    if (meterActiveRef.current) return;
    bagatelleAudio.prime();
    meterPosRef.current = { pos: 0, dir: 1 };
    meterActiveRef.current = true;
    setMeterArmed(true);
    setLiveForce(0);
    doHaptic("select");
  }, [chips, freeBall, phase, stake, doHaptic]);

  const fireMeter = useCallback(() => {
    if (phase !== "idle") return;
    if (!meterActiveRef.current) return;
    const pos = meterPosRef.current.pos;
    const dist = Math.abs(pos - 0.5);

    let power: number;
    let zone: "green" | "amber" | "red";
    if (dist <= 0.1) {
      power = 215;
      zone = "green";
    } else if (dist <= 0.25) {
      power = 188;
      zone = "amber";
    } else {
      power = 168;
      zone = "red";
    }
    meterActiveRef.current = false;
    setMeterArmed(false);
    doHaptic("heavy");
    if (freeBall) {
      setFreeBall(false);
    } else {
      spend(stake);
    }

    resetBagatelleLaunchSfx();
    setPhase("playing");
    setReaction(PLAYING);
    accumBonusRef.current = 0;
    setResultZoneHit(null);
    bagatelleAudio.launch();
    ballStartRef.current = performance.now();

    const w = computeWager(stake, levelRef.current);
    setWager(w);
    setWagerHit(null);

    ballSaveUntilRef.current = performance.now() + 2500;
    setBallSaveActive(true);

    if (dist <= 0.1) {
      skillShotArmedRef.current = true;
      skillShotUntilRef.current = performance.now() + 2200;
    } else {
      skillShotArmedRef.current = false;
      skillShotUntilRef.current = 0;
    }

    cuervoHitsBallRef.current = 0;

    ball2Ref.current.live = false;
    kickbackUsedBallRef.current = false;
    setKickbackHits(0);
    const ball = ballRef.current;
    ball.x = 89;
    ball.y = 141;

    ball.vx = -4.5;
    ball.vy = -power;
    ball.live = true;
    playBagatelleLaunch(zone);
  }, [phase, spend, stake, freeBall, doHaptic]);

  const launchBall = useCallback(() => {
    if (meterActiveRef.current) fireMeter();
    else armMeter();
  }, [armMeter, fireMeter]);

  const boardTouchesRef = useRef<Map<number, "L" | "R">>(new Map());

  const handleBoardPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (phase !== "playing") return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const side: "L" | "R" = x < 0.5 ? "L" : "R";
      boardTouchesRef.current.set(event.pointerId, side);
      try {
        (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
      } catch {}
      if (side === "L") pressLeft();
      else pressRight();
    },
    [phase, pressLeft, pressRight],
  );

  const handleBoardPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const side = boardTouchesRef.current.get(event.pointerId);
      if (!side) return;
      boardTouchesRef.current.delete(event.pointerId);

      const stillHeld = Array.from(boardTouchesRef.current.values()).includes(side);
      if (stillHeld) return;
      if (side === "L") releaseLeft();
      else releaseRight();
    },
    [releaseLeft, releaseRight],
  );

  useEffect(() => {
    const isLeft = (k: string) => k === "ArrowLeft" || k === "a" || k === "A";
    const isRight = (k: string) => k === "ArrowRight" || k === "d" || k === "D";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (isLeft(event.key)) pressLeft();
      if (isRight(event.key)) pressRight();
      if (event.key === "z" || event.key === "Z") nudge(-1);
      if (event.key === "x" || event.key === "X") nudge(1);
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        launchBall();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (isLeft(event.key)) releaseLeft();
      if (isRight(event.key)) releaseRight();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [pressLeft, pressRight, releaseLeft, releaseRight, launchBall, nudge]);

  function step(dt: number) {
    if (meterActiveRef.current) {
      const m = meterPosRef.current;

      const speed = meterSpeedRef.current;
      m.pos += m.dir * speed * dt;
      if (m.pos >= 1) {
        m.pos = 1;
        m.dir = -1;
      } else if (m.pos <= 0) {
        m.pos = 0;
        m.dir = 1;
      }
      meterTickRef.current += dt;
      if (meterTickRef.current > 0.07) {
        meterTickRef.current = 0;
        bagatelleAudio.meterTick();
      }
    }

    if (comboRef.current.timer > 0) {
      comboRef.current.timer -= dt;
      if (comboRef.current.timer <= 0) {
        comboRef.current.timer = 0;
        comboRef.current.count = 0;
      }
    }

    if (nudgeCooldownRef.current > 0) {
      nudgeCooldownRef.current = Math.max(0, nudgeCooldownRef.current - dt);
    }

    if (litSlotRef.current !== null && litTimerRef.current > 0) {
      litTimerRef.current -= dt;
      if (litTimerRef.current <= 0) {
        litTimerRef.current = 0;
        litSlotRef.current = null;
        setLitSlot(null);
        setLitTimer(0);
        bagatelleAudio.litExpire();
      } else {
        if (Math.floor(litTimerRef.current * 10) !== Math.floor(litTimer * 10)) {
          setLitTimer(litTimerRef.current);
        }
      }
    }

    if (ballSaveActive && performance.now() >= ballSaveUntilRef.current) {
      setBallSaveActive(false);
    }

    stepFlipperAngle(leftFlipperRef.current, dt);
    stepFlipperAngle(rightFlipperRef.current, dt);

    decayNumericMap(flashRef.current, dt);
    decayNumericMap(hitCooldownRef.current, dt);

    stepSparks(sparksRef.current, dt);
    stepTrail(trailRef.current, dt);

    for (let i = 0; i < dropFlashRef.current.length; i += 1) {
      if (dropFlashRef.current[i] > 0)
        dropFlashRef.current[i] = Math.max(0, dropFlashRef.current[i] - dt);
    }

    const ball = ballRef.current;
    if (!ball.live) return;

    const curLvl = getLevelMeta(levelRef.current);
    const modeNow = bankModeRef.current;
    const modeGravityMul = modeNow ? modeNow.gravityMul : 1;
    const gravity = (modRef.current.id === "heavy" ? 108 : 88) * curLvl.gravityMul * modeGravityMul;
    applyGravityAndDrag(ball, gravity, dt);

    if (curLvl.magnetAvail && performance.now() < magnetUntilRef.current) {
      applyMagnetForce(ball, curLvl.eventFreqMul, dt);
    }

    const inShooterLane = applyShooterLane(ball, dt);
    const speed = Math.hypot(ball.vx, ball.vy);

    if (ball.y < 26 && ball.vy < -140 && Math.abs(ball.vx) < 30) {
      ball.vx += (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 16);
    }
    if (speed < 7 && ball.y < 134 && !inShooterLane) {
      ball.vx += (Math.random() - 0.5) * 8;
      ball.vy -= 4;
    }

    const steps = 2;
    const stepDt = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      ball.x += ball.vx * stepDt;
      ball.y += ball.vy * stepDt;
      collide(ball);
      if (ball.y > PLAYFIELD_BOTTOM) {
        const b2p = ball2Ref.current;
        if (b2p.live) {
          ball.x = b2p.x;
          ball.y = b2p.y;
          ball.vx = b2p.vx;
          ball.vy = b2p.vy;
          ball.live = true;
          b2p.live = false;
          setMultiballActive(false);
          multiballActiveRef.current = false;
          break;
        }
        drain(ball.x);
        return;
      }
    }

    clampSpeed(ball, curLvl.speedCap);

    const tr = trailRef.current;
    tr.push({ x: ball.x, y: ball.y, life: 0.32 });
    if (tr.length > 22) tr.shift();

    const b2 = ball2Ref.current;
    if (b2.live) {
      applyGravityAndDrag(b2, gravity, dt);

      if (curLvl.magnetAvail && performance.now() < magnetUntilRef.current) {
        applyMagnetForce(b2, curLvl.eventFreqMul, dt);
      }
      for (let i = 0; i < steps; i += 1) {
        b2.x += b2.vx * stepDt;
        b2.y += b2.vy * stepDt;
        collide(b2);
        if (b2.y > PLAYFIELD_BOTTOM) {
          b2.live = false;
          bagatelleAudio.drain();
          if (performance.now() >= multiballUntilRef.current) {
            setMultiballActive(false);
            multiballActiveRef.current = false;
          }
          break;
        }
      }
      if (b2.live) {
        clampSpeed(b2, curLvl.speedCap);
      }
    }
  }

  function collide(ball: { x: number; y: number; vx: number; vy: number; live: boolean }) {
    for (const wall of WALLS) {
      const point = closestOnSeg(ball.x, ball.y, wall.ax, wall.ay, wall.bx, wall.by);
      const dx = ball.x - point.x;
      const dy = ball.y - point.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= BALL_R || distance <= 1e-4) continue;

      const nx = dx / distance;
      const ny = dy / distance;
      ball.x = point.x + nx * BALL_R;
      ball.y = point.y + ny * BALL_R;

      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        const restitution = wall.kind === "guide" ? 0.76 : 0.88;
        ball.vx -= (1 + restitution) * vn * nx;
        ball.vy -= (1 + restitution) * vn * ny;
      }

      if (wall.kind === "sling-left") {
        ball.vx += 16;
        ball.vy -= 22;
        bagatelleAudio.sling();
      } else if (wall.kind === "sling-right") {
        ball.vx -= 16;
        ball.vy -= 22;
        bagatelleAudio.sling();
      }
    }

    OBSTACLES.forEach((obstacle, index) => {
      const dx = ball.x - obstacle.x;
      const dy = ball.y - obstacle.y;
      const distance = Math.hypot(dx, dy);
      const min = BALL_R + obstacle.r;
      if (distance >= min || distance <= 1e-4) return;

      const nx = dx / distance;
      const ny = dy / distance;
      ball.x = obstacle.x + nx * min;
      ball.y = obstacle.y + ny * min;

      const vn = ball.vx * nx + ball.vy * ny;
      const restitution =
        obstacle.kind === "peg"
          ? 0.8
          : obstacle.kind === "post"
            ? 0.9
            : obstacle.kind === "spinner"
              ? 0.35
              : obstacle.kind === "gong"
                ? 1.15
                : 1.3;
      if (vn < 0) {
        ball.vx -= (1 + restitution) * vn * nx;
        ball.vy -= (1 + restitution) * vn * ny;
      }

      if (obstacle.kind === "peg" || obstacle.kind === "post") {
        ball.vx += (Math.random() - 0.5) * 3.2;
        ball.vy += (Math.random() - 0.5) * 1.6;
        flashRef.current[index] = 0.18;
        if (!hitCooldownRef.current[index]) {
          hitCooldownRef.current[index] = 0.22;
          const gain = obstacle.kind === "peg" ? 1 : 2;
          accumBonusRef.current += gain;
          bagatelleAudio.peg();
        }
      }

      if (obstacle.kind === "spinner") {
        flashRef.current[index] = 0.28;
        if (!hitCooldownRef.current[index]) {
          hitCooldownRef.current[index] = 0.09;
          const speedIn = Math.hypot(ball.vx, ball.vy);
          const spins = Math.max(1, Math.round(speedIn / 55));
          const modeMul =
            (bankModeRef.current?.scoreMul ?? 1) * (multiballActiveRef.current ? 2 : 1);
          const gain = Math.max(1, Math.round(stakeRef.current * 0.04 * modeMul)) * spins;
          accumBonusRef.current += gain;
          setBumperBonus({ id: Date.now() + index, amount: gain, x: obstacle.x, y: obstacle.y });
          bagatelleAudio.spinner();
        }
      }

      if (obstacle.kind === "gong") {
        const kick = 30;
        ball.vx += nx * kick;
        ball.vy += ny * kick;
        flashRef.current[index] = 0.55;
        if (!hitCooldownRef.current[index]) {
          hitCooldownRef.current[index] = 0.35;
          const modeMul =
            (bankModeRef.current?.scoreMul ?? 1) * (multiballActiveRef.current ? 2 : 1);
          let gain = Math.max(6, Math.round(stakeRef.current * 0.5 * modeMul));

          if (wormReadyRef.current) {
            wormReadyRef.current = false;
            setWormReady(false);
            cargaRef.current = 0;
            setCarga(0);
            const bonus = Math.max(20, Math.round(stakeRef.current * 2));
            gain += bonus;

            litSlotRef.current = JACKPOT_SLOT;
            setLitSlot(JACKPOT_SLOT);
            litTimerRef.current = 10;
            setLitTimer(10);
            ball.vx =
              (SLOT_LEFT + (SLOT_RIGHT - SLOT_LEFT) * ((JACKPOT_SLOT + 0.5) / SLOTS) - ball.x) *
              2.2;
            ball.vy = 140;
            setWormFlash(Date.now());
            bagatelleAudio.mission();
            doHaptic("heavy");
          }

          const mode = bankModeRef.current;
          if (mode?.portalOnGong) {
            const bonus = Math.max(15, Math.round(stakeRef.current * 1.2));
            gain += bonus;
            litSlotRef.current = JACKPOT_SLOT;
            setLitSlot(JACKPOT_SLOT);
            litTimerRef.current = 8;
            setLitTimer(8);
            ball.vx =
              (SLOT_LEFT + (SLOT_RIGHT - SLOT_LEFT) * ((JACKPOT_SLOT + 0.5) / SLOTS) - ball.x) *
              2.0;
            ball.vy = 130;
          }
          accumBonusRef.current += gain;
          setBumperBonus({ id: Date.now() + index, amount: gain, x: obstacle.x, y: obstacle.y });
          bagatelleAudio.gong();
        }
      }

      if (obstacle.kind === "bumper" || obstacle.kind === "target") {
        const modeNowB = bankModeRef.current;
        const kickMul = modeNowB?.bumperKickMul ?? 1;
        const kick = (obstacle.kind === "target" ? 26 : 21) * kickMul;
        ball.vx += nx * kick;
        ball.vy += ny * kick;
        flashRef.current[index] = obstacle.kind === "target" ? 0.42 : 0.28;

        if (!hitCooldownRef.current[index]) {
          hitCooldownRef.current[index] = 0.16;
          const combo = comboRef.current;
          if (combo.timer > 0) combo.count += 1;
          else combo.count = 1;
          combo.timer = 1.6;
          const mult = Math.min(combo.count, 5);
          const scoreMul = (modeNowB?.scoreMul ?? 1) * (multiballActiveRef.current ? 2 : 1);
          const base = Math.max(
            1,
            Math.round(stakeRef.current * (obstacle.kind === "target" ? 0.14 : 0.08) * scoreMul),
          );
          const amount = base * mult;
          accumBonusRef.current += amount;
          setBumperBonus({ id: Date.now() + index, amount, x: obstacle.x, y: obstacle.y });
          if (combo.count >= 2) {
            setComboDisplay({ count: combo.count, mult, key: Date.now() + index });
          }

          if (combo.count >= 4) {
            const lm = getLevelMeta(levelRef.current);
            if (lm.magnetAvail && performance.now() > magnetUntilRef.current) {
              const dur = MAGNET_TIME * (0.8 + 0.2 * lm.eventFreqMul);
              magnetUntilRef.current = performance.now() + dur * 1000;
              setMagnetActive(true);
              window.setTimeout(() => setMagnetActive(false), dur * 1000);
            }
          }

          if (missionRef.current.kind === "combo" && !missionDoneRef.current) {
            const target = missionRef.current.target;
            if (combo.count > missionProgressRef.current) {
              bumpMission("combo", Math.min(target, combo.count) - missionProgressRef.current);
            }
          }

          bumpMission("bumpers", 1);
          if (obstacle.label === "CUERVO") {
            bumpMission("cuervo", 1);

            cuervoHitsBallRef.current += 1;
            setKickbackHits(cuervoHitsBallRef.current);
          }

          if (obstacle.kind === "target") bagatelleAudio.target();
          else bagatelleAudio.bumper();

          const isCuervo = obstacle.label === "CUERVO";
          const isStar = obstacle.label === "★";
          const gain = isCuervo ? 18 : obstacle.kind === "target" ? 12 : 7;
          const prev = cargaRef.current;
          const next = Math.min(CARGA_MAX, prev + gain);
          cargaRef.current = next;
          setCarga(next);

          if (prev < CARGA_MAX && next >= CARGA_MAX && !wormReadyRef.current) {
            wormReadyRef.current = true;
            setWormReady(true);
          }

          const starProb = 0.4 + rank.perks.starLitBoost;
          if (isStar && litSlotRef.current === null && Math.random() < starProb) {
            const candidates = MULTIPLIERS.map((m, i) => ({ m, i })).filter(
              ({ m, i }) => m > 0 && m < 10 && i !== JACKPOT_SLOT,
            );
            if (candidates.length > 0) {
              const pick = candidates[Math.floor(Math.random() * candidates.length)].i;
              litSlotRef.current = pick;
              setLitSlot(pick);
              litTimerRef.current = 9;
              setLitTimer(9);
            }
          }

          if (isCuervo && litSlotRef.current === null) {
            const candidates = MULTIPLIERS.map((m, i) => ({ m, i })).filter(
              ({ m }) => m >= 2 && m < 10,
            );
            if (candidates.length > 0) {
              const pick = candidates[Math.floor(Math.random() * candidates.length)].i;
              litSlotRef.current = pick;
              setLitSlot(pick);
              litTimerRef.current = 12;
              setLitTimer(12);
            }
          }

          if (cuervoIndexRef.current < 6 && !cuervoBonusRef.current) {
            const letterGain = isCuervo ? 2 : 1;
            const nextLetters = Math.min(6, cuervoIndexRef.current + letterGain);
            if (nextLetters !== cuervoIndexRef.current) {
              cuervoIndexRef.current = nextLetters;
              setCuervoIndex(nextLetters);
              if (nextLetters >= 6) {
                cuervoBonusRef.current = true;
                setCuervoBonus(true);
                bagatelleAudio.mission();

                if (!ball2Ref.current.live) {
                  const b2 = ball2Ref.current;
                  b2.x = 50;
                  b2.y = 68;
                  const dir = Math.random() < 0.5 ? -1 : 1;
                  b2.vx = dir * (55 + Math.random() * 30);
                  b2.vy = -30 - Math.random() * 40;
                  b2.live = true;
                  multiballUntilRef.current = performance.now() + MULTIBALL_DURATION_MS;
                  setMultiballActive(true);
                  multiballActiveRef.current = true;
                  setMultiballRemaining(MULTIBALL_DURATION_MS);
                  setMultiballFlash(Date.now());
                  doHaptic("heavy");
                }
                setReaction({
                  pose: "front",
                  mood: "triunfante",
                  line: "«¡CUERVO completo, cielo! Multibola: dos bolas, doble puntos, doble suerte.»",
                });
              }
            }
          }

          if (
            isStar &&
            skillShotArmedRef.current &&
            performance.now() < skillShotUntilRef.current
          ) {
            skillShotArmedRef.current = false;
            const bonus = stakeRef.current * 4;
            accumBonusRef.current += bonus;
            setSkillShotFlash(bonus);
            bagatelleAudio.mission();
            setReaction({
              pose: "front",
              mood: "triunfante",
              line: `«¡SKILL SHOT, bombón! +${bonus} fichas por la puntería.»`,
            });
          }
        }

        if (obstacle.kind === "target") {
          ball.vx += ball.x < obstacle.x ? -6 : 6;
        }

        const count = obstacle.kind === "target" ? 14 : 10;
        for (let s = 0; s < count; s += 1) {
          const a = Math.random() * Math.PI * 2;
          const sp = 40 + Math.random() * 60;
          const max = 0.42 + Math.random() * 0.18;
          sparksRef.current.push({
            x: obstacle.x + nx * obstacle.r,
            y: obstacle.y + ny * obstacle.r,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 12,
            life: max,
            max,
            gold: true,
          });
        }
      } else {
        flashRef.current[index] = 0.18;
        if (obstacle.kind === "peg") {
          const count = 4;
          for (let s = 0; s < count; s += 1) {
            const a = Math.random() * Math.PI * 2;
            const sp = 22 + Math.random() * 30;
            const max = 0.24 + Math.random() * 0.12;
            sparksRef.current.push({
              x: obstacle.x + nx * obstacle.r,
              y: obstacle.y + ny * obstacle.r,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp - 6,
              life: max,
              max,
              gold: false,
            });
          }
        }
      }
    });

    const curLvlDT = getLevelMeta(levelRef.current);
    for (let di = 0; di < DROP_TARGETS.length; di += 1) {
      if (dropDownRef.current[di]) continue;
      const dt0 = DROP_TARGETS[di];

      const minX = dt0.x - dt0.w / 2 - BALL_R;
      const maxX = dt0.x + dt0.w / 2 + BALL_R;
      const minY = dt0.y - dt0.h / 2 - BALL_R;
      const maxY = dt0.y + dt0.h / 2 + BALL_R;
      if (ball.x < minX || ball.x > maxX || ball.y < minY || ball.y > maxY) continue;

      const cx = Math.max(dt0.x - dt0.w / 2, Math.min(ball.x, dt0.x + dt0.w / 2));
      const cy = Math.max(dt0.y - dt0.h / 2, Math.min(ball.y, dt0.y + dt0.h / 2));
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const d = Math.hypot(dx, dy);
      if (d >= BALL_R || d <= 1e-4) continue;
      const nx = dx / d;
      const ny = dy / d;
      ball.x = cx + nx * BALL_R;
      ball.y = cy + ny * BALL_R;
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        const rest = 0.95 * curLvlDT.bounceMul;
        ball.vx -= (1 + rest) * vn * nx;
        ball.vy -= (1 + rest) * vn * ny;
      }

      dropDownRef.current[di] = true;
      dropFlashRef.current[di] = 0.5;
      setDropDown([...dropDownRef.current]);
      bagatelleAudio.target();
      const gain = Math.max(1, Math.round(stakeRef.current * 0.06));
      accumBonusRef.current += gain;
      setBumperBonus({ id: Date.now() + 500 + di, amount: gain, x: dt0.x, y: dt0.y });

      if (dropDownRef.current.every((b) => b)) {
        const bonus = Math.round(stakeRef.current * 0.9 * curLvlDT.dropRewardMul);
        accumBonusRef.current += bonus;
        dropBanksRef.current += 1;
        setDropBanks(dropBanksRef.current);
        setDropRewardFlash({ amount: bonus, key: Date.now() });
        bagatelleAudio.mission();

        window.setTimeout(() => {
          dropDownRef.current = DROP_TARGETS.map(() => false);
          setDropDown([...dropDownRef.current]);
        }, 700);

        const boss = curLvlDT.boss?.id;
        if (curLvlDT.magnetAvail) {
          const dur = boss === "corvina" ? MAGNET_TIME * 1.6 : MAGNET_TIME;
          const rankMs = rank.perks.magnetBonusMs;
          const totalMs = dur * 1000 + rankMs;
          magnetUntilRef.current = performance.now() + totalMs;
          setMagnetActive(true);
          window.setTimeout(() => setMagnetActive(false), totalMs);
        }

        const nextMode = rollBankMode();
        bankModeRef.current = nextMode;
        setBankMode(nextMode);
        bankModeUntilRef.current = performance.now() + BANK_MODE_DURATION_MS;
        setBankModeRemaining(BANK_MODE_DURATION_MS);
        setReaction({
          pose: "front",
          mood: "coqueta",
          line: `«¡«${nextMode.name}», cielo! ${nextMode.hint}.»`,
        });
      }
      break;
    }

    collideFlipper(ball, PIVOT_L, leftFlipperRef.current, true);
    collideFlipper(ball, PIVOT_R, rightFlipperRef.current, false);
  }

  function drain(x: number) {
    const ball = ballRef.current;

    if (performance.now() < ballSaveUntilRef.current && phase === "playing") {
      ballSaveUntilRef.current = 0;
      setBallSaveActive(false);
      setBallSavedFlash(Date.now());
      bagatelleAudio.mission();
      ball.x = 89;
      ball.y = 141;
      ball.vx = -8.5;
      ball.vy = -170;
      ball.live = true;
      return;
    }

    const ratioK = Math.max(0, Math.min(1, (x - SLOT_LEFT) / (SLOT_RIGHT - SLOT_LEFT)));
    const slotK = Math.max(0, Math.min(SLOTS - 1, Math.floor(ratioK * SLOTS)));
    const isOutlane = slotK === 0 || slotK === SLOTS - 1;
    if (
      isOutlane &&
      cuervoHitsBallRef.current >= 3 &&
      !kickbackUsedBallRef.current &&
      phase === "playing"
    ) {
      kickbackUsedBallRef.current = true;
      setKickbackFlash(Date.now());
      bagatelleAudio.mission();
      doHaptic("success");

      ball.x = slotK === 0 ? SLOT_LEFT + 6 : SLOT_RIGHT - 6;
      ball.y = 138;
      ball.vx = slotK === 0 ? 55 : -55;
      ball.vy = -180;
      ball.live = true;
      return;
    }
    setBallSaveActive(false);
    ball.live = false;

    const ratio = Math.max(0, Math.min(1, (x - SLOT_LEFT) / (SLOT_RIGHT - SLOT_LEFT)));
    const slot = Math.max(0, Math.min(SLOTS - 1, Math.floor(ratio * SLOTS)));
    const bonus = accumBonusRef.current;
    accumBonusRef.current = 0;
    comboRef.current = { count: 0, timer: 0 };
    setComboDisplay(null);
    const currentStake = stakeRef.current;
    const currentMod = modRef.current;
    const currentCarga = cargaRef.current;
    const currentLit = litSlotRef.current;
    const payout = resolvePayout(
      slot,
      currentStake,
      currentMod.id,
      dustSlotRef.current,
      currentCarga,
      currentLit,
    );
    const { outcome } = payout;
    let { won } = payout;

    const currentZone = zoneRef.current;
    const zoned = applyZoneMult(won, slot, currentZone);
    won = zoned.won;
    setResultZoneHit(zoned.zoneHit);

    let cuervoCashed = false;
    if (cuervoBonusRef.current) {
      if (won > 0) won = won * 2;
      cuervoBonusRef.current = false;
      setCuervoBonus(false);
      cuervoIndexRef.current = 0;
      setCuervoIndex(0);
      cuervoCashed = true;
    }

    const curLvlMeta = getLevelMeta(levelRef.current);
    if (outcome === "jackpot10" && curLvlMeta.jackpotBoost > 0) won += curLvlMeta.jackpotBoost;
    if (outcome === "curse" && curLvlMeta.curseBoost > 0) {
      const extra = Math.round(currentStake * curLvlMeta.curseBoost);
      spend(extra);
    }

    const totalWin = won + bonus;

    trackBagatelleLaunch({ outcome, totalWin, stake: currentStake });

    setResultSlot(slot);
    setResultOutcome(outcome);

    const snap = trailRef.current.slice(-32).map((p) => ({ x: p.x, y: p.y }));
    snap.push({ x, y: 152 });
    setResultTrail(snap);
    setLastWin(totalWin);
    setPhase("result");

    if (outcome === "jackpot10") {
      bagatelleAudio.jackpot();
      doHaptic("heavy");
    } else if (outcome === "curse") {
      bagatelleAudio.curse();
      doHaptic("warning");
    } else if (outcome === "miss" || outcome === "barely") {
      bagatelleAudio.drain();
      doHaptic("tap");
    } else {
      bagatelleAudio.win();
      doHaptic(totalWin > 0 ? "success" : "tap");
    }

    if (currentLit !== null && slot === currentLit) {
      bumpMission("lit", 1);
    }

    if (totalWin > 0) {
      addChips(totalWin);
      registerWin(totalWin);
      lossStreakRef.current = 0;
      void import("@/lib/nemesis").then(({ reportGameOutcome }) =>
        reportGameOutcome("bagatelle", "win"),
      );

      void import("@/lib/economy").then(({ awardLifeOnWin, registerHostessMatchResult }) => {
        awardLifeOnWin();
        registerHostessMatchResult(hostess, {
          won: true,
          magnitude: outcome === "jackpot10" ? "big" : "normal",
        });
      });

      if (totalWin > highScore) {
        setHighScore(totalWin);
        try {
          window.localStorage.setItem(HS_KEY, String(totalWin));
        } catch {}
      }
    } else {
      registerLoss();
      lossStreakRef.current += 1;
      void import("@/lib/nemesis").then(({ reportGameOutcome }) =>
        reportGameOutcome("bagatelle", "loss"),
      );

      void import("@/lib/economy").then(({ registerHostessMatchResult }) =>
        registerHostessMatchResult(hostess, { won: false, tag: `outcome:${outcome}` }),
      );
    }

    if (outcome === "jackpot10" || totalWin > 0) {
      setLevelProgress((p) => {
        const inc = outcome === "jackpot10" ? LEVEL_ADVANCE : 1;
        const next = p + inc;
        if (next >= LEVEL_ADVANCE) {
          const nl = levelRef.current + 1;
          levelRef.current = nl;
          setLevel(nl);
          setLevelUpFlash(Date.now());
          try {
            window.localStorage.setItem(LEVEL_KEY, String(nl));
            window.localStorage.setItem(LEVEL_PROG_KEY, "0");
          } catch {}
          return 0;
        }
        try {
          window.localStorage.setItem(LEVEL_PROG_KEY, String(next));
        } catch {}
        return next;
      });
    } else if (outcome === "curse") {
      setLevelProgress(0);
      try {
        window.localStorage.setItem(LEVEL_PROG_KEY, "0");
      } catch {}
    }

    const wagerTarget = wagerRef.current;
    if (wagerBeaten(totalWin, wagerTarget)) {
      setWagerHit(true);
      void import("@/store/favors").then(({ useFavors }) => {
        try {
          useFavors.getState().earn(1, "bagatelle");
        } catch {}
      });
    } else if (wagerTarget > 0) {
      setWagerHit(false);
    }

    if (totalWin > 0) {
      const contrib = bankContribution(totalWin);
      const nextBank = bankRef.current + contrib;
      bankRef.current = nextBank;
      setBank(nextBank);
      const nextStreak = bankStreakRef.current + 1;
      bankStreakRef.current = nextStreak;
      setBankStreak(nextStreak);
    } else if (outcome === "curse" || outcome === "miss") {
      const kept = bankAfterCurse(bankRef.current);
      bankRef.current = kept;
      setBank(kept);
      bankStreakRef.current = 0;
      setBankStreak(0);
    }

    setReaction(reactionFor(outcome, lossStreakRef.current));
    setHistory((entries) =>
      [{ slot, win: totalWin, stake: currentStake, mod: currentMod.id }, ...entries].slice(0, 12),
    );

    if (user && totalWin > 0 && !isOfflineDemo()) {
      const elapsed = Math.max(1500, Math.round(performance.now() - ballStartRef.current));
      const safeWin = Math.max(0, Math.min(50_000, totalWin));
      submitRunFn({
        data: {
          mode: "casual",
          seed: randomSeed(),
          score: safeWin,
          best_ball: safeWin,
          balls_played: 1,
          combo_max: Math.min(99, comboRef.current?.count ?? 0),
          jackpots: outcome === "jackpot10" ? 1 : 0,
          duration_ms: Math.min(60_000, elapsed),
          client_version: "pinball-1",
        },
      }).catch(() => {});
    }

    if (totalWin > 0 && activeTourneyGame() === "bagatelle") {
      void submitTourneyScore("bagatelle", Math.max(0, Math.min(50_000, totalWin)));
    }

    if (totalWin > 0) {
      const bagScore = Math.max(0, Math.min(50_000, totalWin));
      reportSingleScore("bagatelle", bagScore);
      void submitScore({
        game: "bagatelle",
        mode: "best-ball-daily",
        seed: dailySeed("bagatelle"),
        score: bagScore,
        meta: { slot, stake: currentStake, mod: currentMod.id },
      });
    }

    try {
      const prevLossStreak = loadBagStats().currentLossStreak;
      checkLossComeback(prevLossStreak, totalWin > 0);
      const dailyProg = totalWin > 0 ? reportDailyBall(totalWin) : null;
      const dailyCh = getDailyChallenge();
      reportAchievementBall({
        outcome,
        totalWin,
        cuervoCompleted: cuervoCashed,
        comboMax: comboRef.current?.count ?? 0,
        bank: bankRef.current,
        wagerBeaten: wagerBeaten(totalWin, wagerRef.current),
        daily: dailyProg
          ? { beat: dailyProg.best >= dailyCh.target, streak: dailyProg.streak }
          : undefined,
      });
    } catch (err) {}
    if (outcome === "jackpot10") {
      setJackpotFlash(totalWin);
      setFreeBall(true);
    }
    if (cuervoCashed) {
      setFreeBall(true);
    }

    const nextCarga = outcome === "jackpot10" ? 0 : Math.floor(currentCarga * 0.25);
    cargaRef.current = nextCarga;
    setCarga(nextCarga);

    litSlotRef.current = null;
    setLitSlot(null);
    litTimerRef.current = 0;
    setLitTimer(0);

    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(
      () => {
        setPhase("idle");

        resetBagatelleLaunchSfx();
        setResultSlot(null);

        setResultTrail(null);
        setResultOutcome(null);
        setLastWin(null);
        setJackpotFlash(null);

        const newStake = stakeRef.current;
        setMod(rollMod());
        setDustSlot(Math.random() < 0.5 ? 0 : 12);
        const newMission = rollMission(newStake);
        setMission(newMission);
        setMissionProgress(0);
        setMissionDone(false);
        missionProgressRef.current = 0;
        missionDoneRef.current = false;
        setReaction(GREETING);
        if (outcome === "jackpot10") {
          bagatelleAudio.freeBall();
        }
      },
      outcome === "jackpot10" ? 2800 : 1700,
    );
  }

  const ball = ballRef.current;
  const leftDeg = (leftFlipperRef.current.angle * 180) / Math.PI;
  const rightDeg = 180 - (rightFlipperRef.current.angle * 180) / Math.PI;
  const launchLabel =
    phase === "playing"
      ? "en juego"
      : phase === "result"
        ? "cobrando"
        : meterArmed
          ? "¡soltar!"
          : "medir fuerza";
  const meterPos = meterPosRef.current.pos;
  const meterDist = Math.abs(meterPos - 0.5);
  const meterZone: "green" | "yellow" | "red" =
    meterDist <= 0.1 ? "green" : meterDist <= 0.25 ? "yellow" : "red";
  const meterZoneLabel =
    meterZone === "green"
      ? "VERDE · máxima"
      : meterZone === "yellow"
        ? "ÁMBAR · media"
        : "ROJA · débil";
  const meterZoneColor =
    meterZone === "green" ? "#3dd66b" : meterZone === "yellow" ? "#f3c64a" : "#e0524a";

  const marqueeBulbs = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${4 + index * 5.3}%`,
        delay: `${index * 0.18}s`,
      })),
    [],
  );

  const blessingFactor = mod.id === "blessing" ? 1.5 : 1;
  const effMults = MULTIPLIERS.map((_, i) => effectiveMult(i, mod.id, dustSlot, carga, litSlot));
  const expectedReturn = effMults.reduce((acc, m, i) => {
    const payout = m > 0 ? m * blessingFactor : m;
    return acc + SLOT_PROBS[i] * payout;
  }, 0);
  const evChips = Math.round(expectedReturn * stake - stake);
  const winChance = effMults.reduce((acc, m, i) => acc + (m > 0 ? SLOT_PROBS[i] : 0), 0);
  const curseChance = effMults.reduce((acc, m, i) => acc + (m < 0 ? SLOT_PROBS[i] : 0), 0);
  const jackpotChance = effMults.reduce((acc, m, i) => acc + (m >= 10 ? SLOT_PROBS[i] : 0), 0);

  const cargaTier =
    carga >= CARGA_PLUMAS
      ? "PLUMAS DE ORO"
      : carga >= CARGA_BENDICION
        ? "BENDICIÓN"
        : carga >= CARGA_INDULTO
          ? "INDULTO"
          : "—";
  const cargaTierColor =
    carga >= CARGA_PLUMAS
      ? "var(--brass-bright)"
      : carga >= CARGA_BENDICION
        ? "var(--brass)"
        : carga >= CARGA_INDULTO
          ? "var(--ivory)"
          : "var(--ivory)";

  return (
    <GameRoomShell
      bg={zoneBg}
      room="bagatelle"
      title="Clavo y Suerte"
      subtitle="el cuervo dorado · la cantina"
      npcId={hostess}
      npcRoom="/bagatelle"
    >
      <div className="mx-auto mb-2 flex max-w-6xl justify-center px-3 sm:justify-end">
        <TourneyRoundBadge game="bagatelle" />
      </div>
      <BagatelleVictoryScreen />
      {runActive ? <div className="mx-auto max-w-6xl px-3"></div> : null}

      <div className="cuervo-mobile-compact mx-auto w-full max-w-[1220px] min-w-0 px-3 pb-10 pt-2 sm:px-6">
        <div className="mobile-stack-grid grid min-w-0 items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[300px_minmax(0,680px)] lg:gap-8">
          <section className="game-focus mx-auto w-full min-w-0 max-w-[680px] md:order-2 md:mx-0 lg:order-2">
            <div className="rounded-[1.4rem] border border-[var(--brass)]/30 bg-[linear-gradient(180deg,oklch(0.20_0.06_28/0.95),oklch(0.06_0.01_25/0.98))] p-3 shadow-[0_40px_90px_-28px_rgba(0,0,0,0.95)]">
              <div className="rounded-[1.1rem] border border-[var(--brass)]/20 bg-[linear-gradient(180deg,oklch(0.13_0.03_24/0.98),oklch(0.05_0.008_25/1))] p-3">
                <div
                  data-bagatelle-backglass
                  className="relative overflow-hidden rounded-[0.9rem] border border-[var(--brass)]/25 bg-[linear-gradient(180deg,oklch(0.11_0.03_20/0.98),oklch(0.06_0.01_20/1))] px-4 py-4"
                >
                  <img
                    src={pinballBackglass}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.07] blur-[1px]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_85%)]" />
                  {(() => {
                    const bulbColor =
                      carga >= CARGA_PLUMAS
                        ? "oklch(0.92 0.18 82)"
                        : carga >= CARGA_BENDICION
                          ? "oklch(0.84 0.15 82)"
                          : carga >= CARGA_INDULTO
                            ? "oklch(0.78 0.12 80)"
                            : "oklch(0.65 0.08 80)";
                    const comboBoost = comboDisplay ? Math.min(comboDisplay.count, 5) : 0;
                    const bulbDur = `${(1.7 - comboBoost * 0.22).toFixed(2)}s`;
                    const bulbGlow =
                      comboBoost > 0
                        ? `0 0 ${4 + comboBoost * 2}px ${bulbColor}`
                        : `0 0 3px ${bulbColor}`;
                    return marqueeBulbs.map((bulb) => (
                      <span
                        key={bulb.id}
                        className="absolute top-2 h-1.5 w-1.5 rounded-full bulb"
                        style={{
                          left: bulb.left,
                          background: bulbColor,
                          boxShadow: bulbGlow,
                          animation: `pinballPulse ${bulbDur} ease-in-out infinite`,
                          animationDelay: bulb.delay,
                        }}
                      />
                    ));
                  })()}

                  <div className="relative z-10 grid items-center gap-3 md:grid-cols-[140px_1fr_140px]">
                    <div className="rounded-[0.8rem] border border-[var(--brass)]/20 bg-[var(--noir)]/80 px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,240,200,0.08)]">
                      <div className="font-display text-[11px] uppercase tracking-[0.34em] text-[var(--brass)]/90">
                        fichas
                      </div>
                      <div className="led-digit mt-2 text-[var(--brass-bright)] text-glow-brass">
                        {String(Math.min(chips, 99999)).padStart(5, "0")}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="font-display text-[11px] uppercase tracking-[0.38em] text-[var(--brass)]/90">
                        El Cuervo Dorado
                      </div>
                      <h1 className="mt-1 font-display text-[clamp(1.5rem,6vw,3rem)] leading-none text-[var(--brass-bright)] text-glow-brass">
                        CLAVO Y SUERTE
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                        <span className="rounded-full border border-[var(--brass)]/30 bg-[var(--noir)]/75 px-3 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--ivory)]/70">
                          {phaseBadge(phase)}
                        </span>
                        <span className="rounded-full border border-[var(--blood)]/35 bg-[var(--blood)]/15 px-3 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--ivory)]">
                          {mod.name}
                        </span>
                        <span
                          className="rounded-full border-2 px-3 py-1 font-display text-[11px] uppercase tracking-[0.3em]"
                          style={{
                            borderColor: levelMeta.ribbonTone,
                            color: levelMeta.ribbonTone,
                            background: `color-mix(in oklab, ${levelMeta.ribbonTone} 14%, oklch(0.08 0.02 30))`,
                          }}
                        >
                          Nivel {level} · {levelMeta.name}
                        </span>
                        {levelMeta.boss && (
                          <span
                            className="rounded-full border-2 px-3 py-1 font-display text-[11px] uppercase tracking-[0.32em] text-[var(--ivory)] shadow-[0_0_14px_currentColor]"
                            style={{
                              borderColor: levelMeta.ribbonTone,
                              color: levelMeta.ribbonTone,
                              background: `color-mix(in oklab, ${levelMeta.ribbonTone} 22%, oklch(0.05 0.02 25))`,
                            }}
                            title={levelMeta.boss.rule}
                          >
                            ★ Jefa · {levelMeta.boss.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {Array.from({ length: LEVEL_ADVANCE }).map((_, i) => (
                            <span
                              key={i}
                              className="h-1.5 w-4 rounded-full transition-colors"
                              style={{
                                background:
                                  i < levelProgress ? levelMeta.ribbonTone : "oklch(0.22 0.02 30)",
                                boxShadow:
                                  i < levelProgress ? `0 0 6px ${levelMeta.ribbonTone}` : "none",
                              }}
                            />
                          ))}
                        </span>
                      </div>
                      {levelMeta.boss && (
                        <div
                          className="mt-2 text-center font-display text-[11px] uppercase tracking-[0.28em]"
                          style={{ color: levelMeta.ribbonTone, opacity: 0.85 }}
                        >
                          {levelMeta.boss.rule}
                        </div>
                      )}
                      {}
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                        {wager > 0 && (
                          <span
                            className={`rounded-full border px-3 py-1 font-display text-[11px] uppercase tracking-[0.3em] ${
                              wagerHit === true
                                ? "border-[oklch(0.78_0.16_140)] bg-[oklch(0.20_0.12_140/0.35)] text-[oklch(0.88_0.15_140)]"
                                : wagerHit === false
                                  ? "border-[var(--blood)]/60 bg-[var(--blood)]/15 text-[var(--blood)]"
                                  : "border-[var(--brass)]/40 bg-[var(--noir)]/70 text-[var(--brass)]"
                            }`}
                            title={`${hostShort} dice: no llegás a ${wager}. Superarlo paga +1 🪶.`}
                          >
                            {wagerHit === true
                              ? `¡Le ganaste a ${hostShort}! +1 🪶`
                              : wagerHit === false
                                ? `${hostShort} tenía razón · ${wager}`
                                : `${hostShort} apuesta: no llegás a ${wager}`}
                          </span>
                        )}
                        {bank > 0 && (
                          <button
                            type="button"
                            onClick={cashoutBank}
                            disabled={phase !== "idle"}
                            className="rounded-full border-2 border-[oklch(0.75_0.16_78)] bg-[oklch(0.15_0.06_60/0.7)] px-3 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-[oklch(0.9_0.16_78)] shadow-[0_0_10px_oklch(0.75_0.16_78/0.5)] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            title={`Cobrás ${computeCashout(bank, bankStreak)} 🪙 (banca ${bank} × ${bankMultiplier(bankStreak).toFixed(2)}). Una maldición te parte la banca por la mitad.`}
                          >
                            Cobrar Banca · {bank}🪙 · x{bankMultiplier(bankStreak).toFixed(2)}
                          </button>
                        )}
                        {bank > 0 && bankStreak > 0 && (
                          <span className="rounded-full border border-[var(--brass)]/40 bg-[var(--noir)]/70 px-2 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/80">
                            Racha {bankStreak}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[0.8rem] border border-[var(--brass)]/20 bg-[var(--noir)]/80 px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,240,200,0.08)]">
                      <div className="font-display text-[11px] uppercase tracking-[0.34em] text-[var(--brass)]/90">
                        ronda
                      </div>
                      <div className="led-digit mt-2 text-[var(--brass-bright)] text-glow-brass">
                        {shortModName(mod.id)}
                      </div>
                    </div>
                  </div>
                </div>

                <FitBoardArea
                  aspect={W / H}
                  reserveBottom={30}
                  className="mt-3 rounded-[1rem] border border-[var(--brass)]/22 bg-[linear-gradient(180deg,oklch(0.30_0.08_28/0.95),oklch(0.15_0.04_28/1))] p-3 shadow-[inset_0_0_0_1px_rgba(255,220,140,0.06)]"
                >
                  <div
                    className="relative overflow-hidden rounded-[0.85rem] border border-[var(--brass)]/20 bg-[var(--noir)] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.95)]"
                    onPointerDown={handleBoardPointerDown}
                    onPointerUp={handleBoardPointerUp}
                    onPointerCancel={handleBoardPointerUp}
                    onPointerLeave={handleBoardPointerUp}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                      touchAction: "none",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      WebkitTapHighlightColor: "transparent",
                      WebkitTouchCallout: "none",
                    }}
                  >
                    <div className="pointer-events-none absolute inset-x-[3%] top-0 z-20 hidden items-center justify-between px-3 pt-2 sm:flex">
                      <div className="rounded-full border border-[var(--brass)]/20 bg-[var(--noir)]/55 px-3 py-1 font-display text-[11px] uppercase tracking-[0.28em] text-[var(--brass)]/90 backdrop-blur-sm">
                        touch ← / → abajo
                      </div>
                      <div className="rounded-full border border-[var(--brass)]/20 bg-[var(--noir)]/55 px-3 py-1 font-display text-[11px] uppercase tracking-[0.28em] text-[var(--brass)]/90 backdrop-blur-sm">
                        5 bumpers · 4 slings · 13 ranuras
                      </div>
                    </div>

                    <svg
                      viewBox={`0 0 ${W} ${H}`}
                      className="block h-auto w-full select-none"
                      aria-label="Tablero de clavos El Cuervo Dorado"
                    >
                      <defs>
                        <linearGradient id="cabinetWood" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="var(--mahogany)" />
                          <stop offset="100%" stopColor="var(--noir)" />
                        </linearGradient>
                        <radialGradient id="topHalo" cx="50%" cy="0%" r="65%">
                          <stop offset="0%" stopColor="oklch(0.78 0.14 82 / 0.25)" />
                          <stop offset="100%" stopColor="oklch(0.10 0.01 25 / 0)" />
                        </radialGradient>
                        <radialGradient id="ballGrad" cx="35%" cy="30%" r="75%">
                          <stop offset="0%" stopColor="oklch(0.98 0.01 90)" />
                          <stop offset="50%" stopColor="oklch(0.82 0.03 80)" />
                          <stop offset="100%" stopColor="oklch(0.42 0.03 70)" />
                        </radialGradient>
                        <filter id="glowSoft">
                          <feGaussianBlur stdDeviation="0.85" />
                        </filter>
                        <filter id="glowBig">
                          <feGaussianBlur stdDeviation="1.8" />
                        </filter>
                      </defs>

                      <rect x="0" y="0" width={W} height={H} fill="url(#cabinetWood)" />
                      <rect
                        x="4"
                        y="4"
                        width="92"
                        height="152"
                        rx="6"
                        fill="var(--noir)"
                        stroke="var(--brass)"
                        strokeOpacity="0.4"
                        strokeWidth="0.8"
                      />

                      {}
                      <defs>
                        <clipPath id="playfieldClip">
                          <rect x="7" y="7" width="86" height="146" rx="5" />
                        </clipPath>
                      </defs>
                      <g clipPath="url(#playfieldClip)">
                        <image
                          href={pinballPlayfieldPainted}
                          x="7"
                          y="-18"
                          width="86"
                          height="170"
                          preserveAspectRatio="none"
                        />
                      </g>
                      <rect
                        x="7"
                        y="7"
                        width="86"
                        height="146"
                        rx="5"
                        fill="none"
                        stroke="var(--brass)"
                        strokeOpacity="0.32"
                        strokeWidth="0.5"
                      />
                      <rect
                        x="7"
                        y="7"
                        width="86"
                        height="146"
                        rx="5"
                        fill="url(#topHalo)"
                        opacity="0.55"
                        pointerEvents="none"
                      />

                      <text
                        x="88.8"
                        y="80"
                        textAnchor="middle"
                        fontSize="2.4"
                        fill="var(--brass-bright)"
                        opacity="0.55"
                        transform="rotate(90 88.8 80)"
                        letterSpacing="0.22em"
                      >
                        SHOOTER LANE
                      </text>

                      {}

                      {OBSTACLES.map((obstacle, index) => {
                        const flash = flashRef.current[index] ?? 0;
                        if (obstacle.kind === "peg") {
                          return (
                            <g key={`peg-${index}`}>
                              {flash > 0 ? (
                                <circle
                                  cx={obstacle.x}
                                  cy={obstacle.y}
                                  r={obstacle.r * 2.4}
                                  fill="oklch(0.84 0.15 82 / 0.7)"
                                  filter="url(#glowSoft)"
                                />
                              ) : null}
                              <circle
                                cx={obstacle.x}
                                cy={obstacle.y}
                                r={obstacle.r * 0.95}
                                fill="var(--noir)"
                                opacity="0.85"
                              />
                              <circle
                                cx={obstacle.x}
                                cy={obstacle.y}
                                r={obstacle.r * 0.7}
                                fill="var(--brass-dark)"
                                opacity="0.9"
                              />
                              <circle
                                cx={obstacle.x - obstacle.r * 0.2}
                                cy={obstacle.y - obstacle.r * 0.2}
                                r={obstacle.r * 0.25}
                                fill="var(--ivory)"
                                opacity="0.5"
                              />
                            </g>
                          );
                        }

                        if (obstacle.kind === "post") {
                          return (
                            <g key={`post-${index}`}>
                              <circle
                                cx={obstacle.x}
                                cy={obstacle.y}
                                r={obstacle.r * 1.7}
                                fill="var(--noir)"
                                opacity="0.7"
                              />
                              <circle
                                cx={obstacle.x}
                                cy={obstacle.y}
                                r={obstacle.r * 1.15}
                                fill="var(--brass-dark)"
                              />
                              <circle
                                cx={obstacle.x}
                                cy={obstacle.y}
                                r={obstacle.r * 0.8}
                                fill="var(--ivory)"
                                opacity="0.75"
                              />
                            </g>
                          );
                        }

                        if (obstacle.kind === "spinner") {
                          const spin = (performance.now() / 8 + index * 47) % 360;
                          return (
                            <g
                              key={`spinner-${index}`}
                              transform={`rotate(${spin} ${obstacle.x} ${obstacle.y})`}
                            >
                              {flash > 0 ? (
                                <circle
                                  cx={obstacle.x}
                                  cy={obstacle.y}
                                  r={obstacle.r * 2.2}
                                  fill="oklch(0.88 0.10 92 / 0.5)"
                                  filter="url(#glowSoft)"
                                />
                              ) : null}
                              <circle
                                cx={obstacle.x}
                                cy={obstacle.y}
                                r={obstacle.r}
                                fill="var(--noir)"
                                stroke="oklch(0.80 0.05 92)"
                                strokeWidth={0.35}
                                opacity="0.92"
                              />
                              {[0, 60, 120].map((a) => (
                                <line
                                  key={a}
                                  x1={
                                    obstacle.x - Math.cos((a * Math.PI) / 180) * obstacle.r * 0.85
                                  }
                                  y1={
                                    obstacle.y - Math.sin((a * Math.PI) / 180) * obstacle.r * 0.85
                                  }
                                  x2={
                                    obstacle.x + Math.cos((a * Math.PI) / 180) * obstacle.r * 0.85
                                  }
                                  y2={
                                    obstacle.y + Math.sin((a * Math.PI) / 180) * obstacle.r * 0.85
                                  }
                                  stroke="oklch(0.88 0.04 92)"
                                  strokeWidth={0.5}
                                  strokeLinecap="round"
                                />
                              ))}
                            </g>
                          );
                        }

                        if (obstacle.kind === "gong") {
                          return (
                            <g key={`gong-${index}`}>
                              {flash > 0 ? (
                                <circle
                                  cx={obstacle.x}
                                  cy={obstacle.y}
                                  r={obstacle.r * 2.8}
                                  fill="oklch(0.92 0.2 82 / 0.75)"
                                  filter="url(#glowSoft)"
                                />
                              ) : null}
                              <circle
                                cx={obstacle.x}
                                cy={obstacle.y}
                                r={obstacle.r}
                                fill="var(--brass-dark)"
                                stroke="oklch(0.9 0.18 82)"
                                strokeWidth={0.4}
                              />
                              <circle
                                cx={obstacle.x}
                                cy={obstacle.y}
                                r={obstacle.r * 0.6}
                                fill="oklch(0.9 0.18 82)"
                                opacity="0.7"
                              />
                              <text
                                x={obstacle.x}
                                y={obstacle.y + 0.9}
                                textAnchor="middle"
                                fontSize={obstacle.r * 1.1}
                                fill="var(--noir)"
                                fontWeight="700"
                              >
                                ☼
                              </text>
                            </g>
                          );
                        }

                        const isTarget = obstacle.kind === "target";
                        const size = obstacle.r * 2.7;
                        return (
                          <g key={`bumper-${index}`}>
                            <circle
                              cx={obstacle.x}
                              cy={obstacle.y}
                              r={obstacle.r * 2.0}
                              fill={
                                isTarget
                                  ? "oklch(0.55 0.22 22 / 0.30)"
                                  : "oklch(0.84 0.15 82 / 0.28)"
                              }
                              filter="url(#glowBig)"
                              opacity={flash > 0 ? 1 : 0.55}
                            />
                            <image
                              href={pinballBumperCuervo}
                              x={obstacle.x - size / 2}
                              y={obstacle.y - size / 2}
                              width={size}
                              height={size}
                              preserveAspectRatio="xMidYMid meet"
                              style={{
                                filter:
                                  flash > 0
                                    ? "drop-shadow(0 0 1.2px oklch(0.95 0.18 82))"
                                    : "drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.55))",
                              }}
                            />
                            {obstacle.label && obstacle.label.length > 1 ? (
                              <text
                                x={obstacle.x}
                                y={obstacle.y + obstacle.r + 1.6}
                                textAnchor="middle"
                                fontSize="1.8"
                                fill="var(--brass-bright)"
                                letterSpacing="0.18em"
                                opacity="0.95"
                              >
                                {obstacle.label}
                              </text>
                            ) : null}
                          </g>
                        );
                      })}

                      {}

                      {}
                      <g opacity="0.55" pointerEvents="none">
                        <path
                          d="M 22 37 Q 12 46 22 55"
                          fill="none"
                          stroke={levelMeta.ribbonTone}
                          strokeOpacity="0.6"
                          strokeWidth="0.9"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 78 37 Q 88 46 78 55"
                          fill="none"
                          stroke={levelMeta.ribbonTone}
                          strokeOpacity="0.6"
                          strokeWidth="0.9"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 42 76 Q 50 72 58 76"
                          fill="none"
                          stroke={levelMeta.ribbonTone}
                          strokeOpacity="0.5"
                          strokeWidth="0.7"
                          strokeLinecap="round"
                        />
                      </g>

                      {}
                      {DROP_TARGETS.map((dt, i) => {
                        const down = dropDown[i];
                        const flash = dropFlashRef.current[i] ?? 0;
                        return (
                          <g key={`drop-${i}`} opacity={down ? 0.18 : 1}>
                            <rect
                              x={dt.x - dt.w / 2}
                              y={dt.y - dt.h / 2}
                              width={dt.w}
                              height={dt.h}
                              rx="0.4"
                              fill={flash > 0 ? "oklch(0.92 0.18 82)" : "oklch(0.55 0.10 30 / 0.9)"}
                              stroke="var(--brass-bright)"
                              strokeWidth="0.28"
                            />
                            <text
                              x={dt.x}
                              y={dt.y + 0.7}
                              textAnchor="middle"
                              fontSize="1.7"
                              fill="var(--ivory)"
                              opacity={down ? 0.4 : 0.95}
                              style={{ fontFamily: "serif", letterSpacing: "0.05em" }}
                            >
                              {dt.label}
                            </text>
                          </g>
                        );
                      })}

                      {}
                      {levelMeta.magnetAvail && (
                        <g pointerEvents="none">
                          <circle
                            cx={MAGNET.x}
                            cy={MAGNET.y}
                            r={MAGNET.r * 1.6}
                            fill={
                              magnetActive
                                ? "oklch(0.60 0.22 25 / 0.5)"
                                : "oklch(0.30 0.05 40 / 0.25)"
                            }
                            filter="url(#glowBig)"
                          >
                            {magnetActive && (
                              <animate
                                attributeName="r"
                                values={`${MAGNET.r * 1.4};${MAGNET.r * 2.2};${MAGNET.r * 1.4}`}
                                dur="0.8s"
                                repeatCount="indefinite"
                              />
                            )}
                          </circle>
                          <circle
                            cx={MAGNET.x}
                            cy={MAGNET.y}
                            r={MAGNET.r}
                            fill="var(--noir)"
                            stroke={magnetActive ? "oklch(0.85 0.22 25)" : "var(--brass-dark)"}
                            strokeWidth="0.35"
                          />
                          <text
                            x={MAGNET.x}
                            y={MAGNET.y + 1}
                            textAnchor="middle"
                            fontSize="2.4"
                            fill={magnetActive ? "oklch(0.95 0.18 30)" : "var(--brass)"}
                            opacity="0.9"
                          >
                            ⌬
                          </text>
                        </g>
                      )}

                      {}
                      {levelMeta.boss && (
                        <g pointerEvents="none">
                          <text
                            x={50}
                            y={14}
                            textAnchor="middle"
                            fontSize="3.2"
                            fill={levelMeta.ribbonTone}
                            opacity="0.85"
                            style={{
                              fontFamily: "'Cinzel', 'Limelight', Georgia, serif",
                              letterSpacing: "0.18em",
                            }}
                          >
                            {levelMeta.boss.name.toUpperCase()}
                            <animate
                              attributeName="opacity"
                              values="0.55;0.95;0.55"
                              dur={
                                levelMeta.boss.id === "cuervo"
                                  ? "1.2s"
                                  : levelMeta.boss.id === "corvina"
                                    ? "1.8s"
                                    : "2.4s"
                              }
                              repeatCount="indefinite"
                            />
                          </text>
                          {levelMeta.boss.id === "cuervo" && (
                            <>
                              <text
                                x={16}
                                y={10}
                                fontSize="2.4"
                                fill="oklch(0.85 0.14 320)"
                                opacity="0.7"
                              >
                                ★
                                <animate
                                  attributeName="opacity"
                                  values="0.2;0.9;0.2"
                                  dur="0.9s"
                                  repeatCount="indefinite"
                                />
                              </text>
                              <text
                                x={84}
                                y={10}
                                fontSize="2.4"
                                fill="oklch(0.85 0.14 320)"
                                opacity="0.7"
                              >
                                ★
                                <animate
                                  attributeName="opacity"
                                  values="0.2;0.9;0.2"
                                  dur="1.1s"
                                  repeatCount="indefinite"
                                />
                              </text>
                            </>
                          )}
                          {levelMeta.boss.id === "corvina" && (
                            <text
                              x={50}
                              y={9}
                              textAnchor="middle"
                              fontSize="1.8"
                              fill="oklch(0.75 0.20 330)"
                              opacity="0.75"
                              style={{ letterSpacing: "0.35em" }}
                            >
                              ★ ★ ★
                            </text>
                          )}
                          {levelMeta.boss.id === "reina" && (
                            <text
                              x={50}
                              y={9}
                              textAnchor="middle"
                              fontSize="1.8"
                              fill="oklch(0.78 0.22 30)"
                              opacity="0.75"
                              style={{ letterSpacing: "0.32em" }}
                            >
                              ♥ ♦ ♥
                            </text>
                          )}
                        </g>
                      )}

                      {}
                      {dropBanks > 0 && (
                        <text
                          x={50}
                          y={38}
                          textAnchor="middle"
                          fontSize="1.8"
                          fill="var(--brass-bright)"
                          opacity="0.75"
                          style={{ letterSpacing: "0.28em" }}
                          pointerEvents="none"
                        >
                          BANKS ×{dropBanks}
                        </text>
                      )}

                      {dropRewardFlash && (
                        <text
                          key={dropRewardFlash.key}
                          x={50}
                          y={50}
                          textAnchor="middle"
                          fontSize="6"
                          fill="var(--brass-bright)"
                          style={{
                            fontFamily: "'Cinzel', 'Limelight', Georgia, serif",
                            letterSpacing: "0.12em",
                          }}
                          opacity="0"
                          pointerEvents="none"
                        >
                          BANK +{dropRewardFlash.amount}
                          <animate
                            attributeName="opacity"
                            values="0;1;1;0"
                            dur="1.6s"
                            fill="freeze"
                          />
                          <animate
                            attributeName="y"
                            values="55;45;40;35"
                            dur="1.6s"
                            fill="freeze"
                          />
                        </text>
                      )}

                      {ZONES.map((z) => {
                        const [lo, hi] = ZONE_RANGES[z];
                        const slotWidthZ = (SLOT_RIGHT - SLOT_LEFT) / SLOTS;
                        const xz = SLOT_LEFT + slotWidthZ * lo;
                        const wz = slotWidthZ * (hi - lo + 1);
                        const active = zone === z && phase === "idle";
                        return (
                          <rect
                            key={`zone-${z}`}
                            x={xz}
                            y="143.4"
                            width={wz}
                            height="11.6"
                            rx="1.4"
                            fill={active ? "oklch(0.84 0.15 82 / 0.16)" : "transparent"}
                            stroke={active ? "var(--brass-bright)" : "transparent"}
                            strokeOpacity={active ? 0.75 : 0}
                            strokeDasharray="1.2 1"
                            strokeWidth="0.5"
                          />
                        );
                      })}

                      {Array.from({ length: SLOTS - 1 }, (_, index) => {
                        const x = SLOT_LEFT + ((SLOT_RIGHT - SLOT_LEFT) / SLOTS) * (index + 1);
                        return (
                          <line
                            key={`divider-${index}`}
                            x1={x}
                            y1="146"
                            x2={x}
                            y2="154"
                            stroke="var(--brass)"
                            strokeOpacity="0.25"
                            strokeWidth="0.45"
                          />
                        );
                      })}

                      {MULTIPLIERS.map((multiplier, index) => {
                        const slotWidth = (SLOT_RIGHT - SLOT_LEFT) / SLOTS;
                        const x = SLOT_LEFT + slotWidth * index + slotWidth / 2;
                        const lit = resultSlot === index && phase === "result";
                        const isDust = mod.id === "dust" && multiplier === 0 && index === dustSlot;
                        const isLit = litSlot === index;

                        const haloColor =
                          lit && resultOutcome
                            ? resultOutcome === "jackpot10"
                              ? "oklch(0.88 0.18 82 / 0.85)"
                              : resultOutcome === "curse"
                                ? "oklch(0.55 0.22 22 / 0.85)"
                                : resultOutcome === "win"
                                  ? "oklch(0.82 0.15 82 / 0.75)"
                                  : "oklch(0.7 0.05 80 / 0.55)"
                            : null;
                        return (
                          <g key={`slot-${index}`}>
                            {isLit ? (
                              <rect
                                x={x - slotWidth / 2 - 0.4}
                                y="144.6"
                                width={slotWidth + 0.8}
                                height="9.6"
                                rx="1.2"
                                fill="oklch(0.84 0.15 82 / 0.45)"
                                filter="url(#glowBig)"
                              />
                            ) : null}
                            {haloColor ? (
                              <>
                                <rect
                                  x={x - slotWidth / 2 - 1.2}
                                  y="143.8"
                                  width={slotWidth + 2.4}
                                  height="11.2"
                                  rx="1.6"
                                  fill={haloColor}
                                  filter="url(#glowBig)"
                                >
                                  <animate
                                    attributeName="opacity"
                                    values="0.4;1;0.4"
                                    dur="0.7s"
                                    repeatCount="indefinite"
                                  />
                                </rect>
                                <rect
                                  x={x - slotWidth / 2 - 0.4}
                                  y="144.8"
                                  width={slotWidth + 0.8}
                                  height="9.4"
                                  rx="1.2"
                                  fill="none"
                                  stroke={
                                    resultOutcome === "curse"
                                      ? "var(--blood)"
                                      : "var(--brass-bright)"
                                  }
                                  strokeWidth="0.55"
                                >
                                  <animate
                                    attributeName="stroke-opacity"
                                    values="0.6;1;0.6"
                                    dur="0.7s"
                                    repeatCount="indefinite"
                                  />
                                </rect>
                              </>
                            ) : null}
                            <rect
                              x={x - slotWidth / 2 + 0.25}
                              y="145.4"
                              width={slotWidth - 0.5}
                              height="8.1"
                              rx="0.8"
                              fill={
                                lit
                                  ? "oklch(0.84 0.15 82 / 0.35)"
                                  : isLit
                                    ? "oklch(0.84 0.15 82 / 0.22)"
                                    : isDust
                                      ? "oklch(0.70 0.135 78 / 0.18)"
                                      : "oklch(0.05 0.008 25 / 0.55)"
                              }
                              stroke={
                                isLit
                                  ? "var(--brass-bright)"
                                  : multiplier < 0
                                    ? "var(--blood)"
                                    : "var(--brass)"
                              }
                              strokeOpacity={lit || isLit ? 0.9 : 0.28}
                              strokeWidth={isLit ? 0.7 : 0.45}
                            />
                            <image
                              href={SLOT_CARDS[index]}
                              x={x - 2.75}
                              y="146.2"
                              width="5.5"
                              height="5.9"
                              preserveAspectRatio="xMidYMid meet"
                              opacity={lit ? 1 : 0.92}
                            />
                            <text
                              x={x}
                              y="153.2"
                              textAnchor="middle"
                              fontSize="1.8"
                              fill={
                                lit ? "var(--noir)" : isLit ? "var(--brass-bright)" : "var(--ivory)"
                              }
                            >
                              {SLOT_LABELS[index]}
                            </text>
                          </g>
                        );
                      })}

                      {}
                      <g
                        transform={`translate(${PIVOT_L.x} ${PIVOT_L.y}) rotate(${leftDeg})`}
                        style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.7))" }}
                      >
                        <image
                          href={pinballFlipper}
                          x={-3.5}
                          y={-3}
                          width={20}
                          height={6.2}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </g>
                      <g
                        transform={`translate(${PIVOT_R.x} ${PIVOT_R.y}) rotate(${rightDeg})`}
                        style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.7))" }}
                      >
                        <image
                          href={pinballFlipper}
                          x={-3.5}
                          y={-3}
                          width={20}
                          height={6.2}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </g>

                      {}
                      {ball.live && trailRef.current.length > 1 ? (
                        <g pointerEvents="none">
                          {trailRef.current.map((p, i) => {
                            const alpha = (p.life / 0.32) * 0.55;
                            const r = BALL_R * (0.4 + (i / trailRef.current.length) * 0.85);
                            return (
                              <circle
                                key={`tr-${i}`}
                                cx={p.x}
                                cy={p.y}
                                r={r}
                                fill="oklch(0.92 0.16 82)"
                                opacity={alpha}
                              />
                            );
                          })}
                        </g>
                      ) : null}

                      {}
                      {phase === "result" && resultTrail && resultTrail.length > 1 ? (
                        <g pointerEvents="none" opacity="0.7">
                          <polyline
                            points={resultTrail.map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke={
                              resultOutcome === "jackpot10"
                                ? "var(--brass-bright)"
                                : resultOutcome === "curse"
                                  ? "var(--blood)"
                                  : "var(--brass)"
                            }
                            strokeWidth="0.45"
                            strokeOpacity="0.85"
                            strokeDasharray="1.2 1.2"
                          >
                            <animate
                              attributeName="stroke-dashoffset"
                              from="0"
                              to="-12"
                              dur="1.4s"
                              repeatCount="indefinite"
                            />
                          </polyline>
                        </g>
                      ) : null}

                      {}
                      {sparksRef.current.length > 0 ? (
                        <g pointerEvents="none">
                          {sparksRef.current.map((s, i) => {
                            const t = s.life / s.max;
                            return (
                              <circle
                                key={`sp-${i}`}
                                cx={s.x}
                                cy={s.y}
                                r={0.35 + t * 0.45}
                                fill={s.gold ? "oklch(0.92 0.18 82)" : "oklch(0.85 0.04 70)"}
                                opacity={t}
                              />
                            );
                          })}
                        </g>
                      ) : null}

                      {ball.live ? (
                        <g style={{ filter: "drop-shadow(0 1px 1.2px rgba(0,0,0,0.75))" }}>
                          <ellipse
                            cx={ball.x}
                            cy={ball.y + 1.2}
                            rx={BALL_R * 1.2}
                            ry={BALL_R * 0.4}
                            fill="oklch(0 0 0 / 0.55)"
                          />
                          <circle
                            cx={ball.x}
                            cy={ball.y}
                            r={BALL_R * 1.7}
                            fill={levelMeta.ballHalo}
                            filter="url(#glowSoft)"
                          />
                          <image
                            href={pinballBall}
                            x={ball.x - BALL_R * 1.35}
                            y={ball.y - BALL_R * 1.35}
                            width={BALL_R * 2.7}
                            height={BALL_R * 2.7}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        </g>
                      ) : null}

                      {}
                      {ball2Ref.current.live ? (
                        <g style={{ filter: "drop-shadow(0 1px 1.2px rgba(0,0,0,0.75))" }}>
                          <ellipse
                            cx={ball2Ref.current.x}
                            cy={ball2Ref.current.y + 1.2}
                            rx={BALL_R * 1.2}
                            ry={BALL_R * 0.4}
                            fill="oklch(0 0 0 / 0.55)"
                          />
                          <circle
                            cx={ball2Ref.current.x}
                            cy={ball2Ref.current.y}
                            r={BALL_R * 1.9}
                            fill="oklch(0.55 0.22 320 / 0.55)"
                            filter="url(#glowSoft)"
                          />
                          <image
                            href={pinballBall}
                            x={ball2Ref.current.x - BALL_R * 1.35}
                            y={ball2Ref.current.y - BALL_R * 1.35}
                            width={BALL_R * 2.7}
                            height={BALL_R * 2.7}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        </g>
                      ) : null}
                    </svg>

                    <AnimatePresence>
                      {bumperBonus ? (
                        <motion.div
                          key={bumperBonus.id}
                          initial={{ opacity: 0, y: 0, scale: 0.82 }}
                          animate={{ opacity: 1, y: -18, scale: 1 }}
                          exit={{ opacity: 0, y: -28 }}
                          transition={{ duration: 0.55 }}
                          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-full border border-[var(--brass-bright)] bg-[var(--noir)]/86 px-2 py-[2px] font-display text-[11px] uppercase tracking-[0.22em] text-[var(--brass-bright)] shadow-[0_0_14px_rgba(255,220,140,0.72)]"
                          style={{
                            left: `${bumperBonus.x}%`,
                            top: `${(bumperBonus.y / H) * 100}%`,
                          }}
                        >
                          +{bumperBonus.amount}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <AnimatePresence>
                      {comboDisplay ? (
                        <motion.div
                          key={comboDisplay.key}
                          initial={{ opacity: 0, scale: 0.6, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          transition={{ type: "spring", stiffness: 320, damping: 18 }}
                          className="pointer-events-none absolute left-1/2 top-[18%] z-30 -translate-x-1/2 text-center"
                        >
                          <div className="rounded-md border-2 border-[var(--brass-bright)] bg-gradient-to-b from-[oklch(0.30_0.18_28)] to-[oklch(0.12_0.08_25)] px-4 py-1.5 font-display uppercase shadow-[0_0_22px_rgba(255,200,90,0.85)]">
                            <div className="text-[11px] tracking-[0.42em] text-[var(--ivory)]/85">
                              combo x{comboDisplay.count}
                            </div>
                            <div
                              className="text-lg font-bold leading-none tracking-[0.18em] text-[var(--brass-bright)]"
                              style={{ textShadow: "0 0 12px rgba(255,210,120,0.9)" }}
                            >
                              ×{comboDisplay.mult} fichas
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <AnimatePresence>
                      {phase === "result" && lastWin !== null ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="pointer-events-none absolute inset-x-0 top-[46%] z-20 -translate-y-1/2 text-center"
                        >
                          <div
                            className={`mx-auto inline-flex max-w-[84%] items-center justify-center rounded-full border px-5 py-2 font-display text-sm uppercase tracking-[0.28em] backdrop-blur-sm ${
                              lastWin > 0
                                ? "border-[var(--brass)] bg-[var(--noir)]/78 text-[var(--brass-bright)]"
                                : lastWin < 0
                                  ? "border-[var(--blood)] bg-[var(--blood)]/28 text-[var(--ivory)]"
                                  : "border-[var(--oxblood)] bg-[var(--noir)]/72 text-[var(--ivory)]/70"
                            }`}
                          >
                            {lastWin > 0
                              ? `+${lastWin} fichas`
                              : lastWin < 0
                                ? `maldición ${lastWin}`
                                : "sin premio"}
                          </div>
                          {resultZoneHit !== null ? (
                            <div
                              className={`mx-auto mt-1 inline-flex max-w-[84%] items-center justify-center rounded-full border px-3 py-0.5 font-display text-[11px] uppercase tracking-[0.2em] ${
                                resultZoneHit
                                  ? "border-[var(--brass)] text-[var(--brass-bright)]"
                                  : "border-[var(--ivory)]/25 text-[var(--ivory)]/55"
                              }`}
                            >
                              {resultZoneHit
                                ? `zona ${ZONE_LABELS[zone].toLowerCase()} · bonus ×1.25`
                                : `fuera de ${ZONE_LABELS[zone].toLowerCase()} · ×0.85`}
                            </div>
                          ) : null}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </FitBoardArea>

                {}
                <div className="mt-4">
                  <div className="flex items-center justify-between font-display text-[11px] uppercase tracking-[0.34em] text-[var(--ivory)]/65">
                    <span className="flex items-center gap-2">
                      medidor de fuerza
                      <button
                        type="button"
                        onClick={() => setSettingsOpen((v) => !v)}
                        aria-label="Ajustes del medidor"
                        title="Ajustes: sensibilidad, vibración, fuerza en vivo"
                        className="grid h-5 w-5 place-items-center rounded-full border border-[var(--brass)]/40 text-[11px] text-[var(--brass)]/85 transition hover:border-[var(--brass-bright)] hover:text-[var(--brass-bright)]"
                      >
                        ⚙
                      </button>
                    </span>
                    <span style={{ color: meterArmed ? meterZoneColor : undefined }}>
                      {meterArmed
                        ? meterSettings.showLiveForce
                          ? `${meterZoneLabel} · ${liveForce}%`
                          : meterZoneLabel
                        : "mantén presionado"}
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-4 overflow-hidden rounded-full border border-[var(--brass)]/40 bg-[var(--noir)]/85 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)]">
                    {}
                    <div className="absolute inset-0 flex">
                      <div
                        style={{
                          width: "20%",
                          background: "linear-gradient(180deg,#8e2f27,#4a1512)",
                        }}
                      />
                      <div
                        style={{
                          width: "20%",
                          background: "linear-gradient(180deg,#c39a3c,#6b521a)",
                        }}
                      />
                      <div
                        style={{
                          width: "20%",
                          background: "linear-gradient(180deg,#5f8f4e,#25401f)",
                        }}
                      />
                      <div
                        style={{
                          width: "20%",
                          background: "linear-gradient(180deg,#c39a3c,#6b521a)",
                        }}
                      />
                      <div
                        style={{
                          width: "20%",
                          background: "linear-gradient(180deg,#8e2f27,#4a1512)",
                        }}
                      />
                    </div>
                    {}
                    <div className="pointer-events-none absolute inset-y-0 left-[20%] w-px bg-black/60" />
                    <div className="pointer-events-none absolute inset-y-0 left-[40%] w-px bg-black/60" />
                    <div className="pointer-events-none absolute inset-y-0 left-[60%] w-px bg-black/60" />
                    <div className="pointer-events-none absolute inset-y-0 left-[80%] w-px bg-black/60" />
                    {}
                    {meterArmed ? (
                      <div
                        className="absolute top-[-3px] bottom-[-3px] w-[3px] rounded-sm bg-[var(--ivory)] shadow-[0_0_10px_rgba(255,255,255,0.95)]"
                        style={{ left: `calc(${meterPos * 100}% - 1.5px)` }}
                      />
                    ) : null}
                    {}
                    {!meterArmed ? <div className="absolute inset-0 bg-black/55" /> : null}
                  </div>
                  {settingsOpen ? (
                    <div className="mt-2 rounded-xl border border-[var(--brass)]/35 bg-[var(--noir)]/90 p-3 text-[11px] text-[var(--ivory)]/85 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]">
                      <div className="flex items-center justify-between font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/80">
                        <span>ajustes del medidor</span>
                        <button
                          type="button"
                          onClick={() => setSettingsOpen(false)}
                          className="text-[var(--ivory)]/60 hover:text-[var(--ivory)]"
                          aria-label="Cerrar ajustes"
                        >
                          ✕
                        </button>
                      </div>
                      <label className="mt-3 block">
                        <div className="flex items-center justify-between">
                          <span>Suavizado (sensibilidad)</span>
                          <span className="text-[var(--brass-bright)]">
                            {Math.round(meterSettings.sensitivity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(meterSettings.sensitivity * 100)}
                          onChange={(e) => {
                            const next = saveMeterSettings({
                              sensitivity: Number(e.target.value) / 100,
                            });
                            setMeterSettings(next);
                          }}
                          className="mt-1 w-full accent-[var(--brass-bright)]"
                          aria-label="Sensibilidad del medidor"
                        />
                        <div className="mt-0.5 flex justify-between text-[11px] uppercase tracking-[0.24em] text-[var(--ivory)]/45">
                          <span>rápido</span>
                          <span>suave</span>
                        </div>
                      </label>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 rounded-lg border border-[var(--brass)]/25 bg-[var(--noir)]/70 px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={meterSettings.hapticsEnabled}
                            onChange={(e) => {
                              const next = saveMeterSettings({ hapticsEnabled: e.target.checked });
                              setMeterSettings(next);
                            }}
                            className="accent-[var(--brass-bright)]"
                          />
                          <span>Vibración</span>
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-[var(--brass)]/25 bg-[var(--noir)]/70 px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={meterSettings.showLiveForce}
                            onChange={(e) => {
                              const next = saveMeterSettings({ showLiveForce: e.target.checked });
                              setMeterSettings(next);
                            }}
                            className="accent-[var(--brass-bright)]"
                          />
                          <span>Fuerza en vivo</span>
                        </label>
                      </div>
                      <BagatelleSfxVolumeSlider />
                      <div className="mt-2 text-[11px] text-[var(--ivory)]/50">
                        Se guarda en el dispositivo. Ideal para pantallas chicas: subí el suavizado
                        para clavar el verde.
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      nudge(-1);
                    }}
                    disabled={phase !== "playing" || tiltActive}
                    title="Nudge izquierdo — 4 en 4s = TILT"
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                    className="rounded-full border border-[var(--brass)]/35 bg-[linear-gradient(180deg,oklch(0.28_0.08_28),oklch(0.12_0.03_25))] px-2 py-2.5 font-display text-[11px] uppercase tracking-[0.15em] text-[var(--brass)]/85 shadow-[inset_0_2px_8px_rgba(0,0,0,0.75)] transition active:translate-y-[1px] disabled:opacity-45 sm:py-3 sm:tracking-[0.2em]"
                  >
                    ↖<span className="ml-1 hidden sm:inline">Z</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
                      pressLeft();
                    }}
                    onPointerUp={releaseLeft}
                    onPointerCancel={releaseLeft}
                    onPointerLeave={releaseLeft}
                    disabled={phase !== "playing"}
                    title="Mantené presionado para hacer cradle"
                    style={{
                      touchAction: "none",
                      WebkitTapHighlightColor: "transparent",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                    }}
                    className="min-w-0 truncate rounded-full border border-[var(--brass)]/35 bg-[linear-gradient(180deg,oklch(0.28_0.08_28),oklch(0.12_0.03_25))] px-2 py-2.5 font-display text-[12px] uppercase tracking-[0.18em] text-[var(--brass-bright)] shadow-[inset_0_2px_8px_rgba(0,0,0,0.75)] transition active:translate-y-[1px] disabled:opacity-45 sm:px-3 sm:py-3 sm:text-[11px] sm:tracking-[0.3em]"
                  >
                    <span aria-label="Flipper izquierdo" className="text-lg leading-none sm:hidden">
                      ◀
                    </span>
                    <span className="hidden sm:inline">◀ izquierda</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      try {
                        (event.currentTarget as HTMLButtonElement).setPointerCapture(
                          event.pointerId,
                        );
                      } catch {}
                      armMeter();
                    }}
                    onPointerUp={(event) => {
                      event.preventDefault();
                      if (meterActiveRef.current) fireMeter();
                    }}
                    onPointerCancel={() => {
                      if (meterActiveRef.current) fireMeter();
                    }}
                    onPointerLeave={(event) => {
                      event.preventDefault();
                    }}
                    disabled={phase !== "idle" || (!freeBall && chips < stake)}
                    style={{
                      touchAction: "none",
                      WebkitTapHighlightColor: "transparent",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                    }}
                    className={`min-w-0 truncate rounded-full border px-2 py-3 font-display text-[11px] uppercase tracking-[0.08em] text-[var(--ivory)] shadow-[0_14px_26px_-14px_rgba(180,40,40,0.95)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-[11px] sm:tracking-[0.34em] ${
                      freeBall
                        ? "border-[var(--brass-bright)] bg-[linear-gradient(180deg,oklch(0.46_0.18_82),oklch(0.24_0.10_70))]"
                        : "border-[var(--brass)] bg-[linear-gradient(180deg,oklch(0.34_0.16_20),oklch(0.20_0.10_20))]"
                    }`}
                  >
                    {meterArmed
                      ? meterSettings.showLiveForce
                        ? `SOLTAR · ${liveForce}%`
                        : "SOLTAR"
                      : freeBall && phase === "idle"
                        ? "★ GRATIS · MANTÉN"
                        : launchLabel}
                  </button>
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
                      pressRight();
                    }}
                    onPointerUp={releaseRight}
                    onPointerCancel={releaseRight}
                    onPointerLeave={releaseRight}
                    disabled={phase !== "playing"}
                    title="Mantené presionado para hacer cradle"
                    style={{
                      touchAction: "none",
                      WebkitTapHighlightColor: "transparent",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                    }}
                    className="min-w-0 truncate rounded-full border border-[var(--brass)]/35 bg-[linear-gradient(180deg,oklch(0.28_0.08_28),oklch(0.12_0.03_25))] px-2 py-2.5 font-display text-[12px] uppercase tracking-[0.18em] text-[var(--brass-bright)] shadow-[inset_0_2px_8px_rgba(0,0,0,0.75)] transition active:translate-y-[1px] disabled:opacity-45 sm:px-3 sm:py-3 sm:text-[11px] sm:tracking-[0.3em]"
                  >
                    <span aria-label="Flipper derecho" className="text-lg leading-none sm:hidden">
                      ▶
                    </span>
                    <span className="hidden sm:inline">derecha ▶</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      nudge(1);
                    }}
                    disabled={phase !== "playing" || tiltActive}
                    title="Nudge derecho — cuidado con el TILT"
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                    className="rounded-full border border-[var(--brass)]/35 bg-[linear-gradient(180deg,oklch(0.28_0.08_28),oklch(0.12_0.03_25))] px-2 py-2.5 font-display text-[11px] uppercase tracking-[0.15em] text-[var(--brass)]/85 shadow-[inset_0_2px_8px_rgba(0,0,0,0.75)] transition active:translate-y-[1px] disabled:opacity-45 sm:py-3 sm:tracking-[0.2em]"
                  >
                    ↗<span className="ml-1 hidden sm:inline">X</span>
                  </button>
                </div>

                <div className="mt-2 hidden text-center font-display text-[11px] uppercase tracking-[0.22em] text-[var(--ivory)]/55 sm:block sm:tracking-[0.34em]">
                  Tocá los botones laterales y mantené pulsado para retener · deslizá suave para
                  empujar
                </div>
              </div>
            </div>
          </section>

          <aside
            data-mobile-keep
            className="desktop-rail mx-auto flex w-full min-w-0 max-w-[680px] flex-col gap-4 md:order-1 md:mx-0 md:max-w-[260px] lg:max-w-[300px] lg:order-1"
          >
            <div data-mobile-hide>
              <NpcPortraitCard name={hostFull} line={reaction.line} npcId={hostess}>
                {isShauna ? (
                  <img
                    src={
                      reaction.mood === "triunfante"
                        ? shaunaWinAsset
                        : reaction.mood === "triste"
                          ? shaunaLoseAsset
                          : reaction.mood === "sorprendida"
                            ? shaunaTenseAsset
                            : reaction.mood === "enfadada"
                              ? shaunaAngryAsset
                              : reaction.mood === "seductora"
                                ? shaunaFlirtyAsset
                                : shaunaPortraitAsset
                    }
                    alt="Shauna"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                ) : (
                  <LolaPortrait
                    pose={reaction.pose}
                    mood={reaction.mood}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                )}
              </NpcPortraitCard>
            </div>

            <div
              data-bagatelle-stakes
              className="rounded-[1.2rem] border border-[var(--brass)]/25 bg-[var(--noir)]/72 p-1.5 sm:p-4"
            >
              <div className="hidden font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90 sm:block">
                apuesta
              </div>
              <div className="flex flex-nowrap gap-1.5 sm:mt-3 sm:flex-wrap sm:gap-2">
                {STAKES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    data-inline-chip
                    onClick={() => setStake(value)}
                    disabled={phase !== "idle"}
                    className={`min-h-9 flex-1 rounded-full border px-2 py-1 font-display text-[11px] tracking-[0.18em] transition disabled:opacity-50 sm:min-h-0 sm:flex-none sm:px-3 ${
                      stake === value
                        ? "border-[var(--brass)] bg-[var(--brass)]/18 text-[var(--brass-bright)]"
                        : "border-[var(--brass)]/25 text-[var(--ivory)]/72 hover:border-[var(--brass)]/60"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div
              data-bagatelle-zone
              className="rounded-[1.2rem] border border-[var(--brass)]/25 bg-[var(--noir)]/72 p-1.5 sm:p-4"
            >
              <div className="hidden font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90 sm:block">
                zona elegida · <span className="text-[var(--brass-bright)]">×1.25</span> si acierta,{" "}
                <span className="text-[var(--ivory)]/50">×0.85</span> si no
              </div>
              <div className="flex flex-nowrap gap-1.5 sm:mt-3 sm:flex-wrap sm:gap-2">
                {ZONES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    data-inline-chip
                    onClick={() => setZone(value)}
                    disabled={phase !== "idle"}
                    className={`min-h-9 flex-1 rounded-full border px-2 py-1 font-display text-[11px] uppercase tracking-[0.14em] transition disabled:opacity-50 sm:min-h-0 sm:flex-none sm:px-3 sm:text-[11px] ${
                      zone === value
                        ? "border-[var(--brass)] bg-[var(--brass)]/18 text-[var(--brass-bright)]"
                        : "border-[var(--brass)]/25 text-[var(--ivory)]/72 hover:border-[var(--brass)]/60"
                    }`}
                  >
                    {ZONE_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>

            <div
              data-mobile-hide
              className="rounded-[1.2rem] border border-[var(--brass)]/25 bg-[var(--noir)]/72 p-4"
            >
              <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                reglas de esta ronda
              </div>
              <div className="mt-2 font-script text-[1.9rem] leading-none text-[var(--brass-bright)] text-glow-brass">
                {mod.name}
              </div>
              <div className="mt-1 text-sm italic text-[var(--ivory)]/70">{mod.blurb}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--ivory)]/65">
                <div className="rounded-[0.8rem] border border-[var(--brass)]/15 bg-[var(--noir)]/60 px-3 py-2">
                  5 bumpers
                </div>
                <div className="rounded-[0.8rem] border border-[var(--brass)]/15 bg-[var(--noir)]/60 px-3 py-2">
                  slings vivos
                </div>
                <div className="rounded-[0.8rem] border border-[var(--brass)]/15 bg-[var(--noir)]/60 px-3 py-2">
                  lanes arriba
                </div>
                <div className="rounded-[0.8rem] border border-[var(--brass)]/15 bg-[var(--noir)]/60 px-3 py-2">
                  jackpot central
                </div>
              </div>
            </div>

            {}
            <div
              data-mobile-hide
              className="rounded-[1.2rem] border border-[var(--brass)]/25 bg-[var(--noir)]/72 p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                  rango del cuervo
                </div>
                <div className="font-mono text-[11px] text-[var(--ivory)]/60">
                  {missionsTotal} misión{missionsTotal === 1 ? "" : "es"}
                </div>
              </div>
              <div className="mt-1 font-script text-[1.35rem] leading-none text-[var(--brass-bright)] text-glow-brass">
                {rank.name}
              </div>
              {nextRank ? (
                <>
                  <div className="mt-2 relative h-2 overflow-hidden rounded-full border border-[var(--brass)]/30 bg-[var(--noir)]/85">
                    <div
                      className="absolute inset-y-0 left-0 transition-[width] duration-200"
                      style={{
                        width: `${Math.min(100, ((missionsTotal - rank.threshold) / (nextRank.threshold - rank.threshold)) * 100)}%`,
                        background: "linear-gradient(90deg,#6b2418,#d9a83a)",
                      }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--ivory)]/55">
                    próximo: {nextRank.name} · {nextRank.threshold - missionsTotal} restantes
                  </div>
                </>
              ) : (
                <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--brass-bright)]/80">
                  rango máximo alcanzado
                </div>
              )}
              <div className="mt-2 text-[11px] text-[var(--ivory)]/65">
                cash-out ×{rank.perks.cashoutMul.toFixed(2)} · imán +
                {Math.round(rank.perks.magnetBonusMs / 100) / 10}s
              </div>

              {}
              <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-[var(--brass)]/20 bg-[var(--noir)]/60 px-2 py-1.5">
                <span className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--brass)]/90">
                  kickback
                </span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => {
                    const armed = kickbackHits > i && !kickbackUsedBallRef.current;
                    return (
                      <span
                        key={i}
                        className="inline-block h-2 w-4 rounded-sm border transition"
                        style={{
                          borderColor: armed ? "var(--brass-bright)" : "var(--brass)",
                          background: armed
                            ? "linear-gradient(90deg,#d9a83a,var(--cd-gold-glim))"
                            : "transparent",
                          opacity: armed ? 1 : 0.35,
                        }}
                      />
                    );
                  })}
                  <span className="ml-1 font-mono text-[11px] text-[var(--ivory)]/70">
                    {Math.min(3, kickbackHits)}/3
                  </span>
                </div>
              </div>

              {}
              {wormReady && (
                <div className="mt-2 rounded-md border border-[oklch(0.55_0.22_330)]/60 bg-[oklch(0.20_0.10_320)]/40 px-2 py-1.5 text-center font-display text-[11px] uppercase tracking-[0.24em] text-[oklch(0.85_0.18_320)]">
                  túnel armado — pegá al gong
                </div>
              )}

              {}
              {multiballActive && (
                <div className="mt-2 rounded-md border border-[oklch(0.55_0.22_320)]/70 bg-[oklch(0.20_0.10_320)]/50 px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[11px] uppercase tracking-[0.24em] text-[oklch(0.85_0.18_320)]">
                      ★ multibola ×2
                    </span>
                    <span className="font-mono text-[11px] text-[var(--ivory)]/75">
                      {Math.ceil(multiballRemaining / 1000)}s
                    </span>
                  </div>
                  <div className="mt-1 relative h-1 overflow-hidden rounded-full bg-[var(--noir)]/70">
                    <div
                      className="absolute inset-y-0 left-0 transition-[width]"
                      style={{
                        width: `${(multiballRemaining / MULTIBALL_DURATION_MS) * 100}%`,
                        background: "oklch(0.65 0.22 320)",
                      }}
                    />
                  </div>
                </div>
              )}

              {}
              {bankMode && (
                <div
                  className="mt-2 rounded-md border px-2 py-1.5"
                  style={{
                    borderColor: bankMode.color,
                    background: `color-mix(in oklch, ${bankMode.color} 12%, transparent)`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-display text-[11px] uppercase tracking-[0.24em]"
                      style={{ color: bankMode.color }}
                    >
                      {bankMode.name}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--ivory)]/75">
                      {Math.ceil(bankModeRemaining / 1000)}s
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] italic text-[var(--ivory)]/70">
                    {bankMode.hint}
                  </div>
                  <div className="mt-1 relative h-1 overflow-hidden rounded-full bg-[var(--noir)]/70">
                    <div
                      className="absolute inset-y-0 left-0 transition-[width]"
                      style={{
                        width: `${(bankModeRemaining / BANK_MODE_DURATION_MS) * 100}%`,
                        background: bankMode.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {}
            <AnimatePresence>
              {rankUpFlash && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-[1.2rem] border border-[var(--brass-bright)]/80 bg-[var(--brass)]/20 p-3 text-center font-display text-[12px] uppercase tracking-[0.28em] text-[var(--brass-bright)] text-glow-brass"
                >
                  ★ ascenso: {rankUpFlash}
                </motion.div>
              )}
            </AnimatePresence>

            {}
            <AnimatePresence>
              {kickbackFlash && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-md border border-[var(--brass-bright)]/70 bg-[var(--noir)]/85 px-3 py-1.5 text-center font-display text-[11px] uppercase tracking-[0.24em] text-[var(--brass-bright)]"
                >
                  ★ kickback de plumas
                </motion.div>
              )}
            </AnimatePresence>

            {}
            <AnimatePresence>
              {wormFlash && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-md border border-[oklch(0.55_0.22_330)]/70 bg-[oklch(0.15_0.08_320)]/85 px-3 py-1.5 text-center font-display text-[11px] uppercase tracking-[0.24em] text-[oklch(0.85_0.18_320)]"
                >
                  túnel de gusano → jackpot
                </motion.div>
              )}
              {multiballFlash && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-md border border-[oklch(0.55_0.22_320)]/80 bg-[oklch(0.20_0.10_320)]/85 px-3 py-1.5 text-center font-display text-[11px] uppercase tracking-[0.24em] text-[oklch(0.90_0.18_320)]"
                >
                  ★ multibola — 15 s a doble puntaje
                </motion.div>
              )}
            </AnimatePresence>

            <div
              data-mobile-hide
              className={`rounded-[1.2rem] border p-4 transition ${missionDone ? "border-[var(--brass-bright)]/70 bg-[var(--brass)]/12" : "border-[var(--brass)]/25 bg-[var(--noir)]/72"}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                  misión de Lola
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !muted;
                    setMuted(next);
                    bagatelleAudio.setMuted(next);
                  }}
                  className="rounded-full border border-[var(--brass)]/30 bg-[var(--noir)]/70 px-2 py-[2px] font-display text-[11px] uppercase tracking-[0.22em] text-[var(--ivory)]/75 hover:border-[var(--brass)]/60"
                  title={muted ? "Activar sonido" : "Silenciar sonido"}
                >
                  {muted ? "🔇 sonido" : "🔊 sonido"}
                </button>
              </div>
              <div className="mt-2 font-script text-[1.5rem] leading-none text-[var(--brass-bright)] text-glow-brass">
                {mission.label}
              </div>
              <div className="mt-1 text-xs italic text-[var(--ivory)]/70">{mission.hint}</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full border border-[var(--brass)]/30 bg-[var(--noir)]/85">
                  <div
                    className="absolute inset-y-0 left-0 transition-[width] duration-200"
                    style={{
                      width: `${Math.min(100, (missionProgress / mission.target) * 100)}%`,
                      background: missionDone
                        ? "linear-gradient(90deg,#d9a83a,var(--cd-gold-glim))"
                        : "linear-gradient(90deg,#6b2418,#a8332b)",
                    }}
                  />
                </div>
                <span className="font-mono text-[11px] text-[var(--ivory)]/80">
                  {missionProgress}/{mission.target}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em]">
                <span className="text-[var(--ivory)]/55">recompensa</span>
                <span
                  className={missionDone ? "text-[var(--brass-bright)]" : "text-[var(--brass)]"}
                >
                  {missionDone ? "✓ cobrada" : `+${mission.reward} fichas`}
                </span>
              </div>
              {freeBall ? (
                <div className="mt-3 rounded-md border border-[var(--brass-bright)]/60 bg-[var(--brass)]/15 px-3 py-1.5 text-center font-display text-[11px] uppercase tracking-[0.24em] text-[var(--brass-bright)]">
                  ★ próxima bola GRATIS por jackpot
                </div>
              ) : null}
            </div>

            <div
              data-mobile-hide
              className="rounded-[1.2rem] border border-[var(--brass)]/25 bg-[var(--noir)]/72 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                  carga del cuervo
                </div>
                <div
                  className="font-display text-[11px] tracking-[0.24em]"
                  style={{ color: cargaTierColor }}
                >
                  {cargaTier}
                </div>
              </div>
              <div className="relative mt-2 h-3 overflow-hidden rounded-full border border-[var(--brass)]/30 bg-[var(--noir)]/85 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-200"
                  style={{
                    width: `${carga}%`,
                    background: "linear-gradient(90deg,#7a3a1f,#d9a83a 55%,var(--cd-gold-glim))",
                    boxShadow:
                      carga >= CARGA_PLUMAS ? "0 0 12px rgba(255,210,120,0.85)" : undefined,
                  }}
                />
                <div className="pointer-events-none absolute inset-y-0 left-[30%] w-px bg-black/55" />
                <div className="pointer-events-none absolute inset-y-0 left-[60%] w-px bg-black/55" />
                <div className="pointer-events-none absolute inset-y-0 left-[90%] w-px bg-black/55" />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 font-display text-[11px] uppercase tracking-[0.2em] text-[var(--ivory)]/60">
                <div className={carga >= CARGA_INDULTO ? "text-[var(--ivory)]" : ""}>
                  30 · indulto
                </div>
                <div
                  className={`text-center ${carga >= CARGA_BENDICION ? "text-[var(--brass)]" : ""}`}
                >
                  60 · bendición
                </div>
                <div
                  className={`text-right ${carga >= CARGA_PLUMAS ? "text-[var(--brass-bright)]" : ""}`}
                >
                  90 · plumas
                </div>
              </div>

              {}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                  letras
                </div>
                <div className="flex gap-1">
                  {["C", "U", "E", "R", "V", "O"].map((L, i) => {
                    const lit = i < cuervoIndex;
                    return (
                      <span
                        key={L}
                        className={`flex h-5 w-5 items-center justify-center rounded-sm border font-display text-[11px] ${cuervoBonus ? "animate-pulse" : ""}`}
                        style={{
                          borderColor: lit ? "var(--brass-bright)" : "var(--brass)",
                          background: lit ? "rgba(217,168,58,0.25)" : "rgba(0,0,0,0.45)",
                          color: lit ? "var(--brass-bright)" : "var(--brass)",
                          opacity: lit ? 1 : 0.4,
                          boxShadow: cuervoBonus ? "0 0 8px rgba(255,210,120,0.9)" : undefined,
                        }}
                      >
                        {L}
                      </span>
                    );
                  })}
                </div>
              </div>
              {cuervoBonus ? (
                <div className="mt-2 rounded-md border border-[var(--brass-bright)]/60 bg-[var(--brass)]/15 px-2 py-1 text-center font-display text-[11px] uppercase tracking-[0.24em] text-[var(--brass-bright)]">
                  ★ CUERVO completo · ×2 al cobrar + bola gratis
                </div>
              ) : null}
              {ballSaveActive ? (
                <div className="mt-2 rounded-md border border-[var(--ivory)]/40 bg-[var(--noir)]/85 px-2 py-1 text-center font-display text-[11px] uppercase tracking-[0.24em] text-[var(--ivory)]">
                  ◐ escudo de Lola activo
                </div>
              ) : null}

              {litSlot !== null ? (
                <div className="mt-3 rounded-md border border-[var(--brass-bright)]/60 bg-[var(--brass)]/12 px-2 py-1.5">
                  <div className="flex items-center justify-between font-display text-[11px] uppercase tracking-[0.22em] text-[var(--brass-bright)]">
                    <span>ranura iluminada</span>
                    <span>{SLOT_LABELS[litSlot]} · +2x</span>
                  </div>
                  <div className="relative mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--noir)]/85">
                    <div
                      className="absolute inset-y-0 left-0 transition-[width] duration-150"
                      style={{
                        width: `${Math.max(0, Math.min(100, (litTimer / 12) * 100))}%`,
                        background:
                          litTimer < 3
                            ? "linear-gradient(90deg,#a8332b,#e0524a)"
                            : "linear-gradient(90deg,#d9a83a,var(--cd-gold-glim))",
                      }}
                    />
                  </div>
                  <div className="mt-1 text-right font-mono text-[11px] text-[var(--ivory)]/55">
                    {litTimer.toFixed(1)}s
                  </div>
                </div>
              ) : null}

              <div className="mt-3 border-t border-[var(--brass)]/15 pt-3">
                <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                  probabilidades
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-[var(--ivory)]/80">
                  <div className="rounded-md border border-[var(--brass)]/20 bg-[var(--noir)]/60 px-2 py-1.5 text-center">
                    <div className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--ivory)]/55">
                      ganar
                    </div>
                    <div className="font-mono text-[var(--brass-bright)]">
                      {Math.round(winChance * 100)}%
                    </div>
                  </div>
                  <div className="rounded-md border border-[var(--blood)]/35 bg-[var(--blood)]/10 px-2 py-1.5 text-center">
                    <div className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--ivory)]/55">
                      maldición
                    </div>
                    <div className="font-mono text-[var(--blood)]">
                      {Math.round(curseChance * 100)}%
                    </div>
                  </div>
                  <div className="rounded-md border border-[var(--brass-bright)]/45 bg-[var(--brass)]/10 px-2 py-1.5 text-center">
                    <div className="font-display text-[11px] uppercase tracking-[0.22em] text-[var(--ivory)]/55">
                      jackpot
                    </div>
                    <div className="font-mono text-[var(--brass-bright)]">
                      {(jackpotChance * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-md border border-[var(--brass)]/20 bg-[var(--noir)]/60 px-3 py-2 text-[11px]">
                  <span className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--ivory)]/55">
                    esperado / bola
                  </span>
                  <span
                    className={`font-mono ${evChips >= 0 ? "text-[var(--brass-bright)]" : "text-[var(--blood)]"}`}
                  >
                    {evChips >= 0 ? "+" : ""}
                    {evChips}
                  </span>
                </div>
                <div className="mt-1 text-[11px] italic text-[var(--ivory)]/40">
                  estimado sobre {stake} fichas con la carga y ranura iluminada actuales.
                </div>
              </div>
            </div>

            <div
              data-mobile-hide
              className="rounded-[1.2rem] border border-[var(--brass)]/25 bg-[var(--noir)]/72 p-4"
            >
              <div className="font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                últimas bolas
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {history.length === 0 ? (
                  <span className="text-[11px] italic text-[var(--ivory)]/40">
                    todavía no lanzaste ninguna.
                  </span>
                ) : (
                  history.map((entry, index) => {
                    const multiplier = MULTIPLIERS[entry.slot];
                    const isDust =
                      entry.mod === "dust" && multiplier === 0 && entry.slot === dustSlot;
                    return (
                      <span
                        key={`${index}-${entry.win}`}
                        title={`${entry.win >= 0 ? "+" : ""}${entry.win}`}
                        className={`rounded-full border px-2 py-[2px] font-display text-[11px] tracking-[0.16em] ${slotTone(multiplier, false, isDust)}`}
                      >
                        {SLOT_LABELS[entry.slot]}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div
              data-mobile-hide
              className="rounded-[1.2rem] border border-[var(--brass)]/25 bg-[linear-gradient(180deg,oklch(0.16_0.04_28/0.92),oklch(0.06_0.01_25/0.96))] p-4"
            >
              <div className="flex items-center justify-between font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                <span>récord de sesión</span>
                <span>mejor bola</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="led-digit text-[var(--brass-bright)] text-glow-brass">
                  {String(Math.min(highScore, 99999)).padStart(5, "0")}
                </div>
                <span className="font-display text-[11px] uppercase tracking-[0.24em] text-[var(--ivory)]/55">
                  fichas
                </span>
              </div>
              <div className="mt-1 text-[11px] italic text-[var(--ivory)]/40">
                guardado en este navegador.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAchievementsPanel(true)}
              data-mobile-hide
              className="w-full rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-950/40 to-red-950/30 px-3 py-2 text-left text-xs text-amber-100 transition hover:from-amber-900/50 hover:to-red-900/40"
            >
              <div className="text-[11px] uppercase tracking-[0.3em] text-amber-300/80">
                vitrina · reto del día
              </div>
              <div className="mt-1 flex items-center gap-2 font-semibold">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rotate-45 border border-amber-300"
                />
                Ver logros y objetivo diario
              </div>
            </button>

            <div data-mobile-hide>
              <PinballLeaderboard />
            </div>
          </aside>
        </div>
      </div>

      <BagatelleAchievementToast />
      <AnimatePresence>
        {showAchievementsPanel && (
          <BagatelleAchievementsPanel onClose={() => setShowAchievementsPanel(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {jackpotFlash !== null ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="pointer-events-none fixed inset-x-0 top-[10vh] z-[60] flex justify-center px-4"
          >
            <div className="relative overflow-hidden rounded-[1rem] border-2 border-[var(--brass-bright)] bg-[linear-gradient(135deg,oklch(0.18_0.05_28/0.96),oklch(0.10_0.03_24/0.98))] px-6 py-3 shadow-[0_0_60px_rgba(255,210,130,0.7)] sm:px-10 sm:py-4">
              <motion.div
                aria-hidden
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
                className="pointer-events-none absolute inset-y-0 w-1/3"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,230,150,0.45), transparent)",
                }}
              />
              <div className="relative flex items-center gap-4">
                <span className="font-script text-3xl text-[var(--brass-bright)] drop-shadow-[0_0_12px_rgba(255,220,140,0.95)] sm:text-5xl">
                  ¡JACKPOT!
                </span>
                <span className="hidden h-10 w-px bg-[var(--brass)]/40 sm:block" />
                <span className="font-display text-xl tracking-[0.24em] text-[var(--ivory)] sm:text-3xl">
                  +{jackpotFlash}
                </span>
                <span className="font-display text-[11px] uppercase tracking-[0.32em] text-[var(--brass)]/90">
                  fichas
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {skillShotFlash !== null ? (
          <motion.div
            key="skillshot"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="pointer-events-none fixed inset-x-0 top-[24vh] z-[56] flex justify-center px-4"
          >
            <div className="rounded-md border-2 border-[var(--brass-bright)] bg-[var(--noir)]/95 px-5 py-2 shadow-[0_0_30px_rgba(255,210,130,0.6)]">
              <span className="font-display text-base uppercase tracking-[0.32em] text-[var(--brass-bright)] sm:text-lg">
                ★ SKILL SHOT +{skillShotFlash}
              </span>
            </div>
          </motion.div>
        ) : null}
        {ballSavedFlash !== null ? (
          <motion.div
            key="ballsaved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none fixed inset-x-0 top-[46vh] z-[54] flex justify-center px-4"
          >
            <div className="rounded-md border border-[var(--ivory)]/60 bg-[var(--noir)]/95 px-4 py-1.5 shadow-[0_0_20px_rgba(255,255,255,0.25)]">
              <span className="font-display text-sm uppercase tracking-[0.32em] text-[var(--ivory)]">
                ◐ Bola salvada
              </span>
            </div>
          </motion.div>
        ) : null}
        {levelUpFlash !== null ? (
          <motion.div
            key={`levelup-${levelUpFlash}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="pointer-events-none fixed inset-x-0 top-[33vh] z-[58] flex justify-center px-4"
          >
            <div
              className="rounded-lg border-2 px-8 py-5 text-center shadow-[0_0_60px_currentColor]"
              style={{
                borderColor: levelMeta.ribbonTone,
                color: levelMeta.ribbonTone,
                background: "oklch(0.05 0.02 25 / 0.94)",
              }}
            >
              <div className="font-display text-[11px] uppercase tracking-[0.42em] opacity-80">
                Nueva Ronda
              </div>
              <div className="mt-1 font-display text-3xl uppercase tracking-[0.28em] text-[var(--brass-bright)]">
                Nivel {level}
              </div>
              <div className="mt-1 font-display text-sm uppercase tracking-[0.32em]">
                {levelMeta.name}
              </div>
              {levelMeta.boss && (
                <div className="mt-2 font-script text-base italic text-[var(--ivory)]/85">
                  ★ Aparece {levelMeta.boss.name}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {tiltActive ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed inset-0 z-[62] flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(160,40,30,0.55)_0%,rgba(0,0,0,0.85)_75%)]"
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 14 }}
              className="text-center"
            >
              <div className="font-display text-[12px] uppercase tracking-[0.6em] text-[var(--ivory)]/70">
                la casa se enoja
              </div>
              <div className="font-script text-7xl text-[var(--blood)] drop-shadow-[0_0_24px_rgba(220,60,60,0.9)] sm:text-9xl">
                ¡TILT!
              </div>
              <div className="mt-2 font-display text-sm tracking-[0.3em] text-[var(--ivory)]/82">
                bola perdida · bonus y carga purgados
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {nudgeFlash ? (
          <motion.div
            key={nudgeFlash.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none fixed inset-0 z-40"
            style={{
              background:
                nudgeFlash.dir < 0
                  ? "linear-gradient(90deg,rgba(255,210,120,0.22),transparent 40%)"
                  : "linear-gradient(270deg,rgba(255,210,120,0.22),transparent 40%)",
            }}
          />
        ) : null}
      </AnimatePresence>
    </GameRoomShell>
  );
}
