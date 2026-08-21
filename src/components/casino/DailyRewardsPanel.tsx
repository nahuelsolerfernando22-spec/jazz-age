import { useEffect } from "react";
import { useHydrated } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCasino } from "@/store/casino";
import { useDailyRewards, DAILY_GIFT_CHIPS } from "@/store/daily-rewards";
import { IconRegalo } from "./DecoIcons";

export function DailyRewardsPanel({ compact = false }: { compact?: boolean }) {
  const addChips = useCasino((s) => s.addChips);
  const canClaim = useDailyRewards((s) => s.canClaimGift());
  const claim = useDailyRewards((s) => s.claimGift);
  const ensureDay = useDailyRewards((s) => s.ensureDay);
  const hydrated = useHydrated();

  useEffect(() => {
    ensureDay();
  }, [ensureDay]);

  function handleClaim() {
    if (claim()) {
      addChips(DAILY_GIFT_CHIPS);
      toast.success(`+¢${DAILY_GIFT_CHIPS} — regalo diario del casino.`);
    }
  }

  // El estado del regalo vive en almacenamiento local: sólo existe tras hidratar.
  if (!hydrated || !canClaim) return null;

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "px-2"}`}>
      <button
        onClick={handleClaim}
        title={`Reclamar ¢${DAILY_GIFT_CHIPS} de regalo diario`}
        aria-label={`Reclamar regalo diario de ${DAILY_GIFT_CHIPS} fichas`}
        className={`cuervo-tap-target inline-flex ${compact ? "h-11 w-11 px-0" : "h-11 px-4"} shrink-0 items-center justify-center gap-1 rounded-full border border-emerald-500/70 bg-emerald-500/20 font-display text-[11px] uppercase tracking-[0.2em] text-emerald-100 shadow-sm transition hover:bg-emerald-500/30 active:scale-[0.97] active:bg-emerald-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80`}
      >
        <IconRegalo size={compact ? 22 : 18} className="shrink-0" />
        {!compact && <span>Regalo</span>}
        {!compact && <span>¢{DAILY_GIFT_CHIPS}</span>}
      </button>
    </div>
  );
}
