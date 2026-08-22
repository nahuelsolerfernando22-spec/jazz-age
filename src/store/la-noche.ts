import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  NOCHE_MESAS,
  NOCHE_PAGO_MESA,
  NOCHE_PREMIO,
  armarNoche,
  bonoDeTalismanes,
  nuevaSemilla,
  type NocheMesa,
} from "@/lib/la-noche";
import { useCasino } from "@/store/casino";
import { useRewardsHistory } from "@/store/rewards-history";

export type NocheFase = "idle" | "mesa" | "talisman" | "final";

export interface NocheResultado {
  ganadas: number;
  fichas: number;
  completada: boolean;
  cerradaAt: number;
}

interface LaNocheState {
  fase: NocheFase;
  seed: string;
  mesas: NocheMesa[];
  paso: number;
  ganadas: number;
  fichas: number;
  talismanes: string[];
  ultima: NocheResultado | null;
  mejorRacha: number;

  empezar: () => void;
  abandonar: () => void;
  elegirTalisman: (id: string) => void;
  /** Lo llama el rastreador de partidas cuando termina cualquier mesa. */
  report: (gameId: string, won: boolean) => void;
  ackFinal: () => void;
}

export const useLaNoche = create<LaNocheState>()(
  persist(
    (set, get) => ({
      fase: "idle",
      seed: "",
      mesas: [],
      paso: 0,
      ganadas: 0,
      fichas: 0,
      talismanes: [],
      ultima: null,
      mejorRacha: 0,

      empezar: () => {
        const seed = nuevaSemilla();
        set({
          fase: "mesa",
          seed,
          mesas: armarNoche(seed),
          paso: 0,
          ganadas: 0,
          fichas: 0,
          talismanes: [],
        });
      },

      abandonar: () => set({ fase: "idle", mesas: [], paso: 0, ganadas: 0, fichas: 0, talismanes: [] }),

      elegirTalisman: (id) => {
        const s = get();
        if (s.fase !== "talisman") return;
        set({ talismanes: [...s.talismanes, id], fase: "mesa" });
      },

      report: (gameId, won) => {
        const s = get();
        if (s.fase !== "mesa") return;
        const mesa = s.mesas[s.paso];
        if (!mesa || mesa.gameId !== gameId) return;

        const pago = won ? NOCHE_PAGO_MESA + bonoDeTalismanes(s.talismanes) : 0;
        const ganadas = s.ganadas + (won ? 1 : 0);
        const fichas = s.fichas + pago;
        const paso = s.paso + 1;

        if (pago > 0) useCasino.getState().addChips(pago);

        if (paso >= NOCHE_MESAS) {
          const completada = ganadas >= 3;
          const premio = completada ? NOCHE_PREMIO : 0;
          if (premio > 0) useCasino.getState().addChips(premio);
          useRewardsHistory.getState().add({
            source: "daily-mission",
            favors: 0,
            chips: fichas + premio,
            label: `La Noche · ${ganadas}/${NOCHE_MESAS} mesas`,
          });
          set({
            fase: "final",
            paso,
            ganadas,
            fichas: fichas + premio,
            ultima: {
              ganadas,
              fichas: fichas + premio,
              completada,
              cerradaAt: Date.now(),
            },
            mejorRacha: Math.max(s.mejorRacha, ganadas),
          });
          return;
        }

        set({ fase: "talisman", paso, ganadas, fichas });
      },

      ackFinal: () =>
        set({ fase: "idle", mesas: [], paso: 0, ganadas: 0, fichas: 0, talismanes: [] }),
    }),
    { name: "cuervo:la-noche:v1" },
  ),
);

export function reportNocheResult(gameId: string, won: boolean) {
  useLaNoche.getState().report(gameId, won);
}
