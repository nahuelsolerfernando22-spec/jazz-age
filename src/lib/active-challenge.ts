import { useEffect, useState } from "react";

const KEY = "salon:active-challenge:v1";
const EVT = "challenge:changed";

export type ActiveChallenge = {
  wandererId: string;
  wandererName: string;
  wandererPortrait: string;
  gameRoute: string;
  gameLabel: string;
  taunt?: string;
  startedAt: number;
};

function safeParse(raw: string | null): ActiveChallenge | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as ActiveChallenge;
    if (!v || !v.wandererId || !v.gameRoute) return null;
    return v;
  } catch {
    return null;
  }
}

export function getActiveChallenge(): ActiveChallenge | null {
  if (typeof window === "undefined") return null;
  return safeParse(window.localStorage.getItem(KEY));
}

export function setActiveChallenge(
  c: ActiveChallenge,
  opts: { force?: boolean } = {},
): { ok: true } | { ok: false; current: ActiveChallenge } {
  if (typeof window === "undefined") return { ok: true };
  const current = getActiveChallenge();
  if (current && !opts.force) return { ok: false, current };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
  return { ok: true };
}

export function clearActiveChallenge() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

export function useActiveChallenge(): ActiveChallenge | null {
  const [state, setState] = useState<ActiveChallenge | null>(() => getActiveChallenge());
  useEffect(() => {
    const sync = () => setState(getActiveChallenge());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return state;
}
