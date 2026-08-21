import { useMemo } from "react";
import { currentWeeklyEvent, type WeeklyEvent } from "@/lib/weeklyEvents";

export type TimeBand = "madrugada" | "manana" | "tarde" | "noche" | "cierre";
export type Season = "invierno" | "primavera" | "verano" | "otono";

const DAILY_HOSTESS_POOL = [
  "corvina",
  "perla",
  "luciera",
  "daphne",
  "vita",
  "yolanda",
  "jade",
  "zulme",
  "lola",
  "madge",
  "bettie",
  "mirla",
  "eulalia",
] as const;
export type DailyHostessId = (typeof DAILY_HOSTESS_POOL)[number];

function localDayOfYear(d: Date): number {
  const current = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const start = Date.UTC(d.getFullYear(), 0, 0);
  return Math.floor((current - start) / 86400000);
}

export function timeBandFor(hour: number): TimeBand {
  if (hour < 5) return "madrugada";
  if (hour < 12) return "manana";
  if (hour < 18) return "tarde";
  if (hour < 23) return "noche";
  return "cierre";
}

export function seasonFor(d: Date): Season {
  const m = d.getMonth();
  if (m <= 1 || m === 11) return "invierno";
  if (m <= 4) return "primavera";
  if (m <= 7) return "verano";
  return "otono";
}

export function featuredHostessFor(d: Date): DailyHostessId {
  return DAILY_HOSTESS_POOL[localDayOfYear(d) % DAILY_HOSTESS_POOL.length];
}

export interface EventContext {
  weekly: WeeklyEvent;
  featuredHostess: DailyHostessId;
  timeBand: TimeBand;
  season: Season;
  hour: number;
  dayOfWeek: number;
}

export function getEventContext(now: Date = new Date()): EventContext {
  const hour = now.getHours();
  return {
    weekly: currentWeeklyEvent(now),
    featuredHostess: featuredHostessFor(now),
    timeBand: timeBandFor(hour),
    season: seasonFor(now),
    hour,
    dayOfWeek: now.getDay(),
  };
}

export function useEventContext(): EventContext {
  const now = new Date();
  const stamp = `${now.toDateString()}-${now.getHours()}`;
  return useMemo(() => getEventContext(now), [stamp]);
}
