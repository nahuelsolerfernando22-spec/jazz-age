import { useEffect } from "react";
import { toast } from "sonner";
import { useSessionStreak } from "@/store/session-streak";
import { useCasino } from "@/store/casino";

export function SessionStreakListener() {
  useEffect(() => {
    const onStart = () => {
      const { streak, bonusChips } = useSessionStreak.getState().registerGame();
      if (bonusChips > 0) {
        try {
          useCasino.getState().addChips(bonusChips);
        } catch {
          /* noop */
        }
        toast.success(`Racha de sesión ×${streak}`, {
          description: `+¢${bonusChips} por seguir en la mesa. La casa te ve constante.`,
          duration: 3800,
        });
      }
    };
    window.addEventListener("cuervo:game-started", onStart);
    return () => window.removeEventListener("cuervo:game-started", onStart);
  }, []);
  return null;
}
