import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { MahjongPresagio } from "@/lib/games/mahjong/mahjong-presagios";

interface Props {
  presagio: MahjongPresagio | null;
}

export function PresagioBadge({ presagio }: Props) {
  const [open, setOpen] = useState(false);
  if (!presagio) return null;
  if (open) {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-2 z-40 flex justify-center px-2">
        <AnimatePresence mode="wait">
          <motion.button
            key={`open-${presagio.id}`}
            type="button"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="pointer-events-auto flex max-w-[24rem] flex-col items-center gap-1 rounded-md border border-[oklch(0.55_0.14_65)] bg-[oklch(0.10_0.03_25/0.92)] px-4 py-2 text-center shadow-[0_6px_28px_oklch(0_0_0/0.7)] backdrop-blur-sm"
            aria-label="Ocultar presagio"
          >
            <span className="font-display text-[11px] uppercase tracking-[0.28em] text-[oklch(0.78_0.16_75)]">
              Presagio del Cuervo
            </span>
            <span className="font-display text-lg leading-tight text-[oklch(0.92_0.10_75)]">
              {presagio.title}
            </span>
            <span className="text-[11px] italic leading-snug text-[oklch(0.78_0.05_70)]">
              {presagio.omen}
            </span>
            <span className="mt-1 text-[11px] leading-snug text-[oklch(0.85_0.12_75)]">
              {presagio.effect}
            </span>
            <span className="mt-1 text-[11px] tracking-widest text-[oklch(0.6_0.05_70)]">
              tocá para minimizar
            </span>
          </motion.button>
        </AnimatePresence>
      </div>
    );
  }
  return (
    <div className="mt-1 mb-1 flex justify-end px-1 select-none">
      <AnimatePresence mode="wait">
        <motion.button
          key={`chip-${presagio.id}`}
          type="button"
          onClick={() => setOpen(true)}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-1.5 rounded-full border border-[oklch(0.55_0.14_65)] bg-[oklch(0.10_0.03_25/0.9)] px-3 py-1 font-display text-[11px] uppercase tracking-[0.2em] text-[oklch(0.85_0.12_75)] shadow-[0_2px_10px_oklch(0_0_0/0.6)] backdrop-blur-sm"
          aria-label="Ver presagio"
        >
          <span aria-hidden>☩</span>
          <span>{presagio.title}</span>
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
