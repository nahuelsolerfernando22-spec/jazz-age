import { create } from "zustand";
import { persist } from "zustand/middleware";
import { drawMahjongPresagio, type MahjongPresagio } from "@/lib/games/mahjong/mahjong-presagios";
import { LEVELS, runRouteIds, setLayoutVariant } from "@/lib/games/mahjong/mahjong-levels";

export interface MahjongRelic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface MahjongRunState {
  active: boolean;
  floor: number;
  maxFloor: number;
  currentLevelId: string;
  /** Recorrido sorteado de esta vigilia (un tablero por piso). */
  route: string[];
  relics: MahjongRelic[];
  presagios: MahjongPresagio[];
  hp: number;
  maxHp: number;
  xp: number;
  seed: string;
  /** La Medalla de Latón ya perdonó una derrota en esta vigilia. */
  graciaUsada: boolean;

  startRun: (seed?: string) => void;
  nextFloor: () => void;
  takeDamage: (amt: number) => void;
  addRelic: (relic: MahjongRelic) => void;
  /** Cobra una derrota: devuelve true si la Medalla de Latón la perdonó. */
  cobrarDerrota: () => boolean;
  endRun: () => void;
}

export const useMahjongRun = create<MahjongRunState>()(
  persist(
    (set, get) => ({
      active: false,
      floor: 1,
      maxFloor: 10,
      currentLevelId: LEVELS[0].id,
      route: [],
      relics: [],
      presagios: [],
      hp: 3,
      maxHp: 3,
      xp: 0,
      seed: "",
      graciaUsada: false,

      startRun: (seed) => {
        const s0 = seed || Math.random().toString(36).substring(7);
        const route = runRouteIds(s0, 10);
        setLayoutVariant(s0);
        set({
          active: true,
          floor: 1,
          route,
          currentLevelId: route[0] ?? LEVELS[0].id,
          relics: [],
          presagios: [drawMahjongPresagio()],
          hp: 3,
          maxHp: 3,
          xp: 0,
          graciaUsada: false,
          seed: s0,
        });
      },

      nextFloor: () =>
        set((s) => {
          const nextId =
            s.route[s.floor] ?? LEVELS[Math.min(LEVELS.length - 1, s.floor)].id;
          return {
            floor: s.floor + 1,
            currentLevelId: nextId,
            presagios: [...s.presagios, drawMahjongPresagio()],
          };
        }),

      takeDamage: (amt) =>
        set((s) => ({
          hp: Math.max(0, s.hp - amt),
          active: s.hp - amt > 0,
        })),

      addRelic: (relic) =>
        set((s) => ({
          relics: [...s.relics, relic],
        })),

      cobrarDerrota: () => {
        const s = get();
        if (!s.active) return false;
        const tieneMedalla = s.relics.some((r) => r.id === "medalla-laton");
        if (tieneMedalla && !s.graciaUsada) {
          set({ graciaUsada: true });
          return true;
        }
        const hp = Math.max(0, s.hp - 1);
        set({ hp, active: hp > 0 });
        return false;
      },

      endRun: () => set({ active: false }),
    }),
    {
      name: "cuervo-dorado:mahjong:run:v2",
      onRehydrateStorage: () => (state) => {
        // Al retomar una vigilia guardada se restaura su trazado espejado.
        if (state?.active && state.seed) setLayoutVariant(state.seed);
      },
    },
  ),
);
