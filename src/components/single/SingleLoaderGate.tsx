import { useEffect, useMemo, useRef, useState } from "react";
import { SingleLoader } from "./SingleLoader";
import { linesForRoute } from "@/lib/loading-lines";

export function SingleLoaderGate({
  preloadKey,
  minimumVisibleMs = 380,
  label,
  onReady,
}: {
  preloadKey: string;
  minimumVisibleMs?: number;
  label?: string;
  onReady: () => void;
}) {
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const firedRef = useRef<string | null>(null);

  const lines = useMemo(() => linesForRoute(preloadKey, false), [preloadKey]);

  useEffect(() => {
    setDone(false);
    setProgress(0);
    firedRef.current = null;
    let cancelled = false;
    let effectiveMs = minimumVisibleMs;
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("loaderMs");
      const n = q ? Number(q) : NaN;
      if (Number.isFinite(n) && n > 0 && n < 30000) effectiveMs = n;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      if (cancelled) return;
      const t = Math.min(1, (performance.now() - start) / effectiveMs);
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const timer = window.setTimeout(() => {
      if (!cancelled) setDone(true);
    }, effectiveMs);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [preloadKey, minimumVisibleMs]);

  useEffect(() => {
    if (done && firedRef.current !== preloadKey) {
      firedRef.current = preloadKey;
      onReady();
    }
  }, [done, preloadKey, onReady]);

  return <SingleLoader label={label} progress={progress} lines={label ? undefined : lines} />;
}
