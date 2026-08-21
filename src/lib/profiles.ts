import { applyBackup, collectSaveKeys, exportSavesToObject, type Backup } from "@/lib/save-backup";

const ACTIVE_KEY = "cuervo:activeProfile";
const PROFILE_PREFIX = "cuervo:profile:";

export type ProfileId = "p1" | "p2" | "p3";
export const PROFILE_IDS: ProfileId[] = ["p1", "p2", "p3"];

export interface ProfileMeta {
  id: ProfileId;
  name: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  exists: boolean;
}

interface StoredProfile {
  name: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  snapshot: Backup;
}

function key(id: ProfileId): string {
  return PROFILE_PREFIX + id;
}

function readStored(id: ProfileId): StoredProfile | null {
  try {
    const raw = localStorage.getItem(key(id));
    if (!raw) return null;
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

function writeStored(id: ProfileId, p: StoredProfile): void {
  localStorage.setItem(key(id), JSON.stringify(p));
}

export function getActiveProfile(): ProfileId | null {
  try {
    const v = localStorage.getItem(ACTIVE_KEY);
    if (v === "p1" || v === "p2" || v === "p3") return v;
    return null;
  } catch {
    return null;
  }
}

export function listProfiles(): ProfileMeta[] {
  return PROFILE_IDS.map((id) => {
    const p = readStored(id);
    if (!p) {
      return {
        id,
        name: "",
        avatar: "",
        createdAt: "",
        updatedAt: "",
        exists: false,
      };
    }
    return {
      id,
      name: p.name,
      avatar: p.avatar,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      exists: true,
    };
  });
}

function snapshotCurrent(): Backup {
  return exportSavesToObject();
}

function wipeGameKeys(): void {
  for (const k of collectSaveKeys()) {
    if (k === ACTIVE_KEY || k.startsWith(PROFILE_PREFIX)) continue;
    localStorage.removeItem(k);
  }
}

export function createProfile(
  id: ProfileId,
  name: string,
  avatar: string,
  useCurrent = false,
): ProfileMeta {
  const now = new Date().toISOString();
  const snapshot: Backup = useCurrent
    ? snapshotCurrent()
    : { magic: "cuervo-save", version: 1, exportedAt: now, data: {} };
  const stored: StoredProfile = {
    name: name.trim().slice(0, 24) || "Jugador",
    avatar: (avatar || "🐦").slice(0, 4),
    createdAt: now,
    updatedAt: now,
    snapshot,
  };
  writeStored(id, stored);
  return {
    id,
    name: stored.name,
    avatar: stored.avatar,
    createdAt: now,
    updatedAt: now,
    exists: true,
  };
}

export function renameProfile(id: ProfileId, name: string, avatar?: string): void {
  const p = readStored(id);
  if (!p) return;
  p.name = name.trim().slice(0, 24) || p.name;
  if (avatar) p.avatar = avatar.slice(0, 4);
  p.updatedAt = new Date().toISOString();
  writeStored(id, p);
}

export function deleteProfile(id: ProfileId): void {
  localStorage.removeItem(key(id));
  if (getActiveProfile() === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function saveActiveSnapshot(): void {
  const active = getActiveProfile();
  if (!active) return;
  const p = readStored(active);
  if (!p) return;
  p.snapshot = snapshotCurrent();
  p.updatedAt = new Date().toISOString();
  writeStored(active, p);
}

export function switchToProfile(id: ProfileId, reload = true): void {
  const target = readStored(id);
  if (!target) throw new Error("perfil no existe");
  saveActiveSnapshot();
  wipeGameKeys();
  applyBackup(target.snapshot, "replace");
  localStorage.setItem(ACTIVE_KEY, id);
  if (reload && typeof window !== "undefined") {
    window.location.reload();
  }
}

export function ensureProfileMigration(): void {
  if (typeof localStorage === "undefined") return;
  if (getActiveProfile()) return;
  const existing = collectSaveKeys().filter(
    (k) => k !== ACTIVE_KEY && !k.startsWith(PROFILE_PREFIX),
  );
  if (existing.length === 0) return;
  if (readStored("p1")) {
    localStorage.setItem(ACTIVE_KEY, "p1");
    return;
  }
  createProfile("p1", "Jugador", "🐦", true);
  localStorage.setItem(ACTIVE_KEY, "p1");
}

export const __test = { ACTIVE_KEY, PROFILE_PREFIX, readStored, writeStored };
