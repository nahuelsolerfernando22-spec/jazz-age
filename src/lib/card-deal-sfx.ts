import dealAsset from "@/assets/audio/sfx-blank.mp3?url";
import { useSettings } from "@/store/settings";

const POOL_SIZE = 4;
let pool: HTMLAudioElement[] | null = null;
let idx = 0;

function getEl() {
  if (typeof window === "undefined") return null;
  if (!pool) {
    pool = Array.from({ length: POOL_SIZE }, () => {
      const a = new Audio(dealAsset);
      a.preload = "auto";
      return a;
    });
  }
  const el = pool[idx];
  idx = (idx + 1) % POOL_SIZE;
  return el;
}

/** Sonido corto de carta repartida (mesas de naipes). */
export function playCardDeal() {
  const a = getEl();
  if (!a) return;
  const { muted, masterVolume, sfxVolume } = useSettings.getState();
  if (muted) return;
  const vol = Math.max(0, Math.min(1, masterVolume * sfxVolume));
  try {
    a.currentTime = 0;
    a.volume = vol;
    void a.play().catch(() => {});
  } catch {}
}
