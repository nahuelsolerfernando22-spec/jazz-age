import { useCallback, useEffect, useRef } from "react";
import shakeAsset from "@/assets/audio/sfx-blank.mp3?url";
import { useSettings } from "@/store/settings";

/**
 * Sonido de dados para Cinco Huesos.
 * Pool de audios para evitar cortes en tiradas rápidas.
 */
const POOL_SIZE = 6;
let landPool: HTMLAudioElement[] | null = null;
let landIdx = 0;

function getLandEl() {
  if (typeof window === "undefined") return null;
  if (!landPool) {
    landPool = Array.from({ length: POOL_SIZE }, () => {
      const a = new Audio(shakeAsset); // Debería ser sfx-dados-land.mp3 si existiera, usamos blank por ahora
      a.preload = "auto";
      return a;
    });
  }
  const el = landPool[landIdx];
  landIdx = (landIdx + 1) % POOL_SIZE;
  return el;
}

export function useDadosSfx() {
  const muted = useSettings((s) => s.muted);
  const master = useSettings((s) => s.masterVolume);
  const sfx = useSettings((s) => s.sfxVolume);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = new Audio(shakeAsset);
    el.preload = "auto";
    audioRef.current = el;
    return () => {
      el.pause();
      audioRef.current = null;
    };
  }, []);

  const shake = useCallback(
    (intensity = 1) => {
      const el = audioRef.current;
      if (!el || muted) return;
      const vol = Math.max(0, Math.min(1, master * sfx * Math.max(0.2, intensity)));
      try {
        el.currentTime = 0;
        el.volume = vol;
        void el.play().catch(() => {});
      } catch {}
    },
    [muted, master, sfx],
  );

  const land = useCallback(
    (intensity = 1) => {
      const a = getLandEl();
      if (!a || muted) return;
      const vol = Math.max(0, Math.min(1, master * sfx * intensity * 0.7));
      try {
        a.currentTime = 0;
        a.volume = vol;
        void a.play().catch(() => {});
      } catch {}
    },
    [muted, master, sfx],
  );

  const win = useCallback(() => {
    // placeholder para sfx de victoria
  }, []);

  return { shake, land, win };
}
