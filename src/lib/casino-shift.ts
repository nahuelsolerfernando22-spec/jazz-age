export type Shift = "manana" | "tarde" | "noche";

export function getCurrentShift(date: Date = new Date()): Shift {
  const h = date.getHours();
  if (h >= 6 && h < 14) return "manana";
  if (h >= 14 && h < 22) return "tarde";
  return "noche";
}

export function shiftLabel(s: Shift): string {
  return s === "manana" ? "Madrugada / mañana" : s === "tarde" ? "Tarde" : "Noche cerrada";
}
