import { useEffect, useRef } from "react";

export function useMahjongSfx({
  tick,
  delta,
  combo = 0,
  group = null,
  enabled = true,
}: {
  tick: number;
  delta: number;
  combo?: number;
  group?: string | null;
  enabled?: boolean;
}) {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (tick === 0 || tick === lastTickRef.current) return;
    lastTickRef.current = tick;

    try {
      if (!ctxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new Ctx();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const step = Math.min(6, Math.max(0, combo - 1));
      const pitch = Math.pow(2, step / 12);
      const gainBoost = 1 + step * 0.04;

      const isSpecial = delta >= 60;
      if (isSpecial) playSpecial(ctx, pitch, gainBoost, group);
      else playPair(ctx, pitch, gainBoost);
    } catch {}
  }, [tick, delta, combo, enabled, group]);

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
}

function playPair(ctx: AudioContext, pitch: number, gb: number) {
  const t0 = ctx.currentTime;
  blip(ctx, 784 * pitch, t0, 0.18, 0.25 * gb);
  blip(ctx, 1046.5 * pitch, t0 + 0.07, 0.18, 0.32 * gb);
}

const GROUP_CHORDS: Record<string, number[]> = {
  bebidas: [880, 1108.7, 1318.5, 1760],
  vicios: [739.99, 932.33, 1108.7, 1479.98],
  armas: [523.25, 659.25, 783.99, 1046.5],
  tesoros: [1046.5, 1318.5, 1568, 2093],
  joyas: [987.77, 1244.5, 1479.98, 1975.5],
  suerte: [830.6, 1046.5, 1244.5, 1661.2],
  mascaras: [622.25, 830.6, 987.77, 1244.5],
  sombras: [415.3, 622.25, 830.6, 1108.7],
  reliquias: [698.46, 880, 1046.5, 1396.9],
  pecados: [466.16, 587.33, 698.46, 932.33],
};
function playSpecial(ctx: AudioContext, pitch: number, gb: number, group: string | null) {
  const t0 = ctx.currentTime;
  const chord = (group && GROUP_CHORDS[group]) || GROUP_CHORDS.tesoros;
  chord.forEach((freq, i) => {
    blip(ctx, freq * pitch, t0 + i * 0.04, 0.24, (0.34 - i * 0.04) * gb);
  });
  noiseShimmer(ctx, t0 + 0.02, 0.35, gb);
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

function noiseShimmer(ctx: AudioContext, start: number, dur: number, gb: number) {
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 4500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(Math.min(0.18, 0.08 * gb), start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(start);
  src.stop(start + dur + 0.02);
}
