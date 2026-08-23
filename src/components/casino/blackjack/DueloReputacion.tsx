import { AnimatePresence, motion } from "framer-motion";
import { veredictoDuelo, type TellBJ } from "@/lib/games/blackjack/blackjack-tells";

/** Barra del duelo: manos jugadas, reputación acumulada y la lectura del croupier. */
export function DueloReputacionBar({
  manos,
  total,
  reputacion,
  tell,
  croupier,
}: {
  manos: number;
  total: number;
  reputacion: number;
  tell: TellBJ | null;
  croupier: string;
}) {
  const pct = Math.min(100, Math.round((manos / total) * 100));
  return (
    <div className="mb-3 rounded-[10px] border border-white/12 bg-white/[0.04] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--marfil)]/70">
          Duelo de palabra · mano {Math.min(manos + 1, total)}/{total}
        </span>
        <span
          className="text-[11px] font-bold uppercase tracking-[0.2em] tabular-nums"
          style={{ color: reputacion >= 0 ? "var(--oro)" : "var(--blood, #7a1f24)" }}
        >
          Reputación {reputacion >= 0 ? "+" : ""}
          {reputacion}
        </span>
      </div>
      <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-[var(--oro)]"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>
      <AnimatePresence mode="wait">
        {tell && (
          <motion.p
            key={tell.gesto}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-[12px] leading-snug text-[var(--marfil)]/75"
          >
            {croupier}: {tell.gesto}.{" "}
            <span
              className="uppercase tracking-[0.14em]"
              style={{ color: tell.lectura === "firme" ? "var(--blood, #7a1f24)" : "var(--oro)" }}
            >
              Se le lee {tell.lectura}
            </span>
            <span className="text-[var(--marfil)]/45">
              {" "}
              ({Math.round(tell.confianza * 100)}% de confianza)
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Cierre del duelo: la mesa dicta el veredicto y ofrece otra noche. */
export function DueloReputacionCierre({
  reputacion,
  total,
  onNuevo,
}: {
  reputacion: number;
  total: number;
  onNuevo: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 rounded-[10px] border border-[var(--oro)]/60 bg-black/50 px-4 py-3 text-center"
    >
      <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--oro)]">
        Duelo cerrado a {total} manos
      </p>
      <p className="mt-1 text-[13px] leading-snug text-[var(--marfil)]/85">
        Reputación {reputacion >= 0 ? "+" : ""}
        {reputacion}. {veredictoDuelo(reputacion)}
      </p>
      <button
        type="button"
        onClick={onNuevo}
        className="gold-cta mt-3 h-11 rounded-full px-5 text-sm font-bold uppercase tracking-[0.2em]"
      >
        Abrir otro duelo
      </button>
    </motion.div>
  );
}
