import { useSettings } from "@/store/settings";

const STORE_KEY = "cuervo:analytics:v1";
const INSTALL_KEY = "cuervo:analytics:install-id";
const CAP = 500;

export type AnalyticsEvent =
  | "session_start"
  | "session_end"
  | "game_open"
  | "game_finish"
  | "mission_completed"
  | "mission_streak_bonus"
  | "reward_claimed"
  | "tutorial_step"
  | "tutorial_completed"
  | "tutorial_skipped"
  | "purchase_intent"
  | "purchase_success";

export interface TrackedEvent {
  ev: AnalyticsEvent;
  ts: number;
  props?: Record<string, string | number | boolean | null>;
}

function safeLS(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function getInstallId(): string {
  const ls = safeLS();
  if (!ls) return "anon";
  let id = ls.getItem(INSTALL_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    ls.setItem(INSTALL_KEY, id);
  }
  return id;
}

function push(evt: TrackedEvent) {
  const ls = safeLS();
  if (!ls) return;
  try {
    const raw = ls.getItem(STORE_KEY);
    const buf: TrackedEvent[] = raw ? JSON.parse(raw) : [];
    buf.push(evt);
    while (buf.length > CAP) buf.shift();
    ls.setItem(STORE_KEY, JSON.stringify(buf));
  } catch {}
}

export function track(ev: AnalyticsEvent, props?: TrackedEvent["props"]): void {
  try {
    const enabled = useSettings.getState().analyticsEnabled;
    if (!enabled) return;
    const evt: TrackedEvent = {
      ev,
      ts: Date.now(),
      props: { installId: getInstallId(), ...(props ?? {}) },
    };
    const schedule = (fn: () => void) => {
      const w = typeof window !== "undefined" ? window : null;
      const ric =
        w && "requestIdleCallback" in w
          ? (w as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback
          : null;
      if (ric) ric(fn);
      else setTimeout(fn, 0);
    };
    schedule(() => push(evt));
  } catch {}
}

export function readBuffer(): TrackedEvent[] {
  const ls = safeLS();
  if (!ls) return [];
  try {
    return JSON.parse(ls.getItem(STORE_KEY) ?? "[]") as TrackedEvent[];
  } catch {
    return [];
  }
}

export function clearBuffer(): void {
  safeLS()?.removeItem(STORE_KEY);
}

let sessionInstalled = false;
export function installAnalyticsSession(): void {
  if (sessionInstalled || typeof window === "undefined") return;
  sessionInstalled = true;
  track("session_start");
  const end = () => track("session_end");
  window.addEventListener("pagehide", end);
  window.addEventListener("beforeunload", end);
}
