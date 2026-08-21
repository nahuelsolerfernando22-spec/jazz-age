const NOTE_BY_PATH: Record<string, number> = {
  "/ruleta": 523.25, // C5
  "/blackjack": 587.33, // D5
  "/dados": 659.25, // E5
  "/truco": 783.99, // G5
  "/chinchon": 880.0, // A5
  "/solitario": 987.77, // B5
  "/bagatelle": 622.25, // D#5
  "/escoba": 830.61, // G#5
  "/mahjong": 554.37, // C#5
};

function noteFor(path: string): number | null {
  if (NOTE_BY_PATH[path] !== undefined) return NOTE_BY_PATH[path];
  for (const key of Object.keys(NOTE_BY_PATH)) {
    if (path.startsWith(key + "/")) {
      return NOTE_BY_PATH[key];
    }
  }
  return null;
}

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
  return ctx;
}

interface Opts {
  muted?: boolean;
  master?: number;
  sfx?: number;
}

export function playRoomStinger(path: string, opts: Opts = {}) {
  if (opts.muted) return;
  const freq = noteFor(path);
  if (freq === null) return;
  const ac = getCtx();
  if (!ac) return;

  const vol = Math.max(0, Math.min(1, (opts.master ?? 1) * (opts.sfx ?? 1))) * 0.35;
  if (vol <= 0.001) return;

  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(vol, now + 0.008);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  const shelf = ac.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 3200;
  shelf.gain.value = -6;
  shelf.connect(master);
  master.connect(ac.destination);

  const partials = [
    { mult: 1.0, gain: 1.0, decay: 0.55 },
    { mult: 2.0, gain: 0.35, decay: 0.42 },
    { mult: 2.76, gain: 0.18, decay: 0.3 }, // parcial inarmónico tipo campana
    { mult: 4.0, gain: 0.08, decay: 0.22 },
  ];
  for (const p of partials) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * p.mult;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(p.gain, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
    osc.connect(g).connect(shelf);
    osc.start(now);
    osc.stop(now + p.decay + 0.05);
  }

  const bufSize = Math.floor(ac.sampleRate * 0.04);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const nf = ac.createBiquadFilter();
  nf.type = "bandpass";
  nf.frequency.value = freq * 3;
  nf.Q.value = 4;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.25, now);
  ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  noise.connect(nf).connect(ng).connect(shelf);
  noise.start(now);
  noise.stop(now + 0.06);
}
