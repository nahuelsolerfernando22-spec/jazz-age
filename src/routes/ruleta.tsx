import { createFileRoute } from "@tanstack/react-router";
import { reportSingleScore } from "@/store/single-scores";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BurstParticles } from "@/components/casino/fx/BurstParticles";
import { GameRoomShell } from "@/components/casino/GameRoomShell";

import { lazyNamed } from "@/lib/lazy";
import { DealerVoice, type DealerMood } from "@/components/casino/DealerVoice";
import { NpcPortraitCard } from "@/components/casino/NpcPortraitCard";
import { useCasino, rankFromXp } from "@/store/casino";
const RuletaVictoryScreen = lazyNamed(
  () => import("@/components/casino/roulette/RuletaVictoryScreen"),
  "RuletaVictoryScreen",
);

import { useRuletaRun } from "@/store/games/ruleta/ruleta-run";
import { RuletaRunHUD } from "@/components/casino/roulette/RuletaRunHUD";
import { trackRuletaSpin } from "@/lib/games/ruleta/ruleta-tracker";
import { unlockedBets, clampBet } from "@/lib/bet-gating";
import { useRouletteSfx } from "@/lib/roulette-sfx";
import { playChipBet } from "@/lib/chip-bet-sfx";
import { ROULETTE_TOURNEY, dailySeed, mulberry32, todayKey } from "@/lib/tournament";
import { speak, useNpcSpeak, type Situation as DSituation } from "@/lib/dialogue";
import { useHaptics } from "@/hooks/use-haptics";
import { usePlayerMemory } from "@/store/player-memory";
import zoneBg from "@/assets/zone-ruleta-v7.webp";
import { TourneyPanel } from "@/components/casino/roulette/TourneyPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import ruletaCabinet from "@/assets/ruleta-table-v5.webp";
import claraPortrait from "@/assets/clara-portrait.webp";
const claraSmile = claraPortrait;
const claraSerious = claraPortrait;
const claraSad = claraPortrait;
const claraSurprised = claraPortrait;
const CLARA_MOOD: Record<"idle" | "spin" | "win" | "lose" | "jackpot", string> = {
  idle: claraPortrait,
  spin: claraSerious,
  win: claraSmile,
  lose: claraSad,
  jackpot: claraSurprised,
};
import { getCurrentHostess } from "@/lib/hostess-rotation";
import { useLockGame } from "@/store/gameLock";
import { useSurrender } from "@/components/casino/SurrenderButton";
import { useOrientationLock } from "@/hooks/use-orientation-lock";
import { useLowFx } from "@/hooks/use-low-fx";

export const Route = createFileRoute("/ruleta")({
  ssr: false,
  component: RuletaPage,
  head: () => ({
    meta: [
      { title: "La Rueda del Cuervo — El Cuervo Dorado" },
      {
        name: "description",
        content: "Clara hace girar la rueda. Apostá al rojo, al negro o jugate un pleno.",
      },
      { property: "og:image", content: zoneBg },
      { property: "og:url", content: "/ruleta" },
    ],
    links: [
      { rel: "canonical", href: "/ruleta" },
      // Precarga: en APK offline los assets salen del bundle local, pero sin
      // preload la mesa aparece después de la rueda y se ve un parpadeo.
      { rel: "preload", as: "image", href: ruletaCabinet },
      { rel: "preload", as: "image", href: zoneBg },
    ],
  }),
});

import {
  N,
  SLOT_DEG,
  colorOf,
  computeWheelTargetAngle,
  computeBallTargetAngle,
  dailyHotNumber,
  currentStreak,
  type Color,
  payoutFor,
  type BetKind,
} from "@/lib/roulette-math";

type PlacedBet = { id: string; kind: BetKind; amount: number };

import { betKey } from "@/lib/games/ruleta/bet-key";
import { ClaraSideBet, ClaraSideBetResult } from "@/components/casino/roulette/ClaraSideBet";
import {
  generarCorazonada,
  multiplicadorClara,
  resolverApuestaClara,
  leerLegajoClara,
  guardarLegajoClara,
  frasePosGiro,
  LEGAJO_VACIO,
  type ClaraClaim,
  type LadoClara,
  type LegajoClara,
} from "@/lib/games/ruleta/clara-bet";

import { WheelMotion } from "@/components/casino/roulette/RouletteWheel";
import { BettingTable } from "@/components/casino/roulette/RouletteBettingTable";

import {
  LINES,
  STREAK_LINES,
  HOT_HIT_LINES,
  pick,
  type Mood,
} from "@/components/casino/roulette/lines";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";

const MOOD_TO_DEALER: Record<Mood, DealerMood> = {
  idle: "idle",
  spin: "taunt",
  win: "win",
  lose: "lose",
  jackpot: "win",
};

function RuletaPage() {
  useSingleHostessCorner("ruleta");
  useOrientationLock("portrait");
  const lowFx = useLowFx();

  // Precarga real de los bitmaps: decodificarlos antes del primer giro evita
  // el tirón del primer frame en Android offline.
  useEffect(() => {
    let alive = true;
    for (const src of [ruletaCabinet, zoneBg]) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      void img.decode?.().catch(() => undefined);
      if (!alive) break;
    }
    return () => {
      alive = false;
    };
  }, []);

  const runActive = useRuletaRun((s) => s.activeLevel);

  // Pausar el reloj del encargo cuando Android suspende la WebView.
  useEffect(() => {
    if (!runActive) return;
    let hiddenAt: number | null = null;
    const onVis = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt != null) {
        const delta = Date.now() - hiddenAt;
        hiddenAt = null;
        const s = useRuletaRun.getState();
        if (s.startedAt != null && delta > 0) {
          useRuletaRun.setState({ startedAt: s.startedAt + delta });
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [runActive]);
  const chips = useCasino((s) => s.chips);
  const bet = useCasino((s) => s.bet);
  const setBet = useCasino((s) => s.setBet);
  const spend = useCasino((s) => s.spend);
  const addChips = useCasino((s) => s.addChips);
  const registerWin = useCasino((s) => s.registerWin);
  const registerLoss = useCasino((s) => s.registerLoss);
  const bumpReputation = useCasino((s) => s.bumpReputation);
  const tourneyState = useCasino((s) => s.rouletteTourney);
  const recordRouletteTourney = useCasino((s) => s.recordRouletteTourney);
  const xp = useCasino((s) => s.xp);
  const rankLevel = rankFromXp(xp).level;
  const chipOpts = useMemo(() => unlockedBets(rankLevel), [rankLevel]);
  useEffect(() => {
    const clamped = clampBet(bet, rankLevel);
    if (clamped !== bet) setBet(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankLevel]);

  const today = todayKey();
  const attemptsToday = tourneyState.day === today ? tourneyState.attempts : [];
  const bestToday = attemptsToday.reduce((m, a) => Math.max(m, a.score), 0);
  const attemptsLeft = ROULETTE_TOURNEY.maxAttempts - attemptsToday.length;

  type TourRun = {
    stack: number;
    spinsLeft: number;
    rng: () => number;
    attemptIndex: number;
  };
  const [tour, setTour] = useState<TourRun | null>(null);
  const inTourney = tour !== null;

  const startTourney = () => {
    if (attemptsLeft <= 0 || spinning) return;
    const attemptIndex = attemptsToday.length;
    const seed = dailySeed("roulette", today, attemptIndex);
    setTour({
      stack: ROULETTE_TOURNEY.stack,
      spinsLeft: ROULETTE_TOURNEY.spins,
      rng: mulberry32(seed),
      attemptIndex,
    });
    setBets([]);
    setLastBets([]);
    setResult(null);
    setLast(null);
    setHistory([]);
  };

  const abandonTourney = () => {
    if (!tour || spinning) return;
    recordRouletteTourney(tour.stack, ROULETTE_TOURNEY.spins - tour.spinsLeft);
    setTour(null);
    setBets([]);
    setLastBets([]);
  };

  const visibleChips = inTourney ? tour!.stack : chips;
  const trySpend = (amt: number): boolean => {
    if (!inTourney) return spend(amt);
    if (tour!.stack < amt) return false;
    setTour((t) => (t ? { ...t, stack: t.stack - amt } : t));
    return true;
  };
  const giveChips = (amt: number) => {
    if (!inTourney) {
      addChips(amt);
      return;
    }
    setTour((t) => (t ? { ...t, stack: t.stack + amt } : t));
  };

  const [bets, setBets] = useState<PlacedBet[]>([]);
  const RUL_LAST_BET_KEY = "cuervo:ruleta:lastBet:v1";
  const [lastBets, setLastBets] = useState<PlacedBet[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(RUL_LAST_BET_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as PlacedBet[]) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (lastBets.length === 0) window.localStorage.removeItem(RUL_LAST_BET_KEY);
      else window.localStorage.setItem(RUL_LAST_BET_KEY, JSON.stringify(lastBets));
    } catch {
      /* noop */
    }
  }, [lastBets]);
  const [spinning, setSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [last, setLast] = useState<{ won: number; n: number; staked: number } | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [mood, setMood] = useState<Mood>("idle");
  const [line, setLine] = useState<string>(() => LINES.idle[0]);
  const lastSpinAt = useRef(0);
  const sfx = useRouletteSfx();
  const haptic = useHaptics();
  const spinTokenRef = useRef(0);
  const pendingTimeoutsRef = useRef<number[]>([]);
  const hostess = useMemo(() => getCurrentHostess("ruleta") ?? "clara", []);
  const [landBurst, setLandBurst] = useState(0);
  const [winBurst, setWinBurst] = useState(0);
  const [winPulseKey, setWinPulseKey] = useState(0);

  // ── La apuesta de Clara ──────────────────────────────────────────────
  const [claraClaim, setClaraClaim] = useState<ClaraClaim | null>(null);
  const [claraLado, setClaraLado] = useState<LadoClara | null>(null);
  const [claraStake, setClaraStake] = useState(0);
  const [legajoClara, setLegajoClara] = useState<LegajoClara>(LEGAJO_VACIO);
  const [claraResultado, setClaraResultado] = useState<{ texto: string; neto: number } | null>(
    null,
  );

  useEffect(() => {
    setLegajoClara(leerLegajoClara());
    setClaraClaim(generarCorazonada(Math.random));
  }, []);


  useEffect(() => {
    setSpinning(false);
  }, []);

  const matchActive = spinning || inTourney;
  useLockGame(matchActive);
  useSurrender(
    inTourney && !spinning
      ? () => {
          if (tour) recordRouletteTourney(tour.stack, ROULETTE_TOURNEY.spins - tour.spinsLeft);
          setTour(null);
          setBets([]);
          setLastBets([]);
        }
      : null,
    "Abandonar torneo",
  );

  useEffect(() => {
    return () => {
      spinTokenRef.current += 1;
      pendingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      pendingTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    speak({ npcId: "clara", situation: "greet", room: "/ruleta" });
    usePlayerMemory.getState().noteVisit("clara");
  }, []);
  const outcomeForSpeak: DSituation | null =
    last && !spinning ? (last.won > last.staked ? "win" : "lose") : null;
  useNpcSpeak("clara", outcomeForSpeak, { room: "/ruleta" });

  useEffect(() => {
    if (!spinning) return;
    let raf = 0;
    let lastSector = -1;
    let wheelEl: SVGGElement | null = null;
    let ballEl: SVGGElement | null = null;
    let lastQuery = 0;
    const tickLoop = (now: number) => {
      if (!wheelEl || !ballEl || now - lastQuery > 500) {
        wheelEl = document.querySelector<SVGGElement>('.wheel-svg g[data-anim="wheel"]');
        ballEl = document.querySelector<SVGGElement>('.wheel-svg g[data-anim="ball"]');
        lastQuery = now;
      }
      if (wheelEl && ballEl) {
        const wm = wheelEl.getCTM();
        const bm = ballEl.getCTM();
        if (wm && bm) {
          const wDeg = (Math.atan2(wm.b, wm.a) * 180) / Math.PI;
          const bDeg = (Math.atan2(bm.b, bm.a) * 180) / Math.PI;
          const rel = (((bDeg - wDeg) % 360) + 360) % 360;
          const sector = Math.floor(rel / SLOT_DEG);
          if (lastSector !== -1 && sector !== lastSector) sfx.tick();
          lastSector = sector;
        }
      }
      raf = requestAnimationFrame(tickLoop);
    };
    raf = requestAnimationFrame(tickLoop);
    return () => cancelAnimationFrame(raf);
  }, [spinning, sfx]);

  const hotNumber = useMemo(() => dailyHotNumber(today), [today]);
  const streak = useMemo(() => currentStreak(history), [history]);

  // Elegir lado cobra la ficha al instante; sacar el lado la devuelve.
  const elegirLadoClara = (lado: LadoClara | null) => {
    if (spinning || !claraClaim) return;
    if (lado === null) {
      if (claraStake > 0) giveChips(claraStake);
      setClaraStake(0);
      setClaraLado(null);
      return;
    }
    if (claraLado === null) {
      if (!trySpend(bet)) return;
      setClaraStake(bet);
    }
    setClaraLado(lado);
    setClaraResultado(null);
    playChipBet();
  };

  const totalStake = useMemo(() => bets.reduce((acc, b) => acc + b.amount, 0), [bets]);


  const stakeByKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bets) {
      const k = betKey(b.kind);
      m.set(k, (m.get(k) ?? 0) + b.amount);
    }
    return m;
  }, [bets]);

  const placeBet = (kind: BetKind) => {
    if (spinning) return;
    if (!trySpend(bet)) return;
    playChipBet();
    setBets((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, amount: bet },
    ]);
    setResult(null);
    setLast(null);
  };

  const placeBets = (nums: readonly number[]) => {
    if (spinning) return;
    const need = nums.length * bet;
    if (!trySpend(need)) return;
    playChipBet();
    const stamp = Date.now();
    setBets((prev) => [
      ...prev,
      ...nums.map((n, i) => ({
        id: `${stamp}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        kind: { kind: "number" as const, n },
        amount: bet,
      })),
    ]);
    setResult(null);
    setLast(null);
  };

  const clearBets = () => {
    if (spinning || bets.length === 0) return;
    giveChips(totalStake);
    setBets([]);
  };

  const rebet = () => {
    if (spinning || lastBets.length === 0) return;
    const need = lastBets.reduce((a, b) => a + b.amount, 0);
    if (!trySpend(need)) return;
    setBets(
      lastBets.map((b) => ({
        ...b,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      })),
    );
    setResult(null);
    setLast(null);
  };

  const handleSpin = () => {
    if (spinning) return;
    // Se puede girar solo por la apuesta de Clara, sin fichas en la mesa.
    if (bets.length === 0 && claraLado === null) return;

    if (inTourney && tour!.spinsLeft <= 0) return;
    if (Date.now() - lastSpinAt.current < 600) return;
    lastSpinAt.current = Date.now();

    setSpinning(true);
    spinTokenRef.current += 1;
    const myToken = spinTokenRef.current;
    setLast(null);
    setResult(null);
    setMood("spin");
    setLine(pick(LINES.spin));
    sfx.spin();

    const r = inTourney ? tour!.rng() : Math.random();
    const n = Math.floor(r * N);

    const newWheel = computeWheelTargetAngle(wheelAngle, n, 6);
    const newBall = computeBallTargetAngle(ballAngle, 9);

    setWheelAngle(newWheel);
    setBallAngle(newBall);

    const staked = totalStake;
    const placedSnapshot = bets;

    const totalMs = lowFx ? 2600 : 5200;

    const thunkId = window.setTimeout(
      () => {
        if (myToken !== spinTokenRef.current) return;
        sfx.pocketThunk();
        haptic("heavy");
        setLandBurst((n) => n + 1);
      },
      Math.round(totalMs * 0.93),
    );

    const resolveId = window.setTimeout(() => {
      if (myToken !== spinTokenRef.current) return;
      setResult(n);
      setHistory((h) => [n, ...h].slice(0, 12));
      let won = 0;
      let anyStraight = false;
      let hotHit = false;
      for (const b of placedSnapshot) {
        const mult = payoutFor(b.kind, n, hotNumber);
        if (mult > 0) {
          won += b.amount * mult;
          if (b.kind.kind === "number") {
            anyStraight = true;
            if (b.kind.n === hotNumber) hotHit = true;
          }
        }
      }
      if (won > 0) {
        giveChips(won);
        if (!inTourney) {
          registerWin(Math.max(0, won - staked));
          bumpReputation(hotHit ? 5 : anyStraight ? 3 : 1);
        }
        void import("@/lib/nemesis").then(({ reportGameOutcome }) =>
          reportGameOutcome("ruleta", "win"),
        );

        window.setTimeout(() => {
          sfx.winChime();
          haptic(hotHit || anyStraight ? "heavy" : "success");
          setWinBurst((n) => n + 1);
          setWinPulseKey((n) => n + 1);
        }, 120);
        if (hotHit) {
          setMood("jackpot");
          setLine(pick(HOT_HIT_LINES));
        } else if (anyStraight) {
          setMood("jackpot");
          setLine(pick(LINES.jackpot));
        } else {
          setMood("win");
          setLine(pick(LINES.win));
        }

        void import("@/lib/economy").then(({ awardLifeOnWin, registerHostessMatchResult }) => {
          awardLifeOnWin();
          registerHostessMatchResult(hostess, {
            won: true,
            magnitude: hotHit || anyStraight ? "big" : "normal",
          });
        });
      } else {
        if (!inTourney) registerLoss();
        setMood("lose");
        void import("@/lib/nemesis").then(({ reportGameOutcome }) =>
          reportGameOutcome("ruleta", "loss"),
        );
        void import("@/lib/economy").then(({ registerHostessMatchResult }) =>
          registerHostessMatchResult(hostess, { won: false, tag: "spin:miss" }),
        );

        const newHistory = [n, ...history];
        const s = currentStreak(newHistory);
        if (s && s.len >= 4 && (s.color === "red" || s.color === "black")) {
          setLine(pick(STREAK_LINES[s.color]));
        } else {
          setLine(pick(LINES.lose));
        }
      }
      setLast({ won, n, staked });

      // La apuesta de Clara se liquida aparte de la mesa.
      if (claraClaim) {
        const { acertoClara, gano } = claraLado
          ? resolverApuestaClara(claraClaim, claraLado, n)
          : { acertoClara: claraClaim.nums.includes(n), gano: false };
        let neto = 0;
        if (claraLado) {
          const devuelto = gano
            ? Math.round(claraStake * multiplicadorClara(claraClaim, claraLado))
            : 0;
          if (devuelto > 0) giveChips(devuelto);
          neto = devuelto - claraStake;
          setClaraResultado({ texto: frasePosGiro(acertoClara, gano), neto });
        } else {
          setClaraResultado(null);
        }
        const nuevo: LegajoClara = {
          corazonadas: legajoClara.corazonadas + 1,
          aciertos: legajoClara.aciertos + (acertoClara ? 1 : 0),
          acompanadas: legajoClara.acompanadas + (claraLado === "acompañar" ? 1 : 0),
          desafios: legajoClara.desafios + (claraLado === "desafiar" ? 1 : 0),
          fichasNetas: legajoClara.fichasNetas + neto,
        };
        setLegajoClara(nuevo);
        guardarLegajoClara(nuevo);
      }
      setClaraLado(null);
      setClaraStake(0);
      setClaraClaim(generarCorazonada(Math.random));

      void import("@/lib/narrative-hooks").then(({ recordGameOutcome }) => {
        recordGameOutcome({ hostessId: hostess, delta: won - staked });
      });
      setLastBets(placedSnapshot);
      setBets([]);
      setSpinning(false);

      if (!inTourney) {
        trackRuletaSpin({
          n,
          bets: placedSnapshot,
          hotNumber,
          payoutFor,
        });
      }

      if (inTourney) {
        // Ojo: nada de efectos dentro del updater de estado (React puede
        // ejecutarlo dos veces y duplicar el reporte de puntaje).
        let closed: { stack: number; spinsUsed: number } | null = null;
        setTour((t) => {
          if (!t) return t;
          const spinsLeft = t.spinsLeft - 1;
          const next = { ...t, spinsLeft };
          const broke = next.stack <= 0;
          const noSpins = spinsLeft <= 0;
          if (broke || noSpins) {
            closed = { stack: next.stack, spinsUsed: ROULETTE_TOURNEY.spins - spinsLeft };
            return null;
          }
          return next;
        });
        if (closed) {
          const { stack, spinsUsed } = closed as { stack: number; spinsUsed: number };
          recordRouletteTourney(stack, spinsUsed);
          reportSingleScore("ruleta", Math.max(0, Math.floor(stack)));
        }
      }
    }, totalMs);
    pendingTimeoutsRef.current.push(thunkId, resolveId);
  };

  return (
    <GameRoomShell
      bg={zoneBg}
      room="ruleta"
      title="La Rueda del Cuervo"
      subtitle="el cuervo dorado · sala dorada"
    >
      <RuletaVictoryScreen />
      {runActive ? (
        <div className="mx-auto max-w-6xl px-3">
          <RuletaRunHUD />
        </div>
      ) : null}

      <div className="cuervo-mobile-compact mx-auto max-w-7xl px-2 pb-8 sm:px-4 sm:pb-10">
        <div className="mobile-stack-grid grid gap-2 sm:gap-6 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          {}
          <section
            className="game-focus mobile-panel order-1 lg:order-2 min-w-0 max-w-full overflow-x-hidden sm:overflow-x-auto relative overflow-hidden rounded-sm border border-[var(--brass)]/40 p-2 shadow-deep backdrop-blur sm:p-4"
            style={{
              background: [
                "radial-gradient(80% 55% at 50% 30%, oklch(0.42 0.14 45 / 0.55) 0%, oklch(0.18 0.06 30 / 0.55) 45%, oklch(0.06 0.02 25 / 0.92) 80%)",

                "linear-gradient(180deg, oklch(0.10 0.03 28 / 0.92) 0%, oklch(0.05 0.01 28 / 0.96) 100%)",
              ].join(", "),
              boxShadow:
                "inset 0 0 80px oklch(0 0 0 / 0.8), inset 0 1px 0 oklch(0.85 0.12 75 / 0.12)",
            }}
          >
            <div
              className={`grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-[var(--brass)]/15 pb-2 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:pb-3 ${"grid"}`}
              style={{
                // Hueco del botón "Atrás" + safe-area, para que el título nunca
                // quede debajo del botón ni pegado al borde en pantallas chicas.
                paddingLeft: "calc(var(--cd-back-inset, 0px) + env(safe-area-inset-left, 0px))",
                // Hueco del botón de pausa: en horizontal el dato "en juego"
                // quedaba tapado por los flotantes de la esquina.
                paddingRight: "calc(var(--hud-btn, 44px) + 14px + env(safe-area-inset-right, 0px))",
                paddingTop: "6px",
              }}
            >
              <div className="min-w-0">
                <div className="hidden font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/90 sm:block">
                  rueda francesa
                </div>
                <h2
                  className="font-script text-[15px] leading-tight text-[var(--brass-bright)] sm:mt-1 sm:text-4xl"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
                >
                  La Rueda del Cuervo
                </h2>
              </div>
              {/* En móvil el rail lateral no entra en pantalla: el torneo se
                  abre en un diálogo desde acá para que siga siendo accesible. */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 rounded-sm border border-[var(--brass)]/45 bg-black/45 px-3 py-2 font-display text-[11px] uppercase tracking-[0.24em] text-[var(--brass-bright)] sm:hidden"
                    style={{ minHeight: "var(--tap-min, 44px)" }}
                  >
                    torneo
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[92vw] border-[var(--brass)]/40 bg-[var(--noir)]/95">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xs uppercase tracking-[0.3em] text-[var(--brass-bright)]">
                      torneo del día
                    </DialogTitle>
                  </DialogHeader>
                  <TourneyPanel
                    inTourney={inTourney}
                    stack={tour?.stack ?? 0}
                    spinsLeft={tour?.spinsLeft ?? 0}
                    attemptsLeft={attemptsLeft}
                    attemptsTotal={ROULETTE_TOURNEY.maxAttempts}
                    bestToday={bestToday}
                    attemptsToday={attemptsToday}
                    onStart={startTourney}
                    onAbandon={abandonTourney}
                    disabled={spinning}
                  />
                </DialogContent>
              </Dialog>
              {/* En móvil este dato ya lo muestra la cabecera de la mesa
                  ("en mesa · ficha"), así que no se repite acá. */}
              <div className="hidden shrink-0 rounded-sm border border-[var(--brass)]/30 bg-black/35 px-2 py-1 text-right leading-tight whitespace-nowrap sm:block sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                <div className="font-display text-[11px] uppercase tracking-[0.24em] text-[var(--smoke)] sm:text-[11px] sm:tracking-[0.35em]">
                  en juego
                </div>
                <div className="font-display text-[11px] uppercase tracking-[0.08em] tabular-nums text-[var(--brass-bright)] sm:text-xl sm:tracking-[0.18em]">
                  {totalStake}¢ <span className="text-[var(--smoke)]">·</span> ficha {bet}¢
                </div>
              </div>
            </div>

            {}
            <div className="relative mt-2 block sm:mt-4">
              {}

              {}
              <div
                className="ruleta-cabinet relative mx-auto flex w-full items-center justify-center overflow-visible"
                style={{ maxWidth: 1100 }}
              >
                <div
                  className="relative h-full w-auto max-w-full"
                  style={{ aspectRatio: "1264 / 848", containerType: "inline-size" }}
                >
                  {}
                  <img
                    src={ruletaCabinet}
                    alt="Mesa de ruleta de El Cuervo Dorado"
                    width={1264}
                    height={848}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.7)]"
                  />

                  {}
                  {/* Geometría medida sobre ruleta-table-v5.webp (1264x848):
                      el aro de bronce va de x 95→585 y de y 175→660, así que
                      su centro cae en 26.9% / 50.1% y su diámetro es 38.8%
                      del ancho. La rueda se calza justo dentro del aro. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-[26.9%] top-[50.1%] aspect-square w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        "radial-gradient(closest-side, oklch(0.82 0.18 70 / 0.30) 0%, oklch(0.55 0.16 55 / 0.14) 58%, transparent 84%)",
                      border: "1px solid oklch(0.80 0.15 78 / 0.30)",
                      boxShadow:
                        "0 0 40px oklch(0.80 0.15 78 / 0.18), inset 0 0 40px oklch(0 0 0 / 0.45)",
                    }}
                  />

                  {}
                  <motion.div
                    className="absolute left-[26.9%] top-[50.1%] aspect-square w-[37.5%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"

                    animate={
                      result !== null && !spinning && !lowFx
                        ? { scale: [1, 1.02, 0.995, 1.005, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: lowFx ? 0 : 0.6, ease: "easeOut" }}
                  >
                    <WheelMotion
                      wheelAngle={wheelAngle}
                      ballAngle={ballAngle}
                      spinning={spinning}
                      result={result}
                      spinToken={spinTokenRef.current}
                      lowFx={lowFx}
                    />
                    {}
                    {!lowFx && <BurstParticles burstKey={landBurst} tone="dust" count={14} />}
                    {}
                    {!lowFx && <BurstParticles burstKey={winBurst} tone="gold" count={26} />}
                    {}
                    <AnimatePresence>
                      {winPulseKey > 0 && !lowFx && (
                        <motion.div
                          key={winPulseKey}
                          className="pointer-events-none absolute inset-0 rounded-full"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: [0, 0.9, 0.5, 0], scale: [0.9, 1.06, 1.02, 1.08] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: "easeOut", times: [0, 0.2, 0.7, 1] }}
                          style={{
                            boxShadow:
                              "0 0 60px 12px oklch(0.85 0.18 75 / 0.6), inset 0 0 40px oklch(0.85 0.18 75 / 0.4)",
                            border: "1px solid oklch(0.85 0.18 75 / 0.7)",
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Panel del mueble: últimos números (escala con el mueble) */}
                  <div className="pointer-events-none absolute left-[52%] right-[10%] top-[20%] bottom-[18%] flex flex-col items-center justify-center gap-[5%] px-[3%] text-center">
                    <div className="font-display text-[clamp(8px,2cqw,16px)] uppercase leading-none tracking-[0.3em] text-[var(--brass-bright)]/85">
                      últimos
                    </div>
                    {history.length > 0 ? (
                      <div className="grid w-full grid-cols-5 gap-[4%]">
                        {history.slice(0, 10).map((h, i) => (
                          <div
                            key={`${h}-${i}`}
                            className="flex aspect-square items-center justify-center rounded-full border border-[var(--brass)]/40 font-display text-[clamp(9px,2.6cqw,20px)] font-bold leading-none tabular-nums"
                            style={{
                              background:
                                colorOf(h) === "green"
                                  ? "oklch(0.32 0.14 145)"
                                  : colorOf(h) === "red"
                                    ? "oklch(0.40 0.18 25)"
                                    : "oklch(0.12 0.01 30)",
                              color: "var(--ivory)",
                              opacity: 1 - i * 0.05,
                            }}
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="grid w-full grid-cols-5 gap-[4%]" aria-hidden="true">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex aspect-square items-center justify-center rounded-full border border-[var(--brass)]/25 bg-[var(--noir)]/50 font-display text-[clamp(9px,2.6cqw,20px)] leading-none text-[var(--brass-bright)]/25"
                            >
                              ·
                            </div>
                          ))}
                        </div>
                        <div className="font-display text-[clamp(9px,2.2cqw,15px)] uppercase leading-none tracking-[0.22em] text-[var(--brass-bright)]/85">
                          sin tiradas aún
                        </div>
                      </>
                    )}
                  </div>

                  {}
                  <div className="pointer-events-none absolute bottom-[6%] left-0 right-0 flex justify-center px-2">
                    <div className="max-w-full truncate rounded-sm border border-[var(--brass)]/60 bg-[var(--noir)]/85 px-[clamp(6px,1.6cqw,14px)] py-[clamp(3px,0.8cqw,8px)] font-display text-[clamp(8px,2cqw,15px)] uppercase leading-none tracking-[0.28em] text-[var(--brass-bright)] shadow-md">
                      {spinning ? "la bola corre…" : "hagan juego"}
                    </div>
                  </div>

                  <AnimatePresence>
                    {result !== null && !spinning && (
                      <motion.div
                        key={`badge-${last?.n}-${last?.won}`}
                        initial={{ opacity: 0, scale: 0.3, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="pointer-events-none absolute bottom-[14%] left-1/2 z-10 -translate-x-1/2 rounded-sm border-2 bg-[var(--noir)]/95 px-4 py-2 font-display text-xs uppercase tracking-[0.3em] backdrop-blur"
                        style={{
                          borderColor:
                            colorOf(result) === "red"
                              ? "oklch(0.62 0.22 25)"
                              : colorOf(result) === "green"
                                ? "oklch(0.55 0.18 145)"
                                : "oklch(0.55 0.05 60)",
                          color: "var(--ivory)",
                          boxShadow: "0 0 20px oklch(0.85 0.18 75 / 0.4)",
                        }}
                      >
                        Salió <span className="text-[var(--brass-bright)]">{result}</span>
                        {" · "}
                        {last && last.won > 0 ? (
                          <span style={{ color: "oklch(0.85 0.18 75)" }}>+{last.won}¢</span>
                        ) : (
                          <span style={{ color: "oklch(0.65 0.05 60)" }}>la casa gana</span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {}
            <BettingTable
              chips={visibleChips}
              bet={bet}
              setBet={setBet}
              chipOpts={chipOpts}
              spinning={spinning}
              totalStake={totalStake}
              sideStake={claraStake}

              stakeByKey={stakeByKey}
              placeBet={placeBet}
              placeBets={placeBets}
              clearBets={clearBets}
              rebet={rebet}
              canRebet={lastBets.length > 0}
              onSpin={handleSpin}
              result={result}
              hotNumber={hotNumber}
              streak={streak}
            />

            <div className="mt-4">
              <ClaraSideBet
                claim={claraClaim}
                lado={claraLado}
                legajo={legajoClara}
                ficha={bet}
                disabled={spinning}
                onElegir={elegirLadoClara}
              />
              <ClaraSideBetResult texto={claraResultado?.texto ?? null} neto={claraResultado?.neto ?? 0} />
            </div>
          </section>


          {}
          <aside className="desktop-rail order-2 lg:order-1 space-y-4">
            {(() => {
              return (
                <div className="hidden lg:block">
                  <NpcPortraitCard
                    src={CLARA_MOOD[mood]}
                    alt="Clara «La Roulettiste» Vionnet"
                    name="Clara · la roulettiste"
                    line={line}
                    npcId="clara"
                  />
                </div>
              );
            })()}

            <TourneyPanel
              inTourney={inTourney}
              stack={tour?.stack ?? 0}
              spinsLeft={tour?.spinsLeft ?? 0}
              attemptsLeft={attemptsLeft}
              attemptsTotal={ROULETTE_TOURNEY.maxAttempts}
              bestToday={bestToday}
              attemptsToday={attemptsToday}
              onStart={startTourney}
              onAbandon={abandonTourney}
              disabled={spinning}
            />

            {inTourney && (
              <section className="rounded-sm border border-[var(--brass)]/35 bg-[var(--noir)]/82 p-4 shadow-deep backdrop-blur">
                <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/90">
                  stack del torneo
                </div>
                <div className="mt-2 font-display text-2xl uppercase tracking-[0.18em] text-[var(--brass-bright)]">
                  {visibleChips}¢
                </div>
                <p className="mt-3 font-body text-sm italic leading-relaxed text-[var(--smoke)]">
                  Misma semilla para todos los jugadores de hoy. Tu puntuación final = fichas
                  restantes al terminar los {ROULETTE_TOURNEY.spins} giros.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </GameRoomShell>
  );
}
