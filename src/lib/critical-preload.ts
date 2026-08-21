import appBg from "@/assets/hub/app-bg.webp";
import missionBoardBg from "@/assets/hub/mission-board-bg.webp";
import trophyCaseBg from "@/assets/hub/trophy-case-bg.webp";
import { warmImages } from "@/lib/asset-manager";

const P0: string[] = [appBg];
const P1: string[] = [missionBoardBg, trophyCaseBg];

let readyPromise: Promise<void> | null = null;

export function primeCriticalAssets(): Promise<void> {
  if (readyPromise) return readyPromise;
  if (typeof window === "undefined") return Promise.resolve();
  readyPromise = warmImages(P0, { priority: 0, fetchPriority: "high", timeoutMs: 1800 }).then(
    () => {
      schedule(() => {
        void warmImages(P1, { priority: 8, fetchPriority: "low", timeoutMs: 1800 });
      });
    },
  );
  return readyPromise;
}

function schedule(fn: () => void) {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(fn, { timeout: 2500 });
  } else {
    setTimeout(fn, 500);
  }
}

let criticalReady = false;
export function markCriticalReady() {
  criticalReady = true;
}
export function isCriticalReady() {
  return criticalReady;
}

if (typeof window !== "undefined") {
  void primeCriticalAssets().then(() => markCriticalReady());
}
