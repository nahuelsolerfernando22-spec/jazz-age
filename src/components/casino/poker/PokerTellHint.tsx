import { AnimatePresence, motion } from "framer-motion";
import { SEAT_NAME, type Seat } from "@/lib/games/poker/poker-engine";
import {
  type Legajo,
  type TellPoker,
  type TellPropio,
  precisionLegajo,
  estudio,
} from "@/lib/games/poker/poker-tells";

/** Pista del último movimiento de un rival: gesto observable, nunca la mano real. */
export function PokerTellHint({ tell }: { tell: TellPoker | null }) {
  return (
    <AnimatePresence>
      {tell && (
        <motion.div
          key={`${tell.seat}-${tell.gesto}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none mt-3"
        >
          <div
            className="rounded-sm border px-3 py-2 text-center"
            style={{
              background: "oklch(0.12 0.01 60 / 0.94)",
              borderColor: tell.read === "farol" ? "var(--blood)" : "var(--brass)",
              boxShadow: "0 6px 18px oklch(0 0 0 / 0.6)",
            }}
          >
            <p
              className="font-display text-[11px] uppercase tracking-[0.18em]"
              style={{
                color: tell.read === "farol" ? "var(--blood)" : "var(--brass-bright)",
                textShadow: "0 1px 0 #000",
              }}
            >
              {tell.read === "farol"
                ? `◈ ${SEAT_NAME[tell.seat]} está de farol`
                : `◆ ${SEAT_NAME[tell.seat]} viene firme`}
            </p>
            <p
              className="mt-1 font-serif text-[13px] leading-snug text-[var(--cd-text-main)]"
              style={{ textShadow: "0 1px 2px oklch(0 0 0 / 0.9)" }}
            >
              {tell.gesto}
            </p>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[var(--cd-text-main)]/15">
              <div
                className="h-full"
                style={{
                  width: `${Math.round(tell.confianza * 100)}%`,
                  background: tell.read === "farol" ? "var(--blood)" : "var(--brass)",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Aviso de tu propia cara: si dudás demasiado, la mesa aprieta. */
export function PokerSelfTell({ tell }: { tell: TellPropio | null }) {
  if (!tell) return null;
  return (
    <div
      className="mt-3 rounded-sm border px-3 py-2 text-center"
      style={{
        borderColor: "var(--blood)",
        background: "oklch(0.16 0.05 25 / 0.55)",
      }}
    >
      <p className="font-display text-[11px] uppercase tracking-[0.18em] text-[var(--blood)]">
        ◈ Tu cara habla
      </p>
      <p className="mt-0.5 font-serif text-[13px] leading-snug text-[var(--cd-text-main)]">
        {tell.texto}
      </p>
    </div>
  );
}

/** Legajo: cuánto tenés estudiado a cada rival y qué tan fiables son tus lecturas. */
export function PokerLegajo({ legajo, seats }: { legajo: Legajo; seats: Seat[] }) {
  return (
    <div className="mt-3">
      <p className="mb-1 font-display text-[11px] uppercase tracking-[0.2em] text-[var(--cd-text-muted)]">
        Legajo de la mesa
      </p>
      <div className="grid grid-cols-2 gap-2">
        {seats.map((seat) => {
          const ficha = legajo[seat];
          const prec = precisionLegajo(legajo, seat);
          const est = estudio(legajo, seat);
          return (
            <div
              key={seat}
              className="rounded-sm border px-2.5 py-2"
              style={{
                borderColor: "oklch(0.72 0.14 78 / 0.32)",
                background: "oklch(0.16 0.02 60 / 0.8)",
              }}
            >
              <p className="truncate font-display text-[11px] uppercase tracking-[0.14em] text-[var(--cd-gold-bright)]">
                {SEAT_NAME[seat]}
              </p>
              <p className="font-display text-[10.5px] uppercase tracking-[0.12em] text-[var(--cd-text-muted)]">
                {ficha
                  ? prec > 0
                    ? `${ficha.lecturas} lecturas · ${Math.round(prec * 100)}% fiel`
                    : `${ficha.lecturas} lecturas · sin datos`
                  : "sin lecturas"}
              </p>
              <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[var(--cd-text-main)]/15">
                <div
                  className="h-full"
                  style={{ width: `${Math.round(est * 100)}%`, background: "var(--brass)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
