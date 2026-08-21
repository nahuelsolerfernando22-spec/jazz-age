export type Climate = "festivo" | "tenso" | "neutro" | "melancolico";

const KEY = "venue:climate:events:v1";
const WINDOW_MS = 30 * 60 * 1000;

type Event = { t: number; kind: "win" | "loss" };

function load(): Event[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const cutoff = Date.now() - WINDOW_MS;
    return (JSON.parse(raw) as Event[]).filter((e) => e.t >= cutoff);
  } catch {
    return [];
  }
}

function save(events: Event[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events.slice(-100)));
  } catch {}
}

export function recordVenueEvent(kind: "win" | "loss") {
  const events = load();
  events.push({ t: Date.now(), kind });
  save(events);
}

export function getClimate(): Climate {
  const events = load();
  if (events.length < 3) return "neutro";
  const wins = events.filter((e) => e.kind === "win").length;
  const losses = events.length - wins;
  const ratio = wins / events.length;
  if (events.length >= 8 && ratio >= 0.65) return "festivo";
  if (events.length >= 8 && ratio <= 0.25) return "tenso";
  if (losses >= 5 && wins <= 1) return "melancolico";
  return "neutro";
}

export const CLIMATE_META: Record<
  Climate,
  { label: string; tint: string; glow: string; ambient: string }
> = {
  festivo: {
    label: "Noche encendida",
    tint: "rgba(212, 175, 55, 0.08)",
    glow: "0 0 60px rgba(212, 175, 55, 0.15)",
    ambient: "Risas y copas chocando al fondo.",
  },
  tenso: {
    label: "Aire pesado",
    tint: "rgba(120, 20, 30, 0.10)",
    glow: "0 0 60px rgba(120, 20, 30, 0.18)",
    ambient: "Murmullos secos. Alguien acaba de perder fuerte.",
  },
  melancolico: {
    label: "Hora azul",
    tint: "rgba(40, 50, 80, 0.10)",
    glow: "0 0 60px rgba(40, 50, 80, 0.15)",
    ambient: "Un piano lento desde el salón.",
  },
  neutro: {
    label: "Marcha pareja",
    tint: "transparent",
    glow: "none",
    ambient: "El murmullo habitual del Cuervo.",
  },
};
