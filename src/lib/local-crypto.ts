const KEY_STORAGE = "cuervo:crypto:key:v1";
const MAGIC = "CVRV1";
const APP_ID = "cuervo-dorado";
const ENVELOPE_MIN = 1;
const ENVELOPE_MAX = 1;

let _cachedKey: CryptoKey | null = null;

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256B64(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toB64(hash);
}

export type SaveFileErrorCode =
  "no_crypto" | "bad_json" | "not_cuervo" | "bad_version" | "bad_schema" | "corrupt" | "wrong_key";

export class SaveFileError extends Error {
  code: SaveFileErrorCode;
  constructor(code: SaveFileErrorCode, message: string) {
    super(message);
    this.name = "SaveFileError";
    this.code = code;
  }
}

async function loadOrCreateRawKey(): Promise<Uint8Array> {
  if (typeof window === "undefined") throw new Error("crypto unavailable (ssr)");
  const existing = window.localStorage.getItem(KEY_STORAGE);
  if (existing) {
    try {
      const raw = fromB64(existing);
      if (raw.length === 32) return raw;
    } catch {}
  }
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  window.localStorage.setItem(KEY_STORAGE, toB64(raw));
  return raw;
}

async function getKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const raw = await loadOrCreateRawKey();
  _cachedKey = await crypto.subtle.importKey(
    "raw",
    raw as unknown as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
  return _cachedKey;
}

export async function encryptString(plain: string): Promise<string> {
  const key = await getKey();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const data = new TextEncoder().encode(plain);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  const out = new Uint8Array(iv.length + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), iv.length);
  return toB64(out);
}

export async function decryptString(payload: string): Promise<string> {
  const key = await getKey();
  const buf = fromB64(payload);
  if (buf.length < 13) throw new Error("payload demasiado corto");
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct as unknown as ArrayBuffer,
  );
  return new TextDecoder().decode(pt);
}

export async function encryptJSON(obj: unknown): Promise<string> {
  return encryptString(JSON.stringify(obj));
}
export async function decryptJSON<T = unknown>(payload: string): Promise<T> {
  return JSON.parse(await decryptString(payload)) as T;
}

export interface SaveEnvelope {
  magic: typeof MAGIC;
  app: typeof APP_ID;
  v: 1;
  schema: number;
  createdAt: string;
  alias?: string;
  cipher: string;
  checksum: string;
}

export async function buildEnvelope(
  payload: unknown,
  alias: string | undefined,
  schema: number,
): Promise<SaveEnvelope> {
  const cipher = await encryptJSON(payload);
  const checksum = await sha256B64(cipher);
  return {
    magic: MAGIC,
    app: APP_ID,
    v: 1,
    schema,
    createdAt: new Date().toISOString(),
    alias,
    cipher,
    checksum,
  };
}

export interface EnvelopeMeta {
  app: string;
  v: number;
  schema: number;
  createdAt: string;
  alias?: string;
  sizeBytes: number;
}

export async function inspectEnvelope(
  raw: string,
): Promise<{ env: SaveEnvelope; meta: EnvelopeMeta }> {
  let env: unknown;
  try {
    env = JSON.parse(raw);
  } catch {
    throw new SaveFileError("bad_json", "El archivo no es un guardado válido (JSON ilegible).");
  }
  if (!env || typeof env !== "object") {
    throw new SaveFileError("bad_json", "El archivo está vacío o mal formado.");
  }
  const e = env as Partial<SaveEnvelope>;
  if (e.magic !== MAGIC) {
    throw new SaveFileError("not_cuervo", "Este archivo no es un guardado de El Cuervo Dorado.");
  }

  if (e.app != null && e.app !== APP_ID) {
    throw new SaveFileError("not_cuervo", `El archivo pertenece a otra app (${String(e.app)}).`);
  }
  if (typeof e.v !== "number" || e.v < ENVELOPE_MIN || e.v > ENVELOPE_MAX) {
    throw new SaveFileError(
      "bad_version",
      `Versión de guardado no soportada (v${String(e.v)}). Actualizá el juego o exportá desde una versión compatible.`,
    );
  }
  if (typeof e.schema !== "number" || e.schema < 1) {
    e.schema = 1;
  }
  if (typeof e.cipher !== "string" || e.cipher.length < 20) {
    throw new SaveFileError("corrupt", "El archivo está corrupto (payload cifrado faltante).");
  }
  if (typeof e.createdAt !== "string") {
    e.createdAt = new Date(0).toISOString();
  }

  if (typeof e.checksum === "string" && e.checksum.length > 0) {
    const computed = await sha256B64(e.cipher);
    if (computed !== e.checksum) {
      throw new SaveFileError("corrupt", "El archivo está corrupto (checksum no coincide).");
    }
  }
  const full = e as SaveEnvelope;
  return {
    env: full,
    meta: {
      app: full.app ?? APP_ID,
      v: full.v,
      schema: full.schema,
      createdAt: full.createdAt,
      alias: full.alias,
      sizeBytes: raw.length,
    },
  };
}

export async function openEnvelope<T = unknown>(env: SaveEnvelope): Promise<T> {
  if (typeof env.cipher !== "string") {
    throw new SaveFileError("corrupt", "El archivo está corrupto (payload faltante).");
  }
  try {
    return await decryptJSON<T>(env.cipher);
  } catch {
    throw new SaveFileError(
      "wrong_key",
      "No se pudo descifrar: la llave local no coincide (¿archivo de otro dispositivo?).",
    );
  }
}

export function isCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}
