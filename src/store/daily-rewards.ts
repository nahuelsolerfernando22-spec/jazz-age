import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { signedStorage } from "@/lib/integrity";

export const DAILY_GIFT_CHIPS = 100;
export const AD_REWARD_CHIPS = 100;
export const AD_MAX_PER_DAY = 5;
export const AD_DURATION_MS = 30_000;

const AD_TOKEN_TTL_MS = 10 * 60_000;

function utcDayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function dayIsBefore(a: string, b: string): boolean {
  return a < b;
}

interface AdToken {
  id: string;
  day: string;
  issuedAt: number;
}

interface State {
  currentDay: string | null;

  giftDay: string | null;

  adsDay: string | null;
  adsWatched: number;

  openAdToken: AdToken | null;

  claimedTokens: string[];

  ensureDay: () => string;
  canClaimGift: () => boolean;
  claimGift: () => boolean;
  adsRemaining: () => number;
  canWatchAd: () => boolean;
  startAd: () => string | null;
  claimAd: (tokenId: string) => boolean;
  cancelAd: (tokenId: string) => void;
}

export const useDailyRewards = create<State>()(
  persist(
    (set, get) => ({
      currentDay: null,
      giftDay: null,
      adsDay: null,
      adsWatched: 0,
      openAdToken: null,
      claimedTokens: [],

      ensureDay: () => {
        const now = utcDayKey();
        const stored = get().currentDay;

        const effective = stored && dayIsBefore(now, stored) ? stored : now;

        const patch: Partial<State> = {};
        if (get().currentDay !== effective) patch.currentDay = effective;
        if (get().adsDay !== effective) {
          patch.adsDay = effective;
          patch.adsWatched = 0;
          patch.claimedTokens = [];

          if (get().openAdToken && get().openAdToken?.day !== effective) {
            patch.openAdToken = null;
          }
        }
        if (Object.keys(patch).length > 0) set(patch);
        return effective;
      },

      canClaimGift: () => {
        const d = get().ensureDay();
        return get().giftDay !== d;
      },

      claimGift: () => {
        const d = get().ensureDay();
        if (get().giftDay === d) return false;
        set({ giftDay: d });
        return true;
      },

      adsRemaining: () => {
        get().ensureDay();
        return Math.max(0, AD_MAX_PER_DAY - get().adsWatched);
      },

      canWatchAd: () => get().adsRemaining() > 0,

      startAd: () => {
        const d = get().ensureDay();
        if (get().adsWatched >= AD_MAX_PER_DAY) return null;

        const existing = get().openAdToken;
        const nowMs = Date.now();
        if (
          existing &&
          existing.day === d &&
          nowMs - existing.issuedAt < AD_TOKEN_TTL_MS &&
          !get().claimedTokens.includes(existing.id)
        ) {
          return existing.id;
        }
        const id = `${d}:${nowMs}:${Math.random().toString(36).slice(2, 10)}`;
        set({ openAdToken: { id, day: d, issuedAt: nowMs } });
        return id;
      },

      claimAd: (tokenId) => {
        const d = get().ensureDay();
        const token = get().openAdToken;
        if (!token || token.id !== tokenId) return false;
        if (token.day !== d) {
          set({ openAdToken: null });
          return false;
        }
        if (get().claimedTokens.includes(tokenId)) return false;
        if (get().adsWatched >= AD_MAX_PER_DAY) {
          set({ openAdToken: null });
          return false;
        }
        set((s) => ({
          adsWatched: s.adsWatched + 1,
          claimedTokens: [...s.claimedTokens, tokenId],
          openAdToken: null,
        }));
        return true;
      },

      cancelAd: (tokenId) => {
        const token = get().openAdToken;
        if (token && token.id === tokenId) set({ openAdToken: null });
      },
    }),
    {
      name: "cuervo:daily-rewards:v2",
      version: 2,
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return signedStorage(window.localStorage);
        // SSR: no-op storage para evitar crashes al hidratar durante render.
        const noop: Storage = {
          length: 0,
          clear: () => {},
          getItem: () => null,
          key: () => null,
          removeItem: () => {},
          setItem: () => {},
        };
        return noop;
      }),
      migrate: (persisted, fromVersion) => {
        if (fromVersion < 2 && persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          return {
            currentDay: null,
            giftDay: typeof p.giftDay === "string" ? p.giftDay : null,
            adsDay: typeof p.adsDay === "string" ? p.adsDay : null,
            adsWatched: typeof p.adsWatched === "number" ? p.adsWatched : 0,
            openAdToken: null,
            claimedTokens: [],
          } as unknown as State;
        }
        return persisted as State;
      },
    },
  ),
);
