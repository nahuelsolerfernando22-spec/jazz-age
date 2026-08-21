import { useEffect } from "react";
import { useHaptics, type HapticKind } from "@/hooks/use-haptics";

export type GameOutcome = "win" | "loss" | "draw" | null;

const OUTCOME_HAPTIC: Record<Exclude<GameOutcome, null>, HapticKind> = {
  win: "win",
  loss: "loss",
  draw: "warning",
};

export function useGameOutcome(outcome: GameOutcome) {
  const haptic = useHaptics();
  useEffect(() => {
    if (!outcome) return;
    haptic(OUTCOME_HAPTIC[outcome]);
  }, [outcome, haptic]);
}
