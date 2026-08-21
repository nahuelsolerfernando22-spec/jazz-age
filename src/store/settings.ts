import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setLowPowerOverride } from "@/lib/low-power";

interface SettingsState {
  muted: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  bagatelleSfxVolume: number;

  reduceMotion: boolean;
  screenShake: boolean;
  hapticFeedback: boolean;
  showSubtitles: boolean;
  subtitleSize: "sm" | "md" | "lg";
  colorblindMode: "off" | "protan" | "deutan" | "tritan";
  analyticsEnabled: boolean;
  highContrast: boolean;
  noirIntensity: number;
  filmGrain: boolean;
  /** Aviso local cuando ascendés de liga al cierre de la jornada (04:00). */
  leagueNotifications: boolean;
  lowPowerMode: "auto" | "on" | "off";

  uiScale: number;
  hudScale: number;
  leftHanded: boolean;
  oneHandMode: boolean;

  mahjongTileScale: number; // 0.8..1.6 zoom del tablero de Mahjong
  // Resaltado verde de la pareja disponible: nunca / recién tras unos segundos / siempre
  mahjongMatchHint: "off" | "delay" | "always";
  // Intensidad del titileo/animaciones al seleccionar fichas en Mahjong
  mahjongSelectFx: "full" | "reducido" | "off";

  roomScrim: "bajo" | "medio" | "alto";

  a11yMode: boolean;
  fontScale: number;

  setMuted: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  setBagatelleSfxVolume: (v: number) => void;
  setReduceMotion: (v: boolean) => void;
  setScreenShake: (v: boolean) => void;
  setHapticFeedback: (v: boolean) => void;
  setShowSubtitles: (v: boolean) => void;
  setSubtitleSize: (v: "sm" | "md" | "lg") => void;
  setColorblindMode: (v: "off" | "protan" | "deutan" | "tritan") => void;
  setAnalyticsEnabled: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setNoirIntensity: (v: number) => void;
  setFilmGrain: (v: boolean) => void;
  setLeagueNotifications: (v: boolean) => void;
  setLowPowerMode: (v: "auto" | "on" | "off") => void;
  setUiScale: (v: number) => void;
  setHudScale: (v: number) => void;
  setLeftHanded: (v: boolean) => void;
  setOneHandMode: (v: boolean) => void;
  setMahjongTileScale: (v: number) => void;
  setMahjongMatchHint: (v: "off" | "delay" | "always") => void;
  setMahjongSelectFx: (v: "full" | "reducido" | "off") => void;
  setRoomScrim: (v: "bajo" | "medio" | "alto") => void;
  setA11yMode: (v: boolean) => void;
  setFontScale: (v: number) => void;
  resetDefaults: () => void;
}

const DEFAULTS = {
  muted: false,
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.9,
  voiceVolume: 1,
  bagatelleSfxVolume: 1,

  reduceMotion: false,
  screenShake: true,
  hapticFeedback: true,
  showSubtitles: true,
  subtitleSize: "md" as const,
  colorblindMode: "off" as const,
  analyticsEnabled: false,
  highContrast: false,
  noirIntensity: 0.5,
  filmGrain: true,
  leagueNotifications: true,
  lowPowerMode: "auto" as const,

  uiScale: 1,
  hudScale: 1,
  leftHanded: false,
  oneHandMode: false,

  mahjongTileScale: 1,
  mahjongMatchHint: "delay" as const,
  mahjongSelectFx: "reducido" as const,

  roomScrim: "alto" as const,

  a11yMode: false,
  fontScale: 1,
};

function syncLegacyMuted(muted: boolean) {
  try {
    localStorage.setItem("speakeasy-muted", muted ? "1" : "0");
  } catch {}
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setMuted: (v) => {
        syncLegacyMuted(v);
        set({ muted: v });
      },
      setMasterVolume: (v) => set({ masterVolume: clamp(v, 0, 1) }),
      setMusicVolume: (v) => set({ musicVolume: clamp(v, 0, 1) }),
      setSfxVolume: (v) => set({ sfxVolume: clamp(v, 0, 1) }),
      setVoiceVolume: (v) => set({ voiceVolume: clamp(v, 0, 1) }),
      setBagatelleSfxVolume: (v) => set({ bagatelleSfxVolume: clamp(v, 0, 1) }),

      setReduceMotion: (v) => set({ reduceMotion: v }),
      setScreenShake: (v) => set({ screenShake: v }),
      setHapticFeedback: (v) => set({ hapticFeedback: v }),
      setShowSubtitles: (v) => set({ showSubtitles: v }),
      setSubtitleSize: (v) => set({ subtitleSize: v }),
      setColorblindMode: (v) => set({ colorblindMode: v }),
      setAnalyticsEnabled: (v) => set({ analyticsEnabled: v }),
      setLeagueNotifications: (v) => set({ leagueNotifications: v }),
      setUiScale: (v) => set({ uiScale: clamp(v, 0.85, 1.3) }),
      setHudScale: (v) => set({ hudScale: clamp(v, 0.85, 1.35) }),
      setLeftHanded: (v) => set({ leftHanded: v }),
      setOneHandMode: (v) => {
        if (typeof document !== "undefined") {
          document.documentElement.dataset.oneHand = v ? "1" : "0";
        }
        set({ oneHandMode: v });
      },
      setMahjongTileScale: (v) => set({ mahjongTileScale: clamp(v, 0.8, 1.6) }),
      setMahjongMatchHint: (v) => set({ mahjongMatchHint: v }),
      setMahjongSelectFx: (v) => set({ mahjongSelectFx: v }),
      setRoomScrim: (_v) => {
        applyRoomScrim("alto");
        set({ roomScrim: "alto" });
      },
      setA11yMode: (v) => {
        applyA11yMode(v);
        set({ a11yMode: v });
      },
      setFontScale: (v) => {
        const cl = clamp(v, 0.9, 1.5);
        applyFontScale(cl);
        set({ fontScale: cl });
      },
      setHighContrast: (v) => {
        if (typeof document !== "undefined") {
          document.documentElement.dataset.highContrast = v ? "1" : "0";
        }
        set({ highContrast: v });
      },
      setNoirIntensity: (v) => {
        const val = clamp(v, 0, 1);
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty("--noir-intensity", String(val));
        }
        set({ noirIntensity: val });
      },
      setFilmGrain: (v) => {
        if (typeof document !== "undefined") {
          document.documentElement.dataset.filmGrain = v ? "1" : "0";
        }
        set({ filmGrain: v });
      },
      setLowPowerMode: (v) => {
        setLowPowerOverride(v === "auto" ? null : v === "on");
        set({ lowPowerMode: v });
      },

      resetDefaults: () => {
        syncLegacyMuted(DEFAULTS.muted);
        set({ ...DEFAULTS });
      },
    }),
    {
      name: "speakeasy-settings-v1",
      onRehydrateStorage: () => (state) => {
        if (state) syncLegacyMuted(state.muted);
        if (state && typeof document !== "undefined") {
          state.roomScrim = "alto";
          applyVisualSettings(state);
          applyRoomScrim("alto");
          applyA11yMode(state.a11yMode ?? false);
          applyFontScale(state.fontScale ?? 1);

          // Apply new settings
          document.documentElement.style.setProperty(
            "--noir-intensity",
            String(state.noirIntensity ?? 0.5),
          );
          document.documentElement.dataset.filmGrain = state.filmGrain ? "1" : "0";
        }
      },
    },
  ),
);

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function applyVisualSettings(
  s: Pick<SettingsState, "reduceMotion"> & {
    colorblindMode?: SettingsState["colorblindMode"];
    subtitleSize?: SettingsState["subtitleSize"];
    uiScale?: number;
    hudScale?: number;
    leftHanded?: boolean;
    highContrast?: boolean;
    lowPowerMode?: SettingsState["lowPowerMode"];
    oneHandMode?: boolean;
    noirIntensity?: number;
    filmGrain?: boolean;
  },
) {
  if (typeof s.highContrast === "boolean" && typeof document !== "undefined") {
    document.documentElement.dataset.highContrast = s.highContrast ? "1" : "0";
  }
  if (s.lowPowerMode) {
    setLowPowerOverride(s.lowPowerMode === "auto" ? null : s.lowPowerMode === "on");
  }

  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.reduceMotion = s.reduceMotion ? "1" : "0";
  if (s.colorblindMode) root.dataset.colorblind = s.colorblindMode;
  if (s.subtitleSize) {
    const scale = s.subtitleSize === "sm" ? "0.9" : s.subtitleSize === "lg" ? "1.25" : "1";
    root.style.setProperty("--subtitle-scale", scale);
  }
  if (typeof s.uiScale === "number") {
    root.style.setProperty("--ui-scale", String(s.uiScale));
  }
  if (typeof s.hudScale === "number") {
    root.style.setProperty("--hud-scale", String(s.hudScale));
  }
  if (typeof s.leftHanded === "boolean") {
    root.dataset.handed = s.leftHanded ? "left" : "right";
  }
  if (typeof s.oneHandMode === "boolean") {
    root.dataset.oneHand = s.oneHandMode ? "1" : "0";
  }

  if (typeof s.noirIntensity === "number") {
    root.style.setProperty("--noir-intensity", String(s.noirIntensity));
  }
  if (typeof s.filmGrain === "boolean") {
    root.dataset.filmGrain = s.filmGrain ? "1" : "0";
  }
}

export const ROOM_SCRIM_LEVELS: Record<
  "bajo" | "medio" | "alto",
  { center: number; bottom: number; radial: number }
> = {
  bajo: { center: 0.22, bottom: 0.22, radial: 65 },
  medio: { center: 0.4, bottom: 0.38, radial: 58 },
  alto: { center: 0.6, bottom: 0.55, radial: 48 },
};

export function applyRoomScrim(level: "bajo" | "medio" | "alto") {
  if (typeof document === "undefined") return;
  const cfg = ROOM_SCRIM_LEVELS[level] ?? ROOM_SCRIM_LEVELS.medio;
  const root = document.documentElement;
  root.style.setProperty("--room-scrim-alpha", String(cfg.center));
  root.style.setProperty("--room-scrim-alpha-bottom", String(cfg.bottom));
  root.style.setProperty("--room-scrim-radial-stop", `${cfg.radial}%`);
  root.dataset.roomScrim = level;
}

export function applyA11yMode(on: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.a11y = on ? "1" : "0";
}

export function applyFontScale(scale: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--font-scale", String(scale));
}
