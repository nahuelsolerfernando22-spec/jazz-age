import { create } from "zustand";

interface SurrenderState {
  handler: (() => void) | null;
  label: string | null;
  setHandler: (fn: (() => void) | null, label?: string | null) => void;
}

export const useSurrenderStore = create<SurrenderState>((set) => ({
  handler: null,
  label: null,
  setHandler: (fn, label = null) => set({ handler: fn, label }),
}));
