/**
 * Golpe de carta contra la mesa ("hachazo").
 *
 * Sintetizado con WebAudio en vez de un archivo: no suma peso al APK y suena
 * igual sin conexión. Dos capas — un golpe grave de madera y un chasquido
 * corto de papel — con una variante fuerte para las cartas matadoras.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

interface SlamOpts {
  muted?: boolean;
  master?: number;
  sfx?: number;
  heavy?: boolean;
}

export function playCardSlam(opts: SlamOpts = {}) {
  if (opts.muted) return;
  const ac = getCtx();
  if (!ac) return;
  const gain = Math.max(0, Math.min(1, (opts.master ?? 1) * (opts.sfx ?? 1)));
  if (gain <= 0) return;

  const heavy = !!opts.heavy;
  const t0 = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = gain * (heavy ? 0.5 : 0.3);
  out.connect(ac.destination);

  try {
    // Golpe grave: la madera de la mesa.
    const thump = ac.createOscillator();
    const thumpGain = ac.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(heavy ? 150 : 190, t0);
    thump.frequency.exponentialRampToValueAtTime(heavy ? 42 : 60, t0 + 0.12);
    thumpGain.gain.setValueAtTime(0.0001, t0);
    thumpGain.gain.exponentialRampToValueAtTime(1, t0 + 0.006);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t0 + (heavy ? 0.26 : 0.16));
    thump.connect(thumpGain).connect(out);
    thump.start(t0);
    thump.stop(t0 + 0.3);

    // Chasquido: el papel al apoyarse.
    const dur = heavy ? 0.09 : 0.06;
    const frames = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, frames, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2.6);
    }
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const band = ac.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = heavy ? 1800 : 2400;
    band.Q.value = 0.8;
    const noiseGain = ac.createGain();
    noiseGain.gain.value = heavy ? 0.55 : 0.4;
    noise.connect(band).connect(noiseGain).connect(out);
    noise.start(t0);
  } catch {
    /* audio no disponible */
  }
}
