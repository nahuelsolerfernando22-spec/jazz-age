import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CUP_PURSE,
  CUP_TOTAL_ROUNDS,
  CUP_GAME_BY_ID,
  cupRoundName,
  sortearCuadro,
  type CupRival,
} from "@/lib/cup";
import { useCasino } from "@/store/casino";

export type CupStatus = "jugando" | "campeon" | "eliminado";

export interface CupRun {
  gameId: string;
  seed: string;
  rivals: CupRival[];
  /** Ronda abierta (0..3). */
  round: number;
  status: CupStatus;
  /** Resultado de cada ronda cerrada. */
  results: Array<"win" | "loss">;
  purse: number;
  startedAt: number;
}

export interface CupTitle {
  gameId: string;
  at: number;
}

interface CupState {
  active: CupRun | null;
  titles: CupTitle[];
  /** Torneos jugados por mesa (para la ficha del salón). */
  played: Record<string, number>;
  start: (gameId: string) => void;
  abandon: () => void;
  /** Cierra la ronda abierta. Devuelve el estado nuevo si aplicó. */
  report: (gameId: string, outcome: "win" | "loss" | "draw") => CupRun | null;
  clearFinished: () => void;
}

export const useCup = create<CupState>()(
  persist(
    (set, get) => ({
      active: null,
      titles: [],
      played: {},

      start: (gameId) => {
        if (!CUP_GAME_BY_ID[gameId]) return;
        const seed = `${gameId}:${Date.now()}:${Math.floor(Math.random() * 1e9)}`;
        set((s) => ({
          active: {
            gameId,
            seed,
            rivals: sortearCuadro(seed),
            round: 0,
            status: "jugando",
            results: [],
            purse: 0,
            startedAt: Date.now(),
          },
          played: { ...s.played, [gameId]: (s.played[gameId] ?? 0) + 1 },
        }));
      },

      abandon: () => set({ active: null }),
      clearFinished: () =>
        set((s) => (s.active && s.active.status !== "jugando" ? { active: null } : s)),

      report: (gameId, outcome) => {
        const run = get().active;
        if (!run || run.status !== "jugando" || run.gameId !== gameId) return null;
        if (outcome === "draw") return run; // el empate no cierra la ronda

        if (outcome === "loss") {
          const next: CupRun = {
            ...run,
            status: "eliminado",
            results: [...run.results, "loss"],
          };
          set({ active: next });
          return next;
        }

        const premio = CUP_PURSE[Math.min(run.round, CUP_PURSE.length - 1)];
        const round = run.round + 1;
        const campeon = round >= CUP_TOTAL_ROUNDS;
        const next: CupRun = {
          ...run,
          round: campeon ? run.round : round,
          status: campeon ? "campeon" : "jugando",
          results: [...run.results, "win"],
          purse: run.purse + premio,
        };
        set((s) => ({
          active: next,
          titles: campeon ? [...s.titles, { gameId, at: Date.now() }] : s.titles,
        }));
        try {
          useCasino.getState().addChips(premio);
        } catch {}
        return next;
      },
    }),
    { name: "cuervo:cup", version: 1 },
  ),
);

/**
 * Puente entre el final de una partida y el cuadro del torneo.
 * Lo llama `reportGameOutcome`, así vale para todas las mesas.
 */
export function recordCupOutcome(gameId: string, outcome: "win" | "loss" | "draw") {
  const before = useCup.getState().active;
  if (!before || before.gameId !== gameId || before.status !== "jugando") return;
  const after = useCup.getState().report(gameId, outcome);
  if (!after || after === before) return;

  void import("sonner").then(({ toast }) => {
    if (after.status === "campeon") {
      toast.success(`¡Campeón del torneo! Bolsa total: ¢${after.purse}`);
    } else if (after.status === "eliminado") {
      toast.error(`Te dejaron afuera en ${cupRoundName(before.round)}. El cuadro se cierra.`);
    } else if (outcome === "win") {
      toast.success(
        `Pasás a ${cupRoundName(after.round)} — te espera ${after.rivals[after.round]?.nombre ?? "la casa"}.`,
      );
    }
  });
}

/** Ronda activa del torneo para una mesa, si la hay. */
export function cupForGame(gameId: string): CupRun | null {
  const run = useCup.getState().active;
  return run && run.gameId === gameId && run.status === "jugando" ? run : null;
}
