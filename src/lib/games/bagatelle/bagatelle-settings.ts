const KEY = "cuervo:bagatelle:meter:v1";
const EVENT = "cuervo:bagatelle:meter:changed";

export interface BagatelleMeterSettings {
  sensitivity: number;
  hapticsEnabled: boolean;
  showLiveForce: boolean;
}

const DEFAULTS: BagatelleMeterSettings = {
  sensitivity: 0.5,
  hapticsEnabled: true,
  showLiveForce: true,
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

export function loadMeterSettings(): BagatelleMeterSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<BagatelleMeterSettings>;
    return {
      sensitivity: clamp01(parsed.sensitivity ?? DEFAULTS.sensitivity),
      hapticsEnabled: parsed.hapticsEnabled ?? DEFAULTS.hapticsEnabled,
      showLiveForce: parsed.showLiveForce ?? DEFAULTS.showLiveForce,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveMeterSettings(patch: Partial<BagatelleMeterSettings>): BagatelleMeterSettings {
  const next = { ...loadMeterSettings(), ...patch };
  next.sensitivity = clamp01(next.sensitivity);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
    } catch {}
  }
  return next;
}

export function sensitivityToSweepSpeed(sensitivity: number): number {
  const s = clamp01(sensitivity);
  return 2.6 - s * 1.9;
}

export const METER_EVENT = EVENT;
