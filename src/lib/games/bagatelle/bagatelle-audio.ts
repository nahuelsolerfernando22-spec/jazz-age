let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let visInstalled = false;

function installVisibility() {
  if (visInstalled || typeof document === "undefined") return;
  visInstalled = true;
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    try {
      if (document.visibilityState === "hidden") void ctx.suspend();
      else void ctx.resume();
    } catch {
      /* noop */
    }
  });
}

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx || ctx.state === "closed") {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.35;
      master.connect(ctx.destination);
      installVisibility();
    } catch {
      return null;
    }
  }
  if (ctx?.state === "suspended") void ctx.resume();
  return ctx;
}

function blip(opts: {
  freq: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  sweep?: number;
  delay?: number;
}) {
  if (muted) return;
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.sweep) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freq + opts.sweep), t0 + opts.dur);
  }
  const vol = opts.vol ?? 0.25;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.02);
}

function noiseBurst(dur: number, vol = 0.18) {
  if (muted) return;
  const c = ensure();
  if (!c || !master) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.value = vol;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1200;
  src.connect(filter).connect(gain).connect(master);
  src.start();
}

export const bagatelleAudio = {
  setMuted(v: boolean) {
    muted = v;
    if (master) master.gain.value = v ? 0 : 0.35;
  },
  isMuted() {
    return muted;
  },
  prime() {
    ensure();
  },
  close() {
    if (!ctx) return;
    try {
      void ctx.close();
    } catch {
      /* noop */
    }
    ctx = null;
    master = null;
  },
  bumper() {
    blip({ freq: 520, dur: 0.09, type: "triangle", vol: 0.22, sweep: -180 });
  },
  target() {
    blip({ freq: 880, dur: 0.14, type: "square", vol: 0.18, sweep: 320 });
    blip({ freq: 1320, dur: 0.18, type: "sine", vol: 0.14, delay: 0.02 });
  },
  peg() {
    blip({ freq: 1800, dur: 0.04, type: "sine", vol: 0.08 });
  },
  spinner() {
    blip({ freq: 1100, dur: 0.06, type: "square", vol: 0.1, sweep: 400 });
    blip({ freq: 1600, dur: 0.05, type: "square", vol: 0.08, delay: 0.03, sweep: 300 });
  },
  gong() {
    blip({ freq: 180, dur: 0.55, type: "sine", vol: 0.25, sweep: -60 });
    blip({ freq: 360, dur: 0.45, type: "triangle", vol: 0.14, delay: 0.02, sweep: -80 });
    blip({ freq: 540, dur: 0.35, type: "sine", vol: 0.09, delay: 0.05, sweep: -100 });
  },
  sling() {
    blip({ freq: 240, dur: 0.08, type: "sawtooth", vol: 0.18, sweep: 180 });
  },
  flipper() {
    blip({ freq: 110, dur: 0.06, type: "square", vol: 0.16, sweep: 60 });
  },
  launch() {
    blip({ freq: 220, dur: 0.32, type: "sawtooth", vol: 0.22, sweep: 480 });
  },
  meterTick() {
    blip({ freq: 1400, dur: 0.025, type: "square", vol: 0.06 });
  },
  drain() {
    blip({ freq: 320, dur: 0.45, type: "sine", vol: 0.22, sweep: -240 });
  },
  win() {
    [523, 659, 784].forEach((f, i) =>
      blip({ freq: f, dur: 0.18, type: "triangle", vol: 0.2, delay: i * 0.06 }),
    );
  },
  curse() {
    blip({ freq: 180, dur: 0.5, type: "sawtooth", vol: 0.22, sweep: -90 });
    noiseBurst(0.25, 0.12);
  },
  jackpot() {
    const notes = [523, 659, 784, 1046, 1318, 1568];
    notes.forEach((f, i) =>
      blip({ freq: f, dur: 0.22, type: "triangle", vol: 0.24, delay: i * 0.08 }),
    );
    noiseBurst(0.3, 0.14);
  },
  mission() {
    [880, 1175, 1568].forEach((f, i) =>
      blip({ freq: f, dur: 0.16, type: "sine", vol: 0.22, delay: i * 0.07 }),
    );
  },
  freeBall() {
    [659, 784, 1046].forEach((f, i) =>
      blip({ freq: f, dur: 0.14, type: "triangle", vol: 0.2, delay: i * 0.05 }),
    );
  },
  nudge() {
    blip({ freq: 140, dur: 0.07, type: "square", vol: 0.18, sweep: -30 });
    noiseBurst(0.06, 0.08);
  },
  tilt() {
    blip({ freq: 90, dur: 0.6, type: "sawtooth", vol: 0.28, sweep: -40 });
    noiseBurst(0.35, 0.18);
  },
  litExpire() {
    blip({ freq: 420, dur: 0.18, type: "sine", vol: 0.14, sweep: -180 });
  },
};
