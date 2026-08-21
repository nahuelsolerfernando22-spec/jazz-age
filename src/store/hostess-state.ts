import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SickSeverity = "leve" | "fuerte";
export type EnergyPhase = "fresca" | "normal" | "impaciente" | "agotada";

export interface HostessDynState {
  sick: { active: boolean; since: number; until: number; severity: SickSeverity } | null;
  lastTickAt: number;
  walkoutUntil: number | null;
}

interface Store {
  byId: Record<string, HostessDynState>;
  setSick: (id: string, s: HostessDynState["sick"]) => void;
  setTick: (id: string, at: number) => void;
  setWalkout: (id: string, until: number | null) => void;
}

export const useHostessState = create<Store>()(
  persist(
    (set) => ({
      byId: {},
      setSick: (id, s) =>
        set((st) => ({
          byId: {
            ...st.byId,
            [id]: {
              ...(st.byId[id] ?? { sick: null, lastTickAt: 0, walkoutUntil: null }),
              sick: s,
            },
          },
        })),
      setTick: (id, at) =>
        set((st) => ({
          byId: {
            ...st.byId,
            [id]: {
              ...(st.byId[id] ?? { sick: null, lastTickAt: 0, walkoutUntil: null }),
              lastTickAt: at,
            },
          },
        })),
      setWalkout: (id, until) =>
        set((st) => ({
          byId: {
            ...st.byId,
            [id]: {
              ...(st.byId[id] ?? { sick: null, lastTickAt: 0, walkoutUntil: null }),
              walkoutUntil: until,
            },
          },
        })),
    }),
    { name: "hostess-dyn-state:v1" },
  ),
);
