import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect } from "react";
import { useCasino, rankFromXp } from "@/store/casino";

export type WearTier = "light" | "medium" | "heavy";
export type WearMode = "auto-session" | "progress" | WearTier;

interface WearState {
  mode: WearMode;
  sessionSeed: number;
  cache: Record<string, WearTier>;
  stage: number;
  setMode: (m: WearMode) => void;
  rerollSession: () => void;
  setStage: (stage: number) => void;
  resolveTier: (room: string) => WearTier;
}

function freshSeed() {
  return Math.floor(Math.random() * 1_000_000);
}

function hashRoom(room: string, seed: number) {
  let h = seed >>> 0;
  for (let i = 0; i < room.length; i++) {
    h = ((h << 5) - h + room.charCodeAt(i)) >>> 0;
  }
  return h;
}

function compute(room: string, mode: WearMode, seed: number, stage: number): WearTier {
  if (mode === "light" || mode === "medium" || mode === "heavy") return mode;
  if (mode === "progress") {
    const jitter = hashRoom(room, seed) % 2;
    const score = stage + jitter;
    if (score <= 2) return "light";
    if (score <= 5) return "medium";
    return "heavy";
  }
  const bucket = hashRoom(room, seed) % 5;
  if (bucket < 2) return "light";
  if (bucket < 4) return "medium";
  return "heavy";
}

export const useWear = create<WearState>()(
  persist(
    (set, get) => ({
      mode: "progress",
      sessionSeed: freshSeed(),
      cache: {},
      stage: 1,
      setMode: (mode) => set({ mode, cache: {} }),
      rerollSession: () => set({ sessionSeed: freshSeed(), cache: {} }),
      setStage: (stage) => {
        if (get().stage === stage) return;

        set({ stage, cache: {} });
      },
      resolveTier: (room) => {
        const { cache, mode, sessionSeed, stage } = get();
        const cached = cache[room];
        if (cached) return cached;
        const tier = compute(room, mode, sessionSeed, stage);

        set({ cache: { ...cache, [room]: tier } });
        return tier;
      },
    }),
    {
      name: "speakeasy-wear",

      partialize: (s) => ({ mode: s.mode }),
    },
  ),
);

export function useWearStageSync() {
  const xp = useCasino((s) => s.xp);
  const scarletTier = useCasino((s) => s.scarletTier);
  const setStage = useWear((s) => s.setStage);

  useEffect(() => {
    const level = rankFromXp(xp).level;
    setStage(level + scarletTier);
  }, [xp, scarletTier, setStage]);
}

export function useRoomTier(room: string): WearTier {
  return useWear((s) => s.cache[room] ?? compute(room, s.mode, s.sessionSeed, s.stage));
}
