import a1 from "@/assets/audio/bagatelle-ball-a.mp3?url";
import a2 from "@/assets/audio/bagatelle-ball-b.mp3?url";
import { useSettings } from "@/store/settings";

export type BagatelleZone = "green" | "amber" | "red";

let variants: HTMLAudioElement[] | null = null;
let lastIdx = -1;
let current: HTMLAudioElement | null = null;
let currentOnEnded: (() => void) | null = null;

function ensure(): HTMLAudioElement[] | null {
  if (typeof window === "undefined") return null;
  if (!variants) {
    variants = [new Audio(a1), new Audio(a2)];
    for (const el of variants) {
      el.preload = "auto";

      try {
        el.load();
      } catch {}
    }
  }
  return variants;
}

function effectiveVolume(): number {
  const s = useSettings.getState();
  if (s.muted) return 0;
  const master = s.masterVolume ?? 1;
  const sfx = s.sfxVolume ?? 1;
  const bag = s.bagatelleSfxVolume ?? 1;
  return Math.max(0, Math.min(1, master * sfx * bag));
}

function zoneProfile(zone: BagatelleZone) {
  switch (zone) {
    case "green":
      return { rate: 1.0, gain: 0.95 };
    case "amber":
      return { rate: 0.96, gain: 1.0 };
    case "red":
      return { rate: 0.9, gain: 1.05 };
  }
}

function clearCurrent() {
  if (current && currentOnEnded) {
    try {
      current.removeEventListener("ended", currentOnEnded);
    } catch {}
  }
  current = null;
  currentOnEnded = null;
}

export function resetBagatelleLaunchSfx() {
  if (current) {
    try {
      current.pause();
      current.currentTime = 0;
    } catch {}
  }
  clearCurrent();
}

export function playBagatelleLaunch(zone: BagatelleZone = "amber") {
  const vol = effectiveVolume();
  if (vol <= 0) {
    resetBagatelleLaunchSfx();
    return;
  }
  const list = ensure();
  if (!list) return;

  const idx = lastIdx < 0 ? Math.floor(Math.random() * list.length) : (lastIdx + 1) % list.length;
  lastIdx = idx;
  const el = list[idx];

  resetBagatelleLaunchSfx();

  const profile = zoneProfile(zone);

  const rateJitter = 1 + (Math.random() - 0.5) * 0.08;
  const gainJitter = 1 + (Math.random() - 0.5) * 0.16;
  const rate = Math.max(0.5, Math.min(2, profile.rate * rateJitter));
  const gain = Math.max(0, Math.min(1, profile.gain * gainJitter));

  try {
    el.pause();
    el.currentTime = 0;
    el.playbackRate = rate;

    const anyEl = el as HTMLAudioElement & { preservesPitch?: boolean };
    if ("preservesPitch" in anyEl) anyEl.preservesPitch = false;
    el.volume = Math.max(0, Math.min(1, vol * gain));
    current = el;
    currentOnEnded = () => {
      if (current === el) clearCurrent();
    };
    el.addEventListener("ended", currentOnEnded, { once: true });
    void el.play().catch(() => {
      if (current === el) clearCurrent();
    });
  } catch {
    clearCurrent();
  }
}

export function playBagatelleBall(zone: BagatelleZone = "amber") {
  playBagatelleLaunch(zone);
}
