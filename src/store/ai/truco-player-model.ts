import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlayerEvent =
  | { kind: "envido:called"; value?: number; asMano: boolean }
  | { kind: "envido:not-called"; asMano: boolean }
  | { kind: "envido:accepted"; value?: number }
  | { kind: "envido:declined" }
  | { kind: "truco:accepted"; level: "truco" | "retruco" | "vale4" }
  | { kind: "truco:declined"; level: "truco" | "retruco" | "vale4" }
  | { kind: "truco:called"; strength?: number }
  | { kind: "bluffed" };

export interface PlayerModel {
  hands: number;

  envidoCallOpps: number;
  envidoCalls: number;
  envidoAcceptOpps: number;
  envidoAccepts: number;
  envidoSumCalled: number;
  envidoSumAccepted: number;
  envidoNCalled: number;
  envidoNAccepted: number;

  trucoOffers: number;
  trucoAccepts: number;
  retrucoOffers: number;
  retrucoAccepts: number;
  vale4Offers: number;
  vale4Accepts: number;

  bluffOpps: number;
  bluffs: number;
  updatedAt: number;
}

const EMPTY: PlayerModel = {
  hands: 0,
  envidoCallOpps: 0,
  envidoCalls: 0,
  envidoAcceptOpps: 0,
  envidoAccepts: 0,
  envidoSumCalled: 0,
  envidoSumAccepted: 0,
  envidoNCalled: 0,
  envidoNAccepted: 0,
  trucoOffers: 0,
  trucoAccepts: 0,
  retrucoOffers: 0,
  retrucoAccepts: 0,
  vale4Offers: 0,
  vale4Accepts: 0,
  bluffOpps: 0,
  bluffs: 0,
  updatedAt: 0,
};

function ratio(x: number, n: number, prior: number, alpha = 4): number {
  return (x + alpha * prior) / (n + 2 * alpha);
}

export interface PlayerStats {
  hands: number;
  envidoCallRate: number;
  envidoAcceptRate: number;
  envidoAvgCalled: number;
  envidoAvgAccepted: number;
  trucoAcceptRate: number;
  retrucoAcceptRate: number;
  vale4AcceptRate: number;
  bluffRate: number;
}

export function statsFrom(m: PlayerModel): PlayerStats {
  return {
    hands: m.hands,
    envidoCallRate: ratio(m.envidoCalls, m.envidoCallOpps, 0.45),
    envidoAcceptRate: ratio(m.envidoAccepts, m.envidoAcceptOpps, 0.55),
    envidoAvgCalled: m.envidoNCalled ? m.envidoSumCalled / m.envidoNCalled : 26,
    envidoAvgAccepted: m.envidoNAccepted ? m.envidoSumAccepted / m.envidoNAccepted : 25,
    trucoAcceptRate: ratio(m.trucoAccepts, m.trucoOffers, 0.6),
    retrucoAcceptRate: ratio(m.retrucoAccepts, m.retrucoOffers, 0.45),
    vale4AcceptRate: ratio(m.vale4Accepts, m.vale4Offers, 0.35),
    bluffRate: ratio(m.bluffs, m.bluffOpps, 0.15),
  };
}

interface Store {
  model: PlayerModel;
  stats: () => PlayerStats;
  record: (events: PlayerEvent[]) => void;
  reset: () => void;
}

export const useTrucoPlayerModel = create<Store>()(
  persist(
    (set, get) => ({
      model: EMPTY,
      stats: () => statsFrom(get().model),
      record: (events) => {
        set((s) => {
          const m = { ...s.model };
          for (const e of events) {
            switch (e.kind) {
              case "envido:called":
                m.envidoCallOpps += 1;
                m.envidoCalls += 1;
                if (typeof e.value === "number") {
                  m.envidoSumCalled += e.value;
                  m.envidoNCalled += 1;
                }
                break;
              case "envido:not-called":
                if (e.asMano) m.envidoCallOpps += 1;
                break;
              case "envido:accepted":
                m.envidoAcceptOpps += 1;
                m.envidoAccepts += 1;
                if (typeof e.value === "number") {
                  m.envidoSumAccepted += e.value;
                  m.envidoNAccepted += 1;
                }
                break;
              case "envido:declined":
                m.envidoAcceptOpps += 1;
                break;
              case "truco:accepted":
                if (e.level === "truco") {
                  m.trucoOffers += 1;
                  m.trucoAccepts += 1;
                }
                if (e.level === "retruco") {
                  m.retrucoOffers += 1;
                  m.retrucoAccepts += 1;
                }
                if (e.level === "vale4") {
                  m.vale4Offers += 1;
                  m.vale4Accepts += 1;
                }
                break;
              case "truco:declined":
                if (e.level === "truco") m.trucoOffers += 1;
                if (e.level === "retruco") m.retrucoOffers += 1;
                if (e.level === "vale4") m.vale4Offers += 1;
                break;
              case "truco:called":
                m.bluffOpps += 1;
                if ((e.strength ?? 1) < 0.35) m.bluffs += 1;
                break;
              case "bluffed":
                m.bluffOpps += 1;
                m.bluffs += 1;
                break;
            }
          }
          m.updatedAt = Date.now();
          m.hands =
            m.hands +
            (events.some((e) => e.kind === "envido:called" || e.kind === "envido:not-called")
              ? 1
              : 0);
          return { model: m };
        });
      },
      reset: () => set({ model: EMPTY }),
    }),
    { name: "cuervo:truco-player-model:v1" },
  ),
);
