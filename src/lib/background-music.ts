import theme from "@/assets/audio/speakeasy-theme.mp3?url";

const STORAGE_KEY = "speakeasy-music-on";
const TRACK_URL: string = theme;
let audio: HTMLAudioElement | null = null;
let currentVol = 0;
let fadeRaf: number | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (audio) return audio;
  const el = new Audio(TRACK_URL);
  el.loop = true;
  el.preload = "auto";
  el.volume = 0;
  audio = el;
  return el;
}

function fadeTo(target: number, ms = 800) {
  const el = getAudio();
  if (!el) return;
  if (fadeRaf) cancelAnimationFrame(fadeRaf);
  const from = currentVol;
  const start = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - start) / ms);
    currentVol = from + (target - from) * k;
    el.volume = Math.max(0, Math.min(1, currentVol));
    if (k < 1) fadeRaf = requestAnimationFrame(step);
    else fadeRaf = null;
  };
  fadeRaf = requestAnimationFrame(step);
}

export function isMusicEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMusicEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {}
  const el = getAudio();
  if (!el) return;
  if (on) {
    el.play().catch(() => {});
  } else {
    fadeTo(0, 400);
    setTimeout(() => {
      if (!isMusicEnabled()) el.pause();
    }, 500);
  }
}

export function applyMusicVolume(target: number) {
  fadeTo(target, 600);
}

export function suspendMusic() {
  const el = audio;
  if (el && !el.paused) el.pause();
}
export function resumeMusicIfEnabled() {
  if (!isMusicEnabled()) return;
  const el = getAudio();
  el?.play().catch(() => {});
}
