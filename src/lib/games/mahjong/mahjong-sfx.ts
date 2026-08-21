import { useSettings } from "@/store/settings";
import mahjongLoseUrl from "@/assets/audio/mahjong-lose.mp3?url";

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function volume(): number {
  const s = useSettings.getState();
  if (s.muted) return 0;
  return Math.max(0, Math.min(1, (s.masterVolume ?? 1) * (s.sfxVolume ?? 1)));
}

function tone(opts: {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  sweepTo?: number;
}) {
  const v = volume();
  if (v <= 0) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, c.currentTime);
    if (opts.sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, opts.sweepTo),
        c.currentTime + opts.duration,
      );
    }
    const peak = (opts.gain ?? 0.18) * v;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(peak, c.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + opts.duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + opts.duration + 0.02);
  } catch {}
}

export function playMahjongClick() {
  tone({ freq: 880, duration: 0.06, type: "triangle", gain: 0.12 });
}

export function playMahjongError() {
  tone({ freq: 260, duration: 0.16, type: "sawtooth", gain: 0.14, sweepTo: 130 });
}

export function playMahjongWin() {
  const c = getCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => {
    window.setTimeout(() => {
      tone({ freq: f, duration: 0.28, type: "triangle", gain: 0.2 });
    }, i * 110);
  });
}

let loseEl: HTMLAudioElement | null = null;
export function playMahjongLose() {
  const v = volume();
  if (v <= 0) return;
  if (typeof window === "undefined") return;
  try {
    if (!loseEl) {
      loseEl = new Audio(mahjongLoseUrl);
      loseEl.preload = "auto";
    }
    loseEl.volume = v;
    loseEl.currentTime = 0;
    void loseEl.play().catch(() => {});
  } catch {}
}
