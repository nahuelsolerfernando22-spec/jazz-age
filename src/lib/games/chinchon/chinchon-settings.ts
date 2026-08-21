import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChinchonSettings {
  secondLivesAllowed: number;
  allowSecondLifeOnChinchon: boolean;
  showAiExplain: boolean;
  set: (patch: Partial<Omit<ChinchonSettings, "set" | "reset">>) => void;
  reset: () => void;
}

const DEFAULTS = {
  secondLivesAllowed: 1,
  allowSecondLifeOnChinchon: false,
  showAiExplain: false,
};

export const useChinchonSettings = create<ChinchonSettings>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set(DEFAULTS),
    }),
    {
      name: "cuervo:chinchon-settings:v1",
      version: 2,
      migrate: (persisted: unknown) => {
        const p = (persisted ?? {}) as Partial<ChinchonSettings>;
        return { ...DEFAULTS, ...p, showAiExplain: false } as ChinchonSettings;
      },
    },
  ),
);
