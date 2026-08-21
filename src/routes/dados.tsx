import { createFileRoute } from "@tanstack/react-router";
import { useNemesisSession } from "@/lib/nemesis";
import { reportSingleScore } from "@/store/single-scores";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { TourneyRoundBadge } from "@/components/casino/TourneyRoundBadge";
import { useSurrender } from "@/components/casino/SurrenderButton";
import { BrassButton } from "@/components/casino/BrassButton";
import { ArtDecoToast } from "@/components/casino/ArtDecoToast";
import { lazyNamed } from "@/lib/lazy";
import { rumorsForGame } from "@/lib/rumores";
import { withRumorChips } from "@/lib/rumor-bonus";
import { useLockGame } from "@/store/gameLock";

import { NoLivesGate } from "@/components/casino/NoLivesGate";
import { useTryStart } from "@/hooks/use-try-start";
import { useHaptics } from "@/hooks/use-haptics";
import zoneDados from "@/assets/zone-dados-v6.webp";
import dadosFeltMat from "@/assets/huesos/felt.webp";
import { BoneDie } from "@/components/casino/huesos/BoneDie";

import zeldaPortrait from "@/assets/zelda-portrait.webp";
const zeldaFlirty = zeldaPortrait;
const zeldaWin = zeldaPortrait;
const zeldaLose = zeldaPortrait;
const zeldaTense = zeldaPortrait;
const zeldaAngry = zeldaPortrait;
import salomeIdle from "@/assets/salome-portrait.webp";
import salomeWin from "@/assets/salome-portrait.webp";
import salomeLose from "@/assets/salome-portrait.webp";
import salomeFlirty from "@/assets/salome-portrait.webp";
import salomeTense from "@/assets/salome-portrait.webp";
import salomeAngry from "@/assets/salome-portrait.webp";
import { getCurrentHostess } from "@/lib/hostess-rotation";
import { getHostessAiProfile, profileToGeneralaSkill } from "@/lib/hostess-ai";
import { getEffectiveProfile } from "@/lib/hostess-tuning";
import { useHostessMatch } from "@/hooks/use-hostess-match";
import { describeHostess } from "@/lib/hostess-personality";
import { useCasino } from "@/store/casino";
import { useCampaignBridge } from "@/hooks/use-campaign-bridge";

const DadosVictoryScreen = lazyNamed(
  () => import("@/components/casino/dados/DadosVictoryScreen"),
  "DadosVictoryScreen",
);
import { useDadosRun } from "@/store/games/dados/dados-run";
import { trackDadosEvent } from "@/lib/games/dados/dados-tracker";
import { useDadosSfx } from "@/hooks/use-dados-sfx";
import { BurstParticles } from "@/components/casino/fx/BurstParticles";
import { useNpcDialogue } from "@/hooks/use-npc-dialogue";
import type { Situation } from "@/lib/dialogue";
import {
  dealNight,
  contractById,
  contractValue,
  valorDoblado,
  valorRobado,
  tableTotals,
  openContracts,
  nightOver,
  rivalTurn,
  favorById,
  type TableContract,
  type FavorId,
  rollDice,
} from "@/lib/cinco-huesos";
import { GENERALA_LEVELS, getGeneralaLevel } from "@/lib/generala-levels";
import { useGeneralaProgression } from "@/hooks/use-generala-progression";
const GeneralaLevelSelect = lazyNamed(
  () => import("@/components/casino/generala/GeneralaLevelSelect"),
  "GeneralaLevelSelect",
);
import { GeneralaHistory } from "@/components/casino/generala/GeneralaHistory";
import { ContractBoard } from "@/components/casino/huesos/ContractBoard";
import { FavorHand } from "@/components/casino/huesos/FavorHand";
import { HuesosRules } from "@/components/casino/huesos/HuesosRules";
import { useRulesSeen } from "@/store/rules-seen";
import { HuesosEndScreen } from "@/components/casino/huesos/HuesosEndScreen";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { toast as sonner } from "sonner";
import { HostessHudStrip } from "@/components/casino/HostessHudStrip";
import {
  drawPresagio,
  maxRollsFor,
  canHoldWith,
  adjustContractScore,
  settlePresagio,
  type Presagio,
} from "@/lib/huesos-presagios";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";
import { useGameAutosave, loadGameSave } from "@/lib/game-autosave";

const MAX_ROLLS = 3;

export const Route = createFileRoute("/dados")({
  ssr: false,
  component: DadosPage,
  head: () => ({
    meta: [
      { title: "Cinco Huesos — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Cinco Huesos: cerrá contratos con cinco dados antes que la anfitriona, jugá cartas de favor y llevate las fichas del sótano del Cuervo Dorado.",
      },
      { property: "og:title", content: "Cinco Huesos — El Cuervo Dorado" },
      {
        property: "og:description",
        content:
          "Cerrá contratos antes que la anfitriona y jugá tus cartas de favor en el sótano del Cuervo Dorado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: zoneDados },
      { property: "og:url", content: "/dados" },
    ],
    links: [{ rel: "canonical", href: "/dados" }],
  }),
});

type Phase = "idle" | "player_roll" | "player_pick" | "scarlet" | "round_end" | "match_over";

interface DadosSave {
  levelId: string;
  wager: number | null;
  pot: number;
  phase: Phase;
  round: number;
  table: TableContract[];
  reserve: string[];
  hand: FavorId[];
  favorsUsed: FavorId[];
  rivalHand?: FavorId[];
  lastPlayerClaim?: string | null;
  doubleNext: boolean;
  lastRivalClaim: string | null;
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  firstRoll: number[] | null;
  presagio: Presagio | null;
  cursedIndex: number;
  brokeRule: boolean;
  holdsUsed: number;
}

function isValidDadosSave(v: unknown): v is DadosSave {
  if (!v || typeof v !== "object") return false;
  const s = v as DadosSave;
  return (
    typeof s.levelId === "string" &&
    typeof s.phase === "string" &&
    typeof s.round === "number" &&
    Array.isArray(s.table) &&
    s.table.length > 0 &&
    Array.isArray(s.hand) &&
    Array.isArray(s.dice) &&
    Array.isArray(s.held)
  );
}

interface ZeldaPlay {
  dice: number[];
  contractId: string | null;
  burnedId: string | null;
  value: number;
  servida: boolean;
  favorUsed?: FavorId | null;
  stolenId?: string | null;
  intent?: string | null;
}

function DadosPage() {
  useSingleHostessCorner("dados");
  useCampaignBridge("dados");
  const nem = useNemesisSession("dados");
  const haptic = useHaptics();
  const chips = useCasino((s) => s.chips);
  const spend = useCasino((s) => s.spend);
  const addChips = useCasino((s) => s.addChips);
  const registerWin = useCasino((s) => s.registerWin);
  const registerLoss = useCasino((s) => s.registerLoss);
  const bumpReputation = useCasino((s) => s.bumpReputation);

  const { tryStart, gateOpen, closeGate } = useTryStart();
  const prog = useGeneralaProgression();

  const [levelId, setLevelId] = useState<string>("g1");
  const level = useMemo(() => getGeneralaLevel(levelId), [levelId]);
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);

  const [wager, setWager] = useState<number | null>(level.wagerChips[0]);
  const [pot, setPot] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  useLockGame(phase !== "idle" && phase !== "match_over");
  const matchStartedAt = useRef<number>(0);
  const [npcOutcome, setNpcOutcome] = useState<Situation | null>(null);
  const isSalome = useMemo(() => getCurrentHostess("dados") === "salome", []);
  const hostNpcId = isSalome ? "salome" : "zelda";
  const learn = useHostessMatch(hostNpcId);

  const hostName = isSalome ? "Salomé «La Velada»" : "Zelda «La Adivina»";
  const hostShort = isSalome ? "Salomé" : "Zelda";
  const hostSubtitle = isSalome ? "cubilete de Salomé · sótano" : "cubilete de Zelda · sótano";
  const hostPortrait = useMemo(() => {
    if (isSalome) {
      switch (npcOutcome) {
        case "win":
          return salomeWin;
        case "lose":
          return salomeLose;
        case "angry":
          return salomeAngry;
        case "flirty":
          return salomeFlirty;
        case "tense":
          return salomeTense;
        default:
          return salomeIdle;
      }
    }
    switch (npcOutcome) {
      case "win":
        return zeldaWin;
      case "lose":
        return zeldaLose;
      case "angry":
        return zeldaAngry;
      case "flirty":
        return zeldaFlirty;
      case "tense":
        return zeldaTense;
      default:
        return zeldaPortrait;
    }
  }, [isSalome, npcOutcome]);
  const { line: zeldaLine } = useNpcDialogue(hostNpcId, "/dados", npcOutcome);

  const [round, setRound] = useState(0);
  const [table, setTable] = useState<TableContract[]>([]);
  const [reserve, setReserve] = useState<string[]>([]);
  const [hand, setHand] = useState<FavorId[]>([]);
  const [favorsUsed, setFavorsUsed] = useState<FavorId[]>([]);
  // Favores de un solo turno: se arman en tu mano y se gastan en el turno de la rival.
  const [ojoArmado, setOjoArmado] = useState(false);
  const [plomoArmado, setPlomoArmado] = useState(false);
  const [rivalHand, setRivalHand] = useState<FavorId[]>([]);
  const [lastPlayerClaim, setLastPlayerClaim] = useState<string | null>(null);
  const [rivalTarget, setRivalTarget] = useState<string | null>(null);
  const [pendingFavor, setPendingFavor] = useState<FavorId | null>(null);
  const [showRules, setShowRules] = useState(false);
  const rulesSeen = useRulesSeen((s) => s.seen["dados"] === true);
  const markRulesSeen = useRulesSeen((s) => s.markSeen);
  const closeRules = useCallback(() => {
    setShowRules(false);
    markRulesSeen("dados");
  }, [markRulesSeen]);
  // Onboarding una sola vez: si ya las vio, no volvemos a interrumpir la partida.
  useEffect(() => {
    if (!rulesSeen) setShowRules(true);
  }, [rulesSeen]);
  const [doubleNext, setDoubleNext] = useState(false);
  const [lastRivalClaim, setLastRivalClaim] = useState<string | null>(null);
  const [dice, setDice] = useState<number[]>([1, 1, 1, 1, 1]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(MAX_ROLLS);
  const [firstRoll, setFirstRoll] = useState<number[] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [zeldaPlay, setZeldaPlay] = useState<ZeldaPlay | null>(null);
  const [zeldaThinking, setZeldaThinking] = useState(false);

  const presagioActive = useMemo(() => {
    const rumors = rumorsForGame("dados");
    const caliente = rumors.find((r) => r.id === "mesa-caliente");
    const zelda = rumors.find((r) => r.id === "zelda-apuesta");
    return {
      caliente: !!caliente,
      zelda: !!zelda,
      inspeccion: !!rumors.find((r) => r.id === "inspeccion-liga"),
    };
  }, []);

  const [presagio, setPresagio] = useState<Presagio | null>(null);
  // Los 5 dados tienen que entrar en una sola fila: a 84px se pasaban de 412px
  // y el quinto caía solo en un renglón aparte.
  const diceRowRef = useRef<HTMLDivElement>(null);
  const [dieSize, setDieSize] = useState(84);
  useEffect(() => {
    const el = diceRowRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const w = el.clientWidth;
      if (!w) return;
      const gap = w < 640 ? 8 : 12;
      setDieSize(Math.max(44, Math.min(84, Math.floor((w - gap * 4) / 5))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);
  const [cursedIndex, setCursedIndex] = useState<number>(-1);
  const [brokeRule, setBrokeRule] = useState<boolean>(false);
  const [holdsUsed, setHoldsUsed] = useState<number>(0);
  const effectiveMaxRolls = useMemo(() => maxRollsFor(presagio, MAX_ROLLS), [presagio]);

  const sfx = useDadosSfx();
  const reducedMotion = useReducedMotion();
  // Duración de la tirada: giro/rebote de ~620ms para que se lea el vuelo de
  // los dados; instantánea si el sistema pide reducir movimiento.
  const rollMs = reducedMotion ? 0 : 620;
  const [rollBurst, setRollBurst] = useState(0);
  const [winBurst, setWinBurst] = useState(0);
  const [winPulseKey, setWinPulseKey] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [lastNet, setLastNet] = useState(0);

  // Reanudación silenciosa: si la app muere a mitad de una mano de dados, la
  // recuperamos tal cual quedó. Guardado inválido o incompleto = partida
  // nueva, nunca un crash.
  useEffect(() => {
    const saved = loadGameSave("dados", 3);
    if (isValidDadosSave(saved) && saved.phase !== "idle" && saved.phase !== "match_over") {
      setLevelId(saved.levelId);
      setWager(saved.wager);
      setPot(saved.pot);
      setRound(saved.round);
      setTable(saved.table);
      setReserve(saved.reserve ?? []);
      setHand(saved.hand ?? []);
      setFavorsUsed(saved.favorsUsed ?? []);
      setRivalHand(saved.rivalHand ?? []);
      setLastPlayerClaim(saved.lastPlayerClaim ?? null);
      setDoubleNext(!!saved.doubleNext);
      setLastRivalClaim(saved.lastRivalClaim ?? null);
      setDice(saved.dice);
      setHeld(saved.held);
      setRollsLeft(saved.rollsLeft);
      setFirstRoll(saved.firstRoll);
      setPresagio(saved.presagio);
      setCursedIndex(saved.cursedIndex);
      setBrokeRule(saved.brokeRule);
      setHoldsUsed(saved.holdsUsed);
      setPhase(saved.phase);
      matchStartedAt.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (wager == null || !level.wagerChips.includes(wager)) {
      setWager(level.wagerChips[0]);
    }
  }, [levelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingClaim = prog.pendingReward(levelId).amount;
  const levelProgress = prog.getProgress(levelId);

  const totals = useMemo(() => tableTotals(table), [table]);
  const playerTotal = totals.player;
  const zeldaTotal = totals.rival;
  const contractsLeft = useMemo(() => openContracts(table).length, [table]);

  const startMatch = () => {
    if (wager == null) {
      setToast("Elegí una apuesta primero.");
      return;
    }
    tryStart(() => {
      if (!spend(wager)) {
        setToast("No te alcanza para sentarte.");
        return;
      }
      setPot(wager);
      const deal = dealNight(8);
      setTable(deal.table);
      setReserve(deal.reserve);
      setHand(deal.hand);
      setFavorsUsed([]);
      setRivalHand(deal.rivalHand);
      setLastPlayerClaim(null);
      setRivalTarget(null);
      setPendingFavor(null);
      setDoubleNext(false);
      setLastRivalClaim(null);
      setRound(1);
      setZeldaPlay(null);
      setWinPulseKey((k) => k + 1); // Efecto visual al empezar
      sfx.shake(1.2); // Sonido de cubilete fuerte al empezar

      const p = drawPresagio(`${levelId}:${Date.now()}`);
      setPresagio(p);
      setBrokeRule(false);
      // El presagio ya se muestra como sobre lacrado sobre el paño; un toast
      // encima tapaba el HUD y la anfitriona.
      matchStartedAt.current = Date.now();
      learn.begin();

      beginPlayerTurn(p);
    });
  };

  const beginPlayerTurn = (p: Presagio | null = presagio) => {
    setHeld([false, false, false, false, false]);
    setHoldsUsed(0);
    setRollsLeft(maxRollsFor(p, MAX_ROLLS));
    setFirstRoll(null);
    setPhase("player_roll");
    setDice([1, 1, 1, 1, 1]);

    if (p?.id === "hex_del_uno") {
      setCursedIndex(Math.floor(Math.random() * 5));
    } else {
      setCursedIndex(-1);
    }
    setToast(
      p?.id === "dos_tiros"
        ? "Tirá los cinco huesos — sólo 2 tiros por turno (presagio)."
        : "Tirá los cinco dados — hasta 3 tiros por turno.",
    );
  };

  const rollTimersRef = useRef<{ burst: number | null; end: number | null }>({
    burst: null,
    end: null,
  });
  useEffect(() => {
    return () => {
      if (rollTimersRef.current.burst != null) window.clearInterval(rollTimersRef.current.burst);
      if (rollTimersRef.current.end != null) window.clearTimeout(rollTimersRef.current.end);
      rollTimersRef.current = { burst: null, end: null };
    };
  }, []);

  const rollNow = () => {
    const capRolls = maxRollsFor(presagio, MAX_ROLLS);
    if (phase !== "player_roll" || rollsLeft <= 0 || rolling) return;
    haptic("dice");
    sfx.shake(0.42);
    setRollBurst((n) => n + 1);

    const settleRoll = () => {
      const finalDice = dice.map((v, i) => (held[i] ? v : 1 + Math.floor(Math.random() * 6)));
      const rolled = rollsLeft === capRolls ? rollDice(5) : finalDice;
      setDice(rolled);
      setRolling(false);
      sfx.land();
      setRollBurst((n) => n + 1);
      haptic("tap");

      const left = rollsLeft - 1;
      setRollsLeft(left);
      if (rollsLeft === capRolls) setFirstRoll([...rolled]);

      if (presagio?.id === "hex_del_uno") {
        setCursedIndex(Math.floor(Math.random() * 5));
      }
      if (left === 0) {
        setPhase("player_pick");
        setToast("Sin tiros. Cerrá un contrato con lo que hay.");
      } else {
        setToast(
          `Tocá los huesos que querés guardar y volvé a tirar (${left} tiro${left === 1 ? "" : "s"}).`,
        );
      }
    };

    if (rollMs === 0) {
      settleRoll();
      return;
    }

    setRolling(true);
    const burst = window.setInterval(() => {
      setDice((d) => d.map((v, i) => (held[i] ? v : 1 + Math.floor(Math.random() * 6))));
    }, 70);
    rollTimersRef.current.burst = burst;
    rollTimersRef.current.end = window.setTimeout(() => {
      window.clearInterval(burst);
      rollTimersRef.current.burst = null;
      rollTimersRef.current.end = null;
      settleRoll();
    }, rollMs);
  };

  const toggleHold = (i: number) => {
    if (pendingFavor === "dedo_balanza") {
      const next = (dice[i] % 6) + 1;
      setDice((d) => d.map((v, idx) => (idx === i ? next : v)));
      setFavorsUsed((u) => (u.includes("dedo_balanza") ? u : [...u, "dedo_balanza"]));
      setPendingFavor(null);
      setToast(`Girás el hueso: ahora marca ${next}.`);
      haptic("success");
      return;
    }
    if (phase !== "player_roll" || rollsLeft === maxRollsFor(presagio, MAX_ROLLS)) return;
    const currentlyHeld = held[i];
    const face = dice[i];
    // No hay límite de retención general (podés guardar los 5), pero los presagios pueden restringirlo.
    if (!currentlyHeld) {
      const check = canHoldWith(presagio, face, cursedIndex, i, rollsLeft);
      if (!check.allowed) {
        setToast(check.reason ?? "No podés retener este dado.");
        haptic("warning");
        return;
      }
    }
    haptic("tap");
    setHeld((h) => h.map((v, idx) => (idx === i ? !v : v)));
    setHoldsUsed((n) => (currentlyHeld ? n - 1 : n + 1));
  };

  const stand = () => {
    if (phase !== "player_roll" || rollsLeft === maxRollsFor(presagio, MAX_ROLLS)) return;
    setPhase("player_pick");
    setToast("Plantado. Cerrá un contrato o quemá uno.");
  };

  const capRolls = maxRollsFor(presagio, MAX_ROLLS);
  const servidaNow = rollsLeft === capRolls - 1 && firstRoll !== null;
  /** Contratos cerrados de primer tiro en la noche (para telemetría). */
  const servidasRef = useRef(0);

  /** Cierra un contrato con los dados que hay en la mesa. */
  const claimContract = (id: string) => {
    if (phase !== "player_pick" && phase !== "player_roll") return;
    if (phase === "player_roll" && rollsLeft === capRolls) return;
    const contract = contractById(id);
    const slot = table.find((t) => t.id === id);
    if (!slot || slot.owner !== null) return;

    // Solo verificamos si cierran los dados SI no es Quemar (aunque claimContract no se usa para quemar)
    const base = contractValue(contract, dice, servidaNow);
    if (base <= 0) {
      setToast(`Los huesos no cierran «${contract.title}».`);
      haptic("warning");
      return;
    }
    const adjusted = adjustContractScore(presagio, id, base, servidaNow);
    const value = doubleNext ? valorDoblado(adjusted.value) : adjusted.value;
    if (doubleNext) setDoubleNext(false);

    setTable((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, owner: "player" as const, value, servida: servidaNow } : t,
      ),
    );
    if (servidaNow) servidasRef.current += 1;
    setLastPlayerClaim(id);
    setToast(
      `${contract.title}: ${value} pts${adjusted.note ? ` · ${adjusted.note}` : ""}${
        servidaNow ? " · servida" : ""
      }.`,
    );
    haptic(servidaNow ? "heavy" : "success");
    if (servidaNow || contract.tier !== "menor" || value >= 30) {
      sfx.win();
      setWinBurst((n) => n + 1);
      setWinPulseKey((n) => n + 1);
    }
    trackDadosEvent({ kind: "pick", cat: "generala", value, servida: servidaNow });
    setPendingFavor(null);
    setPhase("scarlet");
  };

  /** Sin jugada posible: se quema el contrato libre más barato. */
  const burnContract = () => {
    if (phase !== "player_pick" && phase !== "player_roll") return;
    if (phase === "player_roll" && rollsLeft === capRolls) return;
    const open = openContracts(table);
    if (open.length === 0) return;
    const cheapest = open
      .slice()
      .sort((a, b) => contractById(a.id).pay - contractById(b.id).pay)[0];
    if (presagio?.id === "generala_o_nada" && cheapest.id === "cinco_huesos") setBrokeRule(true);
    setTable((prev) =>
      prev.map((t) => (t.id === cheapest.id ? { ...t, owner: "burned" as const, value: 0 } : t)),
    );
    setToast(`Quemaste «${contractById(cheapest.id).title}». La mesa toma nota.`);
    haptic("warning");
    setPendingFavor(null);
    setPhase("scarlet");
  };

  // ------------------------------------------------------------- favores
  const spendFavor = (id: FavorId) => setFavorsUsed((u) => (u.includes(id) ? u : [...u, id]));

  /** Favores que están en la mano pero no tienen efecto posible ahora mismo. */
  const unavailableFavors = useMemo(() => {
    const out: FavorId[] = [];
    const inTurn = phase === "player_roll" || phase === "player_pick";
    if (!inTurn)
      out.push("vuelta_de_mano", "dedo_balanza", "cortar_mazo", "ojo_cuervo", "cubilete_plomo");
    else if (reserve.length === 0) out.push("cortar_mazo");
    if (!lastRivalClaim) out.push("cobrar_deuda");
    if (doubleNext) out.push("doblar_apuesta");
    return out;
  }, [phase, reserve.length, lastRivalClaim, doubleNext]);

  const playFavor = (id: FavorId) => {
    if (favorsUsed.includes(id) || !matchActiveRef.current) return;
    if (pendingFavor === id) {
      setPendingFavor(null);
      return;
    }
    const favor = favorById(id);
    switch (id) {
      case "vuelta_de_mano": {
        if (phase !== "player_roll" && phase !== "player_pick") return;
        setRollsLeft((r) => r + 1);
        if (phase === "player_pick") setPhase("player_roll");
        spendFavor(id);
        setToast(`${favor.title}: te queda un tiro más.`);
        haptic("success");
        return;
      }
      case "doblar_apuesta": {
        setDoubleNext(true);
        spendFavor(id);
        setToast(`${favor.title}: el próximo contrato que cierres paga doble.`);
        haptic("success");
        return;
      }
      case "cobrar_deuda": {
        if (!lastRivalClaim) {
          setToast("Todavía no hay deuda que cobrar.");
          haptic("warning");
          return;
        }
        const stolen = lastRivalClaim;
        setTable((prev) =>
          prev.map((t) =>
            t.id === stolen
              ? { ...t, owner: "player" as const, value: valorRobado(t.value) }
              : t,
          ),
        );
        setLastRivalClaim(null);
        spendFavor(id);
        setToast(`${favor.title}: le robaste «${contractById(stolen).title}».`);
        haptic("heavy");
        return;
      }
      case "ojo_cuervo": {
        if (phase !== "player_roll" && phase !== "player_pick") return;
        setOjoArmado(true);
        spendFavor(id);
        setToast(`${favor.title}: vas a ver a qué contrato le apunta la rival.`);
        haptic("success");
        return;
      }
      case "cubilete_plomo": {
        if (phase !== "player_roll" && phase !== "player_pick") return;
        setPlomoArmado(true);
        spendFavor(id);
        setToast(`${favor.title}: en su próximo turno no pasa de 4.`);
        haptic("heavy");
        return;
      }
      case "dedo_balanza":
      case "cortar_mazo": {
        if (phase !== "player_roll" && phase !== "player_pick") return;
        setPendingFavor(id);
        setToast(
          id === "dedo_balanza"
            ? "Tocá el dado que querés girar."
            : "Tocá el contrato libre que querés cambiar.",
        );
        return;
      }
    }
  };

  const cutContract = (id: string) => {
    if (pendingFavor !== "cortar_mazo") return;
    const next = reserve[0];
    if (!next) {
      setToast("No quedan contratos en el mazo.");
      setPendingFavor(null);
      return;
    }
    setReserve((r) => r.slice(1));
    setTable((prev) => prev.map((t) => (t.id === id ? { id: next, owner: null, value: 0 } : t)));
    spendFavor("cortar_mazo");
    setPendingFavor(null);
    setToast(`Cortaste el mazo: entra «${contractById(next).title}».`);
    haptic("success");
  };

  useEffect(() => {
    if (phase !== "scarlet") return;
    setZeldaThinking(true);
    const hostessSkill = profileToGeneralaSkill(getEffectiveProfile(hostNpcId));

    const aiSkillOrder = { rookie: 0, normal: 1, sharp: 2 } as const;
    let chosenSkill =
      aiSkillOrder[hostessSkill] >= aiSkillOrder[level.aiSkill] ? hostessSkill : level.aiSkill;

    if (nem.active) {
      if (nem.difficulty >= 1.5) chosenSkill = "sharp";
      else if (nem.difficulty >= 1.3 && chosenSkill === "rookie") chosenSkill = "normal";

      if (nem.preference === "rookie") chosenSkill = "rookie";
      else if (nem.preference === "sharp") chosenSkill = "sharp";
    }
    if (openContracts(table).length === 0) {
      setZeldaThinking(false);
      setPhase("round_end");
      return;
    }
    // Ojo del Cuervo y Cubilete de Plomo valen sólo para este turno de la rival.
    const favoresContraRival: FavorId[] = [];
    if (ojoArmado) favoresContraRival.push("ojo_cuervo");
    if (plomoArmado) favoresContraRival.push("cubilete_plomo");
    const play = rivalTurn(table, chosenSkill, {
      hand: rivalHand,
      lastPlayerClaim,
      presagio: { ...presagio, caliente: presagioActive.caliente },
      playerDice: dice,
      favorsUsed: favoresContraRival,
    });
    setRivalTarget(play.target);
    setZeldaPlay({
      dice: play.dice,
      contractId: play.claimed,
      burnedId: play.burned,
      value: play.value,
      servida: play.servida,
      favorUsed: play.favorUsed,
      stolenId: play.stolen,
    });
    const t = window.setTimeout(() => {
      setTable((prev) =>
        prev.map((slot) => {
          if (play.claimed && slot.id === play.claimed && slot.owner === null) {
            return { ...slot, owner: "rival" as const, value: play.value, servida: play.servida };
          }
          if (play.burned && slot.id === play.burned && slot.owner === null) {
            return { ...slot, owner: "burned" as const, value: 0 };
          }
          if (play.stolen && slot.id === play.stolen && slot.owner === "player") {
            return { ...slot, owner: "rival" as const, value: play.value };
          }
          return slot;
        }),
      );
      if (play.claimed) setLastRivalClaim(play.claimed);
      if (play.stolen) {
        setLastRivalClaim(play.stolen);
        setLastPlayerClaim(null);
      }
      if (play.favorUsed) {
        const used = play.favorUsed;
        setRivalHand((h) => h.filter((f) => f !== used));
        setToast(`La anfitriona jugó «${favorById(used).title}».`);
      }
      setZeldaThinking(false);
      setRivalTarget(null);
      setOjoArmado(false);
      setPlomoArmado(false);
      setPhase("round_end");
    }, 1700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "round_end") return;
    if (nightOver(table)) {
      finishMatch(table);
      return;
    }
    const t = window.setTimeout(() => {
      setRound((r) => r + 1);
      setZeldaPlay(null);
      beginPlayerTurn();
    }, 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, table]);

  const finishMatch = (tbl: TableContract[]) => {
    const { player: pt, rival: zt } = tableTotals(tbl);
    const wagered = pot;
    let net = 0;
    let result: "W" | "L" | "T" = "T";
    if (pt > zt) {
      const basePayout = Math.round(pot * level.payoutMult);
      const payout = withRumorChips("dados", basePayout);
      addChips(payout);
      registerWin(pot);
      bumpReputation(3);
      net = payout - wagered;
      result = "W";
      setToast(`Ganaste ${payout} fichas en ${level.title}. (${pt} vs ${zt})`);
      setNpcOutcome("lose");
    } else if (pt < zt) {
      registerLoss();
      net = -wagered;
      result = "L";
      setToast(`Zelda te leyó los dados. La casa se queda con el bote. (${pt} vs ${zt})`);
      setNpcOutcome("win");
    } else {
      addChips(pot);
      net = 0;
      result = "T";
      setToast(`Empate. Te devuelven la apuesta. (${pt} vs ${zt})`);
      setNpcOutcome("tense");
    }

    const settle = settlePresagio(presagio, {
      brokeRule,
      won: result === "W",
    });
    if (settle.delta > 0) {
      addChips(settle.delta);
      net += settle.delta;
    } else if (settle.delta < 0) {
      spend(Math.min(-settle.delta, chips));
      net += settle.delta;
    }
    if (settle.note) sonner(settle.note);
    prog.recordMatch(levelId, result, pt, zt, net);

    // Torneo semanal: una planilla = una ronda
    void import("@/lib/daily-tournament").then(({ submitTourneyScore, activeTourneyGame }) => {
      if (activeTourneyGame() !== "dados") return;
      const bonus = result === "W" ? 150 : result === "T" ? 50 : 0;
      void submitTourneyScore("dados", Math.max(0, pt) + bonus);
    });

    learn.event(result === "L" ? "won" : result === "W" ? "lost" : "tied", `generala:${result}`);
    learn.finish({
      hostessWon: result === "L",
      durationMs: matchStartedAt.current ? Date.now() - matchStartedAt.current : undefined,
      playerAggressionRate: Math.min(1, pt / Math.max(1, pt + zt)),
    });
    void import("@/lib/narrative-hooks").then(({ recordGameOutcome }) => {
      recordGameOutcome({
        hostessId: hostNpcId,
        delta: net,
        clutch: result === "W" && Math.abs(pt - zt) <= 15,
      });
    });

    void import("@/lib/nemesis").then(({ reportGameOutcome, reportOutcomeMistakes }) => {
      reportOutcomeMistakes({
        game: "dados",
        playerScore: pt,
        cpuScore: zt,
        result,
      });
      reportGameOutcome("dados", result === "W" ? "win" : result === "L" ? "loss" : "draw");
    });
    matchStartedAt.current = 0;
    setLastNet(net);
    setEndOpen(true);

    trackDadosEvent({
      kind: "match-end",
      won: result === "W",
      draw: result === "T",
      playerScore: pt,
      cpuScore: zt,
      generalasScored: 0,
      servidasScored: servidasRef.current,
    });
    reportSingleScore("dados", pt);
    servidasRef.current = 0;

    setPhase("match_over");
  };

  const playerLine =
    phase === "match_over"
      ? playerTotal > zeldaTotal
        ? "Los dados te eligieron a vos. Hoy la adivina pierde y paga."
        : playerTotal < zeldaTotal
          ? "El cubilete cantó para mí. Volvé cuando junte fichas, encanto."
          : "Empate honesto. El humo no decidió todavía."
      : phase === "scarlet"
        ? "Zelda agita el cubilete. El humo del cigarro le tapa los ojos."
        : phase === "player_roll" && rollsLeft === effectiveMaxRolls
          ? "Sentate. Cinco huesos, tres tiros. Que la mesa los oiga rodar."
          : phase === "player_pick"
            ? "Cerrá un contrato antes que ella. Lo que no cierres, se quema."
            : "El reservado de Zelda Marek. Sentate y dejá que el humo te lea.";

  const lastPlayerTotalRef = useRef(0);
  const [playerDelta, setPlayerDelta] = useState<number>(0);
  const [playerDeltaTick, setPlayerDeltaTick] = useState(0);
  useEffect(() => {
    const diff = playerTotal - lastPlayerTotalRef.current;
    lastPlayerTotalRef.current = playerTotal;
    if (diff > 0) {
      setPlayerDelta(diff);
      setPlayerDeltaTick((t) => t + 1);
    }
  }, [playerTotal]);

  const playingPhase =
    phase === "player_roll" ||
    phase === "player_pick" ||
    phase === "scarlet" ||
    phase === "round_end";

  // El paño necesita saber si se puede cerrar y cuánto pagaría cada contrato
  // con los dados que hay en la mesa ahora mismo.
  const canPickNow =
    phase === "player_pick" ||
    (phase === "player_roll" && rollsLeft < effectiveMaxRolls && !rolling);
  const scorePreview = useMemo(() => {
    if (!canPickNow) return {} as Record<string, number>;
    const servida = rollsLeft === effectiveMaxRolls - 1 && firstRoll !== null;
    const out: Record<string, number> = {};
    for (const slot of table) {
      if (slot.owner === null) {
        const base = contractValue(contractById(slot.id), dice, servida);
        out[slot.id] = doubleNext ? base * 2 : base;
      }
    }
    return out;
  }, [canPickNow, dice, table, rollsLeft, effectiveMaxRolls, firstRoll, doubleNext]);
  const nothingToClaim =
    canPickNow && Object.values(scorePreview).every((v) => v <= 0) && contractsLeft > 0;
  const matchActive = phase !== "idle" && phase !== "match_over";
  const matchActiveRef = useRef(false);
  matchActiveRef.current = matchActive;

  useGameAutosave(
    {
      game: "dados",
      version: 3,
      active: matchActive,
      snapshot: () => ({
        levelId,
        wager,
        pot,
        phase,
        round,
        table,
        reserve,
        hand,
        favorsUsed,
        rivalHand,
        lastPlayerClaim,
        doubleNext,
        lastRivalClaim,
        dice,
        held,
        rollsLeft,
        firstRoll,
        presagio,
        cursedIndex,
        brokeRule,
        holdsUsed,
      }),
    },
    [
      levelId,
      wager,
      pot,
      phase,
      round,
      table,
      reserve,
      hand,
      favorsUsed,
      rivalHand,
      lastPlayerClaim,
      doubleNext,
      lastRivalClaim,
      dice,
      held,
      rollsLeft,
      firstRoll,
      presagio,
      cursedIndex,
      brokeRule,
      holdsUsed,
    ],
  );

  const handleSurrender = () => {
    if (!matchActive) return;
    const { player: pt, rival: zt } = tableTotals(table);
    registerLoss();
    setZeldaThinking(false);
    setNpcOutcome("win");
    setToast(`Te rendiste ante ${hostShort}. La mesa queda perdida por abandono.`);

    // El abandono cuenta como derrota para toda la progresión (liga, torneo,
    // némesis, aprendizaje y encargos), igual que una planilla terminada.
    prog.recordMatch(levelId, "L", pt, zt, -pot);
    void import("@/lib/daily-tournament").then(({ submitTourneyScore, activeTourneyGame }) => {
      if (activeTourneyGame() !== "dados") return;
      void submitTourneyScore("dados", Math.max(0, pt));
    });
    learn.event("won", "generala:surrender");
    learn.finish({
      hostessWon: true,
      durationMs: matchStartedAt.current ? Date.now() - matchStartedAt.current : undefined,
    });
    void import("@/lib/narrative-hooks").then(({ recordGameOutcome }) => {
      recordGameOutcome({ hostessId: hostNpcId, delta: -pot, clutch: false });
    });
    void import("@/lib/nemesis").then(({ reportGameOutcome, reportOutcomeMistakes }) => {
      reportOutcomeMistakes({ game: "dados", playerScore: pt, cpuScore: zt, result: "L" });
      reportGameOutcome("dados", "loss");
    });
    trackDadosEvent({
      kind: "match-end",
      won: false,
      draw: false,
      playerScore: pt,
      cpuScore: zt,
      generalasScored: 0,
      servidasScored: servidasRef.current,
    });
    reportSingleScore("dados", pt);
    servidasRef.current = 0;

    matchStartedAt.current = 0;
    setLastNet(-pot);
    setEndOpen(true);
    setPhase("match_over");
  };
  useSurrender(matchActive ? handleSurrender : null, "Rendirse");

  return (
    <GameRoomShell bg={zoneDados} room="dados" title="Cinco Huesos" subtitle={hostSubtitle}>
      <div className="mx-auto flex max-w-7xl justify-end px-4">
        <TourneyRoundBadge game="dados" />
      </div>
      <DadosCampaignMount />
      <DoorOpenReveal />

      <NoLivesGate open={gateOpen} onClose={closeGate} />

      <HuesosEndScreen
        open={endOpen && phase === "match_over"}
        table={table}
        rivalName={hostShort}
        net={lastNet}
        canRematch={wager != null && chips >= wager}
        onClose={() => setEndOpen(false)}
        onRematch={() => {
          setEndOpen(false);
          startMatch();
        }}
      />

      <div className="generala-room cuervo-mobile-compact mobile-stack-grid mx-auto grid max-w-7xl gap-6 px-4 pb-10 grid-cols-1 sm:grid-cols-[168px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="desktop-rail space-y-4">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative h-fit rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/80 p-4 shadow-deep backdrop-blur"
          >
            <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-sm border border-[var(--brass)]/40 bg-gradient-to-b from-[var(--mahogany)]/60 to-[var(--noir)]">
              <img
                src={hostPortrait}
                alt={`${hostName}, anfitriona del reservado de los dados`}
                className="absolute inset-0 h-full w-full select-none object-cover object-top"
                draggable={false}
                style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.85)) saturate(1.05)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-1 rounded-sm border border-[var(--brass)]/35"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2 rounded-sm border border-[var(--brass)]/15"
              />
              {[
                "top-1 left-1 border-t-2 border-l-2",
                "top-1 right-1 border-t-2 border-r-2",
                "bottom-1 left-1 border-b-2 border-l-2",
                "bottom-1 right-1 border-b-2 border-r-2",
              ].map((cls) => (
                <span
                  key={cls}
                  aria-hidden
                  className={`pointer-events-none absolute h-4 w-4 border-[var(--brass-bright)]/70 ${cls}`}
                />
              ))}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 30%, transparent 40%, oklch(0 0 0 / 0.7) 100%)",
                }}
              />
              <HostessHudStrip npcId={hostNpcId} />
            </div>
            <div className="mt-3 text-center font-display text-[11px] uppercase tracking-[0.5em] text-[var(--brass)]/80">
              — {hostName} —
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={zeldaLine || playerLine}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 min-h-[3.5rem] text-center font-script text-lg leading-snug text-[var(--brass-bright)]"
              >
                &ldquo;{zeldaLine || playerLine}&rdquo;
              </motion.p>
            </AnimatePresence>
          </motion.aside>

          {}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/82 p-4 shadow-deep backdrop-blur"
          >
            <div className="flex items-baseline justify-between">
              <div className="font-display text-[11px] uppercase tracking-[0.45em] text-[var(--brass)]/90">
                caja
              </div>
              <button
                type="button"
                onClick={() => setLevelPickerOpen(true)}
                className="rounded-sm border border-[var(--brass)]/45 px-2 py-0.5 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)] hover:bg-[var(--mahogany)]/40"
              >
                Cambiar mesa
              </button>
            </div>
            <div className="mt-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
              {level.title} · {level.subtitle}
            </div>
            <div className="mt-2 font-display text-2xl uppercase tracking-[0.18em] text-[var(--brass-bright)]">
              {chips} fichas
            </div>
            <div className="mt-1 font-display text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]/90">
              ★ {levelProgress.stars}/3 · ganadas {levelProgress.matchesWon}
              {levelProgress.bestScore > 0 && <> · mejor {levelProgress.bestScore}</>}
            </div>
            {pendingClaim > 0 && (
              <button
                type="button"
                onClick={() => {
                  const got = prog.claimRewards(levelId);
                  if (got > 0) {
                    addChips(got);
                    sonner.success(`Cobraste ${got} fichas en ${level.title}`);
                  }
                }}
                className="mt-2 w-full rounded-sm border border-[oklch(0.78_0.16_70)] bg-gradient-to-br from-[oklch(0.45_0.12_60)] to-[oklch(0.30_0.10_50)] px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.3em] text-[oklch(0.98_0.06_85)]"
              >
                Cobrar +{pendingClaim} fichas
              </button>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {level.wagerChips.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWager(value)}
                  className="rounded-sm border px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.25em]"
                  style={{
                    borderColor:
                      wager === value ? "var(--brass-bright)" : "oklch(0.45 0.08 60 / 0.45)",
                    background: wager === value ? "oklch(0.74 0.14 70)" : "transparent",
                    color: wager === value ? "var(--noir)" : "var(--brass)",
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <BrassButton
              type="button"
              variant="primary"
              size="md"
              shape="ingot"
              block
              onClick={startMatch}
              disabled={phase !== "idle" && phase !== "match_over"}
              className="mt-4"
            >
              {phase !== "idle" && phase !== "match_over"
                ? "Mesa en curso"
                : wager == null
                  ? "Elegí tu apuesta"
                  : `Sentarse · ${wager}`}
            </BrassButton>
            <p className="mt-2 text-[11px] italic text-[var(--smoke)]">
              Si ganás, pagamos {level.payoutMult}× tu apuesta. Empate devuelve el bote.
              {presagioActive.zelda && " · Bono Zelda x2 Activo."}
            </p>
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="gen-label mt-3 w-full rounded-[3px] border border-[var(--brass)]/45 px-3 py-1.5 text-[var(--brass)]"
            >
              cómo se juega
            </button>
          </motion.section>
        </div>

        {}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="game-focus mobile-panel relative rounded-sm border border-[var(--brass)]/40 bg-[var(--noir)]/75 p-4 shadow-deep backdrop-blur sm:p-6"
        >
          {}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-[var(--brass)]/20 pb-2">
            <div className="flex min-w-0 items-center gap-4">
              <Stat label="Vos" value={playerTotal} accent animateKey={playerTotal} />
              <span aria-hidden className="gen-display text-sm text-[var(--brass)]/90">
                vs
              </span>
              <Stat
                label={hostShort}
                value={zeldaTotal}
                glow={phase === "scarlet"}
                animateKey={zeldaTotal}
              />
              <Stat label="Bote" value={pot} animateKey={pot} />
            </div>
            <div className="shrink-0 text-right">
              <div className="gen-label text-[var(--smoke)]">Mesa</div>
              <div className="gen-display text-sm leading-tight text-[var(--brass-bright)]">
                {level.title}
              </div>
            </div>
          </div>

          {/* La noche avanza por contratos resueltos, no por rondas. */}
          <ProgressBar
            cleared={table.length > 0 ? table.length - contractsLeft : 0}
            total={table.length || 6}
          />

          {}
          <ScorePop tick={playerDeltaTick} delta={playerDelta} />

          {phase === "idle" || phase === "match_over" ? (
            <div className="mt-5 flex flex-col items-center gap-4 rounded-md border border-dashed border-[var(--brass)]/30 bg-[var(--noir)]/55 px-6 py-10 text-center">
              <div className="gen-label text-[var(--brass)]/90">
                {phase === "match_over" ? "fin de la partida" : "mesa fría"}
              </div>
              <div className="gen-display text-3xl text-[var(--ivory)]">
                {phase === "match_over"
                  ? playerTotal > zeldaTotal
                    ? `Ganaste · ${playerTotal} vs ${zeldaTotal}`
                    : playerTotal < zeldaTotal
                      ? `Zelda gana · ${zeldaTotal} vs ${playerTotal}`
                      : `Empate · ${playerTotal} igualados`
                  : "Los cubiletes esperan tu mano."}
              </div>
              <p className="gen-body max-w-md text-sm italic text-[var(--smoke)]">
                Elegí cuánto apostás, sentate y sacá los cinco dados.
              </p>
              {/* En teléfono el panel de apuesta lateral está oculto: replicamos
                  aquí los controles para poder empezar la mano. */}
              <div className="w-full sm:hidden">
                <div className="flex flex-wrap justify-center gap-2">
                  {level.wagerChips.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setWager(value)}
                      className="rounded-sm border px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.25em]"
                      style={{
                        borderColor:
                          wager === value ? "var(--brass-bright)" : "oklch(0.45 0.08 60 / 0.45)",
                        background: wager === value ? "oklch(0.74 0.14 70)" : "transparent",
                        color: wager === value ? "var(--noir)" : "var(--brass)",
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <BrassButton
                  type="button"
                  variant="primary"
                  size="md"
                  shape="ingot"
                  block
                  onClick={startMatch}
                  className="mt-3"
                >
                  {wager == null ? "Elegí tu apuesta" : `Sentarse · ${wager}`}
                </BrassButton>
              </div>
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="gen-label rounded-[3px] border border-[var(--brass)]/45 px-3 py-1.5 text-[var(--brass)]"
              >
                cómo se juega
              </button>
            </div>
          ) : (
            <>
              {}
              <div
                className="relative mt-4 overflow-hidden rounded-sm border border-[var(--brass)]/25 p-4"
                style={{
                  boxShadow:
                    "inset 0 1px 0 oklch(0.78 0.13 70 / 0.18), inset 0 -22px 50px oklch(0.04 0.01 25 / 0.7)",
                }}
              >
                <img
                  src={dadosFeltMat}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  style={{ filter: "saturate(1.05) brightness(1.15) contrast(1.02)" }}
                />
                {}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={{
                    background:
                      "repeating-conic-gradient(from 0deg at 50% 60%, oklch(0.78 0.14 70 / 0.18) 0deg 4deg, transparent 4deg 14deg)",
                    maskImage: "radial-gradient(ellipse at 50% 60%, black 0%, transparent 65%)",
                    WebkitMaskImage:
                      "radial-gradient(ellipse at 50% 60%, black 0%, transparent 65%)",
                  }}
                />
                {}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <span className="font-script text-[10rem] leading-none text-[var(--brass-bright)]/[0.04]">
                    Z
                  </span>
                </div>
                {}
                {[
                  { pos: "top-2 left-2", rot: "rotate(0deg)" },
                  { pos: "top-2 right-2", rot: "rotate(90deg)" },
                  { pos: "bottom-2 right-2", rot: "rotate(180deg)" },
                  { pos: "bottom-2 left-2", rot: "rotate(270deg)" },
                ].map((c) => (
                  <svg
                    key={c.pos}
                    aria-hidden
                    className={`pointer-events-none absolute h-10 w-10 text-[var(--brass)]/90 ${c.pos}`}
                    style={{ transform: c.rot }}
                    viewBox="0 0 40 40"
                    fill="none"
                  >
                    <path d="M0 0 L40 0 L0 40 Z" fill="currentColor" opacity="0.08" />
                    <path d="M2 2 L18 2 M2 2 L2 18" stroke="currentColor" strokeWidth="1.2" />
                    <path
                      d="M6 2 L6 10 M10 2 L10 8 M14 2 L14 6"
                      stroke="currentColor"
                      strokeWidth="0.8"
                    />
                    <path
                      d="M2 6 L10 6 M2 10 L8 10 M2 14 L6 14"
                      stroke="currentColor"
                      strokeWidth="0.8"
                    />
                  </svg>
                ))}
                <div className="relative">
                  {presagio && (
                    <div
                      className="relative z-[1] mb-4 overflow-hidden rounded-[3px] border px-3 py-2.5 pl-3"
                      style={{
                        borderColor: "oklch(0.62 0.09 70 / 0.45)",
                        background:
                          "linear-gradient(155deg, oklch(0.88 0.05 85) 0%, oklch(0.82 0.06 80) 55%, oklch(0.74 0.07 72) 100%)",
                        boxShadow:
                          "0 6px 14px oklch(0.04 0.01 25 / 0.55), inset 0 0 24px oklch(0.45 0.10 55 / 0.35)",
                      }}
                    >
                      {/* Solapa de sobre y sello lacrado */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-6"
                        style={{
                          background:
                            "linear-gradient(180deg, oklch(0.55 0.07 60 / 0.28), transparent)",
                          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                        }}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full"
                        style={{
                          background:
                            "radial-gradient(circle at 35% 30%, oklch(0.52 0.20 25), oklch(0.32 0.14 25))",
                          boxShadow: "inset 0 -2px 6px oklch(0.15 0.06 25 / 0.7)",
                          opacity: 0.9,
                        }}
                      />
                      <div className="relative flex items-start gap-2">
                        <span
                          className="gen-label mt-0.5 shrink-0"
                          style={{ color: "oklch(0.38 0.14 28)" }}
                        >
                          Presagio
                        </span>
                        <div className="min-w-0">
                          <div
                            className="gen-display text-lg leading-tight"
                            style={{ color: "oklch(0.24 0.05 40)" }}
                          >
                            {presagio.title}
                          </div>
                          <div
                            className="gen-body text-[11px] italic leading-snug"
                            style={{ color: "oklch(0.34 0.03 45)" }}
                          >
                            {presagio.omen}
                          </div>
                          <div
                            className="gen-label mt-0.5"
                            style={{ color: "oklch(0.38 0.14 28)" }}
                          >
                            {presagio.effect}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="gen-label mb-2 flex items-center justify-between text-[var(--brass)]/90">
                    <span className="min-w-0 flex-1 truncate">
                      {phase === "scarlet" ? `huesos de ${hostShort.toLowerCase()}` : "tu cubilete"}
                    </span>
                    {phase !== "scarlet" && (
                      <span className="flex shrink-0 items-center gap-2">
                        {held.some(Boolean) && (
                          <button
                            type="button"
                            onClick={() => held.forEach((h, i) => h && toggleHold(i))}
                            className="gen-label rounded-[3px] border border-[var(--brass)]/45 px-2 py-[3px] text-[var(--brass)]"
                          >
                            soltar todos
                          </button>
                        )}
                        <span className="text-[var(--brass-bright)]">
                          tiros · {rollsLeft}/{effectiveMaxRolls}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="relative" ref={diceRowRef}>
                    <motion.div
                      className="flex flex-nowrap items-center justify-center gap-2 py-2 sm:gap-3"
                      animate={
                        rolling
                          ? { x: [0, -3, 4, -5, 3, -2, 0], y: [0, 2, -1, 2, -1, 0] }
                          : { x: 0, y: 0 }
                      }
                      transition={{ duration: rolling ? 0.55 : 0.2, ease: "easeInOut" }}
                    >
                      {(phase === "scarlet" && zeldaPlay ? zeldaPlay.dice : dice).map((face, i) => {
                        const isHeld = phase !== "scarlet" && held[i];
                        const isCursed = phase !== "scarlet" && cursedIndex === i;
                        const disabled =
                          pendingFavor === "dedo_balanza"
                            ? rolling || firstRoll === null
                            : phase !== "player_roll" || rollsLeft === effectiveMaxRolls || rolling;
                        return (
                          <BoneDie
                            key={i}
                            face={face}
                            held={isHeld}
                            cursed={isCursed}
                            rolling={rolling && !held[i]}
                            size={dieSize}
                            disabled={disabled}
                            onClick={() => toggleHold(i)}
                          />
                        );
                      })}
                    </motion.div>
                    {}
                    <BurstParticles burstKey={rollBurst} tone="dust" count={12} />
                    {}
                    <BurstParticles burstKey={winBurst} tone="gold" count={22} />
                    {}
                    <AnimatePresence>
                      {winPulseKey > 0 && (
                        <motion.div
                          key={winPulseKey}
                          className="pointer-events-none absolute inset-0 rounded-sm"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: [0, 0.9, 0.6, 0], scale: [0.95, 1.05, 1.02, 1.06] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.1, ease: "easeOut", times: [0, 0.2, 0.7, 1] }}
                          style={{
                            boxShadow:
                              "0 0 45px 8px oklch(0.85 0.18 75 / 0.55), inset 0 0 30px oklch(0.85 0.18 75 / 0.35)",
                            border: "1px solid oklch(0.85 0.18 75 / 0.65)",
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {(phase === "player_roll" || phase === "player_pick") &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <div
                        className="gen-dock fixed inset-x-0 bottom-0 z-30 mx-auto max-w-7xl px-4 pt-2"
                        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
                      >
                        <FavorHand
                          hand={hand}
                          used={favorsUsed}
                          pending={pendingFavor}
                          disabled={false}
                          unavailable={unavailableFavors}
                          onPlay={playFavor}
                          onCancel={() => setPendingFavor(null)}
                          variant="dock"
                        />
                        <div className="mt-2 grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-stretch gap-2">
                          <BrassButton
                            type="button"
                            variant="primary"
                            size="lg"
                            onClick={rollNow}
                            disabled={phase !== "player_roll" || rollsLeft <= 0 || rolling}
                            className="min-w-0 [&>span]:whitespace-nowrap"
                          >
                            {rollsLeft === effectiveMaxRolls
                              ? "Tirar los dados"
                              : rolling
                                ? "Rodando…"
                                : rollsLeft > 0
                                  ? `Tirar (${rollsLeft})`
                                  : "Sin tiros"}
                          </BrassButton>
                          <button
                            type="button"
                            onClick={nothingToClaim ? burnContract : stand}
                            disabled={phase === "player_roll" && rollsLeft === effectiveMaxRolls}
                            className="gen-label min-h-[52px] min-w-0 whitespace-nowrap rounded-md border-2 border-[var(--brass)]/80 bg-[oklch(0.25_0.05_40)] px-2 text-[oklch(0.9_0.15_75)] shadow-gold disabled:opacity-30"
                          >
                            {phase === "player_pick" || nothingToClaim ? "Quemar" : "Plantarme"}
                          </button>
                        </div>
                      </div>,
                      document.body,
                    )}
                  {phase === "scarlet" && (
                    <div className="mt-3 text-center font-display text-[11px] uppercase tracking-[0.35em] text-[var(--brass)]/90">
                      {zeldaThinking ? (
                        <div className="flex flex-col items-center">
                          <span>{hostShort} lee los huesos…</span>
                          {zeldaPlay?.intent && (
                            <span className="mt-1 text-[11px] text-[oklch(0.85_0.18_75)] animate-pulse">
                              VA POR: {contractById(zeldaPlay.intent).title}
                            </span>
                          )}
                        </div>
                      ) : (
                        `${hostShort} jugó`
                      )}
                      {zeldaPlay && !zeldaThinking && (
                        <div className="mt-1 font-script text-2xl normal-case tracking-normal text-[var(--brass-bright)]">
                          {zeldaPlay.contractId
                            ? `${contractById(zeldaPlay.contractId).title} · ${zeldaPlay.value}`
                            : zeldaPlay.burnedId
                              ? `Quemó ${contractById(zeldaPlay.burnedId).title}`
                              : "Pasó de mano"}
                          {zeldaPlay.servida && zeldaPlay.value > 0 && (
                            <span className="ml-2 align-middle text-[11px] uppercase tracking-[0.3em] text-[var(--brass)]">
                              servida
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {playingPhase && (
            <>
              <ContractBoard
                table={table}
                rivalName={hostShort}
                preview={scorePreview}
                canClaim={canPickNow}
                cutMode={pendingFavor === "cortar_mazo"}
                rivalTarget={rivalTarget}
                rivalFavors={rivalHand.length}
                onClaim={claimContract}
                onCut={cutContract}
              />
              {phase !== "player_roll" && phase !== "player_pick" && (
                <div className="mt-8 rounded-sm border border-[var(--brass)]/20 bg-[var(--noir)]/40 p-4">
                  <FavorHand
                    hand={hand}
                    used={favorsUsed}
                    pending={pendingFavor}
                    disabled={phase === "scarlet" || phase === "round_end"}
                    unavailable={unavailableFavors}
                    onPlay={playFavor}
                    onCancel={() => setPendingFavor(null)}
                  />
                </div>
              )}
              {doubleNext && (
                <div className="gen-label mt-2 text-center text-[var(--brass-bright)]">
                  apuesta doblada · el próximo contrato paga ×2
                </div>
              )}
            </>
          )}

          <div className="mt-4">
            <ArtDecoToast message={toast} tone="neutral" />
          </div>
          {(phase === "player_roll" || phase === "player_pick") && (
            <div aria-hidden className="h-44" />
          )}
        </motion.section>
      </div>

      {}
      <div className="mx-auto max-w-7xl px-4 pb-10">
        <GeneralaHistory history={prog.history} currentLevelId={levelId} />
      </div>

      <GeneralaLevelSelect
        open={levelPickerOpen}
        currentLevelId={levelId}
        onClose={() => setLevelPickerOpen(false)}
        onPick={(id) => {
          if (phase !== "idle" && phase !== "match_over") {
            sonner.error("Terminá la mesa actual antes de cambiar.");
            return;
          }
          setLevelId(id);
        }}
      />

      {showRules && <HuesosRules onClose={closeRules} />}
    </GameRoomShell>
  );
}

function DoorOpenReveal() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.1, delay: 0.55 }}
    >
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: "-101%" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="absolute inset-y-0 left-0 w-1/2"
        style={{
          background: "linear-gradient(100deg, oklch(0.18 0.04 35), oklch(0.08 0.02 30))",
          boxShadow: "inset -2px 0 0 oklch(0.62 0.12 70)",
        }}
      />
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: "101%" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="absolute inset-y-0 right-0 w-1/2"
        style={{
          background: "linear-gradient(260deg, oklch(0.18 0.04 35), oklch(0.08 0.02 30))",
          boxShadow: "inset 2px 0 0 oklch(0.62 0.12 70)",
        }}
      />
    </motion.div>
  );
}

function Stat({
  label,
  value,
  accent,
  glow,
  animateKey,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  glow?: boolean;
  animateKey?: number | string;
}) {
  return (
    <div className="leading-tight">
      <div className="gen-label truncate text-[var(--brass)]/90">{label}</div>
      <div className="relative h-9 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={String(animateKey ?? value)}
            initial={{ y: 14, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -14, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
            className={`gen-num text-3xl ${
              accent
                ? "text-[oklch(0.85_0.18_75)]"
                : glow
                  ? "text-[oklch(0.9_0.16_80)] [text-shadow:0_0_10px_oklch(0.85_0.18_75/0.7)]"
                  : "text-[var(--ivory)]"
            }`}
          >
            {value}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProgressBar({ cleared, total }: { cleared: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (cleared / total) * 100)) : 0;
  return (
    <div className="mt-3">
      <div className="gen-label mb-1 flex items-center justify-between text-[var(--brass)]/90">
        <span>Contratos cerrados</span>
        <span>
          {cleared}/{total}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-[var(--brass)]/30 bg-[var(--noir)]/80">
        <motion.div
          className="absolute inset-y-0 left-0"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{
            background:
              "linear-gradient(90deg, oklch(0.62 0.14 60), oklch(0.85 0.18 75) 60%, oklch(0.95 0.12 90))",
            boxShadow: "0 0 10px oklch(0.85 0.18 75 / 0.6)",
          }}
        />
      </div>
    </div>
  );
}

function ScorePop({ tick, delta }: { tick: number; delta: number }) {
  return (
    <AnimatePresence>
      {tick > 0 && delta > 0 ? (
        <motion.div
          key={tick}
          initial={{ opacity: 0, y: 6, scale: 0.85 }}
          animate={{ opacity: 1, y: -6, scale: 1.05 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.9 }}
          className="pointer-events-none absolute left-1/2 top-[72px] z-10 -translate-x-1/2 font-script text-3xl text-[oklch(0.92_0.18_80)] [text-shadow:0_0_12px_oklch(0.85_0.18_75/0.7)]"
        >
          +{delta}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DadosCampaignMount() {
  const activeLevel = useDadosRun((s) => s.activeLevel);
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3">
      <DadosVictoryScreen />
    </div>
  );
}
