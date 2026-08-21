import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyPrestige,
  isTopTier,
  nextTier,
  tierById,
  type DifficultyTier,
  type TierTuning,
} from "@/lib/difficulty";

export interface GameProgress {
  tierId: string;
  prestige: number;
  streak: number;
  unlocked: string[];
}

export interface ResolvedDifficulty {
  tier: DifficultyTier;
  prestige: number;
  tuning: TierTuning;
  label: string;
}

interface State {
  byGame: Record<string, GameProgress>;
  resolve: (gameId: string, tiers: DifficultyTier[]) => ResolvedDifficulty;
  setTier: (gameId: string, tierId: string) => void;
  reportResult: (gameId: string, tiers: DifficultyTier[], won: boolean) => ProgressEvent | null;
  reset: (gameId?: string) => void;
}

export type ProgressEvent =
  { kind: "tier-unlocked"; tier: DifficultyTier } | { kind: "prestige-up"; level: number };

function initialFor(tiers: DifficultyTier[]): GameProgress {
  const first = tiers[0]!;
  return { tierId: first.id, prestige: 0, streak: 0, unlocked: [first.id] };
}

function ensure(byGame: Record<string, GameProgress>, gameId: string, tiers: DifficultyTier[]) {
  const cur = byGame[gameId];
  if (!cur) return initialFor(tiers);

  if (!tiers.some((t) => t.id === cur.tierId)) {
    return { ...cur, tierId: tiers[0]!.id };
  }
  return cur;
}

import { difficultyLabel } from "@/lib/difficulty";

export const usePrestige = create<State>()(
  persist(
    (set, get) => ({
      byGame: {},
      resolve: (gameId, tiers) => {
        const p = ensure(get().byGame, gameId, tiers);
        const tier = tierById(tiers, p.tierId);
        const tuning = applyPrestige(tier.tuning, p.prestige);
        return { tier, prestige: p.prestige, tuning, label: difficultyLabel(tier, p.prestige) };
      },
      setTier: (gameId, tierId) => {
        set((s) => {
          const cur = s.byGame[gameId];
          if (!cur) return s;
          if (!cur.unlocked.includes(tierId)) return s;
          return { byGame: { ...s.byGame, [gameId]: { ...cur, tierId, streak: 0 } } };
        });
      },
      reportResult: (gameId, tiers, won) => {
        const before = ensure(get().byGame, gameId, tiers);
        const tier = tierById(tiers, before.tierId);
        let event: ProgressEvent | null = null;
        let next: GameProgress = { ...before };

        if (!won) {
          next = { ...next, streak: 0 };
        } else {
          next = { ...next, streak: next.streak + 1 };
          if (next.streak >= tier.unlockAt) {
            if (isTopTier(tiers, tier.id)) {
              next = { ...next, prestige: next.prestige + 1, streak: 0 };
              event = { kind: "prestige-up", level: next.prestige };
            } else {
              const nx = nextTier(tiers, tier.id)!;
              if (!next.unlocked.includes(nx.id)) {
                next = {
                  ...next,
                  unlocked: [...next.unlocked, nx.id],

                  tierId: nx.id,
                  streak: 0,
                };
                event = { kind: "tier-unlocked", tier: nx };
              } else {
                next = { ...next, streak: 0 };
              }
            }
          }
        }
        set((s) => ({ byGame: { ...s.byGame, [gameId]: next } }));
        return event;
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
    { name: "cuervo:prestige:v1" },
  ),
);
