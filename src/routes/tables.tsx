import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BJ_PERSIST_KEY = "cuervo:blackjack:table:v1";
const DEFAULT_BET = 25;
function loadPersistedBet(): number {
  if (typeof window === "undefined") return DEFAULT_BET;
  try {
    const raw = window.localStorage.getItem(BJ_PERSIST_KEY);
    if (!raw) return DEFAULT_BET;
    const parsed = JSON.parse(raw);
    return Number.isFinite(parsed?.bet) ? Math.max(5, Math.floor(parsed.bet)) : DEFAULT_BET;
  } catch {
    return DEFAULT_BET;
  }
}
import {
  score,
  isNaturalBlackjack,
  settleHands,
  type BJCard,
  type BJHand,
  type HandOutcome,
} from "@/lib/games/blackjack/blackjack";
import { useNemesis } from "@/store/nemesis";
import { reportOutcomeMistakes } from "@/lib/nemesis";
import { reportSingleScore } from "@/store/single-scores";
import { useCasino } from "@/store/casino";
import { NoLivesGate } from "@/components/casino/NoLivesGate";
import { useTryStart } from "@/hooks/use-try-start";
import { useChipRefill } from "@/store/chip-refill";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";
import { useCampaignBridge, bumpCampaignEvent } from "@/hooks/use-campaign-bridge";
import { playCardDeal } from "@/lib/card-deal-sfx";
import { playChipBet } from "@/lib/chip-bet-sfx";

import { lazyNamed } from "@/lib/lazy";
const BlackjackVictoryScreen = lazyNamed(
  () => import("@/components/casino/blackjack/BlackjackVictoryScreen"),
  "BlackjackVictoryScreen",
);
const BlackjackPowerUpsHUD = lazyNamed(
  () => import("@/components/casino/blackjack/BlackjackPowerUpsHUD"),
  "BlackjackPowerUpsHUD",
);

import {
  useBlackjackRun,
  type HandReport,
  type BlackjackPowerUp,
} from "@/store/games/blackjack/blackjack-run";
import { BlackjackRunHUD } from "@/components/casino/blackjack/BlackjackRunHUD";
import { trackBlackjackHand } from "@/lib/games/blackjack/blackjack-tracker";
import { useHostessRank } from "@/store/hostess-rank";
import { hostessForGame } from "@/lib/single-hostess";
import { useLockGame } from "@/store/gameLock";
import { useSurrender } from "@/components/casino/SurrenderButton";
import { cardImg, cardBack } from "@/lib/cards";
import { CasinoHUD } from "@/components/casino/CasinoHUD";
import { GameTopBar } from "@/components/casino/GameTopBar";
import { useBlackjackHistory, summarizeHistory } from "@/store/games/blackjack/blackjack-history";
import { useSingleDifficulty } from "@/store/single-difficulty";
import { useCpuTraining } from "@/store/cpu-training";
import { useHaptics } from "@/hooks/use-haptics";

export const Route = createFileRoute("/tables")({
  head: () => ({
    links: [],
    meta: [
      { title: "Filo de Veintiuno — El Cuervo Dorado" },
      {
        name: "description",
        content: "21 sin pestañear. Vegas Strip: S17, DAS, split ×4, insurance.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TablesPage,
});

const GAME_ID = "blackjack";
const MAX_SPLIT_HANDS = 4;

const RANKS: Array<{ rank: string; value: number }> = [
  { rank: "A", value: 11 },
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 10 },
  { rank: "Q", value: 10 },
  { rank: "K", value: 10 },
];
const SUITS = ["♠", "♥", "♦", "♣"] as const;

type Suit = (typeof SUITS)[number];
type CardUI = BJCard & { suit: Suit; id: string };

function hiLoValue(card: { rank: string }): number {
  if (
    card.rank === "A" ||
    card.rank === "10" ||
    card.rank === "J" ||
    card.rank === "Q" ||
    card.rank === "K"
  ) {
    return -1;
  }
  if (["2", "3", "4", "5", "6"].includes(card.rank)) return 1;
  return 0;
}

function buildShoe(decks = 6): CardUI[] {
  const cards: CardUI[] = [];
  for (let d = 0; d < decks; d++) {
    for (const s of SUITS) {
      for (const r of RANKS) {
        cards.push({ ...r, suit: s, id: `${d}-${s}-${r.rank}-${Math.random()}` });
      }
    }
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

type Phase = "bet" | "insurance" | "player" | "dealer" | "settled";

interface PlayHand {
  cards: CardUI[];
  wager: number;
  doubled: boolean;
  fromSplitAces: boolean;
  finished: boolean;
}

const BET_UNITS = [5, 10, 25, 50, 100];

function isSoft17(cards: CardUI[]): boolean {
  if (score(cards) !== 17) return false;
  const raw = cards.reduce((s, c) => s + c.value, 0);
  const aces = cards.filter((c) => c.rank === "A").length;

  for (let k = 0; k < aces; k++) {
    if (raw - 10 * k === 17) return true;
  }
  return false;
}

function TablesPage() {
  useSingleHostessCorner(GAME_ID);
  useCampaignBridge("blackjack");
  const record = useNemesis((s) => s.recordResult);

  const nemesisRaw = useNemesis((s) => s.byGame[GAME_ID]);
  const nemesis = useMemo(
    () => useNemesis.getState().get(GAME_ID),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nemesisRaw],
  );
  const addHistory = useBlackjackHistory((s) => s.add);
  const historyEntries = useBlackjackHistory((s) => s.entries);
  const summary = useMemo(() => summarizeHistory(historyEntries), [historyEntries]);
  const difficulty = useSingleDifficulty((s) => s.get(GAME_ID));

  const cpuStatsRaw = useCpuTraining((s) => s.byGame[GAME_ID]);
  const cpuBoost = useMemo(
    () => useCpuTraining.getState().boost(GAME_ID),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cpuStatsRaw],
  );
  const reportCpu = useCpuTraining((s) => s.report);

  const dealerHitsSoft17 = difficulty === "sharp" || cpuBoost.progress >= 0.5;
  const { tryStart, gateOpen, closeGate } = useTryStart();
  const seatPaid = useRef(false);

  const activeEncargoLevel = useBlackjackRun((s) => s.activeLevel);
  const encargoRestrictions = useMemo(
    () => useBlackjackRun.getState().restrictions(),
    [activeEncargoLevel],
  );

  const SHOE_DECKS = 6;
  const shoe = useRef<CardUI[]>(buildShoe(SHOE_DECKS));
  const [shoeInfo, setShoeInfo] = useState({ remaining: shoe.current.length, count: 0 });
  const haptic = useHaptics();
  const initialBet = useRef(loadPersistedBet());
  // Fichas unificadas con la economía global del casino.
  const chips = useCasino((s) => s.chips);
  const setChips = useCallback((updater: number | ((c: number) => number)) => {
    const cur = useCasino.getState().chips;
    const next = typeof updater === "function" ? updater(cur) : updater;
    const delta = Math.round(next - cur);
    if (delta !== 0) useCasino.getState().addChips(delta);
  }, []);
  const [bet, setBet] = useState(initialBet.current);
  const [phase, setPhase] = useState<Phase>("bet");
  const [hands, setHands] = useState<PlayHand[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dealer, setDealer] = useState<CardUI[]>([]);
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [hostessLine, setHostessLine] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const [activePowerUps, setActivePowerUps] = useState<BlackjackPowerUp[]>([]);

  useLockGame(phase === "player" || phase === "dealer" || phase === "insurance");

  // Persistir solo la apuesta preferida; las fichas viven en la caja del casino.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(BJ_PERSIST_KEY, JSON.stringify({ bet }));
    } catch {
      /* storage lleno o bloqueado: ignorar */
    }
  }, [bet]);

  // Si te quedaste sin fichas, la mesa baja la apuesta a lo que alcance.
  useEffect(() => {
    if ((phase === "bet" || phase === "settled") && chips > 0 && bet > chips) {
      setBet(Math.max(5, Math.floor(chips)));
    }
  }, [chips, bet, phase]);

  const draw = useCallback((): CardUI => {
    // Reshuffle solo puede pasar acá si el zapato se agota en medio de una mano
    // (caso extremo). El reshuffle "normal" ocurre entre rondas, en deal().
    let resetCount = false;
    if (shoe.current.length < 4) {
      shoe.current = buildShoe(SHOE_DECKS);
      resetCount = true;
    }
    const card = shoe.current.pop() as CardUI;
    setShoeInfo((prev) => ({
      remaining: shoe.current.length,
      count: resetCount ? hiLoValue(card) : prev.count + hiLoValue(card),
    }));
    return card;
  }, []);

  const dealerUp = dealer[0];
  const showDealerHidden = phase === "settled" || phase === "dealer";
  const dealerScore = useMemo(() => score(dealer), [dealer]);

  const playerAreaRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (phase !== "player" && phase !== "settled") return;
    const el = playerAreaRef.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 260);
    return () => window.clearTimeout(id);
  }, [phase, hands.length]);

  const settleRound = useCallback(
    (finalHands: PlayHand[], finalDealer: CardUI[], insurance: number) => {
      const bjHands: BJHand[] = finalHands.map((h) => ({
        cards: h.cards,
        wager: h.wager,
        doubled: h.doubled,
        surrendered: false,
        fromSplitAces: h.fromSplitAces,
      }));
      const result = settleHands(bjHands, finalDealer, insurance);

      let finalPayout = result.totalPayout;
      let net = result.netHands + (result.insurancePayout - insurance);

      // Power-up Bribaje: reduce pérdida del encargo
      const activeRun = useBlackjackRun.getState();
      if (net < 0 && activeRun.activeLevel && activeRun.inventory.bribe > 0) {
        const refund = Math.floor(Math.abs(net) * 0.5);
        finalPayout += refund;
        net += refund;
        activeRun.usePowerUp("bribe");
      }

      setChips((c) => c + finalPayout);
      setPhase("settled");
      const outcome = net > 0 ? "win" : net < 0 ? "loss" : "draw";

      const anyNaturalBj = result.perHand.some((r) => r.outcome === "blackjack");
      haptic(
        anyNaturalBj
          ? "heavy"
          : outcome === "win"
            ? "success"
            : outcome === "loss"
              ? "error"
              : "warning",
      );
      record(GAME_ID, outcome);
      // Puntaje de liga a partir de la ganancia neta de la mano
      // (las fichas ya se mueven sobre la caja global del casino).
      if (net > 0) {
        void import("@/store/league-progress").then(({ awardLeaguePoints }) =>
          awardLeaguePoints("blackjack", Math.max(1, Math.floor(net / 2))),
        );
      }
      if (outcome === "win") {
        bumpCampaignEvent("blackjack");
        void import("@/lib/nemesis").then(({ reportGameOutcome }) =>
          reportGameOutcome("blackjack", "win"),
        );
      } else if (outcome === "loss") {
        void import("@/lib/nemesis").then(({ reportGameOutcome }) =>
          reportGameOutcome("blackjack", "loss"),
        );
      }

      {
        const anyBj = result.perHand.some((r) => r.outcome === "blackjack");
        const anyWin = result.perHand.some(
          (r) => r.outcome === "blackjack" || r.outcome === "win" || r.outcome === "dealer-bust",
        );
        const anyPush = result.perHand.some((r) => r.outcome === "push");
        const handOutcome: "blackjack" | "win" | "push" | "loss" = anyBj
          ? "blackjack"
          : anyWin
            ? "win"
            : anyPush && net === 0
              ? "push"
              : "loss";
        trackBlackjackHand({
          outcome: handOutcome,
          net,
          wager: finalHands[0]?.wager ?? 0,
          doubled: finalHands.some((h) => h.doubled),
          split: finalHands.length > 1,
          hands: finalHands.length,
        });
      }

      reportSingleScore("blackjack", Math.max(0, net));

      reportOutcomeMistakes({
        game: "blackjack",
        net,
        playerScore: score(finalHands[0]?.cards ?? []),
        dealerScore: score(finalDealer),
        outcomes: result.perHand.map((r) => r.outcome),
      });
      const h = hostessForGame(GAME_ID);
      if (h) {
        setHostessLine(
          outcome === "win" ? h.win : outcome === "loss" ? h.loss : "Empate. Otra mano.",
        );
      }

      const labels = result.perHand
        .map((r, i) => `M${i + 1}: ${labelFor(r.outcome)} (${r.net >= 0 ? "+" : ""}${r.net})`)
        .join("  ·  ");
      const insLabel =
        insurance > 0
          ? ` · Seguro ${result.insurancePayout > 0 ? "+" + (result.insurancePayout - insurance) : "-" + insurance}`
          : "";
      setMessage(`${labels}${insLabel} · Neto ${net >= 0 ? "+" : ""}${net}`);

      addHistory({
        bet: finalHands.reduce((s, h) => s + h.wager, 0) + insurance,
        net,
        playerScore: score(finalHands[0]?.cards ?? []),
        dealerScore: score(finalDealer),
        outcomes: result.perHand.map((r) => r.outcome),
        insuranceBet: insurance,
        insurancePayout: result.insurancePayout,
        splits: finalHands.length,
        doubled: finalHands.some((h) => h.doubled),
      });

      reportCpu(GAME_ID, {
        playerWon: net > 0,
        spread: Math.min(100, Math.abs(net)),
      });
    },
    [record, addHistory, reportCpu],
  );

  const finishDealerAndSettle = useCallback(
    (finalHands: PlayHand[], insurance: number) => {
      const anyAlive = finalHands.some((h) => score(h.cards) <= 21);
      const d = [...dealer];
      if (anyAlive) {
        setPhase("dealer");

        while (score(d) < 17 || (dealerHitsSoft17 && isSoft17(d))) {
          d.push(draw());
        }
        setDealer(d);
      }
      settleRound(finalHands, d, insurance);
    },
    [dealer, draw, settleRound, dealerHitsSoft17],
  );

  const advanceOrSettle = useCallback(
    (updated: PlayHand[], insurance: number) => {
      const nextIdx = updated.findIndex((h, i) => i > activeIdx - 1 && !h.finished);

      let next = -1;
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i].finished) {
          next = i;
          break;
        }
      }
      void nextIdx;
      if (next === -1) {
        finishDealerAndSettle(updated, insurance);
      } else {
        setActiveIdx(next);
      }
    },
    [activeIdx, finishDealerAndSettle],
  );

  const deal = useCallback(() => {
    if (chips < bet) return;
    // Sentarse a la mesa cuesta una vida (una sola vez por sesión, no por mano),
    // igual que el resto de los juegos de la casa.
    if (!seatPaid.current) {
      const ok = tryStart(() => {
        seatPaid.current = true;
      });
      if (!ok) return;
    }
    // Cut card: si el zapato bajó del umbral, se rebaraja limpio entre manos
    // para evitar reshuffles a mitad de ronda.
    if (shoe.current.length < 52) {
      shoe.current = buildShoe(SHOE_DECKS);
      setShoeInfo({ remaining: shoe.current.length, count: 0 });
    }
    setActivePowerUps([]); // Limpiar efectos temporales
    haptic("select");
    setChips((c) => c - bet);
    playChipBet();
    const p: CardUI[] = [draw(), draw()];
    const d: CardUI[] = [draw(), draw()];
    playCardDeal();
    const initialHand: PlayHand = {
      cards: p,
      wager: bet,
      doubled: false,
      fromSplitAces: false,
      finished: false,
    };
    setHands([initialHand]);
    setActiveIdx(0);
    setDealer(d);
    setInsuranceBet(0);
    setMessage(null);
    setHostessLine(undefined);

    if (d[0].rank === "A" && !encargoRestrictions.noInsurance) {
      setPhase("insurance");
      return;
    }

    if (isNaturalBlackjack(p) || isNaturalBlackjack(d)) {
      settleRound([{ ...initialHand, finished: true }], d, 0);
    } else {
      setPhase("player");
    }
  }, [chips, bet, draw, settleRound, encargoRestrictions.noInsurance, haptic, tryStart]);

  const declineInsurance = useCallback(() => {
    if (isNaturalBlackjack(dealer) || isNaturalBlackjack(hands[0].cards)) {
      settleRound([{ ...hands[0], finished: true }], dealer, 0);
    } else {
      setPhase("player");
    }
  }, [dealer, hands, settleRound]);

  const takeInsurance = useCallback(() => {
    const ins = Math.floor(hands[0].wager / 2);
    if (chips < ins) {
      declineInsurance();
      return;
    }
    setChips((c) => c - ins);
    setInsuranceBet(ins);
    if (isNaturalBlackjack(dealer) || isNaturalBlackjack(hands[0].cards)) {
      settleRound([{ ...hands[0], finished: true }], dealer, ins);
    } else {
      setPhase("player");
    }
  }, [hands, chips, dealer, settleRound, declineInsurance]);

  const currentHand = hands[activeIdx];
  const currentScore = useMemo(() => (currentHand ? score(currentHand.cards) : 0), [currentHand]);

  const hit = useCallback(() => {
    if (phase !== "player" || !currentHand || currentHand.finished) return;
    const card = draw();
    const updated = hands.map((h, i) =>
      i === activeIdx ? { ...h, cards: [...h.cards, card] } : h,
    );
    const s = score(updated[activeIdx].cards);

    // Power-up Segunda Oportunidad
    if (s > 21 && activePowerUps.includes("second-chance")) {
      setActivePowerUps((prev) => prev.filter((p) => p !== "second-chance"));
      setMessage("¡Segunda Oportunidad activada! Carta descartada.");
      haptic("warning");
      // Mantenemos las cartas previas pero cerramos la mano (el hit falló pero el bust se evitó descartando la carta)
      const restored = hands.map((h, i) => (i === activeIdx ? { ...h, finished: true } : h));
      setHands(restored);
      advanceOrSettle(restored, insuranceBet);
      return;
    }

    if (s >= 21) updated[activeIdx].finished = true;

    haptic(s > 21 ? "error" : "tap");
    setHands(updated);
    if (updated[activeIdx].finished) advanceOrSettle(updated, insuranceBet);
  }, [
    phase,
    currentHand,
    hands,
    activeIdx,
    draw,
    advanceOrSettle,
    insuranceBet,
    haptic,
    activePowerUps,
  ]);

  const stand = useCallback(() => {
    if (phase !== "player" || !currentHand) return;
    haptic("select");
    const updated = hands.map((h, i) => (i === activeIdx ? { ...h, finished: true } : h));
    setHands(updated);
    advanceOrSettle(updated, insuranceBet);
  }, [phase, currentHand, hands, activeIdx, advanceOrSettle, insuranceBet, haptic]);

  const canDouble =
    phase === "player" &&
    !!currentHand &&
    currentHand.cards.length === 2 &&
    !currentHand.fromSplitAces &&
    chips >= currentHand.wager &&
    !encargoRestrictions.noDouble;

  const dbl = useCallback(() => {
    if (!canDouble || !currentHand) return;
    haptic("heavy");
    setChips((c) => c - currentHand.wager);
    const card = draw();
    const updated = hands.map((h, i) =>
      i === activeIdx
        ? { ...h, cards: [...h.cards, card], wager: h.wager * 2, doubled: true, finished: true }
        : h,
    );
    setHands(updated);
    advanceOrSettle(updated, insuranceBet);
  }, [canDouble, currentHand, hands, activeIdx, draw, advanceOrSettle, insuranceBet, haptic]);

  const canSplit =
    phase === "player" &&
    !!currentHand &&
    currentHand.cards.length === 2 &&
    hands.length < MAX_SPLIT_HANDS &&
    chips >= currentHand.wager &&
    !encargoRestrictions.noSplit &&
    currentHand.cards[0].value === currentHand.cards[1].value;

  const doSplit = useCallback(() => {
    if (!canSplit || !currentHand) return;
    haptic("heavy");
    setChips((c) => c - currentHand.wager);
    const [c1, c2] = currentHand.cards;
    const isAces = c1.rank === "A";

    const newCard1 = draw();
    const newCard2 = draw();
    const h1: PlayHand = {
      cards: [c1, newCard1],
      wager: currentHand.wager,
      doubled: false,
      fromSplitAces: isAces,

      finished: isAces,
    };
    const h2: PlayHand = {
      cards: [c2, newCard2],
      wager: currentHand.wager,
      doubled: false,
      fromSplitAces: isAces,
      finished: isAces,
    };
    const updated = [...hands.slice(0, activeIdx), h1, h2, ...hands.slice(activeIdx + 1)];
    setHands(updated);
    if (isAces) {
      const next = updated.findIndex((h) => !h.finished);
      if (next === -1) finishDealerAndSettle(updated, insuranceBet);
      else setActiveIdx(next);
    } else {
      setActiveIdx(activeIdx);
    }
  }, [canSplit, currentHand, hands, activeIdx, draw, finishDealerAndSettle, insuranceBet, haptic]);

  const nextHand = useCallback(() => {
    setHands([]);
    setDealer([]);
    setActiveIdx(0);
    setInsuranceBet(0);
    setMessage(null);
    setPhase("bet");
  }, []);

  const handleSurrender = useCallback(() => {
    if (phase !== "player" && phase !== "dealer" && phase !== "insurance") return;
    // Rendirse: devuelve la mitad del wager (redondeo abajo, como settleHands),
    // marca las manos vivas como rendidas y liquida contra el dealer actual
    // sin obligarlo a robar más cartas. Reutiliza settleRound para que chips,
    // historial, campaign, nemesis y tracker queden consistentes.
    if (hands.length === 0) {
      setPhase("settled");
      return;
    }
    const surrendered: PlayHand[] = hands.map((h) => ({ ...h, finished: true }));
    // settleHands recibe surrendered=true por mano — marcamos todas las que
    // siguen vivas (score<=21 y no terminadas por bust).
    const bjHands: BJHand[] = surrendered.map((h) => ({
      cards: h.cards,
      wager: h.wager,
      doubled: h.doubled,
      surrendered: score(h.cards) <= 21,
      fromSplitAces: h.fromSplitAces,
    }));
    const result = settleHands(bjHands, dealer, insuranceBet);
    setChips((c) => c + result.totalPayout);
    setPhase("settled");
    const net = result.netHands + (result.insurancePayout - insuranceBet);
    setMessage(`Te rendiste · ${net >= 0 ? "+" : ""}${net}`);
    record(GAME_ID, "loss");
    addHistory({
      bet: surrendered.reduce((s, h) => s + h.wager, 0) + insuranceBet,
      net,
      playerScore: score(surrendered[0]?.cards ?? []),
      dealerScore: score(dealer),
      outcomes: result.perHand.map((r) => r.outcome),
      insuranceBet,
      insurancePayout: result.insurancePayout,
      splits: surrendered.length,
      doubled: surrendered.some((h) => h.doubled),
    });
    trackBlackjackHand({
      outcome: "loss",
      net,
      wager: surrendered[0]?.wager ?? 0,
      doubled: false,
      split: surrendered.length > 1,
      hands: surrendered.length,
    });
    haptic("warning");
    const h = hostessForGame(GAME_ID);
    if (h) setHostessLine(h.loss);
  }, [phase, hands, dealer, insuranceBet, record, addHistory, haptic]);
  useSurrender(
    phase === "player" || phase === "dealer" || phase === "insurance" ? handleSurrender : null,
    "Rendirse",
  );

  return (
    <main
      className="cuervo-game-root relative text-[var(--marfil)]"
      style={{
        fontFamily: "'Barlow', system-ui, sans-serif",
        height: "calc(100svh - var(--cd-content-offset, 0px))",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <h1 className="sr-only">Blackjack — Vegas Strip</h1>
      <BlackjackEncargosMount />
      <BlackjackVictoryScreen />
      <CasinoHUD />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 30%, rgba(45,90,61,0.25) 0%, transparent 70%), radial-gradient(80% 80% at 50% 100%, rgba(122,31,36,0.20) 0%, transparent 60%), linear-gradient(180deg, rgba(11,21,18,0.35) 0%, rgba(11,21,18,0.55) 100%)",
        }}
      />
      <div
        className="relative mx-auto flex max-w-5xl flex-col px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] sm:px-6"
        style={{
          paddingTop: "calc(var(--hud-h, 64px) + 12px)",
          minHeight: "calc(100svh - var(--cd-content-offset, 0px) - var(--hud-h, 64px) - 12px)",
        }}
      >
        <GameTopBar
          className="mb-4 ml-14 sm:ml-0"
          title="FILO DE VEINTIUNO"
          subtitle={nemesis.name}
          chips={
            <>
              <span
                className="hidden shrink-0 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--marfil)]/80 sm:inline-block"
                title={`Nemesis · ${nemesis.name}`}
              >
                Nemesis · {nemesis.name}
              </span>

              <span className="shrink-0 rounded-full border border-[var(--oro)]/40 bg-[var(--oro)]/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--oro)]">
                Nv {nemesis.level}
              </span>
            </>
          }
          trailing={
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="shrink-0 inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/60 hover:text-[var(--oro)]"
              aria-label="Historial"
            >
              ⟳ {summary.played}
            </button>
          }
        />

        {}
        <section className="rounded-2xl border border-white/10 bg-[var(--verde-noche)]/78 p-3.5 sm:p-5 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--marfil)]/65 sm:tracking-[0.24em]">
            <span className="whitespace-nowrap">Crupier</span>
            {showDealerHidden && (
              <span className="whitespace-nowrap text-[var(--oro)]">· {dealerScore}</span>
            )}
            {!showDealerHidden && dealerUp && (
              <span className="whitespace-nowrap font-bold text-[var(--cd-gold-warm)]">
                · visible {dealerUp.rank}
                {dealerUp.suit}
              </span>
            )}
            <span className="ml-auto shrink-0 whitespace-nowrap rounded-full border border-white/10 px-2 py-[2px] text-[11px] tracking-[0.16em] text-[var(--marfil)]/80 sm:tracking-[0.22em]">
              {dealerHitsSoft17 ? "H17" : "S17"} · {cpuBoost.stage}
            </span>
          </div>
          <div
            className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--marfil)]/65"
            title="Cartas que quedan en el zapato y conteo Hi-Lo en curso"
          >
            <span className="whitespace-nowrap rounded-full border border-white/10 px-2 py-[2px]">
              Zapato · {shoeInfo.remaining}/{SHOE_DECKS * 52}
            </span>
            <span
              className={`whitespace-nowrap rounded-full border px-2 py-[2px] ${
                shoeInfo.count > 0
                  ? "border-[var(--oro)]/50 text-[var(--oro)]"
                  : shoeInfo.count < 0
                    ? "border-white/15 text-[var(--marfil)]/80"
                    : "border-white/10 text-[var(--marfil)]/65"
              }`}
            >
              Cuenta · {shoeInfo.count > 0 ? "+" : ""}
              {shoeInfo.count}
            </span>
          </div>

          <div className="flex min-h-[92px] flex-wrap gap-2 overflow-hidden">
            {dealer.map((c, i) => (
              <CardFace
                key={c.id}
                card={c}
                hidden={!showDealerHidden && i === 1 && !activePowerUps.includes("double-face")}
              />
            ))}
            {dealer.length === 0 && <EmptySlot hint="El crupier espera tu apuesta" />}
          </div>
        </section>

        {}
        {phase === "insurance" && (
          <div className="mt-3 rounded-2xl border border-[var(--oro)]/50 bg-[var(--oro)]/10 p-4">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--oro)]">
              Seguro · el crupier muestra un As
            </div>
            <div className="mb-3 text-sm text-[var(--marfil)]/80">
              Podés apostar la mitad ({Math.floor(bet / 2)}) contra el blackjack del crupier. Paga
              2:1 si acertás.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={takeInsurance}
                disabled={chips < Math.floor(bet / 2)}
                className="gold-cta h-10 flex-1 rounded-full px-4 text-sm font-bold uppercase tracking-[0.2em] disabled:opacity-40"
              >
                Tomar seguro · {Math.floor(bet / 2)}
              </button>
              <button
                type="button"
                onClick={declineInsurance}
                className="h-10 flex-1 rounded-full border border-white/20 bg-white/[0.06] px-4 text-sm font-bold uppercase tracking-[0.2em] text-[var(--marfil)]"
              >
                No, gracias
              </button>
            </div>
          </div>
        )}

        {}
        {message && (
          <div
            className="my-3 rounded-2xl border border-[var(--oro)]/60 bg-[var(--oro)]/10 px-4 py-2 text-center text-xs uppercase tracking-[0.2em] text-[var(--oro)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {message}
          </div>
        )}

        {}
        <section
          ref={playerAreaRef}
          className="mt-3 rounded-2xl border border-white/10 bg-[var(--verde-noche)]/78 p-3.5 sm:p-5 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:mt-4"
        >
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--marfil)]/65">
            Vos {hands.length > 1 && <span>· {hands.length} manos</span>}
          </div>
          <div
            className={`flex flex-col gap-3 ${
              hands.length > 2 ? "max-h-[38svh] overflow-y-auto pr-1" : ""
            }`}
          >
            {hands.length === 0 && (
              <div className="flex min-h-[92px] gap-2">
                <EmptySlot hint="Apostá y pedí reparto" />
              </div>
            )}
            {hands.map((h, i) => {
              const s = score(h.cards);
              const isActive = phase === "player" && i === activeIdx && !h.finished;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-3 transition ${
                    isActive
                      ? "border-[var(--oro)] bg-[var(--oro)]/5"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--marfil)]/80">
                    Mano {i + 1} · {s}{" "}
                    {h.doubled && <span className="text-[var(--oro)]">· doblada</span>}
                    {h.fromSplitAces && <span className="text-[var(--oro)]">· ases</span>}
                    {h.finished && !isActive && (
                      <span className="text-[var(--marfil)]/65">· cerrada</span>
                    )}
                    <span className="ml-auto text-[var(--oro)]">${h.wager}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 overflow-hidden">
                    {h.cards.map((c) => (
                      <CardFace key={c.id} card={c} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {}
        <div className="mt-auto sticky bottom-0 z-20 -mx-4 border-t border-white/10 bg-[var(--verde-noche)]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pt-6 lg:pb-0 lg:backdrop-blur-0">
          {hostessLine && (
            <div
              key={hostessLine + phase}
              className="mb-1.5 line-clamp-1 text-balance sm:line-clamp-2 text-center text-[11px] italic leading-snug text-[var(--marfil)]/80"
            >
              «{hostessLine}»
            </div>
          )}
          <div className="mb-2 flex items-center justify-between text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[var(--marfil)]/80">
            <BlackjackPowerUpsHUD
              onUse={(kind) => {
                haptic("select");
                if (kind === "double-face") {
                  setActivePowerUps((prev) => [...prev, "double-face"]);
                } else if (kind === "second-chance") {
                  setActivePowerUps((prev) => [...prev, "second-chance"]);
                }
              }}
              disabledKinds={phase !== "player" ? ["double-face", "second-chance"] : []}
            />
            <span className="ml-auto">
              Apuesta · <span className="font-bold text-[var(--cd-gold-warm)]">{bet}</span>
            </span>
          </div>
          {phase === "bet" || phase === "settled" ? (
            <div className="flex flex-wrap items-center gap-2">
              {BET_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setBet(u)}
                  disabled={u > chips}
                  className={`h-10 min-w-[46px] rounded-full border px-2.5 text-sm font-bold sm:h-12 sm:min-w-[52px] sm:px-3 transition disabled:opacity-30 ${
                    bet === u
                      ? "gold-chip-on"
                      : "border-white/15 bg-white/[0.04] text-[var(--marfil)] hover:border-[var(--oro)]/60"
                  }`}
                >
                  {u}
                </button>
              ))}
              <button
                type="button"
                onClick={phase === "settled" ? nextHand : deal}
                disabled={chips < bet && phase !== "settled"}
                className="gold-cta ml-auto h-10 rounded-full px-5 text-sm sm:h-12 sm:px-6 font-bold uppercase tracking-[0.2em] disabled:opacity-40"
              >
                {phase === "settled" ? "Otra mano" : "Repartir"}
              </button>
              {chips <= 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const got = useChipRefill.getState().claim();
                    if (got > 0) {
                      useCasino.getState().addChips(got);
                      setMessage(`La caja te adelanta ${got} fichas.`);
                    } else {
                      setMessage("La caja está cerrada. Volvé más tarde por tu recarga.");
                    }
                  }}
                  className="h-12 rounded-full border border-white/20 bg-white/5 px-4 text-xs uppercase tracking-[0.2em] text-[var(--marfil)]/80"
                >
                  Refill
                </button>
              )}
            </div>
          ) : phase === "player" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={hit}
                className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-full border border-white/20 bg-white/[0.06] px-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--marfil)] transition hover:border-[var(--oro)] hover:text-[var(--oro)] sm:tracking-[0.14em]"
              >
                <span className="truncate">Pedir</span>
                <span className="shrink-0 tabular-nums text-[var(--oro)]">{currentScore}</span>
              </button>
              <button
                type="button"
                onClick={stand}
                className="h-12 min-w-0 truncate rounded-full border border-white/20 bg-white/[0.06] px-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--marfil)] transition hover:border-[var(--oro)] hover:text-[var(--oro)] sm:tracking-[0.14em]"
              >
                Plantarse
              </button>
              <button
                type="button"
                onClick={dbl}
                disabled={!canDouble}
                className="h-12 min-w-0 truncate rounded-full border border-white/20 bg-white/[0.06] px-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--marfil)] transition hover:border-[var(--oro)] hover:text-[var(--oro)] disabled:opacity-30 sm:tracking-[0.14em]"
              >
                Doblar
              </button>
              <button
                type="button"
                onClick={doSplit}
                disabled={!canSplit}
                className={`h-12 min-w-0 truncate rounded-full border px-3 text-[13px] font-bold uppercase tracking-[0.08em] transition disabled:opacity-30 sm:tracking-[0.14em] ${
                  canSplit
                    ? "border-[var(--oro)] bg-[var(--oro)]/10 text-[var(--oro)] shadow-[0_0_0_1px_rgba(201,168,76,0.35)]"
                    : "border-white/20 bg-white/[0.06] text-[var(--marfil)] hover:border-[var(--oro)] hover:text-[var(--oro)]"
                }`}
              >
                Dividir{canSplit ? " ✓" : ""}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {}
      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          entries={historyEntries}
          summary={summary}
        />
      )}

      <NoLivesGate
        open={gateOpen}
        onClose={closeGate}
        line={'"Sin corazones no hay silla en la mesa, encanto. Volvé más tarde."'}
      />
    </main>
  );
}

function labelFor(o: HandOutcome): string {
  switch (o) {
    case "blackjack":
      return "BJ";
    case "dealer-blackjack":
      return "BJ crupier";
    case "surrender":
      return "rendida";
    case "bust":
      return "pasada";
    case "dealer-bust":
      return "crupier pasa";
    case "win":
      return "gana";
    case "push":
      return "empate";
    case "lose":
      return "pierde";
  }
}

function CardFace({ card, hidden = false }: { card: CardUI; hidden?: boolean }) {
  const src = hidden ? cardBack : cardImg(card.rank, card.suit);
  return (
    <img
      src={src}
      alt={hidden ? "carta oculta" : `${card.rank}${card.suit}`}
      draggable={false}
      loading="lazy"
      decoding="async"
      width={80}
      height={120}
      sizes="(max-width: 640px) 72px, 80px"
      className="h-24 w-[4.5rem] select-none rounded-lg border border-[var(--marfil)]/25 bg-[var(--crema-clara)] object-cover shadow-md sm:h-28 sm:w-20"
    />
  );
}

function EmptySlot({ hint }: { hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex h-24 w-[4.5rem] items-center justify-center rounded-lg border border-[var(--oro)]/25 bg-[var(--verde-noche)]/45 text-[var(--cd-gold-warm)]/35 shadow-inner sm:h-28 sm:w-20"
          >
            <span className="text-xl leading-none">♠</span>
          </div>
        ))}
      </div>
      {hint && (
        <span
          className="text-[11px] uppercase leading-tight tracking-[0.18em] text-[var(--marfil)]/80"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

function HistoryPanel({
  onClose,
  entries,
  summary,
}: {
  onClose: () => void;
  entries: ReturnType<typeof useBlackjackHistory.getState>["entries"];
  summary: ReturnType<typeof summarizeHistory>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-t-2xl border border-[var(--oro)]/40 bg-[var(--verde-noche)]/98 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
          <span
            className="text-base text-[var(--oro)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
          >
            HISTORIAL DE MANOS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--marfil)]/80"
          >
            Cerrar
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 border-b border-white/10 px-5 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--marfil)]/80">
          <div>
            Jugadas<div className="mt-1 text-sm text-[var(--marfil)]">{summary.played}</div>
          </div>
          <div>
            Ganadas<div className="mt-1 text-sm text-[var(--oro)]">{summary.wins}</div>
          </div>
          <div>
            Perdidas<div className="mt-1 text-sm text-[#e88]">{summary.losses}</div>
          </div>
          <div>
            Neto
            <div
              className={`mt-1 text-sm ${summary.netTotal >= 0 ? "text-[var(--oro)]" : "text-[#e88]"}`}
            >
              {summary.netTotal >= 0 ? "+" : ""}
              {summary.netTotal}
            </div>
          </div>
        </div>
        <div className="max-h-[55vh] overflow-y-auto px-3 py-2">
          {entries.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-[var(--marfil)]/65">
              Todavía no jugaste ninguna mano.
            </div>
          )}
          {entries.map((e) => {
            const w = e.net > 0;
            const l = e.net < 0;
            return (
              <div
                key={e.id}
                className={`mb-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  w
                    ? "border-[var(--oro)]/40 bg-[var(--oro)]/[0.06]"
                    : l
                      ? "border-[#e88]/30 bg-[#e88]/[0.04]"
                      : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${w ? "bg-[var(--oro)]" : l ? "bg-[#e88]" : "bg-white/40"}`}
                />
                <span className="tabular-nums text-[var(--marfil)]/80">
                  {new Date(e.ts).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-[var(--marfil)]/80">
                  {e.outcomes.map(labelFor).join(", ")}
                </span>
                {e.splits > 1 && <span className="text-[var(--oro)]/80">·split ×{e.splits}</span>}
                {e.doubled && <span className="text-[var(--oro)]/80">·dbl</span>}
                {e.insuranceBet > 0 && <span className="text-[var(--oro)]/80">·seguro</span>}
                <span className="ml-auto tabular-nums text-[var(--marfil)]/80">apu {e.bet}</span>
                <span
                  className={`tabular-nums font-bold ${w ? "text-[var(--oro)]" : l ? "text-[#e88]" : "text-[var(--marfil)]/80"}`}
                >
                  {e.net >= 0 ? "+" : ""}
                  {e.net}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BlackjackEncargosMount() {
  const active = useBlackjackRun((s) => s.activeLevel);
  if (!active) return null;
  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 pt-3 sm:px-6">
      <BlackjackRunHUD />
    </div>
  );
}
