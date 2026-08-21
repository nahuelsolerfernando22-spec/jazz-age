import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_LIVES = 5;
export const REGEN_MS = 20 * 60 * 1000;

interface LivesState {
  current: number;
  lastRegenAt: number;
  tick: () => void;
  spend: () => boolean;
  refillFull: () => void;
  add: (n: number) => void;
  award: () => void;
}

function applyRegen(current: number, lastRegenAt: number) {
  if (current >= MAX_LIVES) {
    return { current, lastRegenAt: Date.now() };
  }
  const now = Date.now();
  const elapsed = Math.max(0, now - lastRegenAt);
  const gained = Math.floor(elapsed / REGEN_MS);
  if (gained <= 0) return { current, lastRegenAt };
  const next = Math.min(MAX_LIVES, current + gained);

  const consumedMs = gained * REGEN_MS;
  return {
    current: next,
    lastRegenAt: next >= MAX_LIVES ? now : lastRegenAt + consumedMs,
  };
}

export const useLives = create<LivesState>()(
  persist(
    (set, get) => ({
      current: MAX_LIVES,
      lastRegenAt: Date.now(),
      tick: () => {
        const { current, lastRegenAt } = get();
        const next = applyRegen(current, lastRegenAt);
        if (next.current !== current || next.lastRegenAt !== lastRegenAt) {
          set(next);
        }
      },
      spend: () => {
        get().tick();
        const { current, lastRegenAt } = get();
        if (current <= 0) return false;

        const nextAnchor = current === MAX_LIVES ? Date.now() : lastRegenAt;
        set({ current: current - 1, lastRegenAt: nextAnchor });
        return true;
      },
      refillFull: () => set({ current: MAX_LIVES, lastRegenAt: Date.now() }),
      add: (n) =>
        set((s) => ({
          current: Math.min(MAX_LIVES, s.current + Math.max(0, Math.floor(n))),
        })),
      award: () =>
        set((s) => ({
          current: Math.min(MAX_LIVES, s.current + 1),
        })),
    }),
    { name: "cuervo-lives" },
  ),
);

export function msUntilNextLife(current: number, lastRegenAt: number): number {
  if (current >= MAX_LIVES) return 0;
  const elapsed = Math.max(0, Date.now() - lastRegenAt);
  return Math.max(0, REGEN_MS - (elapsed % REGEN_MS));
}

export function formatRegen(ms: number): string {
  if (ms <= 0) return "lleno";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
