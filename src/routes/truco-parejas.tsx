import { createFileRoute } from "@tanstack/react-router";
import { reportSingleScore } from "@/store/single-scores";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Hand as HandIcon, HelpCircle, Users } from "lucide-react";
import { GameTopBar } from "@/components/casino/GameTopBar";
import { GameRoomShell } from "@/components/casino/GameRoomShell";
import { MobileSheet } from "@/components/ui/MobileSheet";
import { cardArt } from "@/lib/games/chinchon/chinchon-deck";
import cardBack from "@/assets/chinchon-v2/card-back.webp";
import zoneBg from "@/assets/zone-truco-v2.webp";
import { useHaptics } from "@/hooks/use-haptics";
import { useLockGame } from "@/store/gameLock";
import {
  SENAS,
  SEATS4,
  TEAM_OF,
  type Game4,
  type Seat4,
  type SenaId,
  ai4Decide,
  ai4Sena,
  canCantarEnvidoLevel4,
  canCantarTruco4,
  canIrseAlMazo4,
  canPlay4,
  cantarEnvido4,
  cantarTruco4,
  hacerSena,
  irseAlMazo4,
  playCard4,
  responderEnvido4,
  responderTruco4,
  senaDe,
  startHand4,
} from "@/lib/games/truco/truco4";
import type { Card, EnvidoLevel } from "@/lib/games/truco/truco";

export const Route = createFileRoute("/truco-parejas")({
  head: () => ({
    meta: [
      { title: "Mentira Criolla en parejas — 2 vs 2 con señas" },
      {
        name: "description",
        content:
          "Truco 2 contra 2 con compañero, señas de mesa y cantos completos. Jugá la variante más pedida del truco criollo, offline.",
      },
      { property: "og:title", content: "Mentira Criolla en parejas — 2 vs 2 con señas" },
      {
        property: "og:description",
        content: "Truco en parejas con socio, señas y envido a 15 puntos. Sin conexión.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrucoParejasPage,
});

const NAMES: Record<Seat4, string> = {
  you: "Vos",
  socio: "El Chueco",
  rivalA: "Doña Renga",
  rivalB: "El Tuerto",
};

const POINT_GOAL = 15;

function teamLabel(t: "nos" | "ellos") {
  return t === "nos" ? "Nosotros" : "Ellos";
}

function TrucoParejasPage() {
  const haptics = useHaptics();
  const [g, setG] = useState<Game4 | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showSenas, setShowSenas] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useLockGame(!!g && !g.winner);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const start = useCallback(() => {
    clearTimers();
    setG(startHand4(null, { pointGoal: POINT_GOAL, names: NAMES }));
  }, []);

  const nextHand = useCallback(() => {
    clearTimers();
    setG((prev) => (prev ? startHand4(prev, { pointGoal: prev.pointGoal, names: NAMES }) : prev));
  }, []);

  // Bucle de la CPU: los tres asientos que no sos vos.
  useEffect(() => {
    if (!g || g.winner || g.hand.handOver) return;
    const h = g.hand;
    const actor: Seat4 | null = h.pending
      ? (SEATS4.find((s) => s !== "you" && TEAM_OF[s] !== h.pending!.byTeam) ?? null)
      : h.turn !== "you"
        ? h.turn
        : null;
    if (!actor) return;

    const d = ai4Decide(g, actor, 0.6);
    const t = setTimeout(() => {
      setG((prev) => {
        if (!prev || prev.winner || prev.hand.handOver) return prev;
        // Señas de la CPU antes de mover.
        let next = prev;
        for (const s of SEATS4) {
          if (s === "you") continue;
          const sena = ai4Sena(next, s);
          if (sena) next = hacerSena(next, s, sena);
        }
        if (d.kind === "playCard" && d.cardId) return playCard4(next, actor, d.cardId);
        if (d.kind === "respond") {
          const p = next.hand.pending;
          if (!p) return next;
          return p.kind === "truco"
            ? responderTruco4(next, actor, !!d.accept)
            : responderEnvido4(next, actor, !!d.accept);
        }
        if (d.kind === "canto" && d.canto) {
          const type = d.canto.type;
          return type === "truco" || type === "retruco" || type === "vale4"
            ? cantarTruco4(next, actor)
            : cantarEnvido4(next, actor, type);
        }
        if (d.kind === "mazo") return irseAlMazo4(next, actor);
        return next;
      });
    }, d.thinkMs);
    timers.current.push(t);
    return () => clearTimeout(t);
  }, [g]);

  useEffect(() => {
    if (!g) return;
    const last = g.hand.log[g.hand.log.length - 1];
    if (last) setFlash(last);
  }, [g]);

  // Cierre de partida: se engancha al resto de la casa (némesis, progreso,
  // liga, encargos, torneo y La Noche) igual que las demás mesas.
  const reportedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!g?.winner) return;
    const key = `${g.scores.nos}-${g.scores.ellos}`;
    if (reportedRef.current === key) return;
    reportedRef.current = key;

    const won = g.winner === "nos";
    const spread = Math.abs(g.scores.nos - g.scores.ellos);

    reportSingleScore("truco-parejas", g.scores.nos * 10 + (won ? 100 : 0));
    void import("@/lib/nemesis").then(({ reportGameOutcome }) => {
      reportGameOutcome("truco-parejas", won ? "win" : "loss");
    });
    void import("@/store/league-progress").then(({ awardLeaguePoints }) => {
      const pts = won ? 80 + spread * 4 : Math.max(0, 20 - spread);
      if (pts > 0) awardLeaguePoints("truco-parejas", pts);
    });
  }, [g]);

  const myTurn = !!g && canPlay4(g, "you");
  const pending = g?.hand.pending ?? null;
  const mustRespond = !!pending && TEAM_OF["you"] !== pending.byTeam;

  const play = (c: Card) => {
    if (!g) return;
    haptics("tap");
    setG(playCard4(g, "you", c.id));
  };

  const doSena = (id: SenaId) => {
    if (!g) return;
    haptics("tap");
    setShowSenas(false);
    setG(hacerSena(g, "you", id));
  };

  if (!g) {
    return (
      <GameRoomShell bg={zoneBg} room="truco-parejas" title="Mentira Criolla · Parejas" subtitle="2 vs 2 con señas">
        <div className="mx-auto w-full max-w-md px-4 py-6">
          <div className="rounded-2xl border border-[var(--oro)]/25 bg-[var(--verde-noche)]/80 p-5">
            <h1
              className="text-2xl text-[var(--oro-claro)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.12em" }}
            >
              TRUCO EN PAREJAS
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--marfil)]/80">
              Vos y <strong className="text-[var(--marfil)]">{NAMES.socio}</strong> contra {NAMES.rivalA} y{" "}
              {NAMES.rivalB}. A {POINT_GOAL} puntos. Podés pasarle una seña al socio una vez por mano — pero
              cuidado, del otro lado también miran.
            </p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-[var(--marfil)]/70">
              <li>· Orden cruzado: siempre juega uno de cada equipo.</li>
              <li>· El envido se compara con el mejor tanto de cada pareja.</li>
              <li>· Las señas de la CPU también se pueden cazar.</li>
            </ul>
            <button
              type="button"
              onClick={start}
              className="mt-5 min-h-[48px] w-full rounded-xl border border-[var(--oro)]/45 bg-[var(--oro)]/15 text-sm uppercase tracking-[0.24em] text-[var(--oro-claro)]"
            >
              Sentarse a la mesa
            </button>
          </div>
        </div>
      </GameRoomShell>
    );
  }

  const h = g.hand;
  const slot = h.table[h.trick]!;

  return (
    <GameRoomShell bg={zoneBg} room="truco-parejas" title="Mentira Criolla · Parejas" subtitle="2 vs 2 con señas">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-3 pb-4">
        <GameTopBar
          title="PAREJAS"
          subtitle={`Mano de ${g.names[h.mano]}`}
          chips={
            <>
              <Chip label="Nosotros" value={g.scores.nos} tone="oro" />
              <Chip label="Ellos" value={g.scores.ellos} tone="marfil" />
              <Chip label="En juego" value={h.trucoStake} tone="marfil" />
            </>
          }
          trailing={
            <button
              type="button"
              aria-label="Reglas"
              onClick={() => setShowRules(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--oro)]/30 text-[var(--oro-claro)]"
            >
              <HelpCircle size={18} />
            </button>
          }
        />

        {/* Rivales */}
        <div className="grid grid-cols-2 gap-2">
          <SeatPod g={g} seat="rivalA" card={slot.rivalA} />
          <SeatPod g={g} seat="rivalB" card={slot.rivalB} />
        </div>

        {/* Socio */}
        <SeatPod g={g} seat="socio" card={slot.socio} wide />

        {/* Relato */}
        <div className="min-h-[34px] rounded-lg border border-[var(--oro)]/20 bg-black/35 px-3 py-2 text-[12px] text-[var(--marfil)]/85">
          {flash ?? "Se reparte."}
        </div>

        {/* Tu carta en la mesa */}
        <div className="flex items-center justify-center">
          <TableCard card={slot.you} />
        </div>

        {/* Tu mano */}
        <div className="flex items-end justify-center gap-2">
          <AnimatePresence initial={false}>
            {h.hands.you.map((c) => (
              <motion.button
                key={c.id}
                type="button"
                layout
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                disabled={!myTurn}
                onClick={() => play(c)}
                className={`overflow-hidden rounded-lg border transition ${
                  myTurn
                    ? "border-[var(--oro)]/60 shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
                    : "border-[var(--oro)]/20 opacity-70"
                }`}
              >
                <img src={cardArt(c)} alt="" className="h-[104px] w-auto sm:h-[124px]" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Acciones */}
        {mustRespond ? (
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              label="¡Quiero!"
              primary
              onClick={() => {
                haptics("tap");
                setG(pending!.kind === "truco" ? responderTruco4(g, "you", true) : responderEnvido4(g, "you", true));
              }}
            />
            <ActionButton
              label="No quiero"
              onClick={() => {
                haptics("tap");
                setG(pending!.kind === "truco" ? responderTruco4(g, "you", false) : responderEnvido4(g, "you", false));
              }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {(["envido", "real", "falta"] as EnvidoLevel[]).map((lv) =>
            canCantarEnvidoLevel4(g, "you", lv) ? (
              <ActionButton
                key={lv}
                label={lv === "real" ? "Real envido" : lv === "falta" ? "Falta envido" : "Envido"}
                onClick={() => {
                  haptics("tap");
                  setG(cantarEnvido4(g, "you", lv));
                }}
              />
            ) : null,
          )}
          {canCantarTruco4(g, "you") ? (
            <ActionButton
              label={h.trucoLevel === "truco" ? "Retruco" : h.trucoLevel === "retruco" ? "Vale cuatro" : "Truco"}
              onClick={() => {
                haptics("tap");
                setG(cantarTruco4(g, "you"));
              }}
            />
          ) : null}
          <ActionButton
            label="Seña"
            icon={<HandIcon size={15} />}
            disabled={!!senaDe(h, "you") || h.handOver}
            onClick={() => setShowSenas(true)}
          />
          {canIrseAlMazo4(g, "you") ? (
            <ActionButton
              label="Al mazo"
              onClick={() => {
                haptics("tap");
                setG(irseAlMazo4(g, "you"));
              }}
            />
          ) : null}
        </div>

        {h.envidoReveal ? (
          <div className="rounded-lg border border-[var(--oro)]/25 bg-black/40 px-3 py-2 text-[12px] text-[var(--marfil)]/85">
            Envido — Nosotros {h.envidoReveal.nos} ({g.names[h.envidoReveal.nosOwner]}) · Ellos{" "}
            {h.envidoReveal.ellos} ({g.names[h.envidoReveal.ellosOwner]}). +{h.envidoReveal.points} para{" "}
            {teamLabel(h.envidoReveal.winner)}.
          </div>
        ) : null}
      </div>

      {/* Fin de mano / partida */}
      <AnimatePresence>
        {h.handOver || g.winner ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6"
          >
            <div className="w-full max-w-sm rounded-2xl border border-[var(--oro)]/35 bg-[var(--verde-noche)] p-5 text-center">
              <div
                className="text-2xl text-[var(--oro-claro)]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
              >
                {g.winner
                  ? g.winner === "nos"
                    ? "GANAMOS LA PARTIDA"
                    : "NOS GANARON"
                  : h.handResult?.team === "nos"
                    ? "MANO PARA NOSOTROS"
                    : "MANO PARA ELLOS"}
              </div>
              <div className="mt-2 text-sm text-[var(--marfil)]/80">
                Nosotros {g.scores.nos} · Ellos {g.scores.ellos}
              </div>
              <button
                type="button"
                onClick={() => {
                  haptics("tap");
                  if (g.winner) start();
                  else nextHand();
                }}
                className="mt-4 min-h-[48px] w-full rounded-xl border border-[var(--oro)]/45 bg-[var(--oro)]/15 text-sm uppercase tracking-[0.22em] text-[var(--oro-claro)]"
              >
                {g.winner ? "Otra partida" : "Siguiente mano"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <MobileSheet open={showSenas} onClose={() => setShowSenas(false)} title="Señas al socio">
        <div className="space-y-2 pb-2">
          <p className="text-[12px] text-[var(--marfil)]/70">
            Una seña por mano. Si te la cazan, los rivales saben lo que tenés. También podés mentir.
          </p>
          {SENAS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => doSena(s.id)}
              className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-[var(--oro)]/25 bg-black/30 px-3 py-2 text-left"
            >
              <span>
                <span className="block text-sm text-[var(--marfil)]">{s.label}</span>
                <span className="block text-[11px] text-[var(--marfil)]/60">{s.gesto}</span>
              </span>
              <Eye size={16} className="shrink-0 text-[var(--oro)]/70" />
            </button>
          ))}
        </div>
      </MobileSheet>

      <MobileSheet open={showRules} onClose={() => setShowRules(false)} title="Truco en parejas">
        <div className="space-y-2 pb-3 text-[13px] leading-relaxed text-[var(--marfil)]/80">
          <p>Dos parejas enfrentadas, sentadas cruzadas: siempre juega un jugador de cada lado.</p>
          <p>Gana la baza la carta más alta de la mesa; si empatan cartas de los dos equipos, es parda.</p>
          <p>El envido enfrenta el mejor tanto de cada pareja; empate favorece al equipo que es mano.</p>
          <p>
            Las señas se hacen con el gesto y se leen de reojo: sirven para avisarle al socio si tenés una brava
            o si estás para el envido. Se pueden usar para mentir.
          </p>
        </div>
      </MobileSheet>
    </GameRoomShell>
  );
}

function Chip({ label, value, tone }: { label: string; value: number; tone: "oro" | "marfil" }) {
  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-1 text-[11px] uppercase tracking-[0.16em] ${
        tone === "oro"
          ? "border-[var(--oro)]/40 text-[var(--oro-claro)]"
          : "border-[var(--marfil)]/25 text-[var(--marfil)]/80"
      }`}
    >
      {label} {value}
    </span>
  );
}

function TableCard({ card }: { card: Card | null }) {
  return (
    <div className="flex h-[92px] w-[64px] items-center justify-center rounded-lg border border-[var(--oro)]/20 bg-black/25 sm:h-[104px] sm:w-[72px]">
      {card ? (
        <motion.img
          initial={{ scale: 0.8, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          src={cardArt(card)}
          alt=""
          className="h-full w-full rounded-lg object-cover"
        />
      ) : (
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--marfil)]/35">—</span>
      )}
    </div>
  );
}

function SeatPod({ g, seat, card, wide }: { g: Game4; seat: Seat4; card: Card | null; wide?: boolean }) {
  const h = g.hand;
  const sena = senaDe(h, seat);
  const isPartner = seat === "socio";
  const visible = sena && (isPartner || sena.cazada);
  const active = h.turn === seat && !h.pending && !h.handOver;
  const def = useMemo(() => SENAS.find((s) => s.id === sena?.id) ?? null, [sena?.id]);
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
        active ? "border-[var(--oro)]/60 bg-[var(--oro)]/10" : "border-[var(--oro)]/20 bg-black/30"
      } ${wide ? "w-full" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--marfil)]">
          {isPartner ? <Users size={13} className="text-[var(--oro)]/80" /> : null}
          <span className="truncate">{g.names[seat]}</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--marfil)]/50">
          {TEAM_OF[seat] === "nos" ? "Socio" : "Rival"} · {h.hands[seat].length} cartas
        </div>
        {visible && def ? (
          <div className="mt-1 truncate rounded bg-[var(--oro)]/15 px-1.5 py-0.5 text-[10px] text-[var(--oro-claro)]">
            {isPartner ? "Seña: " : "Le cazaste: "}
            {def.label}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-1">
        {card ? (
          <img src={cardArt(card)} alt="" className="h-[62px] w-auto rounded border border-[var(--oro)]/25" />
        ) : (
          <img src={cardBack} alt="" className="h-[62px] w-auto rounded border border-[var(--oro)]/15 opacity-60" />
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  primary,
  disabled,
  icon,
}: {
  label: string;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-[13px] uppercase tracking-[0.16em] disabled:opacity-40 ${
        primary
          ? "border-[var(--oro)]/55 bg-[var(--oro)]/20 text-[var(--oro-claro)]"
          : "border-[var(--oro)]/25 bg-black/35 text-[var(--marfil)]/85"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
