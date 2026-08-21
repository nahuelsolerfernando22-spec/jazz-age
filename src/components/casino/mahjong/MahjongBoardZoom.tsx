import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSettings } from "@/store/settings";

const MIN = 0.8;
const MAX = 1.6;

function clamp(v: number) {
  return Math.min(MAX, Math.max(MIN, v));
}

interface Props {
  children: ReactNode;
  className?: string;
}

export function MahjongBoardZoom({ children, className }: Props) {
  const scale = useSettings((s) => s.mahjongTileScale);
  const setScale = useSettings((s) => s.setMahjongTileScale);
  const [live, setLive] = useState<number | null>(null);
  const startDistRef = useRef<number | null>(null);
  const startScaleRef = useRef<number>(1);

  const active = live ?? scale;

  useEffect(() => {
    setLive(null);
  }, [scale]);

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    startDistRef.current = Math.hypot(dx, dy);
    startScaleRef.current = scale;
  }

  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length !== 2 || startDistRef.current == null) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    const d = Math.hypot(dx, dy);
    const ratio = d / startDistRef.current;
    setLive(clamp(startScaleRef.current * ratio));
    e.preventDefault();
  }

  function commit() {
    if (live != null) setScale(live);
    startDistRef.current = null;
  }

  return (
    <div
      className={className}
      style={{ touchAction: "pan-x pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={commit}
      onTouchCancel={commit}
    >
      <div
        style={{
          transform: `scale(${active})`,
          transformOrigin: "top center",
          transition: live == null ? "transform 180ms ease-out" : "none",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function MahjongZoomButtons({ className }: { className?: string }) {
  const scale = useSettings((s) => s.mahjongTileScale);
  const setScale = useSettings((s) => s.setMahjongTileScale);
  const step = 0.1;
  return (
    <div
      className={
        className ??
        "pointer-events-auto flex items-center gap-1 rounded-full border border-amber-400/30 bg-black/60 px-1 py-1 shadow-lg backdrop-blur"
      }
    >
      <button
        type="button"
        aria-label="Reducir tamaño de fichas"
        onClick={() => setScale(clamp(scale - step))}
        disabled={scale <= MIN + 0.001}
        className="grid h-9 w-9 place-items-center rounded-full text-amber-100 disabled:opacity-40"
      >
        <span className="text-base font-bold">A-</span>
      </button>
      <span className="min-w-10 text-center text-xs tabular-nums text-amber-200/80">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        aria-label="Aumentar tamaño de fichas"
        onClick={() => setScale(clamp(scale + step))}
        disabled={scale >= MAX - 0.001}
        className="grid h-9 w-9 place-items-center rounded-full text-amber-100 disabled:opacity-40"
      >
        <span className="text-base font-bold">A+</span>
      </button>
    </div>
  );
}
