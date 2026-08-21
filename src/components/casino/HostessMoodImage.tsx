import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface Props {
  src: string;
  alt: string;
  className?: string;
  durationMs?: number;
  eager?: boolean;
}

export function HostessMoodImage({
  src,
  alt,
  className = "",
  durationMs = 220,
  eager = false,
}: Props) {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(src);
  const [previous, setPrevious] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const prevSrc = useRef(src);

  useEffect(() => {
    if (src === prevSrc.current) return;
    setPrevious(prevSrc.current);
    setCurrent(src);
    setTick((t) => t + 1);
    prevSrc.current = src;
    if (reduce) {
      setPrevious(null);
      return;
    }
    const id = window.setTimeout(() => setPrevious(null), durationMs + 40);
    return () => window.clearTimeout(id);
  }, [src, durationMs, reduce]);

  return (
    <div className={`relative ${className}`}>
      <style>{`
        @keyframes hostessMoodIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes hostessMoodOut { from { opacity: 1 } to { opacity: 0 } }
      `}</style>
      {previous && !reduce && (
        <img
          key={`prev-${tick}`}
          src={previous}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          style={{ animation: `hostessMoodOut ${durationMs}ms ease-in-out both` }}
        />
      )}
      <img
        key={`cur-${tick}`}
        src={current}
        alt={alt}
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : "auto"}
        className="relative h-full w-full select-none object-contain"
        style={
          previous && !reduce
            ? { animation: `hostessMoodIn ${durationMs}ms ease-in-out both` }
            : undefined
        }
      />
    </div>
  );
}
