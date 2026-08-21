import { useCallback, useEffect, useRef } from "react";

export function useSlotAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const dryRef = useRef<GainNode | null>(null);
  const wetRef = useRef<GainNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const mutedRef = useRef<boolean>(false);
  const reelStopCountRef = useRef<number>(0);

  const buildImpulse = (ctx: AudioContext) => {
    const sr = ctx.sampleRate;
    const length = Math.floor(sr * 0.38);
    const buf = ctx.createBuffer(2, length, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;

        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6) * (0.85 + ch * 0.1);
      }
    }
    return buf;
  };

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (mutedRef.current) return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = 0.34;
      master.connect(ctx.destination);

      const dry = ctx.createGain();
      dry.gain.value = 1.0;
      const wet = ctx.createGain();
      wet.gain.value = 0.16;
      const conv = ctx.createConvolver();
      conv.buffer = buildImpulse(ctx);
      dry.connect(master);
      wet.connect(conv).connect(master);

      ctxRef.current = ctx;
      masterRef.current = master;
      dryRef.current = dry;
      wetRef.current = wet;
      convolverRef.current = conv;
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("speakeasy-muted");
      mutedRef.current = stored === "1";
    } catch {}
  }, []);

  const setMuted = useCallback((m: boolean) => {
    mutedRef.current = m;
    try {
      localStorage.setItem("speakeasy-muted", m ? "1" : "0");
    } catch {}
    const ctx = ctxRef.current;
    if (m && masterRef.current && ctx) {
      masterRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    } else if (!m && masterRef.current && ctx) {
      masterRef.current.gain.setTargetAtTime(0.34, ctx.currentTime, 0.05);
    }
  }, []);

  const isMuted = useCallback(() => mutedRef.current, []);

  const destFor = (sendWet = false): AudioNode | null => {
    if (sendWet && wetRef.current && dryRef.current) {
      return dryRef.current;
    }
    return dryRef.current;
  };

  const play = useCallback(
    (opts: {
      freq: number;
      durationMs: number;
      type?: OscillatorType;
      gain?: number;
      delayMs?: number;
      attackMs?: number;
      detune?: number;
      sweepTo?: number;
      sweepCurve?: "linear" | "exp";
      filterHz?: number;
      filterType?: BiquadFilterType;
      reverb?: number;
    }) => {
      const ctx = getCtx();
      if (!ctx || !dryRef.current || !wetRef.current) return;
      const start = ctx.currentTime + (opts.delayMs ?? 0) / 1000;
      const dur = opts.durationMs / 1000;
      const attack = Math.max(0.002, (opts.attackMs ?? 5) / 1000);
      const osc = ctx.createOscillator();
      osc.type = opts.type ?? "sine";
      osc.frequency.setValueAtTime(opts.freq, start);
      if (opts.detune) osc.detune.value = opts.detune;
      if (opts.sweepTo !== undefined) {
        if (opts.sweepCurve === "linear") {
          osc.frequency.linearRampToValueAtTime(opts.sweepTo, start + dur);
        } else {
          osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.sweepTo), start + dur);
        }
      }
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(opts.gain ?? 0.3, start + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      let tail: AudioNode = g;
      if (opts.filterHz) {
        const f = ctx.createBiquadFilter();
        f.type = opts.filterType ?? "lowpass";
        f.frequency.value = opts.filterHz;
        f.Q.value = 0.7;
        g.connect(f);
        tail = f;
      }
      osc.connect(g);
      tail.connect(dryRef.current);
      if (opts.reverb && opts.reverb > 0) {
        const send = ctx.createGain();
        send.gain.value = opts.reverb;
        tail.connect(send).connect(wetRef.current);
      }
      osc.start(start);
      osc.stop(start + dur + 0.05);
    },
    [getCtx],
  );

  const noise = useCallback(
    (opts: {
      durationMs: number;
      gain?: number;
      delayMs?: number;
      filterHz?: number;
      filterType?: BiquadFilterType;
      Q?: number;
      reverb?: number;
    }) => {
      const ctx = getCtx();
      if (!ctx || !dryRef.current || !wetRef.current) return;
      const start = ctx.currentTime + (opts.delayMs ?? 0) / 1000;
      const dur = opts.durationMs / 1000;
      const sr = ctx.sampleRate;
      const len = Math.max(64, Math.floor(sr * dur));
      const buf = ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = opts.filterType ?? "bandpass";
      f.frequency.value = opts.filterHz ?? 1200;
      f.Q.value = opts.Q ?? 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(opts.gain ?? 0.25, start + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      src.connect(f).connect(g).connect(dryRef.current);
      if (opts.reverb && opts.reverb > 0) {
        const send = ctx.createGain();
        send.gain.value = opts.reverb;
        g.connect(send).connect(wetRef.current);
      }
      src.start(start);
      src.stop(start + dur + 0.05);
    },
    [getCtx],
  );

  const leverClick = useCallback(() => {
    if (!getCtx()) return;

    play({ freq: 130, sweepTo: 70, durationMs: 180, type: "square", gain: 0.22, filterHz: 480 });

    play({ freq: 1100, sweepTo: 220, durationMs: 90, type: "triangle", gain: 0.28 });

    noise({ durationMs: 120, gain: 0.18, filterHz: 2400, filterType: "highpass", Q: 0.8 });

    play({ freq: 90, durationMs: 220, type: "sine", gain: 0.14, delayMs: 30, filterHz: 320 });
  }, [getCtx, play, noise]);

  const leverLatch = useCallback(() => {
    if (!getCtx()) return;
    play({ freq: 1700, sweepTo: 380, durationMs: 70, type: "triangle", gain: 0.24 });
    noise({ durationMs: 60, gain: 0.12, filterHz: 3600, filterType: "highpass", Q: 1.4 });
    play({ freq: 200, durationMs: 60, type: "square", gain: 0.16 });
  }, [getCtx, play, noise]);

  const reelStop = useCallback(
    (delayMs = 0) => {
      if (!getCtx()) return;
      const idx = reelStopCountRef.current % 3;
      reelStopCountRef.current += 1;
      const pitchShift = idx * 35;

      play({
        freq: 380 + pitchShift,
        sweepTo: 110,
        durationMs: 110,
        type: "triangle",
        gain: 0.24,
        delayMs,
      });

      play({
        freq: 120,
        durationMs: 130,
        type: "square",
        gain: 0.18,
        delayMs,
        filterHz: 360,
      });

      noise({
        durationMs: 45,
        gain: 0.15,
        delayMs: delayMs + 4,
        filterHz: 4200,
        filterType: "bandpass",
        Q: 2.5,
      });

      if (idx === 2) {
        play({
          freq: 2400,
          durationMs: 55,
          type: "sine",
          gain: 0.1,
          delayMs: delayMs + 8,
          reverb: 0.5,
        });
      }
    },
    [getCtx, play, noise],
  );

  const nearMiss = useCallback(() => {
    if (!getCtx()) return;
    play({
      freq: 180,
      sweepTo: 70,
      durationMs: 700,
      type: "sawtooth",
      gain: 0.18,
      attackMs: 80,
      filterHz: 380,
    });

    play({
      freq: 250,
      sweepTo: 175,
      durationMs: 700,
      type: "triangle",
      gain: 0.1,
      attackMs: 80,
      detune: -10,
    });

    play({ freq: 55, durationMs: 850, type: "sine", gain: 0.22, attackMs: 120 });

    noise({ durationMs: 700, gain: 0.06, filterHz: 600, filterType: "lowpass", Q: 0.6 });
  }, [getCtx, play, noise]);

  const win = useCallback(() => {
    if (!getCtx()) return;

    const notes = [
      { f: 523.25, d: 800, t: 0, g: 0.3 },
      { f: 659.25, d: 800, t: 50, g: 0.26 },
      { f: 783.99, d: 850, t: 110, g: 0.24 },
      { f: 1046.5, d: 750, t: 180, g: 0.18 },
    ];
    notes.forEach((n) => {
      play({
        freq: n.f,
        durationMs: n.d,
        type: "sine",
        gain: n.g,
        delayMs: n.t,
        attackMs: 12,
        reverb: 0.45,
      });

      play({
        freq: n.f * 0.5,
        durationMs: n.d * 0.6,
        type: "triangle",
        gain: n.g * 0.35,
        delayMs: n.t,
        attackMs: 8,
        reverb: 0.3,
      });
    });

    play({ freq: 1568, durationMs: 600, type: "sine", gain: 0.12, delayMs: 320, reverb: 0.6 });
    play({ freq: 2093, durationMs: 500, type: "sine", gain: 0.09, delayMs: 380, reverb: 0.6 });

    noise({
      durationMs: 80,
      gain: 0.18,
      filterHz: 4500,
      filterType: "bandpass",
      Q: 3,
      reverb: 0.3,
    });
  }, [getCtx, play, noise]);

  const jackpot = useCallback(() => {
    if (!getCtx()) return;

    play({
      freq: 70,
      sweepTo: 38,
      durationMs: 380,
      type: "sine",
      gain: 0.42,
      attackMs: 4,
    });
    noise({ durationMs: 280, gain: 0.18, filterHz: 220, filterType: "lowpass", Q: 0.7 });

    const fanfare = [
      { f: 523.25, d: 200, t: 80 },
      { f: 659.25, d: 200, t: 220 },
      { f: 783.99, d: 200, t: 360 },
      { f: 1046.5, d: 380, t: 500 },
      { f: 1318.5, d: 1000, t: 780 },
    ];
    fanfare.forEach((n) => {
      play({
        freq: n.f,
        durationMs: n.d,
        type: "triangle",
        gain: 0.3,
        delayMs: n.t,
        attackMs: 10,
        reverb: 0.55,
      });

      play({
        freq: n.f * 0.667,
        durationMs: n.d,
        type: "sine",
        gain: 0.16,
        delayMs: n.t,
        attackMs: 10,
        reverb: 0.45,
      });
    });

    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      play({
        freq: f,
        durationMs: 1400,
        type: "sine",
        gain: 0.18,
        delayMs: 800 + i * 30,
        attackMs: 80,
        reverb: 0.7,
      });
    });

    [2093, 2637, 3136].forEach((f, i) => {
      play({
        freq: f,
        durationMs: 1500,
        type: "sine",
        gain: 0.08,
        delayMs: 900 + i * 80,
        attackMs: 60,
        reverb: 0.8,
      });
    });

    for (let i = 0; i < 14; i++) {
      noise({
        durationMs: 70,
        gain: 0.1 + Math.random() * 0.1,
        delayMs: 600 + i * 80 + Math.random() * 60,
        filterHz: 3500 + Math.random() * 2500,
        filterType: "bandpass",
        Q: 4,
        reverb: 0.4,
      });
    }
  }, [getCtx, play, noise]);

  return { leverClick, leverLatch, reelStop, nearMiss, win, jackpot, setMuted, isMuted };
}
