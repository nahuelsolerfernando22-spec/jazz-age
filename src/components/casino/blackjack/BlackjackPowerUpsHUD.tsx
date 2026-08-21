import { motion } from "framer-motion";
import { useBlackjackRun, type BlackjackPowerUp } from "@/store/games/blackjack/blackjack-run";

const POWERUP_DEFS: Record<BlackjackPowerUp, { label: string; icon: string; desc: string }> = {
  bribe: {
    label: "Bribaje",
    icon: "💰",
    desc: "Mitiga las pérdidas del encargo.",
  },
  "double-face": {
    label: "Doble Cara",
    icon: "👁️",
    desc: "Revela la carta oculta del dealer.",
  },
  "second-chance": {
    label: "Segunda Oportunidad",
    icon: "🎲",
    desc: "Evita el bust una vez.",
  },
};

interface Props {
  onUse?: (kind: BlackjackPowerUp) => void;
  disabledKinds?: BlackjackPowerUp[];
}

export function BlackjackPowerUpsHUD({ onUse, disabledKinds = [] }: Props) {
  const inventory = useBlackjackRun((s) => s.inventory);
  const consumePowerUp = useBlackjackRun((s) => s.usePowerUp);
  const activeLevel = useBlackjackRun((s) => s.activeLevel);

  if (!activeLevel) return null;

  const handleUse = (kind: BlackjackPowerUp) => {
    if (inventory[kind] > 0 && !disabledKinds.includes(kind)) {
      if (consumePowerUp(kind)) {
        onUse?.(kind);
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {(Object.keys(POWERUP_DEFS) as BlackjackPowerUp[]).map((kind) => {
        const count = inventory[kind] || 0;
        const def = POWERUP_DEFS[kind];
        const isDisabled = count <= 0 || disabledKinds.includes(kind);

        return (
          <motion.button
            key={kind}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            onClick={() => handleUse(kind)}
            disabled={isDisabled}
            className={`
              relative flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all
              ${
                isDisabled
                  ? "border-white/5 bg-white/5 opacity-30 grayscale"
                  : "border-[var(--oro)]/40 bg-[var(--oro)]/10 text-[var(--oro)] hover:bg-[var(--oro)]/20"
              }
            `}
            title={def.desc}
          >
            <span className="text-sm">{def.icon}</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] uppercase tracking-wider font-bold">{def.label}</span>
              <span className="text-[11px] tabular-nums font-medium opacity-80">{count}</span>
            </div>

            {count > 0 && !isDisabled && (
              <span className="absolute -right-1 -top-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--oro)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--oro)]"></span>
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
