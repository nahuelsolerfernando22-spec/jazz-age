import { useEffect } from "react";
import { acquireWakeLock, releaseWakeLock } from "@/lib/wake-lock";

export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active) return;
    void acquireWakeLock();
    return () => {
      void releaseWakeLock();
    };
  }, [active]);
}
