import { useEffect, useState } from "react";
import { useSettings } from "@/store/settings";

const MQ = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const userPref = useSettings((s) => s.reduceMotion);
  const [systemPref, setSystemPref] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(MQ).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MQ);
    const on = () => setSystemPref(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return userPref || systemPref;
}

export function motionDuration(base: number, reduced: boolean): number {
  return reduced ? 0 : base;
}
