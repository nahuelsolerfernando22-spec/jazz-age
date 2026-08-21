import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Briefcase, Check, DoorOpen, Flag, Swords, Undo2 } from "lucide-react";
import type { TurnPhase } from "./TurnBanner";

interface Props {
  phase: TurnPhase;
  unassignedTroops: number;
  pendingTroops: number;
  cardsCount: number;
  locked: boolean;
  onConfirmDeploy: () => void;
  onCancelDeploy: () => void;
  onAdvance: () => void;
  onOpenCards: () => void;
}

export function ActionDock({
  phase,
  unassignedTroops,
  pendingTroops,
  cardsCount,
  locked,
  onConfirmDeploy,
  onCancelDeploy,
  onAdvance,
  onOpenCards,
}: Props) {
  const mustDeploy = phase === "deployment" && unassignedTroops > 0;
  const canConfirm = phase === "deployment" && pendingTroops > 0;

  const primary = (() => {
    if (phase === "deployment") {
      if (mustDeploy)
        return {
          label: `REPARTÍ ${unassignedTroops} TROPAS`,
          icon: Flag,
          disabled: false,
          urgent: true,
        };
      return { label: "PASAR AL ASALTO", icon: Swords, disabled: false };
    }
    if (phase === "attack") return { label: "TERMINAR ASALTO", icon: Swords, disabled: false };
    if (phase === "fortification") return { label: "FINALIZAR TURNO", icon: Flag, disabled: false };
    return { label: "FINALIZAR TURNO", icon: Flag, disabled: false };
  })();

  const PrimaryIcon = primary.icon;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] border-t-2 border-[var(--oro)]/40 bg-black/92 px-3 pb-[max(0.5rem,var(--sa-bottom))] pt-2 backdrop-blur-md">
      {canConfirm ? (
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            data-haptic="tap"
            onClick={onCancelDeploy}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[var(--oro)]/50 bg-black/60 font-bebas text-lg text-[var(--oro)]"
          >
            <Undo2 size={16} /> DESHACER
          </button>
          <button
            type="button"
            data-haptic="tap"
            onClick={onConfirmDeploy}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl border-2 border-black bg-[var(--oro)] font-bebas text-xl text-black shadow-[0_4px_0_#000]"
          >
            <Check size={18} /> CONFIRMAR DESPLIEGUE ({pendingTroops})
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[var(--oro)]/30 bg-black/50 text-[var(--oro)]"
        >
          <DoorOpen size={18} />
          <span className="text-[11px] font-black uppercase tracking-widest">Salir</span>
        </Link>

        <button
          type="button"
          data-haptic="tap"
          onClick={onOpenCards}
          className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[var(--oro)]/50 bg-black/60 text-[var(--oro)]"
        >
          <Briefcase size={18} />
          <span className="text-[11px] font-black uppercase tracking-widest">Naipes</span>
          {cardsCount > 0 ? (
            <motion.span
              animate={cardsCount >= 3 ? { scale: [1, 1.25, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-red-700 text-[11px] font-black text-white"
            >
              {cardsCount}
            </motion.span>
          ) : null}
        </button>

        <button
          type="button"
          data-haptic="heavy"
          disabled={locked || (primary.disabled && !primary.urgent)}
          onClick={onAdvance}
          className={`flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border-[3px] border-black px-2 font-bebas text-xl shadow-[0_6px_0_#000] transition-all active:translate-y-1 active:shadow-none ${
            locked || (primary.disabled && !primary.urgent)
              ? "bg-[#2a251a] text-[var(--crema-brillo)]/65 shadow-none border-[var(--oro)]/10"
              : primary.urgent
                ? "bg-[var(--oro)] text-black border-black/20"
                : phase === "attack"
                  ? "bg-red-700 text-white border-white/10"
                  : "bg-[var(--oro-viejo)] text-black border-black/20"
          }`}
        >
          <PrimaryIcon size={22} className={`shrink-0 ${primary.urgent ? "animate-pulse" : ""}`} />
          <span className="min-w-0 truncate whitespace-nowrap leading-none">
            {locked ? "TURNO DEL RIVAL" : primary.label}
          </span>
        </button>

      </div>
    </nav>
  );
}
