// Progreso y cobro de los objetivos diarios de "La Mano Muerta".
// Store dedicado (no toca daily-missions.ts) para que cada objetivo se
// pueda reclamar una sola vez por día y persista entre sesiones.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "@/lib/date-keys";
import { useCasino } from "@/store/casino";
import {
  dailyObjectives,
  isObjectiveMet,
  type SolitarioObjective,
} from "@/lib/games/solitario/solitario-objectives";

interface State {
  day: string;
  claimed: string[];
  claim: (
    id: string,
    stats: { won: boolean; moves: number; suitsClosed: number; usedUndo: boolean },
  ) => number;
  isClaimed: (id: string) => boolean;
  reset: () => void;
}

function ensureFreshDay(get: () => State, set: (p: Partial<State>) => void) {
  const today = todayKey();
  if (get().day !== today) {
    set({ day: today, claimed: [] });
  }
}

export const useSolitarioObjectives = create<State>()(
  persist(
    (set, get) => ({
      day: todayKey(),
      claimed: [],
      isClaimed: (id) => {
        ensureFreshDay(get, set);
        return get().claimed.includes(id);
      },
      claim: (id, stats) => {
        ensureFreshDay(get, set);
        if (get().claimed.includes(id)) return 0;
        const objective = dailyObjectives(get().day).find((o) => o.id === id);
        if (!objective) return 0;
        if (!isObjectiveMet(objective, stats)) return 0;
        useCasino.getState().addChips(objective.reward);
        set((s) => ({ claimed: [...s.claimed, id] }));
        return objective.reward;
      },
      reset: () => set({ day: todayKey(), claimed: [] }),
    }),
    { name: "cuervo:solitario-objectives:v1" },
  ),
);

export function todaysSolitarioObjectives(): SolitarioObjective[] {
  return dailyObjectives(todayKey());
}
