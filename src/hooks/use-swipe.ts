import { useEffect, useRef, type RefObject } from "react";

export type SwipeDirection = "left" | "right" | "up" | "down";

export interface SwipeHandlers {
  onSwipe?: (dir: SwipeDirection) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  maxOffAxis?: number;
  maxDurationMs?: number;
}

export function useSwipe<T extends HTMLElement>(ref: RefObject<T | null>, handlers: SwipeHandlers) {
  const cfg = useRef(handlers);
  cfg.current = handlers;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let st = 0;

    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      sx = t.clientX;
      sy = t.clientY;
      st = performance.now();
    };
    const end = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const dt = performance.now() - st;
      const c = cfg.current;
      const threshold = c.threshold ?? 50;
      const maxOff = c.maxOffAxis ?? 80;
      const maxMs = c.maxDurationMs ?? 600;
      if (dt > maxMs) return;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      let dir: SwipeDirection | null = null;
      if (absX > absY && absX >= threshold && absY <= maxOff) {
        dir = dx > 0 ? "right" : "left";
      } else if (absY > absX && absY >= threshold && absX <= maxOff) {
        dir = dy > 0 ? "down" : "up";
      }
      if (!dir) return;
      c.onSwipe?.(dir);
      if (dir === "left") c.onSwipeLeft?.();
      if (dir === "right") c.onSwipeRight?.();
      if (dir === "up") c.onSwipeUp?.();
      if (dir === "down") c.onSwipeDown?.();
    };

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchend", end, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchend", end);
    };
  }, [ref]);
}
