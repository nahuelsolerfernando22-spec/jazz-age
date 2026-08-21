const DEFAULT_MS = 6000;
const STORAGE_KEY = "cuervo:raid-escalate-ms";
const LAST_LOCATION_KEY = "cuervo:last-location";

function readEnvMs(): number | null {
  const raw = import.meta.env.VITE_RAID_ESCALATE_MS as string | undefined;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readOverrideMs(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function getRaidEscalateMs(): number {
  return readOverrideMs() ?? readEnvMs() ?? DEFAULT_MS;
}

export interface SavedLocation {
  pathname: string;
  search: string;
}

export function saveLastLocation(loc: SavedLocation): void {
  if (typeof window === "undefined") return;

  if (loc.pathname.startsWith("/qa/raid")) return;
  try {
    window.sessionStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(loc));
  } catch {}
}

export function getLastLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedLocation;
    if (typeof parsed?.pathname === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}
