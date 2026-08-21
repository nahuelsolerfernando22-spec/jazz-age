import { useEffect } from "react";
import { FIXED_DT, MAX_FRAME_DT, MAX_PHYSICS_STEPS_PER_FRAME } from "./engine";

export interface UseBagatelleLoopArgs {
  step: (dt: number) => void;
  /** Bump a render tick so React re-renders SVG once per animation frame. */
  onFrame: () => void;

  deps?: React.DependencyList;
}

export function useBagatelleLoop({ step, onFrame, deps = [] }: UseBagatelleLoopArgs): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let paused = typeof document !== "undefined" && document.hidden;

    const frame = (now: number) => {
      if (paused) {
        // visible frame after resume uses a fresh delta.
        last = now;
        acc = 0;
        raf = window.requestAnimationFrame(frame);
        return;
      }
      const realDt = Math.min(MAX_FRAME_DT, (now - last) / 1000);
      last = now;
      acc += realDt;
      let steps = 0;
      while (acc >= FIXED_DT && steps < MAX_PHYSICS_STEPS_PER_FRAME) {
        step(FIXED_DT);
        acc -= FIXED_DT;
        steps += 1;
      }

      if (acc > FIXED_DT * MAX_PHYSICS_STEPS_PER_FRAME) acc = 0;
      onFrame();
      raf = window.requestAnimationFrame(frame);
    };

    const onVis = () => {
      const nowHidden = document.hidden;
      if (nowHidden === paused) return;
      paused = nowHidden;
      if (!paused) {
        last = performance.now();
        acc = 0;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
