import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FavorSource =
  "mission" | "achievement" | "league" | "pickem" | "bagatelle" | "hostess" | "daily" | "other";

export type FavorSources = Partial<Record<FavorSource, number>>;

interface FavorsState {
  favors: number;
  lifetime: number;
  sources: FavorSources;
  add: (n: number, source?: FavorSource) => void;
  earn: (n: number, source?: FavorSource) => void;
  spend: (n: number) => boolean;
  has: (n: number) => boolean;
  reset: () => void;
}

const addImpl = (
  set: (fn: (s: FavorsState) => Partial<FavorsState>) => void,
  n: number,
  source: FavorSource = "other",
) => {
  if (!Number.isFinite(n) || n <= 0) return;
  set((s) => ({
    favors: s.favors + n,
    lifetime: s.lifetime + n,
    sources: { ...s.sources, [source]: (s.sources[source] ?? 0) + n },
  }));
};

export const useFavors = create<FavorsState>()(
  persist(
    (set, get) => ({
      favors: 0,
      lifetime: 0,
      sources: {},
      add: (n, source) => addImpl(set, n, source),

      earn: (n, source) => addImpl(set, n, source),
      spend: (n) => {
        if (!Number.isFinite(n) || n <= 0) return false;
        if (get().favors < n) return false;
        set((s) => ({ favors: s.favors - n }));
        return true;
      },
      has: (n) => get().favors >= n,
      reset: () => set(() => ({ favors: 0, lifetime: 0, sources: {} })),
    }),
    { name: "speakeasy:favors:v1" },
  ),
);
