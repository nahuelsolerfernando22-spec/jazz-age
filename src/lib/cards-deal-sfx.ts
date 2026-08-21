import cardsDealAsset from "@/assets/audio/cards-deal.mp3?url";

let el: HTMLAudioElement | null = null;

function getEl() {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio(cardsDealAsset);
    el.preload = "auto";
  }
  return el;
}

interface VolumeOpts {
  muted?: boolean;
  master?: number;
  sfx?: number;
}

export function playCardsDeal(opts: VolumeOpts = {}) {
  const a = getEl();
  if (!a) return;
  if (opts.muted) return;
  const master = opts.master ?? 1;
  const sfx = opts.sfx ?? 1;
  const vol = Math.max(0, Math.min(1, master * sfx));
  try {
    a.currentTime = 0;
    a.volume = vol;
    void a.play().catch(() => {});
  } catch {}
}
