import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MahjongTile } from "@/components/casino/mahjong/MahjongTile";
import type { SheetIdx, SpecialGroup } from "@/components/casino/mahjong/MahjongTile";
import { SPECIAL_GROUPS } from "@/store/games/mahjong/mahjong-album";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export interface SpecialFlash {
  id: number;
  sheet: SheetIdx;
  type: number;
  group: SpecialGroup;
  name: string;
  base: number;
  combo: number;
  synergy: boolean;
}

const GROUP_HUE: Record<SpecialGroup, number> = {
  bebidas: 75,
  vicios: 350,
  armas: 45,
  tesoros: 85,
  joyas: 300,
  suerte: 145,
  mascaras: 25,
  sombras: 285,
  reliquias: 60,
  pecados: 15,
};

export function SpecialSynergyBadge({ flash }: { flash: SpecialFlash | null }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<SpecialFlash | null>(null);
  useEffect(() => {
    if (!flash) return;
    setShown(flash);
    const t = window.setTimeout(() => setShown(null), reduced ? 1200 : 1800);
    return () => window.clearTimeout(t);
  }, [flash, reduced]);

  const hue = shown ? GROUP_HUE[shown.group] : 60;
  const glow = `oklch(0.82 0.20 ${hue})`;
  const border = `oklch(0.65 0.16 ${hue})`;
  const groupLabel = shown ? SPECIAL_GROUPS[shown.group].label : "";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center">
      <AnimatePresence>
        {shown && (
          <motion.div
            key={shown.id}
            initial={reduced ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: -14 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center gap-3 rounded-sm border-2 bg-[var(--noir)]/95 px-3 py-2 shadow-deep backdrop-blur-sm"
            style={{ borderColor: border, boxShadow: `0 0 24px ${glow}` }}
          >
            <div className="relative">
              <motion.div
                initial={reduced ? { rotate: 0, scale: 1 } : { rotate: -8, scale: 1 }}
                animate={
                  reduced ? { rotate: 0, scale: 1 } : { rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }
                }
                transition={reduced ? { duration: 0 } : { duration: 0.6 }}
              >
                <MahjongTile index={shown.type} variant="special" sheet={shown.sheet} size={42} />
              </motion.div>
              {!reduced && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[6px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.9, 0] }}
                  transition={{ duration: 1.2, repeat: 1 }}
                  style={{ boxShadow: `0 0 22px ${glow}` }}
                />
              )}
            </div>
            <div className="flex flex-col leading-tight">
              <div
                className="font-display text-[11px] uppercase tracking-[0.4em]"
                style={{ color: border }}
              >
                Sinergia · {groupLabel}
              </div>
              <div className="font-script text-lg text-[var(--ivory)]">{shown.name}</div>
              <div className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.25em] text-[var(--brass-bright)]">
                <span className="tabular-nums">+{shown.base}</span>
                {shown.combo >= 2 && (
                  <span className="rounded-sm border border-[var(--brass)]/50 bg-[var(--mahogany)]/60 px-1.5 py-0.5 text-[var(--ivory)]">
                    ×{shown.combo} combo
                  </span>
                )}
                {shown.synergy && (
                  <span
                    className="rounded-sm border px-1.5 py-0.5 tracking-[0.3em]"
                    style={{ borderColor: border, color: glow, background: "oklch(0.10 0.02 30)" }}
                  >
                    ★ Álbum
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
