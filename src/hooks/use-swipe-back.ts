import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { useHaptics } from "@/hooks/use-haptics";

const EDGE_PX = 24;
const MIN_DX = 90;
const MAX_DY = 60;
const MAX_MS = 500;
const FULL_DX = 160;

export function useSwipeBack() {
  const router = useRouter();
  const haptic = useHaptics();
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const indicator = document.createElement("div");
    indicator.className = "swipe-back-indicator";
    indicator.setAttribute("aria-hidden", "true");
    document.body.appendChild(indicator);
    indicatorRef.current = indicator;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let armed = false;
    let armedHaptic = false;

    const setProgress = (p: number, active: boolean) => {
      const el = indicatorRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(1, p));
      el.style.transform = `scaleX(${1 + clamped * 8})`;
      el.dataset.active = active ? "true" : "false";
    };

    const reset = () => {
      const el = indicatorRef.current;
      if (!el) return;
      el.dataset.active = "false";
      el.style.transform = "scaleX(0)";
      armedHaptic = false;
    };

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      armed = t.clientX <= EDGE_PX && window.history.length > 1;
      startX = t.clientX;
      startY = t.clientY;
      startT = performance.now();
    };

    const onMove = (e: TouchEvent) => {
      if (!armed) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dy > MAX_DY) {
        armed = false;
        reset();
        return;
      }
      const p = dx / FULL_DX;
      setProgress(p, true);
      if (!armedHaptic && p >= 1) {
        armedHaptic = true;
        haptic("tap");
      } else if (armedHaptic && p < 1) {
        armedHaptic = false;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!armed) {
        reset();
        return;
      }
      armed = false;
      const t = e.changedTouches[0];
      if (!t) {
        reset();
        return;
      }
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      const dt = performance.now() - startT;
      reset();
      if (dx >= MIN_DX && dy <= MAX_DY && dt <= MAX_MS) {
        if (window.history.length > 1) {
          haptic("select");
          router.history.back();
        }
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
      indicator.remove();
      indicatorRef.current = null;
    };
  }, [router, haptic]);
}
