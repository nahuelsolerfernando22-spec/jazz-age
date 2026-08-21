const KEY = "salon:config:v1";

export type SalonConfig = {
  corvinaCameoPct: number;
  wandererBandHours: number;
  wandererCount: 2 | 3;
};

export const DEFAULT_SALON_CONFIG: SalonConfig = {
  corvinaCameoPct: 15,
  wandererBandHours: 2,
  wandererCount: 3,
};

export function getSalonConfig(): SalonConfig {
  if (typeof window === "undefined") return { ...DEFAULT_SALON_CONFIG };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SALON_CONFIG };
    const parsed = JSON.parse(raw) as Partial<SalonConfig>;
    return {
      corvinaCameoPct: clamp(
        parsed.corvinaCameoPct ?? DEFAULT_SALON_CONFIG.corvinaCameoPct,
        0,
        100,
      ),
      wandererBandHours: clamp(
        parsed.wandererBandHours ?? DEFAULT_SALON_CONFIG.wandererBandHours,
        0.25,
        24,
      ),
      wandererCount: parsed.wandererCount === 2 ? 2 : 3,
    };
  } catch {
    return { ...DEFAULT_SALON_CONFIG };
  }
}

export function setSalonConfig(next: Partial<SalonConfig>) {
  if (typeof window === "undefined") return;
  const cur = getSalonConfig();
  const merged: SalonConfig = {
    corvinaCameoPct: clamp(next.corvinaCameoPct ?? cur.corvinaCameoPct, 0, 100),
    wandererBandHours: clamp(next.wandererBandHours ?? cur.wandererBandHours, 0.25, 24),
    wandererCount: (next.wandererCount ?? cur.wandererCount) === 2 ? 2 : 3,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("salon:config-changed"));
  } catch {}
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}
