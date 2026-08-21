import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SingleDifficulty = "rookie" | "normal" | "sharp";

export const DIFFICULTY_LABEL: Record<SingleDifficulty, string> = {
  rookie: "Novato",
  normal: "Normal",
  sharp: "Filoso",
};

interface State {
  byGame: Record<string, SingleDifficulty>;
  get: (id: string) => SingleDifficulty;
  set: (id: string, d: SingleDifficulty) => void;
}

export const useSingleDifficulty = create<State>()(
  persist(
    (set) => ({
      byGame: {},
      get: (_id) => "sharp",
      set: (_id, _d) => {
        set((s) => s);
      },
    }),
    { name: "cuervo:single-difficulty", version: 2 },
  ),
);

export function currentDifficulty(_id: string): SingleDifficulty {
  return "sharp";
}
