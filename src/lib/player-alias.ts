import { getStoredAlias, setStoredAlias } from "@/lib/identity";
import { getCurrentShift, type Shift } from "@/lib/casino-shift";

const LAST_CHANGE_KEY = "cuervo:alias:lastChange";
const CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const ALIAS_POOLS: Record<Shift, string[]> = {
  manana: ["Resaca", "Última Ronda", "Buen Día", "Café Negro", "Madrugón"],
  tarde: ["El Forastero", "Sombrero Nuevo", "Don Nadie", "Manos Limpias", "El Cliente"],
  noche: ["El Cuervo", "Luna Vieja", "Sin Nombre", "El de la Esquina", "Pulgar Negro"],
};

export function getAliasSuggestions(shift: Shift = getCurrentShift()): string[] {
  return ALIAS_POOLS[shift];
}

export function getPlayerAlias(): string {
  return getStoredAlias() ?? "Forastero";
}

export function setPlayerAlias(alias: string) {
  const cleaned = alias.trim().slice(0, 20);
  if (cleaned.length < 2) throw new Error("El alias necesita al menos 2 letras.");
  setStoredAlias(cleaned);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_CHANGE_KEY, String(Date.now()));
    window.dispatchEvent(new CustomEvent("cuervo:alias:changed", { detail: cleaned }));
  }
}

export function canChangeAlias(): boolean {
  if (typeof window === "undefined") return true;
  const last = Number(window.localStorage.getItem(LAST_CHANGE_KEY) ?? "0");
  if (!last) return true;
  return Date.now() - last >= CHANGE_COOLDOWN_MS;
}

export function nextAliasChangeIn(): number {
  if (typeof window === "undefined") return 0;
  const last = Number(window.localStorage.getItem(LAST_CHANGE_KEY) ?? "0");
  if (!last) return 0;
  return Math.max(0, CHANGE_COOLDOWN_MS - (Date.now() - last));
}

export function withAlias(line: string): string {
  return line.replace(/\{alias\}/g, getPlayerAlias());
}
