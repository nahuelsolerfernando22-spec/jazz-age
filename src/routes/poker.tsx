import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { BrassButton } from "@/components/casino/BrassButton";
import { useCasino } from "@/store/casino";
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
import retratoLola from "@/assets/poker-lola-portrait.jpg";
import retratoBruno from "@/assets/poker-bruno-portrait.jpg";

import {
  PokerLegajo,
  PokerSelfTell,
  PokerTellHint,
} from "@/components/casino/poker/PokerTellHint";

export const Route = createFileRoute("/poker")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mesa de Póker — Texas Hold'em noir · El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Sentate al Texas Hold'em de límite fijo del Cuervo Dorado: ciegas, flop, turn y river contra Lola «La Sombra» y Bruno «El Cuervo».",
      },
      { property: "og:title", content: "Mesa de Póker — Texas Hold'em noir" },
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

function PokerPage() {
  useSingleHostessCorner("poker");
  const chips = useCasino((s) => s.chips);
  const addChips = useCasino((s) => s.addChips);
  const spendChips = useCasino((s) => s.spend);

  const [state, setState] = useState<PokerState | null>(null);
  const [seated, setSeated] = useState(false);
  const [legajo, setLegajo] = useState<Legajo>(LEGAJO_VACIO);
  const [pensados, setPensados] = useState(0);
  const stackRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  /** Último rival que movió: es de quien se puede leer el gesto. */
  const ultimoRivalRef = useRef<Seat | null>(null);
  /** Lectura pendiente de verificar contra las cartas descubiertas. */
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
    }, 750);
    timerRef.current = id;
    return () => window.clearTimeout(id);
  }, [state]);

  const play = useCallback((kind: Parameters<typeof act>[2]) => {
    setPensados(0);
    presionRef.current = 0;
    setState((cur) => (cur && cur.toAct === "you" ? act(cur, "you", kind) : cur));
  }, []);

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
    }, 500);
    return () => window.clearInterval(id);
  }, [esTuTurno, state?.hand, state?.stage]);

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

  const nextHand = () => {
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

  return (
    <GameRoomShell bg="" room="poker" title="Póker" subtitle="Texas Hold'em de límite fijo">
      <div className="mx-auto w-full max-w-md px-3 pb-28 pt-2">
        {!seated || !state ? (
          <Lobby chips={chips} onSit={sit} />
        ) : (
          <>
            <TableHeader state={state} onLeave={leave} />
            <Board state={state} />

            <div className="mt-3 space-y-2">
              {SEATS.filter((s) => s !== "you").map((seat) => (
                <RivalRow key={seat} state={state} seat={seat} tell={tellRival} />
              ))}
            </div>

            <MyHand state={state} handName={myHand} />
            <PokerTellHint tell={tellRival} />
            {esTuTurno && <PokerSelfTell tell={tellPropio(pensados)} />}

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

            <PokerLegajo legajo={legajo} seats={SEATS.filter((sx) => sx !== "you")} />
            <LogPanel log={state.log} />
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
        cuatro subidas por calle. Lola mide cada ficha; Bruno paga cualquier cosa. Miralos: cada
        uno tiene sus tics, y el legajo de la mesa recuerda cuáles te sirvieron.
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

function TableHeader({ state, onLeave }: { state: PokerState; onLeave: () => void }) {
  const stageLabel =
    state.stage === "preflop"
      ? "Cartas tapadas"
      : state.stage === "showdown"
        ? "Mano cerrada"
        : state.stage;
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div>
        <p className="font-display text-[12px] uppercase tracking-[0.18em] text-[var(--cd-gold-bright)]">
          Mano {state.hand} · {stageLabel}
        </p>
        <p className="font-display text-[11px] uppercase tracking-[0.16em] text-[var(--cd-text-muted)]">
          Bote {state.pot} · ciegas {state.smallBlind}/{state.bigBlind}
        </p>
      </div>
      <button
        type="button"
        onClick={onLeave}
        className="cd-press min-h-9 rounded-sm border px-3 py-1 font-display text-[11px] uppercase tracking-[0.16em]"
        style={{ borderColor: "var(--cd-gold-mid)", color: "var(--cd-gold-bright)" }}
      >
        Levantarse
      </button>
    </div>
  );
}

function PlayingCard({ card, hidden, small }: { card?: Card; hidden?: boolean; small?: boolean }) {
  const w = small ? "h-12 w-9" : "h-16 w-12";
  if (hidden || !card) {
    return (
      <div
        className={`${w} flex items-center justify-center rounded-sm border`}
        style={{
          borderColor: "oklch(0.72 0.14 78 / 0.45)",
          background:
            "repeating-linear-gradient(45deg, oklch(0.2 0.05 60), oklch(0.2 0.05 60) 4px, oklch(0.26 0.07 60) 4px, oklch(0.26 0.07 60) 8px)",
        }}
        aria-label="Carta tapada"
      >
        <span className="font-display text-[14px] text-[var(--cd-gold-mid)]">◆</span>
      </div>
    );
  }
  return (
    <div
      className={`${w} flex flex-col items-center justify-center rounded-sm border tabular-nums`}
      style={{
        borderColor: "oklch(0.72 0.14 78 / 0.65)",
        background: "oklch(0.95 0.02 90)",
        color: isRed(card) ? "oklch(0.48 0.19 25)" : "oklch(0.2 0.02 60)",
      }}
      aria-label={`Carta ${cardLabel(card)}`}
    >
      <span className={`font-display ${small ? "text-[15px]" : "text-[19px]"} leading-none`}>
        {cardLabel(card).slice(0, -1)}
      </span>
      <span className={small ? "text-[13px] leading-none" : "text-[16px] leading-none"}>
        {card.s}
      </span>
    </div>
  );
}

function Board({ state }: { state: PokerState }) {
  return (
    <div
      className="rounded-sm border p-3"
      style={{
        borderColor: "oklch(0.72 0.14 78 / 0.5)",
        background: "oklch(0.28 0.07 155 / 0.55)",
        boxShadow: "inset 0 0 50px oklch(0 0 0 / 0.55)",
      }}
    >
      <p className="mb-2 text-center font-display text-[11px] uppercase tracking-[0.2em] text-[var(--cd-text-muted)]">
        Cartas comunitarias
      </p>
      <div className="flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <PlayingCard key={i} card={state.board[i]} hidden={!state.board[i]} />
        ))}
      </div>
      <p className="mt-2 text-center font-display text-[13px] uppercase tracking-[0.18em] text-[var(--cd-gold-bright)]">
        Bote {state.pot}
      </p>
    </div>
  );
}

const RIVAL_RETRATO: Partial<Record<Seat, string>> = {
  lola: retratoLola,
  bruno: retratoBruno,
};

function RivalRow({
  state,
  seat,
  tell,
}: {
  state: PokerState;
  seat: Seat;
  tell: TellPoker | null;
}) {
  const out = state.folded[seat];
  const isTurn = state.toAct === seat;
  const reveal = state.stage === "showdown" && state.showdown && !out;
  const value = reveal ? evaluate([...state.hole[seat], ...state.board]) : null;
  const won = state.winners.includes(seat);
  const marcado = !out && tell?.seat === seat;
  const retrato = RIVAL_RETRATO[seat];
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-sm border px-3 py-2"
      style={{
        borderColor: won
          ? "var(--cd-gold-bright)"
          : marcado
            ? tell.read === "farol"
              ? "var(--blood)"
              : "var(--brass-bright)"
            : isTurn
              ? "oklch(0.72 0.14 78 / 0.7)"
              : "oklch(0.72 0.14 78 / 0.28)",
        background: out ? "oklch(0.14 0.01 60 / 0.6)" : "oklch(0.18 0.03 60 / 0.82)",
        opacity: out ? 0.55 : 1,
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {retrato && (
          <span
            className="relative shrink-0 overflow-hidden rounded-full border"
            style={{
              width: 42,
              height: 42,
              borderColor: marcado
                ? tell.read === "farol"
                  ? "var(--blood)"
                  : "var(--brass-bright)"
                : "oklch(0.72 0.14 78 / 0.4)",
              boxShadow: marcado
                ? `0 0 12px ${tell.read === "farol" ? "oklch(0.55 0.19 25 / 0.7)" : "oklch(0.72 0.14 78 / 0.6)"}`
                : "inset 0 0 10px oklch(0 0 0 / 0.7)",
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
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-[12px] uppercase tracking-[0.14em] text-[var(--cd-gold-bright)]">
            {SEAT_NAME[seat]}
          </p>
          <p className="font-display text-[11px] uppercase tracking-[0.14em] text-[var(--cd-text-muted)]">
            {state.stacks[seat]} fichas
            {state.bets[seat] > 0 ? ` · en mesa ${state.bets[seat]}` : ""}
            {state.lastAction[seat] ? ` · ${state.lastAction[seat]}` : ""}
            {value ? ` · ${value.name}` : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-1">

        <PlayingCard card={state.hole[seat][0]} hidden={!reveal} small />
        <PlayingCard card={state.hole[seat][1]} hidden={!reveal} small />
      </div>
    </div>
  );
}

function MyHand({ state, handName }: { state: PokerState; handName: string | null }) {
  const won = state.winners.includes("you");
  return (
    <div
      className="mt-3 rounded-sm border p-3"
      style={{
        borderColor: won ? "var(--cd-gold-bright)" : "var(--cd-gold-mid)",
        background: "oklch(0.18 0.03 60 / 0.9)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-display text-[12px] uppercase tracking-[0.16em] text-[var(--cd-gold-bright)]">
            Tus cartas
          </p>
          <p className="font-display text-[11px] uppercase tracking-[0.14em] text-[var(--cd-text-muted)]">
            {state.stacks.you} fichas
            {state.bets.you > 0 ? ` · en mesa ${state.bets.you}` : ""}
            {handName ? ` · ${handName}` : ""}
          </p>
        </div>
        <div className="flex gap-1.5">
          <PlayingCard card={state.hole.you[0]} />
          <PlayingCard card={state.hole.you[1]} />
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
      <p className="mt-3 text-center font-display text-[12px] uppercase tracking-[0.18em] text-[var(--cd-text-muted)]">
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
    <div className="mt-3 grid grid-cols-2 gap-2">
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
    <div
      className="mt-3 rounded-sm border p-3 text-center"
      style={{ borderColor: "var(--cd-gold-bright)", background: "oklch(0.2 0.05 60 / 0.92)" }}
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
    </div>
  );
}

function LogPanel({ log }: { log: string[] }) {
  const last = log.slice(-6);
  return (
    <div className="mt-3">
      <p className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[var(--cd-text-muted)]">
        Relato de la mano
      </p>
      <ul className="space-y-0.5">
        {last.map((line, i) => (
          <li
            key={`${i}-${line}`}
            className="font-serif text-[13px] leading-snug text-[var(--cd-text-main)]"
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
