import { useCallback, useEffect, useRef } from "react";
import { useSettings } from "@/store/settings";

export type HapticKind =
  | "tap"
  | "select"
  | "success"
  | "warning"
  | "error"
  | "heavy"
  | "card"
  | "slam"
  | "chip"
  | "dice"
  | "win"
  | "loss";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  select: 12,
  success: [15, 40, 25],
  warning: [30, 40, 30],
  error: [40, 60, 40, 60],
  heavy: 40,
  card: 10,
  // Golpe seco de carta contra la mesa: un impacto y su rebote.
  slam: [26, 22, 14],
  chip: [8, 30, 8],
  dice: [18, 25, 18, 25, 30],
  win: [25, 50, 25, 50, 60, 80, 120],
  loss: [80, 40, 30],
};

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useHaptics() {
  const hapticFeedback = useSettings((s) => s.hapticFeedback);
  const motionRef = useRef(true);
  const enabledRef = useRef(hapticFeedback);
  enabledRef.current = hapticFeedback;

  useEffect(() => {
    motionRef.current = !reducedMotion();
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const on = () => (motionRef.current = !reducedMotion());
    mq?.addEventListener?.("change", on);
    return () => mq?.removeEventListener?.("change", on);
  }, []);

  return useCallback((kind: HapticKind = "tap") => {
    if (!enabledRef.current || !motionRef.current) return;
    if (typeof navigator === "undefined") return;
    try {
      navigator.vibrate?.(PATTERNS[kind]);
    } catch {}
  }, []);
}
