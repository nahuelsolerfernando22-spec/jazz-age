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

/** Tiempo restante hasta volver a tener el corazón completo. */
export function msUntilFull(current: number, lastRegenAt: number): number {
  if (current >= MAX_LIVES) return 0;
  const missing = MAX_LIVES - current;
  return msUntilNextLife(current, lastRegenAt) + (missing - 1) * REGEN_MS;
}

/** "1 h 20 min" / "12 min" — para textos largos, no para el contador vivo. */
export function formatLongWait(ms: number): string {
  if (ms <= 0) return "ahora";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}


export function formatRegen(ms: number): string {
  if (ms <= 0) return "lleno";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
