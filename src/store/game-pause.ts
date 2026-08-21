import { create } from "zustand";

interface GamePauseState {
  paused: boolean;
  setPaused: (v: boolean) => void;
  requestPause: () => void;
  resume: () => void;
}

export const useGamePause = create<GamePauseState>((set) => ({
  paused: false,
  setPaused: (v) => set({ paused: v }),
  requestPause: () => set({ paused: true }),
  resume: () => set({ paused: false }),
}));
