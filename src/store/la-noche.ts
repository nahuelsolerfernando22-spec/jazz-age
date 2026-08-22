import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  NOCHE_MESAS,
  NOCHE_PREMIO,
  NOCHE_PREMIO_JEFE,
  NOCHE_TOTAL,
  armarNoche,
  eventoDeNoche,
  nuevaSemilla,
  pagoDeMesa,
  segurosDeTalismanes,
  talismanRegalado,
  type NocheMesa,
  type NocheOpcion,
} from "@/lib/la-noche";
import { rngFromSeed } from "@/lib/rng";
import { useCasino } from "@/store/casino";
import { useRewardsHistory } from "@/store/rewards-history";

export type NocheFase = "idle" | "mesa" | "evento" | "talisman" | "final";

export interface NocheResultado {
  ganadas: number;
  fichas: number;
  completada: boolean;
  /** Le ganaste la mesa del Dueño. */
  jefeCaido: boolean;
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
  /** Derrotas ya perdonadas por talismanes. */
  segurosUsados: number;
  /** Último cartel para mostrar en pantalla (evento resuelto, seguro gastado). */
  aviso: string | null;
  ultima: NocheResultado | null;
  mejorRacha: number;
  jefesCaidos: number;

  empezar: () => void;
  abandonar: () => void;
  elegirOpcion: (opcion: NocheOpcion) => void;
  elegirTalisman: (id: string) => void;
  /** Lo llama el rastreador de partidas cuando termina cualquier mesa. */
  report: (gameId: string, won: boolean) => void;
  ackFinal: () => void;
  limpiarAviso: () => void;
}

const RESET = {
  fase: "idle" as NocheFase,
  mesas: [] as NocheMesa[],
  paso: 0,
  ganadas: 0,
  fichas: 0,
  talismanes: [] as string[],
  segurosUsados: 0,
  aviso: null as string | null,
};

export const useLaNoche = create<LaNocheState>()(
  persist(
    (set, get) => ({
      ...RESET,
      seed: "",
      ultima: null,
      mejorRacha: 0,
      jefesCaidos: 0,

      empezar: () => {
        const seed = nuevaSemilla();
        set({ ...RESET, fase: "mesa", seed, mesas: armarNoche(seed) });
      },

      abandonar: () => set({ ...RESET }),

      limpiarAviso: () => set({ aviso: null }),

      elegirOpcion: (opcion) => {
        const s = get();
        if (s.fase !== "evento") return;
        const ef = opcion.efecto;
        let delta = ef.fichas ?? 0;
        let talismanes = s.talismanes;
        let aviso = "";

        let salioBien = true;
        if (ef.riesgo != null) {
          const rng = rngFromSeed(`${s.seed}:riesgo:${s.paso}:${opcion.id}`);
          salioBien = rng() > ef.riesgo;
          if (salioBien) delta += ef.premio ?? 0;
          else delta -= ef.castigo ?? 0;
        }

        if (ef.talismanExtra && salioBien) {
          const extra = talismanRegalado(s.seed, s.paso, talismanes);
          if (extra) {
            talismanes = [...talismanes, extra.id];
            aviso = `Te quedás con ${extra.nombre}. `;
          }
        }

        if (delta > 0) {
          useCasino.getState().addChips(delta);
          aviso += `+${delta} fichas.`;
        } else if (delta < 0) {
          useCasino.getState().addChips(delta);
          aviso += `${delta} fichas.`;
        } else if (!aviso) {
          aviso = salioBien ? "Zafaste sin pagar nada." : "Salió mal, pero no te costó fichas.";
        }

        set({
          talismanes,
          fichas: Math.max(0, s.fichas + Math.max(0, delta)),
          aviso: aviso.trim(),
          fase: ef.sinTalisman ? "mesa" : "talisman",
        });
      },

      elegirTalisman: (id) => {
        const s = get();
        if (s.fase !== "talisman") return;
        set({ talismanes: [...s.talismanes, id], fase: "mesa", aviso: null });
      },

      report: (gameId, won) => {
        const s = get();
        if (s.fase !== "mesa") return;
        const mesa = s.mesas[s.paso];
        if (!mesa || mesa.gameId !== gameId) return;

        // La herradura y el escapulario perdonan derrotas: esa mesa se cobra igual.
        let segurosUsados = s.segurosUsados;
        let cobra = won;
        let aviso: string | null = null;
        if (!won && segurosUsados < segurosDeTalismanes(s.talismanes)) {
          segurosUsados += 1;
          cobra = true;
          aviso = "Un talismán te tapó la derrota: la mesa se cobra igual.";
        }

        const pago = cobra ? pagoDeMesa(s.talismanes, !!mesa.jefe) : 0;
        const ganadas = s.ganadas + (cobra ? 1 : 0);
        const fichas = s.fichas + pago;
        const paso = s.paso + 1;

        if (pago > 0) useCasino.getState().addChips(pago);

        if (paso >= NOCHE_TOTAL) {
          const jefeCaido = cobra;
          const completada = ganadas >= 4 && jefeCaido;
          const premio = (ganadas >= 3 ? NOCHE_PREMIO : 0) + (jefeCaido ? NOCHE_PREMIO_JEFE : 0);
          if (premio > 0) useCasino.getState().addChips(premio);
          useRewardsHistory.getState().add({
            source: "daily-mission",
            favors: 0,
            chips: fichas + premio,
            label: `La Noche · ${ganadas}/${NOCHE_TOTAL} mesas${jefeCaido ? " · Dueño caído" : ""}`,
          });
          set({
            fase: "final",
            paso,
            ganadas,
            segurosUsados,
            aviso,
            fichas: fichas + premio,
            ultima: { ganadas, fichas: fichas + premio, completada, jefeCaido, cerradaAt: Date.now() },
            mejorRacha: Math.max(s.mejorRacha, ganadas),
            jefesCaidos: s.jefesCaidos + (jefeCaido ? 1 : 0),
          });
          return;
        }

        set({ fase: "evento", paso, ganadas, fichas, segurosUsados, aviso });
      },

      ackFinal: () => set({ ...RESET }),
    }),
    { name: "cuervo:la-noche:v1", version: 2 },
  ),
);

export function reportNocheResult(gameId: string, won: boolean) {
  useLaNoche.getState().report(gameId, won);
}

export function eventoActual(seed: string, paso: number) {
  return eventoDeNoche(seed, paso);
}

export { NOCHE_MESAS };
