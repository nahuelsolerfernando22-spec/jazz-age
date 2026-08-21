/**
 * Almacenamiento local tolerante a fallos.
 *
 * En Android el WebView puede quedarse sin cuota, matar la app a mitad de una
 * escritura o guardar un JSON truncado. Si una pantalla lee esa clave con
 * `JSON.parse` directo, revienta y el jugador ve una pantalla en blanco.
 *
 * Este módulo centraliza tres cosas:
 *   1. lectura tolerante: si la clave está rota se descarta (cuarentena) y se
 *      devuelve el valor por defecto en vez de tirar la pantalla abajo,
 *   2. versión de esquema por clave, con migración explícita, para que una
 *      actualización de la app no borre partidas ni progreso,
 *   3. escritura segura: si no hay cuota, se libera lo descartable y se
 *      reintenta una vez antes de rendirse en silencio.
 */

export const STORE_PREFIX = "cuervo:";
/** Claves que se pueden tirar sin perder progreso si falta cuota. */
const DISPOSABLE_PREFIXES = ["cuervo:cache:", "cuervo:tmp:", "cuervo:preload:"];
const QUARANTINE_KEY = "cuervo:store:quarantine:v1";

export interface StoreSlot<T> {
  key: string;
  version: number;
  fallback: T;
  /** Convierte datos de una versión anterior. Devolver null descarta el dato. */
  migrate?: (data: unknown, fromVersion: number) => T | null;
  /** Validación mínima del dato ya migrado. */
  validate?: (data: unknown) => data is T;
}

interface Envelope {
  v: number;
  d: unknown;
}

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function quarantine(key: string, reason: string) {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
    const raw = window.localStorage.getItem(QUARANTINE_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [...new Set([...list, key])].slice(-40);
    window.localStorage.setItem(QUARANTINE_KEY, JSON.stringify(next));
  } catch {
    /* si ni siquiera se puede limpiar, no hay nada más que hacer */
  }
  if (import.meta.env.DEV) console.warn("[local-store] clave descartada", key, reason);
}

/** Claves que se descartaron por corrupción (diagnóstico en Ajustes). */
export function quarantinedKeys(): string[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(QUARANTINE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function clearQuarantineLog(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(QUARANTINE_KEY);
  } catch {}
}

/** Lee texto plano sin romper nunca. */
export function readRaw(key: string): string | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function freeDisposableSpace(): boolean {
  if (!hasStorage()) return false;
  let freed = false;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && DISPOSABLE_PREFIXES.some((p) => k.startsWith(p))) doomed.push(k);
    }
    doomed.forEach((k) => window.localStorage.removeItem(k));
    freed = doomed.length > 0;
  } catch {}
  return freed;
}

/** Escribe texto plano; devuelve false si no se pudo (cuota, modo privado). */
export function writeRaw(key: string, value: string): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    if (!freeDisposableSpace()) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

export function removeKey(key: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

/** Lee una ranura versionada. Nunca lanza: ante cualquier duda, `fallback`. */
export function readSlot<T>(slot: StoreSlot<T>): T {
  const raw = readRaw(slot.key);
  if (raw == null) return slot.fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    quarantine(slot.key, "json inválido");
    return slot.fallback;
  }

  const env = parsed as Partial<Envelope>;
  const versioned = env && typeof env === "object" && typeof env.v === "number";
  const version = versioned ? (env.v as number) : 0;
  let data: unknown = versioned ? env.d : parsed;

  if (version !== slot.version) {
    if (!slot.migrate) {
      quarantine(slot.key, `sin migración de v${version} a v${slot.version}`);
      return slot.fallback;
    }
    try {
      const migrated = slot.migrate(data, version);
      if (migrated == null) {
        quarantine(slot.key, "migración descartó el dato");
        return slot.fallback;
      }
      data = migrated;
      writeSlot(slot, migrated);
    } catch {
      quarantine(slot.key, "migración falló");
      return slot.fallback;
    }
  }

  if (slot.validate && !slot.validate(data)) {
    quarantine(slot.key, "no pasó la validación");
    return slot.fallback;
  }
  return data as T;
}

export function writeSlot<T>(slot: StoreSlot<T>, value: T): boolean {
  try {
    return writeRaw(slot.key, JSON.stringify({ v: slot.version, d: value } satisfies Envelope));
  } catch {
    return false;
  }
}

export function clearSlot<T>(slot: StoreSlot<T>): void {
  removeKey(slot.key);
}

/** Lectura suelta de JSON legado (claves sin envoltorio de versión). */
export function readJson<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    quarantine(key, "json legado inválido");
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    return writeRaw(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
