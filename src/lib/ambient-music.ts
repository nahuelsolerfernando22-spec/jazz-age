import ambient from "@/assets/audio/ambient-loop.mp3?url";

const STORAGE_KEY = "speakeasy-ambient-on";
const TRACK_URL: string = ambient;
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

export function isAmbientEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAmbientEnabled(on: boolean) {
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
      if (!isAmbientEnabled()) el.pause();
    }, 500);
  }
}

export function applyAmbientVolume(target: number) {
  fadeTo(target, 600);
}

export function suspendAmbient() {
  const el = audio;
  if (el && !el.paused) el.pause();
}
export function resumeAmbientIfEnabled() {
  if (!isAmbientEnabled()) return;
  const el = getAudio();
  el?.play().catch(() => {});
}
