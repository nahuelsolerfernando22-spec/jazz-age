import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CUP_ENTRIES_PER_DAY,
  CUP_RETRIES_PER_DAY,
  CUP_ROUND_REWARDS,
  CUP_SWEEP_BONUS,
  CUP_TOTAL_ROUNDS,
  CUP_GAME_BY_ID,
  ajustarGarra,
  cupDayKey,
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
  /** Recompensas acumuladas ronda a ronda. */
  trofeos: string[];
  puntos: number;
  startedAt: number;
}

export interface CupTitle {
  gameId: string;
  at: number;
}

export interface CupHistoryEntry {
  gameId: string;
  at: number;
  status: "campeon" | "eliminado";
  rondas: number;
  purse: number;
  puntos: number;
  /** Rival que cerró el cuadro (el último que enfrentaste). */
  rival: string;
}

export interface CupScore {
  puntos: number;
  torneos: number;
  titulos: number;
  mejorRonda: number;
}

interface CupState {
  active: CupRun | null;
  titles: CupTitle[];
  /** Torneos jugados por mesa (para la ficha del salón). */
  played: Record<string, number>;
  history: CupHistoryEntry[];
  scores: Record<string, CupScore>;
  /** Cuánto te está costando cada mesa: -1..1. */
  rating: Record<string, number>;
  day: number;
  entriesUsed: number;
  retriesUsed: number;
  /** Devuelve false si no te queda cupo. */
  start: (gameId: string) => boolean;
  /** Reabre la ronda perdida gastando un reintento. */
  retry: () => boolean;
  abandon: () => void;
  /** Cierra la ronda abierta. Devuelve el estado nuevo si aplicó. */
  report: (gameId: string, outcome: "win" | "loss" | "draw") => CupRun | null;
  clearFinished: () => void;
  cupos: () => { entradas: number; reintentos: number };
}

function emptyScore(): CupScore {
  return { puntos: 0, torneos: 0, titulos: 0, mejorRonda: 0 };
}

export const useCup = create<CupState>()(
  persist(
    (set, get) => ({
      active: null,
      titles: [],
      played: {},
      history: [],
      scores: {},
      rating: {},
      day: cupDayKey(),
      entriesUsed: 0,
      retriesUsed: 0,

      cupos: () => {
        const s = get();
        const hoy = cupDayKey();
        const used = s.day === hoy ? s.entriesUsed : 0;
        const ret = s.day === hoy ? s.retriesUsed : 0;
        return {
          entradas: Math.max(0, CUP_ENTRIES_PER_DAY - used),
          reintentos: Math.max(0, CUP_RETRIES_PER_DAY - ret),
        };
      },

      start: (gameId) => {
        if (!CUP_GAME_BY_ID[gameId]) return false;
        const s = get();
        const hoy = cupDayKey();
        const used = s.day === hoy ? s.entriesUsed : 0;
        if (used >= CUP_ENTRIES_PER_DAY) return false;

        const seed = `${gameId}:${Date.now()}:${Math.floor(Math.random() * 1e9)}`;
        const rating = s.rating[gameId] ?? 0;
        const rivals = sortearCuadro(seed).map((r, i) => ({
          ...r,
          garra: ajustarGarra(r.garra, rating, i),
        }));
        set({
          active: {
            gameId,
            seed,
            rivals,
            round: 0,
            status: "jugando",
            results: [],
            purse: 0,
            trofeos: [],
            puntos: 0,
            startedAt: Date.now(),
          },
          played: { ...s.played, [gameId]: (s.played[gameId] ?? 0) + 1 },
          day: hoy,
          entriesUsed: used + 1,
          retriesUsed: s.day === hoy ? s.retriesUsed : 0,
        });
        return true;
      },

      retry: () => {
        const s = get();
        const run = s.active;
        if (!run || run.status !== "eliminado") return false;
        const hoy = cupDayKey();
        const ret = s.day === hoy ? s.retriesUsed : 0;
        if (ret >= CUP_RETRIES_PER_DAY) return false;

        const rating = s.rating[run.gameId] ?? 0;
        set({
          active: {
            ...run,
            status: "jugando",
            results: run.results.slice(0, -1),
            rivals: run.rivals.map((r, i) =>
              i === run.round ? { ...r, garra: ajustarGarra(r.garra - 1, rating, i) } : r,
            ),
          },
          day: hoy,
          retriesUsed: ret + 1,
          entriesUsed: s.day === hoy ? s.entriesUsed : 0,
        });
        return true;
      },

      abandon: () => set({ active: null }),
      clearFinished: () =>
        set((s) => (s.active && s.active.status !== "jugando" ? { active: null } : s)),

      report: (gameId, outcome) => {
        const run = get().active;
        if (!run || run.status !== "jugando" || run.gameId !== gameId) return null;
        if (outcome === "draw") return run; // el empate no cierra la ronda

        const prevRating = get().rating[gameId] ?? 0;
        const cerrar = (next: CupRun, delta: number) => {
          const status = next.status === "campeon" ? "campeon" : "eliminado";
          const entry: CupHistoryEntry = {
            gameId,
            at: Date.now(),
            status,
            rondas: next.results.filter((r) => r === "win").length,
            purse: next.purse,
            puntos: next.puntos,
            rival: next.rivals[next.round]?.nombre ?? "la casa",
          };
          set((s) => {
            const prev = s.scores[gameId] ?? emptyScore();
            return {
              active: next,
              history: [entry, ...s.history].slice(0, 60),
              scores: {
                ...s.scores,
                [gameId]: {
                  puntos: prev.puntos + next.puntos,
                  torneos: prev.torneos + 1,
                  titulos: prev.titulos + (status === "campeon" ? 1 : 0),
                  mejorRonda: Math.max(prev.mejorRonda, entry.rondas),
                },
              },
              rating: {
                ...s.rating,
                [gameId]: Math.max(-1, Math.min(1, prevRating + delta)),
              },
              titles:
                status === "campeon" ? [...s.titles, { gameId, at: Date.now() }] : s.titles,
            };
          });
        };

        if (outcome === "loss") {
          const next: CupRun = {
            ...run,
            status: "eliminado",
            results: [...run.results, "loss"],
          };
          cerrar(next, -0.2);
          return next;
        }

        const premio = CUP_ROUND_REWARDS[Math.min(run.round, CUP_ROUND_REWARDS.length - 1)];
        const round = run.round + 1;
        const campeon = round >= CUP_TOTAL_ROUNDS;
        const pago = premio.fichas + (campeon ? CUP_SWEEP_BONUS : 0);
        const next: CupRun = {
          ...run,
          round: campeon ? run.round : round,
          status: campeon ? "campeon" : "jugando",
          results: [...run.results, "win"],
          purse: run.purse + pago,
          trofeos: [...run.trofeos, premio.extra],
          puntos: run.puntos + premio.puntos + (campeon ? 60 : 0),
        };

        if (campeon) {
          cerrar(next, 0.25);
        } else {
          set((s) => ({
            active: next,
            rating: {
              ...s.rating,
              [gameId]: Math.max(-1, Math.min(1, prevRating + 0.12)),
            },
          }));
        }
        try {
          useCasino.getState().addChips(pago);
        } catch {}
        return next;
      },
    }),
    {
      name: "cuervo:cup",
      version: 2,
      migrate: (state: unknown) => {
        const s = (state ?? {}) as Partial<CupState>;
        return {
          ...s,
          active: null,
          history: s.history ?? [],
          scores: s.scores ?? {},
          rating: s.rating ?? {},
          day: s.day ?? cupDayKey(),
          entriesUsed: s.entriesUsed ?? 0,
          retriesUsed: s.retriesUsed ?? 0,
        } as CupState;
      },
    },
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
      const extra = after.trofeos[after.trofeos.length - 1];
      toast.success(
        `Pasás a ${cupRoundName(after.round)} — ${extra} en la vitrina. Te espera ${after.rivals[after.round]?.nombre ?? "la casa"}.`,
      );
    }
  });
}

/** Ronda activa del torneo para una mesa, si la hay. */
export function cupForGame(gameId: string): CupRun | null {
  const run = useCup.getState().active;
  return run && run.gameId === gameId && run.status === "jugando" ? run : null;
}

/** Garra del rival de la ronda abierta (para que las mesas ajusten el bot). */
export function cupRivalGarra(gameId: string): number | null {
  const run = cupForGame(gameId);
  return run ? (run.rivals[run.round]?.garra ?? null) : null;
}
