import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useSettings } from "@/store/settings";
import { playRoomStinger } from "@/lib/room-stinger";
import {
  LOADING_POSES,
  markPoseUsed,
  pickWeightedPoseIndex,
  warmLoadingPoses,
} from "@/lib/loading-poses";

const DURATION_MS = 900;

export function RoomCurtainTransition() {
  const location = useLocation();
  const path = location.pathname;
  const prev = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [poseIdx, setPoseIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const muted = useSettings((s) => s.muted);
  const master = useSettings((s) => s.masterVolume);
  const sfx = useSettings((s) => s.sfxVolume);

  useEffect(() => {
    warmLoadingPoses();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      prev.current = path;
      return;
    }
    if (prev.current === null) {
      prev.current = path;
      return;
    }
    if (prev.current === path) return;
    prev.current = path;

    const picked = pickWeightedPoseIndex();
    setPoseIdx(picked);
    markPoseUsed(picked);
    setProgress(0);
    setFadingOut(false);
    setVisible(true);
    playRoomStinger(path, { muted, master, sfx });

    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const tFade = window.setTimeout(() => setFadingOut(true), DURATION_MS);
    const tEnd = window.setTimeout(() => setVisible(false), DURATION_MS + 320);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(tFade);
      clearTimeout(tEnd);
    };
  }, [path, reduceMotion, muted, master, sfx]);

  if (!visible) return null;

  const pose = LOADING_POSES[poseIdx] ?? LOADING_POSES[0];
  const pct = Math.round(progress * 100);
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9500] overflow-hidden"
      style={{
        background: "#050303",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 300ms ease-out",
      }}
    >
      <img
        key={pose.id}
        src={pose.src}
        alt=""
        draggable={false}
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{ animation: "cuervoTransFade 240ms ease-out both" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            "linear-gradient(to top, rgba(5,3,3,0.92) 0%, rgba(5,3,3,0.72) 45%, rgba(5,3,3,0) 100%)",
        }}
      />
      <style>{`
        @keyframes cuervoTransFade { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6"
        style={{ paddingBottom: "max(28px, var(--sa-bottom))" }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.5em] text-[var(--oro)]/80"
          style={{ fontFamily: "'Bebas Neue', 'Barlow', sans-serif" }}
        >
          El Cuervo Dorado
        </p>
        <div
          className="mt-3 h-[3px] w-64 max-w-[70vw] overflow-hidden rounded-full"
          style={{
            background: "rgba(0,0,0,0.7)",
            boxShadow: "inset 0 0 6px rgba(0,0,0,0.9)",
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--cd-gold-mid) 0%, #f5d497 55%, var(--cd-gold-mid) 100%)",
              boxShadow: "0 0 8px rgba(245,212,151,0.55)",
              transition: "width 120ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
        <p
          className="mt-3 max-w-[80vw] px-2 text-center"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(13px, 3.4vw, 16px)",
            lineHeight: 1.3,
            color: "#fbe8bf",
            opacity: 0.92,
            letterSpacing: "0.04em",
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          Preparando la casa… {pct}%
        </p>
      </div>
    </div>
  );
}
