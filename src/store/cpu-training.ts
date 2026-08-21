import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CpuTrainingStats {
  games: number;
  cpuWins: number;
  xp: number;
  lastPlayerStreak: number;
  updatedAt: number;
}

export interface CpuTrainingBoost {
  accuracy: number;
  memory: number;
  bluffCut: number;
  depth: number;
  stage: string;
  progress: number;
}

const EMPTY: CpuTrainingStats = {
  games: 0,
  cpuWins: 0,
  xp: 0,
  lastPlayerStreak: 0,
  updatedAt: 0,
};

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

function normXp(xp: number): number {
  return xp <= 0 ? 0 : 1 - 1 / (1 + Math.log2(1 + xp / 60));
}

function stageOf(n: number): string {
  if (n < 0.15) return "Novato";
  if (n < 0.35) return "Aplicado";
  if (n < 0.6) return "Curtido";
  if (n < 0.85) return "Veterano";
  return "Maestro";
}

export function boostFromStats(s: CpuTrainingStats): CpuTrainingBoost {
  const t = normXp(s.xp);
  return {
    accuracy: 0.12 * t,
    memory: 0.1 * t,
    bluffCut: 0.06 * t,
    depth: Math.floor(2 * t),
    stage: stageOf(t),
    progress: t,
  };
}

interface State {
  byGame: Record<string, CpuTrainingStats>;
  get: (gameId: string) => CpuTrainingStats;
  boost: (gameId: string) => CpuTrainingBoost;
  report: (
    gameId: string,
    result: { playerWon: boolean; spread?: number; playerStreak?: number },
  ) => void;
  reset: (gameId?: string) => void;
}

export const useCpuTraining = create<State>()(
  persist(
    (set, get) => ({
      byGame: {},
      get: (gameId) => get().byGame[gameId] ?? EMPTY,
      boost: (gameId) => boostFromStats(get().byGame[gameId] ?? EMPTY),
      report: (gameId, result) => {
        set((s) => {
          const cur = s.byGame[gameId] ?? EMPTY;
          const spread = clamp(result.spread ?? 0, 0, 100);

          const xpGain = result.playerWon ? 4 + Math.max(0, 8 - spread) * 0.5 : 10 + spread * 0.5;
          const next: CpuTrainingStats = {
            games: cur.games + 1,
            cpuWins: cur.cpuWins + (result.playerWon ? 0 : 1),
            xp: cur.xp + xpGain,
            lastPlayerStreak: result.playerStreak ?? cur.lastPlayerStreak,
            updatedAt: Date.now(),
          };
          return { byGame: { ...s.byGame, [gameId]: next } };
        });
      },
      reset: (gameId) => {
        if (!gameId) {
          set({ byGame: {} });
          return;
        }
        set((s) => {
          const rest = { ...s.byGame };
          delete rest[gameId];
          return { byGame: rest };
        });
      },
    }),
    { name: "cuervo:cpu-training:v1" },
  ),
);
