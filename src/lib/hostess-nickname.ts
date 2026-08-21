import { weaknessOf } from "./hostess-rivalry";

const STORAGE_KEY = "hostess-nicknames:v1";

export interface Nickname {
  hostessId: string;
  nickname: string;
  sourceTag: string;
  mintedAt: number;
}

type Store = Record<string, Nickname>;

const POOL: Array<{ match: RegExp; apodos: string[] }> = [
  { match: /^bluff:/, apodos: ["el Farolero", "la Faroleta", "el Camisa-Blanca"] },
  { match: /^raise:big/, apodos: ["el Mano-Suelta", "el Todo-o-Nada"] },
  { match: /^raise/, apodos: ["el Empujador", "la Que-Sube"] },
  { match: /^capture:/, apodos: ["la Guillotina", "el Carnicero"] },
  { match: /^opening:/, apodos: ["el Metódico", "la Manual"] },
  { match: /^dice:/, apodos: ["el Suertudo", "la Cargada"] },
  { match: /^round:/, apodos: ["la Cadenciosa", "el Reloj"] },
  { match: /^bet:/, apodos: ["el Apretado", "el Miserable"] },
  { match: /^combo:/, apodos: ["la Combinera", "el Encadenador"] },
  { match: /^stars:0/, apodos: ["el Torpe", "la Manos-Frías"] },
  { match: /^verse:/, apodos: ["el Desafinado", "la Tarde"] },
  { match: /^spin:/, apodos: ["el Sudoroso", "la Ansiosa"] },
  { match: /^outcome:/, apodos: ["el de la Mala Racha", "la Perdedora"] },
  { match: /^sapo:/, apodos: ["el Manco", "la Mala Puntería"] },
  { match: /^discard/, apodos: ["el que Tira Bueno", "la Distraída"] },
  { match: /^move/, apodos: ["el Predecible", "el Libro-Abierto"] },
];

const DEFAULT_POOL = ["la Sombra", "el Sin-Nombre", "la Que-Vuelve"];

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickFromPool(hostessId: string, tag: string): string {
  const entry = POOL.find((p) => p.match.test(tag));
  const pool = entry?.apodos ?? DEFAULT_POOL;
  const idx = hashString(hostessId + "::" + tag) % pool.length;
  return pool[idx] ?? DEFAULT_POOL[0];
}

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function save(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function getNickname(hostessId: string): Nickname | null {
  if (!hostessId) return null;
  return load()[hostessId] ?? null;
}

export function nicknameFor(hostessId: string): string | null {
  return getNickname(hostessId)?.nickname ?? null;
}

export function maybeMintNickname(hostessId: string): Nickname | null {
  if (!hostessId) return null;
  const store = load();
  if (store[hostessId]) return store[hostessId];
  const tag = weaknessOf(hostessId);
  if (!tag) return null;
  const nick: Nickname = {
    hostessId,
    nickname: pickFromPool(hostessId, tag),
    sourceTag: tag,
    mintedAt: Date.now(),
  };
  store[hostessId] = nick;
  save(store);
  return nick;
}

export function resetNicknames(hostessId?: string): void {
  const s = load();
  if (hostessId) delete s[hostessId];
  else for (const k of Object.keys(s)) delete s[k];
  save(s);
}

export function listNicknames(): Nickname[] {
  return Object.values(load()).sort((a, b) => b.mintedAt - a.mintedAt);
}
