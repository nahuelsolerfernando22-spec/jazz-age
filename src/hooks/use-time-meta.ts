import { useEffect, useState } from "react";
import { getTimeMeta, type TimeMeta } from "@/lib/time-of-day";

type Listener = (m: TimeMeta) => void;
const listeners = new Set<Listener>();
let current: TimeMeta = getTimeMeta();
let timer: number | null = null;

function tick() {
  const next = getTimeMeta();
  if (next.band !== current.band) {
    current = next;
    listeners.forEach((l) => l(next));
  }
}

function ensureTimer() {
  if (timer !== null || typeof window === "undefined") return;

  timer = window.setInterval(tick, 60_000);
}

export interface TimeMetaState {
  meta: TimeMeta;

  prev: TimeMeta | null;
}

const FADE_MS = 1200;

export function useTimeMeta(): TimeMetaState {
  const [state, setState] = useState<TimeMetaState>(() => ({
    meta: current,
    prev: null,
  }));
  useEffect(() => {
    ensureTimer();
    const listener: Listener = (next) => {
      setState((s) => ({ meta: next, prev: s.meta }));

      window.setTimeout(() => {
        setState((s) => (s.prev && s.prev.band !== s.meta.band ? s : { ...s, prev: null }));
      }, FADE_MS + 50);
    };
    listeners.add(listener);

    if (state.meta.band !== current.band) {
      setState({ meta: current, prev: state.meta });
    }
    return () => {
      listeners.delete(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

export const TIME_META_FADE_MS = FADE_MS;
