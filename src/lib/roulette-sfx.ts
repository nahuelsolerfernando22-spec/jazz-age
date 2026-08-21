import { useCallback, useEffect, useRef } from "react";
import spinAsset from "@/assets/audio/sfx-blank.mp3?url";
import { useSettings } from "@/store/settings";

export function useRouletteSfx() {
  const spinRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio(spinAsset);
    a.preload = "auto";
    spinRef.current = a;
    return () => {
      try {
        a.pause();
      } catch {}
      spinRef.current = null;
    };
  }, []);

  const spin = useCallback(() => {
    const s = useSettings.getState();
    if (s.muted) return;
    const a = spinRef.current;
    if (!a) return;
    try {
      a.volume = Math.max(0, Math.min(1, (s.masterVolume ?? 1) * (s.sfxVolume ?? 1)));
      a.currentTime = 0;
      void a.play().catch(() => {});
    } catch {}
  }, []);

  const stopSpin = useCallback(() => {
    const a = spinRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
  }, []);

  const noop = useCallback(() => {}, []);
  return { tick: noop, pocketThunk: noop, winChime: noop, spin, stopSpin };
}
