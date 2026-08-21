import { create } from "zustand";
import { persist } from "zustand/middleware";
import { monoNow } from "@/lib/monotonic-clock";

const REFILL_INTERVAL_MS = 3 * 60 * 60 * 1000;
export const REFILL_AMOUNT = 200;
export const REFILL_CAP = 4;

type State = {
  lastRefillAt: number;
  bankedCharges: number;
  pendingChargesNow: () => number;
  msToNextCharge: () => number;
  claim: () => number;
  ensureInit: () => void;
};

function chargesAccumulated(state: { lastRefillAt: number; bankedCharges: number }): number {
  const now = monoNow();
  const elapsed = Math.max(0, now - state.lastRefillAt);
  const newCharges = Math.floor(elapsed / REFILL_INTERVAL_MS);
  return Math.min(REFILL_CAP, state.bankedCharges + newCharges);
}

export const useChipRefill = create<State>()(
  persist(
    (set, get) => ({
      lastRefillAt: monoNow(),
      bankedCharges: 0,
      pendingChargesNow: () => chargesAccumulated(get()),
      msToNextCharge: () => {
        const s = get();
        if (chargesAccumulated(s) >= REFILL_CAP) return 0;
        const elapsed = (monoNow() - s.lastRefillAt) % REFILL_INTERVAL_MS;
        return REFILL_INTERVAL_MS - elapsed;
      },
      claim: () => {
        const charges = chargesAccumulated(get());
        if (charges <= 0) return 0;
        set({
          bankedCharges: 0,
          lastRefillAt: monoNow(),
        });
        return charges * REFILL_AMOUNT;
      },
      ensureInit: () => {
        if (!get().lastRefillAt) set({ lastRefillAt: monoNow() });
      },
    }),
    { name: "slots:chip-refill:v1" },
  ),
);
