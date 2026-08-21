const KEY = "cross-rep:pending:v1";

export type CrossEventKind = "win" | "loss" | "streak";

export interface CrossEvent {
  fromNpc: string;
  kind: CrossEventKind;
  amount?: number;
  at: number;
}

type Store = Record<string, CrossEvent[]>;

const GRAPH: Record<string, string[]> = {
  clara: ["salome", "vita"],
  salome: ["clara", "shauna"],
  lin: ["jade", "opal"],
  shauna: ["salome", "vita"],
  eulalia: ["luisa", "bettie"],
  luisa: ["eulalia", "bettie"],
  jade: ["lin", "opal"],
  vita: ["clara", "shauna"],
  zelda: ["clara", "lola"],
  opal: ["jade", "lin"],
  bettie: ["eulalia", "luisa"],
  lola: ["zelda", "bettie"],
};

export function alliesOf(npcId: string): string[] {
  return GRAPH[npcId] ?? [];
}

function safeSession(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function read(): Store {
  const ss = safeSession();
  if (!ss) return {};
  try {
    return JSON.parse(ss.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(s: Store) {
  const ss = safeSession();
  if (!ss) return;
  ss.setItem(KEY, JSON.stringify(s));
}

export function broadcastResult(fromNpc: string, kind: CrossEventKind, amount?: number): void {
  const targets = GRAPH[fromNpc] ?? [];
  if (!targets.length) return;
  const store = read();
  const evt: CrossEvent = { fromNpc, kind, amount, at: Date.now() };
  for (const t of targets) {
    const list = (store[t] ?? []).slice(-2);
    list.push(evt);
    store[t] = list;
  }
  write(store);
}

export function consumePending(targetNpc: string): CrossEvent | null {
  const store = read();
  const list = store[targetNpc] ?? [];
  if (!list.length) return null;
  const [next, ...rest] = list;
  store[targetNpc] = rest;
  write(store);
  return next;
}

export function peekPending(targetNpc: string): CrossEvent | null {
  return read()[targetNpc]?.[0] ?? null;
}

const NPC_LABEL: Record<string, string> = {
  clara: "Clara",
  salome: "Salomé",
  lin: "Lin",
  shauna: "Shauna",
  eulalia: "Eulalia",
  luisa: "Luisa",
  jade: "Jade",
  vita: "Vita",
  zelda: "Zelda",
  opal: "Opal",
  bettie: "Bettie",
  lola: "Lola",
};

export function consumeGossipLine(targetNpc: string): string | null {
  const evt = consumePending(targetNpc);
  if (!evt) return null;
  const who = NPC_LABEL[evt.fromNpc] ?? evt.fromNpc;
  if (evt.kind === "win") {
    return `Dicen que ${who} te vio brillar hace un rato. No te creas tanto.`;
  }
  if (evt.kind === "streak") {
    return `${who} no para de hablar de tu racha. Acá te van a pesar el doble.`;
  }
  return `${who} me contó que dejaste plata en su mesa. Esta noche no me distraigas.`;
}
