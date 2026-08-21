import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MahjongSettings {
  showAiExplain: boolean;
  autoHintSeconds: number;
  showBestMoveGlow: boolean;
  set: (patch: Partial<Omit<MahjongSettings, "set" | "reset">>) => void;
  reset: () => void;
}

const DEFAULTS = {
  showAiExplain: false,
  autoHintSeconds: 8,
  showBestMoveGlow: false,
};

export const useMahjongSettings = create<MahjongSettings>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set(DEFAULTS),
    }),
    { name: "cuervo:mahjong-settings:v1" },
  ),
);
