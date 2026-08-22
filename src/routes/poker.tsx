import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { BrassButton } from "@/components/casino/BrassButton";
import { useCasino } from "@/store/casino";
import { useHaptics } from "@/hooks/use-haptics";
import { useSingleHostessCorner } from "@/hooks/use-single-hostess-corner";
import {
  type Card,
  type PokerState,
  type Seat,
  SEATS,
  SEAT_NAME,
  SEAT_SHORT,
  act,
  cardLabel,
  describeHand,
  evaluate,
  isRed,
  legalActions,
  newTable,
  startHand,
  toCall,
} from "@/lib/games/poker/poker-engine";
import { aiChoose, handStrength } from "@/lib/games/poker/poker-ai";
import {
  type Legajo,
  type TellPoker,
  LEGAJO_VACIO,
  anotarLegajo,
  leerTellPoker,
  tellPropio,
} from "@/lib/games/poker/poker-tells";
import { PokerLegajo } from "@/components/casino/poker/PokerTellHint";
import retratoLola from "@/assets/poker-lola-portrait.jpg";
import retratoBruno from "@/assets/poker-bruno-portrait.jpg";
import bgPoker from "@/assets/bg-poker-sala.jpg";

export const Route = createFileRoute("/poker")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cara de Piedra — Texas Hold'em noir · El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Sentate al Texas Hold'em de límite fijo del Cuervo Dorado: leé los gestos de Lola «La Sombra» y Bruno «El Cuervo» y no dejes que te lean la cara.",
      },
      { property: "og:title", content: "Cara de Piedra — Texas Hold'em noir" },
      {
        property: "og:description",
        content: "Hold'em de límite fijo contra dos rivales del casino de 1928.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PokerPage,
});

const BUY_IN = 300;
const SMALL_BLIND = 5;
/** Segundos de compostura antes de que la mesa empiece a leerte la cara. */
const CALMA_MS = 7000;

function PokerPage() {
  useSingleHostessCorner("poker");
  const haptic = useHaptics();
  const chips = useCasino((s) => s.chips);
  const addChips = useCasino((s) => s.addChips);
  const spendChips = useCasino((s) => s.spend);

  const [state, setState] = useState<PokerState | null>(null);
  const [seated, setSeated] = useState(false);
  const [legajo, setLegajo] = useState<Legajo>(LEGAJO_VACIO);
  const [pensados, setPensados] = useState(0);
  const [verLegajo, setVerLegajo] = useState(false);
  const stackRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const ultimoRivalRef = useRef<Seat | null>(null);
  const lecturaRef = useRef<{ seat: Seat; read: "farol" | "firme"; hand: number } | null>(null);
  const presionRef = useRef(0);

  useEffect(() => {
    if (state) stackRef.current = state.stacks.you;
  }, [state]);

  // Si el jugador abandona la sala, sus fichas de mesa vuelven a la caja.
  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (stackRef.current > 0) {
        addChips(stackRef.current);
        stackRef.current = 0;
      }
    },
    [addChips],
  );

  const sit = () => {
    if (chips < BUY_IN) return;
    if (!spendChips(BUY_IN)) return;
    const table = startHand(newTable(BUY_IN, SMALL_BLIND));
    stackRef.current = table.stacks.you;
    setState(table);
    setSeated(true);
    haptic("chip");
  };

  const leave = () => {
    if (stackRef.current > 0) addChips(stackRef.current);
    stackRef.current = 0;
    setState(null);
    setSeated(false);
  };

  // Turnos de los rivales, con una pausa para que se pueda leer la mesa.
  useEffect(() => {
    if (!state || state.stage === "showdown" || !state.toAct || state.toAct === "you") return;
    const seat = state.toAct;
    const id = window.setTimeout(() => {
      setState((cur) => {
        if (!cur || cur.toAct !== seat) return cur;
        ultimoRivalRef.current = seat;
        return act(cur, seat, aiChoose(cur, seat, Math.random, presionRef.current));
      });
      haptic("card");
    }, 620);
    timerRef.current = id;
    return () => window.clearTimeout(id);
  }, [state, haptic]);

  const play = useCallback(
    (kind: Parameters<typeof act>[2]) => {
      setPensados(0);
      presionRef.current = 0;
      haptic(kind === "retirarse" ? "tap" : "chip");
      setState((cur) => (cur && cur.toAct === "you" ? act(cur, "you", kind) : cur));
    },
    [haptic],
  );

  // Reloj de tu propia cara: cuanto más dudás, más te leen los rivales.
  const esTuTurno = !!state && state.toAct === "you" && state.stage !== "showdown";
  useEffect(() => {
    if (!esTuTurno) {
      setPensados(0);
      presionRef.current = 0;
      return;
    }
    const desde = Date.now();
    const id = window.setInterval(() => {
      const ms = Date.now() - desde;
      setPensados(ms);
      presionRef.current = tellPropio(ms)?.nivel ?? 0;
    }, 200);
    return () => window.clearInterval(id);
  }, [esTuTurno, state?.hand, state?.stage]);

  // Vibración seca justo cuando se te quiebra la cara de piedra.
  const quiebreRef = useRef(false);
  useEffect(() => {
    const roto = pensados >= CALMA_MS;
    if (roto && !quiebreRef.current) haptic("warning");
    quiebreRef.current = roto;
  }, [pensados, haptic]);

  // Lectura visible del último movimiento rival, mientras te toca decidir.
  const tellRival = useMemo(() => {
    if (!state || state.toAct !== "you") return null;
    const seat = ultimoRivalRef.current;
    if (!seat) return null;
    return leerTellPoker(state, seat, legajo);
  }, [state, legajo]);

  useEffect(() => {
    if (tellRival && state) {
      lecturaRef.current = { seat: tellRival.seat, read: tellRival.read, hand: state.hand };
    }
  }, [tellRival, state]);

  // Al descubrirse las cartas, el legajo aprende si la lectura fue buena.
  useEffect(() => {
    if (!state || state.stage !== "showdown" || !state.showdown) return;
    const pend = lecturaRef.current;
    if (!pend || pend.hand !== state.hand) return;
    lecturaRef.current = null;
    const fuerza = handStrength(state.hole[pend.seat], state.board);
    setLegajo((prev) => anotarLegajo(prev, pend.seat, pend.read, fuerza));
  }, [state]);

  // Remate de la mano: vibración distinta si te llevás el bote.
  const manoCerradaRef = useRef(0);
  useEffect(() => {
    if (!state || state.stage !== "showdown") return;
    if (manoCerradaRef.current === state.hand) return;
    manoCerradaRef.current = state.hand;
    haptic(state.winners.includes("you") ? "win" : "loss");
  }, [state, haptic]);

  const nextHand = () => {
    haptic("card");
    setState((cur) => {
      if (!cur) return cur;
      if (cur.stacks.you <= 0) return cur;
      const playable = SEATS.filter((s) => cur.stacks[s] > 0);
      if (playable.length < 2) return cur;
      return startHand(cur);
    });
  };

  const rebuy = () => {
    if (chips < BUY_IN || !state) return;
    if (!spendChips(BUY_IN)) return;
    setState((cur) =>
      cur ? { ...cur, stacks: { ...cur.stacks, you: cur.stacks.you + BUY_IN } } : cur,
    );
  };

  const myActions = state ? legalActions(state, "you") : [];
  const need = state ? toCall(state, "you") : 0;
  const myHand = useMemo(() => (state ? describeHand(state.hole.you, state.board) : null), [state]);

  // Cartas que forman la jugada ganadora, para encenderlas en el remate.
  const luces = useMemo(() => {
    if (!state || state.stage !== "showdown" || !state.showdown) return new Set<string>();
    const ganador = state.winners[0];
    if (!ganador) return new Set<string>();
    const v = evaluate([...state.hole[ganador], ...state.board]);
    return new Set(v.cards.map(cardLabel));
  }, [state]);

  const rivales = SEATS.filter((s) => s !== "you");

  return (
    <GameRoomShell
      bg={bgPoker}
      room="poker"
      title="Cara de Piedra"
      subtitle="Texas Hold'em de límite fijo"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-3 pb-24 pt-1">
        {!seated || !state ? (
          <Lobby chips={chips} onSit={sit} />
        ) : (
          <>
            <TableHeader state={state} onLeave={leave} onLegajo={() => setVerLegajo((v) => !v)} />

            {/* Rivales enfrentados, uno a cada lado de la mesa. */}
            <div className="grid grid-cols-2 gap-2">
              {rivales.map((seat) => (
                <RivalPod key={seat} state={state} seat={seat} tell={tellRival} luces={luces} />
              ))}
            </div>

            <Felt state={state} luces={luces} tell={tellRival} />

            <MyPod
              state={state}
              handName={myHand}
              luces={luces}
              pensados={pensados}
              esTuTurno={esTuTurno}
            />

            {state.stage === "showdown" ? (
              <Showdown
                state={state}
                chips={chips}
                onNext={nextHand}
                onRebuy={rebuy}
                onLeave={leave}
              />
            ) : (
              <ActionRow
                actions={myActions}
                need={need}
                waiting={state.toAct !== "you"}
                turnOf={state.toAct}
                onPlay={play}
              />
            )}

            <Ticker log={state.log} />

            <AnimatePresence>
              {verLegajo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <PokerLegajo legajo={legajo} seats={rivales} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </GameRoomShell>
  );
}

function Lobby({ chips, onSit }: { chips: number; onSit: () => void }) {
  const enough = chips >= BUY_IN;
  return (
    <div
      className="rounded-sm border p-5 text-center"
      style={{
        borderColor: "var(--cd-gold-mid)",
        background: "oklch(0.16 0.03 60 / 0.86)",
        boxShadow: "0 12px 40px oklch(0 0 0 / 0.55)",
      }}
    >
      <p className="font-display text-[18px] uppercase tracking-[0.18em] text-[var(--cd-gold-bright)]">
        Mesa reservada
      </p>
      <p className="mt-2 font-serif text-[14px] leading-relaxed text-[var(--cd-text-main)]">
        Hold&apos;em de límite fijo a tres manos. Ciegas de {SMALL_BLIND} y {SMALL_BLIND * 2}, hasta
        cuatro subidas por calle. Lola mide cada ficha; Bruno paga cualquier cosa. Miralos: cada uno
        tiene sus tics, y el legajo de la mesa recuerda cuáles te sirvieron. Ojo con vos: si dudás
        más de siete segundos, tu cara empieza a hablar.
      </p>
      <p className="mt-3 font-display text-[12px] uppercase tracking-[0.18em] text-[var(--cd-text-muted)]">
        Entrada: {BUY_IN} fichas · tenés {chips}
      </p>
      <div className="mt-4 flex justify-center">
        <BrassButton onClick={onSit} disabled={!enough}>
          {enough ? "Sentarse a la mesa" : "Fichas insuficientes"}
        </BrassButton>
      </div>
    </div>
  );
}

function TableHeader({
  state,
  onLeave,
  onLegajo,
}: {
  state: PokerState;
  onLeave: () => void;
  onLegajo: () => void;
}) {
  const stageLabel =
    state.stage === "preflop"
      ? "Cartas tapadas"
      : state.stage === "showdown"
        ? "Mano cerrada"
        : state.stage;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <div className="min-w-0">
        <p className="truncate font-display text-[12px] uppercase tracking-[0.18em] text-[var(--cd-gold-bright)]">
          Mano {state.hand} · {stageLabel}
        </p>
        <p className="truncate font-display text-[11px] uppercase tracking-[0.16em] text-[var(--cd-text-muted)]">
          ciegas {state.smallBlind}/{state.bigBlind}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <HeaderChip label="Legajo" onClick={onLegajo} />
        <HeaderChip label="Levantarse" onClick={onLeave} />
      </div>
    </div>
  );
}

function HeaderChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cd-press min-h-11 rounded-sm border px-2.5 font-display text-[10.5px] uppercase tracking-[0.14em]"
      style={{ borderColor: "var(--cd-gold-mid)", color: "var(--cd-gold-bright)" }}
    >
      {label}
    </button>
  );
}

type CardSize = "sm" | "md" | "lg";

const SIZES: Record<CardSize, { box: string; rank: string; suit: string }> = {
  sm: { box: "h-[3.25rem] w-10", rank: "text-[16px]", suit: "text-[13px]" },
  md: { box: "h-[4.5rem] w-[3.25rem]", rank: "text-[21px]", suit: "text-[17px]" },
  lg: { box: "h-[5.5rem] w-16", rank: "text-[26px]", suit: "text-[21px]" },
};

function PlayingCard({
  card,
  hidden,
  size = "md",
  lit,
}: {
  card?: Card;
  hidden?: boolean;
  size?: CardSize;
  lit?: boolean;
}) {
  const s = SIZES[size];
  if (hidden || !card) {
    return (
      <div
        className={`${s.box} flex items-center justify-center rounded-[3px] border`}
        style={{
          borderColor: "oklch(0.72 0.14 78 / 0.45)",
          background:
            "repeating-linear-gradient(45deg, oklch(0.2 0.05 60), oklch(0.2 0.05 60) 4px, oklch(0.26 0.07 60) 4px, oklch(0.26 0.07 60) 8px)",
          boxShadow: "inset 0 0 10px oklch(0 0 0 / 0.7)",
        }}
        aria-label={card ? "Carta tapada" : "Sin carta"}
      >
        <span className="font-display text-[14px] text-[var(--cd-gold-mid)]">◆</span>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`${s.box} flex flex-col items-center justify-center rounded-[3px] border tabular-nums`}
      style={{
        borderColor: lit ? "var(--cd-gold-bright)" : "oklch(0.72 0.14 78 / 0.65)",
        background: lit ? "oklch(0.98 0.04 92)" : "oklch(0.95 0.02 90)",
        color: isRed(card) ? "oklch(0.48 0.19 25)" : "oklch(0.2 0.02 60)",
        boxShadow: lit
          ? "0 0 16px oklch(0.78 0.15 85 / 0.75), 0 4px 10px oklch(0 0 0 / 0.5)"
          : "0 4px 10px oklch(0 0 0 / 0.5)",
      }}
      aria-label={`Carta ${cardLabel(card)}`}
    >
      <span className={`font-display ${s.rank} leading-none`}>{cardLabel(card).slice(0, -1)}</span>
      <span className={`${s.suit} leading-none`}>{card.s}</span>
    </motion.div>
  );
}

/** Paño central: cartas comunitarias y bote. */
function Felt({
  state,
  luces,
  tell,
}: {
  state: PokerState;
  luces: Set<string>;
  tell: TellPoker | null;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[14px] border px-2 py-3"
      style={{
        borderColor: "oklch(0.72 0.14 78 / 0.5)",
        background:
          "radial-gradient(120% 90% at 50% 20%, oklch(0.34 0.08 155 / 0.85), oklch(0.19 0.05 155 / 0.92))",
        boxShadow: "inset 0 0 60px oklch(0 0 0 / 0.7), 0 10px 30px oklch(0 0 0 / 0.55)",
      }}
    >
      <div className="flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => {
          const c = state.board[i];
          if (!c) {
            return (
              <div
                key={`hueco-${i}`}
                className={`${SIZES.md.box} rounded-[3px] border border-dashed`}
                style={{
                  borderColor: "oklch(0.72 0.14 78 / 0.28)",
                  background: "oklch(0 0 0 / 0.18)",
                }}
                aria-hidden
              />
            );
          }
          return <PlayingCard key={cardLabel(c)} card={c} lit={luces.has(cardLabel(c))} />;
        })}

      </div>

      <motion.p
        key={state.pot}
        initial={{ scale: 0.9, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="mt-2.5 text-center font-display text-[15px] uppercase tracking-[0.2em] text-[var(--cd-gold-bright)]"
        style={{ textShadow: "0 2px 6px oklch(0 0 0 / 0.9)" }}
      >
        Bote {state.pot}
      </motion.p>

      <AnimatePresence mode="wait">
        {tell && (
          <motion.p
            key={`${tell.seat}-${tell.gesto}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 text-center font-serif text-[12.5px] leading-snug"
            style={{
              color: tell.read === "farol" ? "var(--blood)" : "var(--brass-bright)",
              textShadow: "0 1px 3px oklch(0 0 0 / 0.95)",
            }}
          >
            {tell.gesto}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const RIVAL_RETRATO: Partial<Record<Seat, string>> = {
  lola: retratoLola,
  bruno: retratoBruno,
};

function RivalPod({
  state,
  seat,
  tell,
  luces,
}: {
  state: PokerState;
  seat: Seat;
  tell: TellPoker | null;
  luces: Set<string>;
}) {
  const out = state.folded[seat];
  const isTurn = state.toAct === seat;
  const reveal = state.stage === "showdown" && state.showdown && !out;
  const value = reveal ? evaluate([...state.hole[seat], ...state.board]) : null;
  const won = state.winners.includes(seat);
  const marcado = !out && tell?.seat === seat;
  const acento = marcado
    ? tell.read === "farol"
      ? "var(--blood)"
      : "var(--brass-bright)"
    : won
      ? "var(--cd-gold-bright)"
      : isTurn
        ? "oklch(0.72 0.14 78 / 0.75)"
        : "oklch(0.72 0.14 78 / 0.28)";
  const retrato = RIVAL_RETRATO[seat];
  return (
    <div
      className="relative flex flex-col items-center gap-1.5 rounded-[10px] border px-2 py-2"
      style={{
        borderColor: acento,
        background: out ? "oklch(0.13 0.01 60 / 0.72)" : "oklch(0.18 0.03 60 / 0.86)",
        boxShadow: isTurn ? `0 0 14px ${acento}` : "0 6px 18px oklch(0 0 0 / 0.45)",
        opacity: out ? 0.55 : 1,
      }}
    >
      <div className="flex w-full min-w-0 items-center gap-2">
        {retrato && (
          <span
            className="relative shrink-0 overflow-hidden rounded-full border"
            style={{
              width: 40,
              height: 40,
              borderColor: acento,
              filter: out ? "grayscale(1)" : "none",
            }}
          >
            <img
              src={retrato}
              alt={SEAT_NAME[seat]}
              loading="lazy"
              width={816}
              height={816}
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% 22%" }}
            />
            {isTurn && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-full"
                animate={{ opacity: [0.15, 0.55, 0.15] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ boxShadow: `inset 0 0 12px ${acento}` }}
              />
            )}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[11.5px] uppercase tracking-[0.12em] text-[var(--cd-gold-bright)]">
            {SEAT_SHORT[seat]}
          </p>
          <p className="truncate font-display text-[10.5px] uppercase tracking-[0.1em] text-[var(--cd-text-muted)]">
            {state.stacks[seat]} fichas
          </p>
        </div>
      </div>

      <div className="flex gap-1">
        <PlayingCard
          card={state.hole[seat][0]}
          hidden={!reveal}
          size="sm"
          lit={reveal && luces.has(cardLabel(state.hole[seat][0]))}
        />
        <PlayingCard
          card={state.hole[seat][1]}
          hidden={!reveal}
          size="sm"
          lit={reveal && luces.has(cardLabel(state.hole[seat][1]))}
        />
      </div>

      <p
        className="w-full truncate text-center font-display text-[10px] uppercase tracking-[0.1em]"
        style={{ color: marcado ? acento : "var(--cd-text-muted)" }}
      >
        {out
          ? "se retiró"
          : value
            ? value.name
            : state.bets[seat] > 0
              ? `apostó ${state.bets[seat]}`
              : (state.lastAction[seat] ?? "espera")}
      </p>

      {marcado && (
        <span
          className="absolute -top-2 right-1 rounded-sm border px-1.5 py-[1px] font-display text-[9px] uppercase tracking-[0.12em]"
          style={{ borderColor: acento, color: acento, background: "oklch(0.1 0.01 60 / 0.95)" }}
        >
          {tell.read === "farol" ? "farol" : "firme"}
        </span>
      )}
    </div>
  );
}

/** Tu asiento: cartas grandes y el medidor de cara de piedra. */
function MyPod({
  state,
  handName,
  luces,
  pensados,
  esTuTurno,
}: {
  state: PokerState;
  handName: string | null;
  luces: Set<string>;
  pensados: number;
  esTuTurno: boolean;
}) {
  const won = state.winners.includes("you");
  const propio = tellPropio(pensados);
  // 1 = cara impecable, 0 = te leyeron entera.
  const compostura = esTuTurno
    ? Math.max(0, 1 - Math.min(1, pensados / (CALMA_MS + 13000)))
    : 1;
  const rota = !!propio;
  return (
    <div
      className="rounded-[10px] border p-2.5"
      style={{
        borderColor: won ? "var(--cd-gold-bright)" : rota ? "var(--blood)" : "var(--cd-gold-mid)",
        background: "oklch(0.18 0.03 60 / 0.9)",
        boxShadow: won ? "0 0 20px oklch(0.78 0.15 85 / 0.45)" : "0 6px 18px oklch(0 0 0 / 0.45)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-[12px] uppercase tracking-[0.16em] text-[var(--cd-gold-bright)]">
            Vos · {state.stacks.you} fichas
          </p>
          <p className="truncate font-display text-[11px] uppercase tracking-[0.12em] text-[var(--cd-text-muted)]">
            {handName ?? "sin jugada"}
            {state.bets.you > 0 ? ` · en mesa ${state.bets.you}` : ""}
          </p>

          {/* Medidor de cara de piedra. */}
          <div className="mt-2 w-[9.5rem] max-w-full">
            <div className="h-[4px] w-full overflow-hidden rounded-full bg-[var(--cd-text-main)]/15">
              <motion.div
                className="h-full"
                animate={{ width: `${Math.round(compostura * 100)}%` }}
                transition={{ duration: 0.2 }}
                style={{ background: rota ? "var(--blood)" : "var(--brass)" }}
              />
            </div>
            <p
              className="mt-1 font-display text-[9.5px] uppercase tracking-[0.14em]"
              style={{ color: rota ? "var(--blood)" : "var(--cd-text-muted)" }}
            >
              {rota ? propio.texto : "Cara de piedra"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <PlayingCard
            card={state.hole.you[0]}
            size="lg"
            lit={luces.has(cardLabel(state.hole.you[0]))}
          />
          <PlayingCard
            card={state.hole.you[1]}
            size="lg"
            lit={luces.has(cardLabel(state.hole.you[1]))}
          />
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  actions,
  need,
  waiting,
  turnOf,
  onPlay,
}: {
  actions: ReturnType<typeof legalActions>;
  need: number;
  waiting: boolean;
  turnOf: Seat | null;
  onPlay: (kind: Parameters<typeof act>[2]) => void;
}) {
  if (waiting) {
    return (
      <p className="min-h-11 py-2 text-center font-display text-[12px] uppercase tracking-[0.18em] text-[var(--cd-text-muted)]">
        Piensa {turnOf ? SEAT_SHORT[turnOf] : "la mesa"}…
      </p>
    );
  }
  const label = (kind: string, amount: number) => {
    if (kind === "ver") return `Ver ${need}`;
    if (kind === "apostar") return `Apostar ${amount}`;
    if (kind === "subir") return `Subir ${amount}`;
    if (kind === "pasar") return "Pasar";
    return "Retirarse";
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((a) => (
        <BrassButton
          key={a.kind}
          onClick={() => onPlay(a.kind)}
          variant={a.kind === "retirarse" ? "ghost" : "primary"}
        >
          {label(a.kind, a.amount)}
        </BrassButton>
      ))}
    </div>
  );
}

function Showdown({
  state,
  chips,
  onNext,
  onRebuy,
  onLeave,
}: {
  state: PokerState;
  chips: number;
  onNext: () => void;
  onRebuy: () => void;
  onLeave: () => void;
}) {
  const broke = state.stacks.you <= 0;
  const rivalsBroke = SEATS.filter((s) => s !== "you" && state.stacks[s] > 0).length === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[10px] border p-3 text-center"
      style={{ borderColor: "var(--cd-gold-bright)", background: "oklch(0.2 0.05 60 / 0.94)" }}
    >
      <p className="font-display text-[14px] uppercase tracking-[0.16em] text-[var(--cd-gold-bright)]">
        {state.result}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {broke ? (
          <BrassButton onClick={onRebuy} disabled={chips < BUY_IN}>
            {chips < BUY_IN ? "Sin fichas para recomprar" : `Recomprar ${BUY_IN}`}
          </BrassButton>
        ) : rivalsBroke ? (
          <BrassButton onClick={onLeave}>Cobrar la mesa</BrassButton>
        ) : (
          <BrassButton onClick={onNext}>Mano siguiente</BrassButton>
        )}
      </div>
    </motion.div>
  );
}

/** Relato compacto: solo la última jugada cantada, sin robar alto de pantalla. */
function Ticker({ log }: { log: string[] }) {
  const last = log[log.length - 1];
  if (!last) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={`${log.length}-${last}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="truncate text-center font-serif text-[12.5px] text-[var(--cd-text-muted)]"
      >
        {last}
      </motion.p>
    </AnimatePresence>
  );
}
