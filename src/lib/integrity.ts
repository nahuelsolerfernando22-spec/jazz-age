const SALT_PARTS = ["cu3rv0", "n01r", "1928", "ajenjo"];
const SALT = SALT_PARTS.join("::");

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function sign(payload: string): string {
  const a = fnv1a(SALT + payload);
  const b = fnv1a(a + payload.length + SALT);
  return `${a}${b}`;
}

export function verify(payload: string, signature: string): boolean {
  if (typeof signature !== "string" || signature.length !== 16) return false;
  return sign(payload) === signature;
}

interface Envelope {
  v: unknown;
  s: string;
  t: number;
}

export function signedStorage(base: Storage): Storage {
  return {
    getItem(key: string) {
      const raw = base.getItem(key);
      if (raw == null) return null;
      try {
        const env = JSON.parse(raw) as Envelope;
        if (!env || typeof env.v !== "string" || typeof env.s !== "string") {
          return null;
        }
        if (!verify(env.v, env.s)) {
          try {
            base.removeItem(key);
          } catch {}
          return null;
        }
        return env.v;
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string) {
      const env: Envelope = { v: value, s: sign(value), t: Date.now() };
      base.setItem(key, JSON.stringify(env));
    },
    removeItem(key: string) {
      base.removeItem(key);
    },
    clear() {
      base.clear();
    },
    key(i: number) {
      return base.key(i);
    },
    get length() {
      return base.length;
    },
  };
}

export function packSigned<T>(value: T): string {
  const json = JSON.stringify(value);
  const env: Envelope = { v: json, s: sign(json), t: Date.now() };
  return JSON.stringify(env);
}

export function unpackSigned<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as Envelope;
    if (!env || typeof env.v !== "string" || typeof env.s !== "string") return null;
    if (!verify(env.v, env.s)) return null;
    return JSON.parse(env.v) as T;
  } catch {
    return null;
  }
}
