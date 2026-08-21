import { useEffect, useState } from "react";
import { warmImages } from "@/lib/asset-manager";

export function useRoomAssetGate(urls: string[], timeoutMs = 2500): boolean {
  const [ready, setReady] = useState<boolean>(() => typeof window === "undefined");
  const key = urls.join("|");
  useEffect(() => {
    if (typeof window === "undefined") {
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    warmImages(urls, { timeoutMs, priority: 1, fetchPriority: "high" }).then(() => {
      if (!cancelled) setReady(true);
    });
    const hardTimeout = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, timeoutMs + 500);
    return () => {
      cancelled = true;
      window.clearTimeout(hardTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, timeoutMs]);
  return ready;
}
