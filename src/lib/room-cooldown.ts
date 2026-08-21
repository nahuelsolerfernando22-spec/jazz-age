import { useEffect, useState } from "react";

const COOLDOWN_KEY = (g: string) => `room:cooldown:${g}`;
const STREAK_KEY = (g: string) => `room:lossstreak:${g}`;
const DEFAULT_THRESHOLD = 5;
const DEFAULT_MINUTES = 15;

function safeSession(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function noteRoomResult(gameId: string, result: "win" | "loss" | "draw"): boolean {
  const ss = safeSession();
  if (!ss) return false;
  const key = STREAK_KEY(gameId);
  if (result === "loss") {
    const next = Number(ss.getItem(key) ?? "0") + 1;
    ss.setItem(key, String(next));
    if (next >= DEFAULT_THRESHOLD) {
      setCooldown(gameId, DEFAULT_MINUTES);
      ss.setItem(key, "0");
      return true;
    }
  } else if (result === "win") {
    ss.setItem(key, "0");
  }
  return false;
}

export function setCooldown(gameId: string, minutes: number) {
  const ss = safeSession();
  if (!ss) return;
  ss.setItem(COOLDOWN_KEY(gameId), String(Date.now() + minutes * 60_000));
  window.dispatchEvent(new CustomEvent("cuervo:cooldown:set", { detail: { gameId } }));
}

export function clearCooldown(gameId: string) {
  const ss = safeSession();
  if (!ss) return;
  ss.removeItem(COOLDOWN_KEY(gameId));
}

export function getCooldownUntil(gameId: string): number {
  const ss = safeSession();
  if (!ss) return 0;
  return Number(ss.getItem(COOLDOWN_KEY(gameId)) ?? "0");
}

export function isOnCooldown(gameId: string): boolean {
  return getCooldownUntil(gameId) > Date.now();
}

export function getCooldownSecondsLeft(gameId: string): number {
  return Math.max(0, Math.ceil((getCooldownUntil(gameId) - Date.now()) / 1000));
}

export function useRoomCooldown(gameId: string) {
  const [secondsLeft, setSecondsLeft] = useState(() => getCooldownSecondsLeft(gameId));
  useEffect(() => {
    const tick = () => setSecondsLeft(getCooldownSecondsLeft(gameId));
    tick();
    const id = window.setInterval(tick, 1000);
    const onSet = () => tick();
    window.addEventListener("cuervo:cooldown:set", onSet as EventListener);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("cuervo:cooldown:set", onSet as EventListener);
    };
  }, [gameId]);
  return { secondsLeft, onCooldown: secondsLeft > 0 };
}
