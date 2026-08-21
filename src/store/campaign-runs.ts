import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  buildCampaign,
  computeCampaignStars,
  rewardForCampaignStars,
  type CampaignLevelDef,
  type CampaignTheme,
} from "@/lib/campaign-core";

export type EndReason = "won" | "lost-budget" | "lost-time" | "abandoned";

export interface ClearedRecord {
  stars: 0 | 1 | 2 | 3;
  bestAchieved: number;
  clearedAt: string;
}

export interface CampaignRunState {
  levels: CampaignLevelDef[];
  gameId: string;
  displayName: string;
  campaignName: string;
  activeLevel: string | null;
  startedAt: number | null;
  chipsGained: number;
  chipsLost: number;
  events: number;
  lastEndReason: EndReason | null;
  lastResult: null | {
    levelId: string;
    stars: 0 | 1 | 2 | 3;
    won: boolean;
    reward: number;
    achieved: number;
  };
  cleared: Record<string, ClearedRecord>;

  startRun: (levelId: string) => void;
  abandon: () => void;
  ackResult: () => void;
  bumpChips: (delta: number) => void;
  bumpEvents: (amount?: number) => void;
  tick: () => void;
  totalStars: () => number;
  isUnlocked: (levelId: string) => boolean;
  findLevel: (levelId: string) => CampaignLevelDef | undefined;
}

type Setter = (partial: Partial<CampaignRunState>) => void;

function achievedFor(
  level: CampaignLevelDef,
  state: Pick<CampaignRunState, "chipsGained" | "chipsLost" | "events" | "startedAt">,
): number {
  switch (level.objective.kind) {
    case "chips":
      return Math.max(0, state.chipsGained - state.chipsLost);
    case "events":
      return state.events;
    case "survive":
      if (!state.startedAt) return 0;
      return Math.floor((Date.now() - state.startedAt) / 1000);
  }
}

function isMet(level: CampaignLevelDef, achieved: number): boolean {
  switch (level.objective.kind) {
    case "chips":
      return achieved >= level.objective.target;
    case "events":
      return achieved >= level.objective.target;
    case "survive":
      return achieved >= level.objective.seconds;
  }
}

function timeCapSeconds(level: CampaignLevelDef): number | null {
  const m = level.modifiers.find((x) => x.kind === "time-cap");
  return m && m.kind === "time-cap" ? m.seconds : null;
}

function chipCapLoss(level: CampaignLevelDef): number {
  const m = level.modifiers.find((x) => x.kind === "chip-cap");
  if (m && m.kind === "chip-cap") return Math.min(level.budget, m.loss);
  return level.budget;
}

function taxMult(level: CampaignLevelDef): number {
  const m = level.modifiers.find((x) => x.kind === "tax");
  return m && m.kind === "tax" ? 1 - m.percent : 1;
}

function endRun(
  gameId: string,
  level: CampaignLevelDef,
  reason: EndReason,
  achieved: number,
  set: Setter,
  getCleared: () => Record<string, ClearedRecord>,
) {
  const won = reason === "won";
  const stars: 0 | 1 | 2 | 3 = won ? computeCampaignStars(level, achieved) : 0;
  const reward = rewardForCampaignStars(level, stars);

  const prev = getCleared()[level.id];
  const bestAchieved = prev ? Math.max(prev.bestAchieved, achieved) : achieved;
  const bestStars = (prev ? Math.max(prev.stars, stars) : stars) as 0 | 1 | 2 | 3;
  const cleared = won
    ? {
        ...getCleared(),
        [level.id]: { stars: bestStars, bestAchieved, clearedAt: new Date().toISOString() },
      }
    : getCleared();

  set({
    activeLevel: null,
    startedAt: null,
    chipsGained: 0,
    chipsLost: 0,
    events: 0,
    lastEndReason: reason,
    lastResult: { levelId: level.id, stars, won, reward, achieved },
    cleared,
  });

  if (reward > 0) {
    void import("@/store/casino").then((m) => {
      try {
        m.useCasino.getState().addChips?.(reward);
      } catch {}
    });
  }
}

export function createCampaignStore(theme: CampaignTheme) {
  const levels = buildCampaign(theme);

  return create<CampaignRunState>()(
    persist(
      (set, get) => ({
        levels,
        gameId: theme.gameId,
        displayName: theme.displayName,
        campaignName: theme.campaignName,
        activeLevel: null,
        startedAt: null,
        chipsGained: 0,
        chipsLost: 0,
        events: 0,
        lastEndReason: null,
        lastResult: null,
        cleared: {},

        findLevel: (id) => levels.find((l) => l.id === id),

        isUnlocked: (id) => {
          const l = levels.find((x) => x.id === id);
          if (!l) return false;
          if (l.order === 1) return true;
          const prev = levels[l.order - 2];
          return !!get().cleared[prev.id];
        },

        totalStars: () => Object.values(get().cleared).reduce((acc, r) => acc + r.stars, 0),

        startRun: (levelId) => {
          const l = levels.find((x) => x.id === levelId);
          if (!l) return;
          set({
            activeLevel: l.id,
            startedAt: Date.now(),
            chipsGained: 0,
            chipsLost: 0,
            events: 0,
            lastEndReason: null,
            lastResult: null,
          });
        },

        abandon: () => {
          const s = get();
          if (!s.activeLevel) return;
          set({
            activeLevel: null,
            startedAt: null,
            lastEndReason: "abandoned",
            lastResult: null,
          });
        },

        ackResult: () => set({ lastResult: null, lastEndReason: null }),

        bumpChips: (delta) => {
          const s = get();
          if (!s.activeLevel) return;
          const l = levels.find((x) => x.id === s.activeLevel);
          if (!l) return;

          let chipsGained = s.chipsGained;
          let chipsLost = s.chipsLost;
          if (delta > 0) chipsGained += Math.round(delta * taxMult(l));
          else chipsLost += -delta;

          const achieved = achievedFor(l, {
            chipsGained,
            chipsLost,
            events: s.events,
            startedAt: s.startedAt,
          });

          if (chipsLost - chipsGained >= chipCapLoss(l)) {
            set({ chipsGained, chipsLost });
            endRun(theme.gameId, l, "lost-budget", achieved, set, () => get().cleared);
            return;
          }

          if (isMet(l, achieved)) {
            set({ chipsGained, chipsLost });
            endRun(theme.gameId, l, "won", achieved, set, () => get().cleared);
            return;
          }

          set({ chipsGained, chipsLost });
        },

        bumpEvents: (amount = 1) => {
          const s = get();
          if (!s.activeLevel) return;
          const l = levels.find((x) => x.id === s.activeLevel);
          if (!l) return;

          const events = s.events + amount;
          const achieved = achievedFor(l, {
            chipsGained: s.chipsGained,
            chipsLost: s.chipsLost,
            events,
            startedAt: s.startedAt,
          });

          if (isMet(l, achieved)) {
            set({ events });
            endRun(theme.gameId, l, "won", achieved, set, () => get().cleared);
            return;
          }

          set({ events });
        },

        tick: () => {
          const s = get();
          if (!s.activeLevel || !s.startedAt) return;
          const l = levels.find((x) => x.id === s.activeLevel);
          if (!l) return;
          const elapsed = Math.floor((Date.now() - s.startedAt) / 1000);
          const cap = timeCapSeconds(l);
          const achieved = achievedFor(l, {
            chipsGained: s.chipsGained,
            chipsLost: s.chipsLost,
            events: s.events,
            startedAt: s.startedAt,
          });

          if (l.objective.kind === "survive" && isMet(l, achieved)) {
            endRun(theme.gameId, l, "won", achieved, set, () => get().cleared);
            return;
          }

          if (cap != null && elapsed >= cap) {
            endRun(theme.gameId, l, "lost-time", achieved, set, () => get().cleared);
          }
        },
      }),
      { name: theme.storageKey },
    ),
  );
}

export type CampaignStoreHook = ReturnType<typeof createCampaignStore>;
