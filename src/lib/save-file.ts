import {
  buildEnvelope,
  inspectEnvelope,
  openEnvelope,
  isCryptoAvailable,
  SaveFileError,
  type EnvelopeMeta,
} from "./local-crypto";

const PREFIX = "cuervo:";
const CRYPTO_KEY_KEY = "cuervo:crypto:key:v1";
export const SNAPSHOT_SCHEMA = 1;
const SNAPSHOT_SCHEMA_MAX = 1;
export const RESTORE_FLAG_KEY = "cuervo:restore:justHappened";

export interface SaveSnapshot {
  version: number;
  app?: "cuervo-dorado";
  createdAt: string;
  deviceAlias: string;
  entries: Record<string, string>;
}

export interface RestorePreview {
  meta: EnvelopeMeta;
  snapshot: SaveSnapshot;
  entryCount: number;
  currentCount: number;
  payloadBytes: number;
}

export interface RestoreProgress {
  phase: "backup" | "clear" | "write" | "done";
  current: number;
  total: number;
}

function collectSnapshot(): SaveSnapshot {
  const entries: Record<string, string> = {};
  if (typeof window === "undefined") {
    return {
      version: SNAPSHOT_SCHEMA,
      app: "cuervo-dorado",
      createdAt: new Date().toISOString(),
      deviceAlias: "",
      entries,
    };
  }
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k) continue;
    if (!k.startsWith(PREFIX)) continue;
    if (k === CRYPTO_KEY_KEY) continue;
    const v = window.localStorage.getItem(k);
    if (v != null) entries[k] = v;
  }
  const alias = window.localStorage.getItem("cuervo:alias") ?? "Forastero";
  return {
    version: SNAPSHOT_SCHEMA,
    app: "cuervo-dorado",
    createdAt: new Date().toISOString(),
    deviceAlias: alias,
    entries,
  };
}

function currentCuervoKeys(): string[] {
  const out: string[] = [];
  if (typeof window === "undefined") return out;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(PREFIX) && k !== CRYPTO_KEY_KEY) out.push(k);
  }
  return out;
}

function assertValidSnapshot(snap: unknown): asserts snap is SaveSnapshot {
  if (!snap || typeof snap !== "object") {
    throw new SaveFileError("corrupt", "El guardado descifrado está vacío.");
  }
  const s = snap as Partial<SaveSnapshot>;
  const v = typeof s.version === "number" ? s.version : 1;
  if (v < 1 || v > SNAPSHOT_SCHEMA_MAX) {
    throw new SaveFileError(
      "bad_schema",
      `Este guardado usa un formato de datos (schema ${v}) que esta versión del juego no entiende.`,
    );
  }
  if (!s.entries || typeof s.entries !== "object" || Array.isArray(s.entries)) {
    throw new SaveFileError("corrupt", "El guardado no contiene claves válidas.");
  }
  for (const [k, val] of Object.entries(s.entries)) {
    if (typeof k !== "string" || typeof val !== "string") {
      throw new SaveFileError("corrupt", "Alguna entrada del guardado no tiene el tipo esperado.");
    }
    if (!k.startsWith(PREFIX)) {
      throw new SaveFileError(
        "corrupt",
        `Entrada fuera del namespace del juego: ${k.slice(0, 30)}…`,
      );
    }
  }
}

function commitRestoreSync(
  snap: SaveSnapshot,
  onProgress?: (p: RestoreProgress) => void,
): { restored: number } {
  if (typeof window === "undefined") return { restored: 0 };

  const currentKeys = currentCuervoKeys();
  const backup: Record<string, string> = {};
  currentKeys.forEach((k, i) => {
    const v = window.localStorage.getItem(k);
    if (v != null) backup[k] = v;
    onProgress?.({ phase: "backup", current: i + 1, total: currentKeys.length });
  });

  const entries = Object.entries(snap.entries).filter(
    ([k, v]) =>
      typeof k === "string" &&
      typeof v === "string" &&
      k.startsWith(PREFIX) &&
      k !== CRYPTO_KEY_KEY,
  );

  try {
    currentKeys.forEach((k, i) => {
      window.localStorage.removeItem(k);
      onProgress?.({ phase: "clear", current: i + 1, total: currentKeys.length });
    });

    let n = 0;
    for (let i = 0; i < entries.length; i++) {
      const [k, v] = entries[i];
      window.localStorage.setItem(k, v);
      n++;
      onProgress?.({ phase: "write", current: i + 1, total: entries.length });
    }
    onProgress?.({ phase: "done", current: entries.length, total: entries.length });
    return { restored: n };
  } catch (err) {
    try {
      const written = currentCuervoKeys();
      written.forEach((k) => window.localStorage.removeItem(k));
      for (const [k, v] of Object.entries(backup)) window.localStorage.setItem(k, v);
    } catch {}
    throw new SaveFileError(
      "corrupt",
      `No se pudo escribir el guardado (${err instanceof Error ? err.message : String(err)}). Se restauró el estado anterior.`,
    );
  }
}

export async function exportSaveFile(): Promise<{ bytes: number; filename: string }> {
  if (!isCryptoAvailable()) throw new Error("Este dispositivo no soporta cifrado local.");
  const snap = collectSnapshot();
  const envelope = await buildEnvelope(snap, snap.deviceAlias, SNAPSHOT_SCHEMA);
  const json = JSON.stringify(envelope, null, 2);
  const blob = new Blob([json], { type: "application/octet-stream" });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `cuervo-dorado_${(snap.deviceAlias || "forastero").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}_${stamp}.cuervo`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { bytes: blob.size, filename };
}

export async function inspectSaveFile(file: File): Promise<RestorePreview> {
  if (!isCryptoAvailable()) {
    throw new SaveFileError("no_crypto", "Este dispositivo no soporta cifrado local.");
  }
  const text = await file.text();
  const { env, meta } = await inspectEnvelope(text);
  const snap = await openEnvelope<SaveSnapshot>(env);
  assertValidSnapshot(snap);
  const entryCount = Object.keys(snap.entries).length;
  const currentCount = currentCuervoKeys().length;
  return {
    meta,
    snapshot: snap,
    entryCount,
    currentCount,
    payloadBytes: text.length,
  };
}

export async function commitRestore(
  snapshot: SaveSnapshot,
  onProgress?: (p: RestoreProgress) => void,
): Promise<{ restored: number; alias: string }> {
  if (!isCryptoAvailable()) {
    throw new SaveFileError("no_crypto", "Este dispositivo no soporta cifrado local.");
  }
  assertValidSnapshot(snapshot);
  const { restored } = commitRestoreSync(snapshot, onProgress);
  const alias = window.localStorage.getItem("cuervo:alias") ?? snapshot.deviceAlias ?? "Forastero";

  try {
    window.sessionStorage.setItem(
      RESTORE_FLAG_KEY,
      JSON.stringify({ alias, restored, at: Date.now(), path: window.location.pathname }),
    );
  } catch {}
  window.dispatchEvent(new CustomEvent("cuervo:alias:changed", { detail: alias }));
  window.dispatchEvent(new CustomEvent("cuervo:save:restored", { detail: { restored } }));
  return { restored, alias };
}

export async function importSaveFile(file: File): Promise<{ restored: number; alias: string }> {
  const preview = await inspectSaveFile(file);
  return commitRestore(preview.snapshot);
}
