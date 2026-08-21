import winAsset from "@/assets/audio/win.mp3?url";
import loseAsset from "@/assets/audio/lose.mp3?url";

let winEl: HTMLAudioElement | null = null;
let loseEl: HTMLAudioElement | null = null;

function get(url: string, ref: "win" | "lose") {
  if (typeof window === "undefined") return null;
  if (ref === "win") {
    if (!winEl) {
      winEl = new Audio(url);
      winEl.preload = "auto";
    }
    return winEl;
  }
  if (!loseEl) {
    loseEl = new Audio(url);
    loseEl.preload = "auto";
  }
  return loseEl;
}

interface VolumeOpts {
  muted?: boolean;
  master?: number;
  sfx?: number;
}

function play(el: HTMLAudioElement | null, opts: VolumeOpts) {
  if (!el || opts.muted) return;
  const vol = Math.max(0, Math.min(1, (opts.master ?? 1) * (opts.sfx ?? 1)));
  try {
    el.currentTime = 0;
    el.volume = vol;
    void el.play().catch(() => {});
  } catch {}
}

export function playWin(opts: VolumeOpts = {}) {
  play(get(winAsset, "win"), opts);
}

export function playLose(opts: VolumeOpts = {}) {
  play(get(loseAsset, "lose"), opts);
}
