import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check, Minus, Plus, X } from "lucide-react";

interface Props {
  titulo: string;
  origen: string;
  destino: string;
  min: number;
  max: number;
  inicial?: number;
  /** Tropas que quedan en el origen tras mover (para mostrar el saldo). */
  restanteEn?: number;
  onConfirm: (cantidad: number) => void;
  onCancel?: () => void;
}

/**
 * Movimiento manual de tropas: el jugador decide cuántas fichas viajan,
 * tanto al ocupar un sector conquistado como al reagrupar.
 */
export function TroopMover({
  titulo,
  origen,
  destino,
  min,
  max,
  inicial,
  restanteEn,
  onConfirm,
  onCancel,
}: Props) {
  const tope = Math.max(min, max);
  const [n, setN] = useState(() => Math.min(tope, Math.max(min, inicial ?? min)));
  const paso = (d: number) => setN((v) => Math.min(tope, Math.max(min, v + d)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm"
      style={{ paddingBottom: "max(1rem, calc(var(--sa-bottom) + 1rem))" }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border-2 border-[var(--oro-viejo)] bg-black/95 p-4 shadow-[0_-12px_60px_rgba(0,0,0,0.95)]"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bebas text-xl leading-none text-[var(--oro-palido)]">{titulo}</p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] font-black uppercase tracking-[0.14em] text-[var(--crema-clara)]/80">
              {origen} <ArrowRight size={12} className="shrink-0 text-[var(--oro)]" /> {destino}
            </p>
          </div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancelar movimiento"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--oro)]/40 bg-black/50 text-[var(--oro)] touch-manipulation"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            data-haptic="tap"
            onClick={() => paso(-1)}
            disabled={n <= min}
            aria-label="Una tropa menos"
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[var(--oro-viejo)] bg-black/60 text-[var(--oro)] disabled:opacity-35 touch-manipulation"
          >
            <Minus size={22} />
          </button>
          <div className="flex-1 text-center">
            <span className="block font-bebas text-5xl leading-none tabular-nums text-[var(--crema-brillo)]">
              {n}
            </span>
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--oro)]/80">
              {restanteEn !== undefined ? `quedan ${restanteEn - n} en origen` : `máx. ${tope}`}
            </span>
          </div>
          <button
            type="button"
            data-haptic="tap"
            onClick={() => paso(1)}
            disabled={n >= tope}
            aria-label="Una tropa más"
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[var(--oro-viejo)] bg-black/60 text-[var(--oro)] disabled:opacity-35 touch-manipulation"
          >
            <Plus size={22} />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setN(min)}
            className="min-h-[44px] flex-1 rounded-lg border border-[var(--oro)]/40 bg-black/50 font-bebas text-base uppercase text-[var(--oro)] touch-manipulation"
          >
            Mínimo
          </button>
          <button
            type="button"
            onClick={() => setN(tope)}
            className="min-h-[44px] flex-1 rounded-lg border border-[var(--oro)]/40 bg-black/50 font-bebas text-base uppercase text-[var(--oro)] touch-manipulation"
          >
            Todas
          </button>
        </div>

        <button
          type="button"
          data-haptic="heavy"
          onClick={() => onConfirm(n)}
          className="mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-[var(--oro)] font-bebas text-2xl uppercase text-black shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none touch-manipulation"
        >
          <Check size={22} /> Mover {n}
        </button>
      </motion.div>
    </motion.div>
  );
}
