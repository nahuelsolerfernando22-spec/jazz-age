import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LastResult = "win" | "lose" | "draw" | null;

interface PlayerMemoryState {
  flags: Record<string, boolean>;
  affinity: Record<string, number>;
  streak: number;
  lastResult: LastResult;
  lastRoom: string | null;
  rumorsHeard: string[];
  visits: Record<string, number>;

  lastVisitAt: number | null;
  biggestWin: number;
  totalSessions: number;
  sessionStartedAt: number | null;

  setFlag: (key: string, value?: boolean) => void;
  hasFlag: (key: string) => boolean;
  bumpAffinity: (npcId: string, delta: number) => void;
  noteResult: (room: string, result: Exclude<LastResult, null>, amount?: number) => void;
  noteVisit: (npcId: string) => void;
  hearRumor: (id: string) => void;
  noteSessionStart: () => void;
}

export const usePlayerMemory = create<PlayerMemoryState>()(
  persist(
    (set, get) => ({
      flags: {},
      affinity: {},
      streak: 0,
      lastResult: null,
      lastRoom: null,
      rumorsHeard: [],
      visits: {},

      lastVisitAt: null,
      biggestWin: 0,
      totalSessions: 0,
      sessionStartedAt: null,

      setFlag: (key, value = true) => set((s) => ({ flags: { ...s.flags, [key]: value } })),
      hasFlag: (key) => !!get().flags[key],
      bumpAffinity: (npcId, delta) =>
        set((s) => ({
          affinity: {
            ...s.affinity,
            [npcId]: Math.max(-100, Math.min(100, (s.affinity[npcId] ?? 0) + delta)),
          },
        })),
      noteResult: (room, result, amount) =>
        set((s) => {
          const sign = result === "win" ? 1 : result === "lose" ? -1 : 0;
          const sameSign = sign !== 0 && Math.sign(s.streak) === sign;
          const nextStreak = sign === 0 ? 0 : sameSign ? s.streak + sign : sign;
          const win =
            result === "win" && typeof amount === "number"
              ? Math.max(s.biggestWin, amount)
              : s.biggestWin;
          return { lastResult: result, lastRoom: room, streak: nextStreak, biggestWin: win };
        }),
      noteVisit: (npcId) =>
        set((s) => ({
          visits: { ...s.visits, [npcId]: (s.visits[npcId] ?? 0) + 1 },
          lastVisitAt: Date.now(),
        })),
      hearRumor: (id) =>
        set((s) => (s.rumorsHeard.includes(id) ? s : { rumorsHeard: [...s.rumorsHeard, id] })),
      noteSessionStart: () =>
        set((s) => ({ totalSessions: s.totalSessions + 1, sessionStartedAt: Date.now() })),
    }),
    { name: "cuervo-player-memory:v1" },
  ),
);

export function getAbsenceDays(): number {
  const last = usePlayerMemory.getState().lastVisitAt;
  if (!last) return 0;
  return Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
}
