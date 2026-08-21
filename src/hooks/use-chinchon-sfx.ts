import { useCallback, useEffect, useRef } from "react";
import { playCardsDeal } from "@/lib/cards-deal-sfx";
import { useSettings } from "@/store/settings";

export type ChinchonSfx =
  | "shuffle"
  | "draw"
  | "drawPile"
  | "snap"
  | "cortar"
  | "aiClose"
  | "chinchon"
  | "badClose"
  | "lose"
  | "shake";

export function useChinchonSfx(enabled = true) {
  const ctxRef = useRef<AudioContext | null>(null);
  const muted = useSettings((s) => s.muted);
  const master = useSettings((s) => s.masterVolume);
  const sfxVol = useSettings((s) => s.sfxVolume);

  const ensure = useCallback(() => {
    if (!enabled) return null;
    try {
      if (!ctxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new Ctx();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx && ctx.state !== "closed") {
        try {
          void ctx.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return useCallback(
    (sfx: ChinchonSfx) => {
      const ctx = ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime;
      try {
        switch (sfx) {
          case "shuffle":
            playCardsDeal({ muted: muted || !enabled, master, sfx: sfxVol });
            break;

          case "draw":
            blip(ctx, 1200, t0, 0.06, 0.18, "triangle");
            noise(ctx, t0, 0.05, 0.04, 3000, 8000);
            break;
          case "drawPile":
            blip(ctx, 520, t0, 0.09, 0.22, "triangle");
            blip(ctx, 320, t0 + 0.02, 0.07, 0.16, "sine");
            noise(ctx, t0, 0.09, 0.07, 900, 4200);
            break;
          case "snap":
            noise(ctx, t0, 0.07, 0.18, 1800, 6500);
            blip(ctx, 320, t0, 0.05, 0.14, "square");
            break;
          case "aiClose":
            blip(ctx, 660, t0, 0.12, 0.22, "triangle");
            blip(ctx, 494, t0 + 0.1, 0.18, 0.22, "triangle");
            noise(ctx, t0, 0.06, 0.05, 2200, 6500);
            break;
          case "shake":
            blip(ctx, 90, t0, 0.18, 0.34, "sawtooth");
            noise(ctx, t0, 0.18, 0.06, 200, 2200);
            break;
          case "cortar":
            blip(ctx, 523, t0, 0.18, 0.26, "triangle");
            blip(ctx, 659, t0 + 0.09, 0.18, 0.28, "triangle");
            blip(ctx, 784, t0 + 0.18, 0.28, 0.32, "triangle");
            noise(ctx, t0 + 0.05, 0.3, 0.05, 4500, 9000);
            break;
          case "chinchon":
            blip(ctx, 523, t0, 0.14, 0.28, "triangle");
            blip(ctx, 659, t0 + 0.08, 0.14, 0.28, "triangle");
            blip(ctx, 784, t0 + 0.16, 0.14, 0.28, "triangle");
            blip(ctx, 1046, t0 + 0.24, 0.22, 0.32, "triangle");
            blip(ctx, 1318, t0 + 0.34, 0.32, 0.34, "triangle");
            noise(ctx, t0 + 0.05, 0.5, 0.07, 5000, 10000);
            break;
          case "badClose":
            blip(ctx, 180, t0, 0.45, 0.32, "sawtooth");
            blip(ctx, 120, t0 + 0.05, 0.4, 0.22, "sawtooth");
            break;
          case "lose":
            blip(ctx, 392, t0, 0.18, 0.22, "triangle");
            blip(ctx, 330, t0 + 0.12, 0.22, 0.22, "triangle");
            blip(ctx, 247, t0 + 0.26, 0.32, 0.24, "triangle");
            break;
        }
      } catch {}
    },
    [ensure, enabled, muted, master, sfxVol],
  );
}

function blip(
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  type: OscillatorType = "triangle",
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.min(0.6, gain), start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function noise(
  ctx: AudioContext,
  start: number,
  dur: number,
  gain: number,
  hpHz: number,
  lpHz: number,
) {
  const size = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / size);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = hpHz;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = lpHz;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(hp).connect(lp).connect(g).connect(ctx.destination);
  src.start(start);
  src.stop(start + dur + 0.02);
}
