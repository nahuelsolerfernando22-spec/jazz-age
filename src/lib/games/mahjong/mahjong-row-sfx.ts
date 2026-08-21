import asset from "@/assets/audio/mahjong-row.mp3?url";
import { useSettings } from "@/store/settings";

let el: HTMLAudioElement | null = null;
function getEl() {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio(asset);
    el.preload = "auto";
  }
  return el;
}

export function playMahjongRow() {
  const s = useSettings.getState();
  if (s.muted) return;
  const a = getEl();
  if (!a) return;
  try {
    a.volume = Math.max(0, Math.min(1, (s.masterVolume ?? 1) * (s.sfxVolume ?? 1)));
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {}
}
