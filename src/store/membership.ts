import { create } from "zustand";
import { persist } from "zustand/middleware";

export const REWARDED_DAILY_CAP = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

interface MembershipState {
  member: boolean;
  adsWindowStart: number;
  adsUsed: number;
  setMember: (v: boolean) => void;
  tick: () => void;
  remainingAds: () => number;
  consumeAd: () => boolean;
}

export const useMembership = create<MembershipState>()(
  persist(
    (set, get) => ({
      member: false,
      adsWindowStart: Date.now(),
      adsUsed: 0,
      setMember: (v) => set({ member: v }),
      tick: () => {
        const { adsWindowStart } = get();
        if (Date.now() - adsWindowStart >= DAY_MS) {
          set({ adsWindowStart: Date.now(), adsUsed: 0 });
        }
      },
      remainingAds: () => {
        get().tick();
        return Math.max(0, REWARDED_DAILY_CAP - get().adsUsed);
      },
      consumeAd: () => {
        get().tick();
        const { adsUsed } = get();
        if (adsUsed >= REWARDED_DAILY_CAP) return false;
        set({ adsUsed: adsUsed + 1 });
        return true;
      },
    }),
    { name: "cuervo-membership" },
  ),
);
