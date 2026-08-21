export interface TourneyRoomToastPayload {
  game: string;
  label: string;
  score: number;
  best: number;
  participationReward: number;
  rewardGranted: boolean;
}

const EVENT_NAME = "tourney-room-toast";
const STORAGE_KEY = "tourney:room-toast:v1";

export function notifyTourneyRoomToast(payload: TourneyRoomToastPayload) {
  if (typeof window === "undefined") return;
  const next = { ...payload, at: Date.now() };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
}

export function readPendingTourneyRoomToast(): (TourneyRoomToastPayload & { at: number }) | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TourneyRoomToastPayload & { at: number };
    if (!parsed?.at || Date.now() - parsed.at > 12000) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingTourneyRoomToast() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export { EVENT_NAME as TOURNEY_ROOM_TOAST_EVENT };
