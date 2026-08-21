import { create } from "zustand";
import { persist } from "zustand/middleware";
import { configOla, favoresDeRun, OLAS_TOTALES, type OlaConfig } from "@/lib/sindicato-run";
import { useFavors } from "@/store/favors";

export type RunStatus = "idle" | "playing" | "reward" | "dead" | "won";

interface SyndicateRunState {
  seed: string;
  status: RunStatus;
  /** oleada en curso (1..OLAS_TOTALES) */
  ola: number;
  olasSuperadas: number;
  talismanes: string[];
  naipes: string[];
  vidas: number;
  ultimaRecompensa: number;

  startRun: (seed?: string) => void;
  /** superó la oleada: ofrece botín o cierra la noche */
  ganarOla: () => void;
  /** lo eliminaron: gasta vida o termina la noche */
  perderRun: () => void;
  takeTalisman: (id: string) => void;
  takeNaipe: (id: string) => void;
  avanzarOla: () => void;
  abandonRun: () => void;
  reset: () => void;
}

const INICIAL = {
  status: "idle" as RunStatus,
  ola: 1,
  olasSuperadas: 0,
  talismanes: [] as string[],
  naipes: [] as string[],
  vidas: 1,
  ultimaRecompensa: 0,
};

export const useSyndicateRun = create<SyndicateRunState>()(
  persist(
    (set, get) => ({
      seed: "",
      ...INICIAL,

      startRun: (seed) =>
        set({
          seed: seed ?? `${Date.now()}`,
          ...INICIAL,
          status: "playing",
        }),

      ganarOla: () => {
        const { ola, olasSuperadas } = get();
        const superadas = olasSuperadas + 1;
        if (ola >= OLAS_TOTALES) {
          const premio = favoresDeRun(superadas, true);
          useFavors.getState().earn(premio, "other");
          set({ status: "won", olasSuperadas: superadas, ultimaRecompensa: premio });
          return;
        }
        set({ status: "reward", olasSuperadas: superadas });
      },

      perderRun: () => {
        const { vidas, olasSuperadas, talismanes } = get();
        if (vidas > 0 && talismanes.includes("cuervo-embalsamado")) {
          set({
            vidas: vidas - 1,
            talismanes: talismanes.filter((t) => t !== "cuervo-embalsamado"),
            status: "playing",
          });
          return;
        }
        const premio = favoresDeRun(olasSuperadas, false);
        if (premio > 0) useFavors.getState().earn(premio, "other");
        set({ status: "dead", ultimaRecompensa: premio });
      },

      takeTalisman: (id) =>
        set((s) => ({
          talismanes: s.talismanes.includes(id) ? s.talismanes : [...s.talismanes, id],
          vidas: id === "cigarrera-plata" ? s.vidas + 1 : s.vidas,
        })),

      takeNaipe: (id) => set((s) => ({ naipes: [...s.naipes, id] })),

      avanzarOla: () => set((s) => ({ ola: Math.min(OLAS_TOTALES, s.ola + 1), status: "playing" })),

      abandonRun: () => {
        const { olasSuperadas } = get();
        const premio = favoresDeRun(olasSuperadas, false);
        if (premio > 0) useFavors.getState().earn(premio, "other");
        set({ ...INICIAL });
      },

      reset: () => set({ ...INICIAL }),
    }),
    { name: "sindicato-run:v2" },
  ),
);

export function olaActual(): OlaConfig {
  const { seed, ola } = useSyndicateRun.getState();
  return configOla(seed, ola);
}
