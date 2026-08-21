import { useCallback, useEffect, useMemo, useState } from "react";
import {
  mahjongDailyKey,
  todaysMahjongObjectives,
  type MahjongObjectiveDef,
} from "@/lib/games/mahjong/mahjong-daily";
import { useFavors } from "@/store/favors";

const STORAGE_KEY = "cuervo-dorado:mahjong:daily:v1";

interface ObjectiveProgress {
  count: number;
  done: boolean;
  claimed: boolean;
}

interface StoredState {
  dateKey: string;
  byId: Record<string, ObjectiveProgress>;
}

function empty(dateKey: string): StoredState {
  return { dateKey, byId: {} };
}

function load(dateKey: string): StoredState {
  if (typeof window === "undefined") return empty(dateKey);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty(dateKey);
    const parsed = JSON.parse(raw) as StoredState;
    if (parsed.dateKey !== dateKey) return empty(dateKey);
    return { dateKey, byId: { ...parsed.byId } };
  } catch {
    return empty(dateKey);
  }
}

function persist(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export interface MahjongObjectiveView extends MahjongObjectiveDef {
  progress: number;
  done: boolean;
  claimed: boolean;
}

export interface MahjongRunEvent {
  deltaTrios?: number;
  deltaSpecialTrios?: number;
  deltaScore?: number;
  won?: boolean;
  winTimeSec?: number;
  hintsUsedInRun?: number;
}

export function useMahjongDaily() {
  const today = mahjongDailyKey();
  const objectives = useMemo(() => todaysMahjongObjectives(), []);
  const [state, setState] = useState<StoredState>(() => empty(today));
  const favors = useFavors();

  useEffect(() => {
    setState(load(today));
  }, [today]);

  useEffect(() => {
    persist(state);
  }, [state]);

  const bump = useCallback((id: string, target: number, delta: number, satisfies: boolean) => {
    setState((s) => {
      const prev = s.byId[id] ?? { count: 0, done: false, claimed: false };
      if (prev.done) return s;
      const nextCount = Math.min(target, prev.count + delta);
      const done = satisfies || nextCount >= target;
      return {
        ...s,
        byId: {
          ...s.byId,
          [id]: { count: done ? target : nextCount, done, claimed: prev.claimed },
        },
      };
    });
  }, []);

  const tick = useCallback(
    (ev: MahjongRunEvent) => {
      for (const obj of objectives) {
        switch (obj.kind) {
          case "trios":
            if (ev.deltaTrios) bump(obj.id, obj.target, ev.deltaTrios, false);
            break;
          case "specialTrios":
            if (ev.deltaSpecialTrios) bump(obj.id, obj.target, ev.deltaSpecialTrios, false);
            break;
          case "score":
            if (ev.deltaScore && ev.deltaScore > 0) bump(obj.id, obj.target, ev.deltaScore, false);
            break;
          case "winAny":
            if (ev.won) bump(obj.id, obj.target, 1, false);
            break;
          case "winUnder":
            if (ev.won && ev.winTimeSec != null && ev.winTimeSec <= obj.target)
              bump(obj.id, obj.target, obj.target, true);
            break;
          case "winWithoutHint":
            if (ev.won && (ev.hintsUsedInRun ?? 0) === 0) bump(obj.id, obj.target, 1, true);
            break;
        }
      }
    },
    [bump, objectives],
  );

  const claim = useCallback(
    (id: string): { favors: number; xp: number } | null => {
      const def = objectives.find((o) => o.id === id);
      if (!def) return null;
      const cur = state.byId[id];
      if (!cur || !cur.done || cur.claimed) return null;
      setState((s) => ({
        ...s,
        byId: {
          ...s.byId,
          [id]: {
            ...(s.byId[id] ?? { count: def.target, done: true, claimed: false }),
            claimed: true,
          },
        },
      }));
      favors.earn(def.favors, "daily");
      return { favors: def.favors, xp: def.xp };
    },
    [favors, objectives, state.byId],
  );

  const view: MahjongObjectiveView[] = objectives.map((o) => {
    const p = state.byId[o.id] ?? { count: 0, done: false, claimed: false };
    return {
      ...o,
      progress: Math.min(1, p.count / o.target),
      done: p.done || p.count >= o.target,
      claimed: p.claimed,
    };
  });

  const totalXp = view.filter((v) => v.claimed).reduce((a, v) => a + v.xp, 0);
  const allDone = view.every((v) => v.done);

  return { objectives: view, tick, claim, totalXp, allDone };
}
