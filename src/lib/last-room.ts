import { useEffect, useState } from "react";

const KEY = "casino:last-room:v1";
const NPC_KEY = "casino:last-npc:v1";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function markLastRoom(route: string) {
  const s = safeStorage();
  if (!s) return;
  s.setItem(KEY, JSON.stringify({ route, at: Date.now() }));
  window.dispatchEvent(new CustomEvent("cuervo:last-room"));
}

export function getLastRoom(): { route: string; at: number } | null {
  const s = safeStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function trackNpcVisit(npcId: string): string | null {
  const s = safeStorage();
  if (!s || !npcId) return null;
  const prev = s.getItem(NPC_KEY);
  if (prev !== npcId) s.setItem(NPC_KEY, npcId);
  return prev && prev !== npcId ? prev : null;
}

export function getLastNpc(): string | null {
  return safeStorage()?.getItem(NPC_KEY) ?? null;
}

export function useLastRoom() {
  const [state, setState] = useState(() => getLastRoom());
  useEffect(() => {
    const on = () => setState(getLastRoom());
    window.addEventListener("cuervo:last-room", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("cuervo:last-room", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return state;
}
