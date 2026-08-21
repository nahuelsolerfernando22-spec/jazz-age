/**
 * Cola de operaciones diferidas (offline-first).
 *
 * Todo el juego resuelve en el dispositivo: fichas, puntos de liga y rondas de
 * torneo se aplican al instante aunque no haya red. Lo único que puede fallar
 * es el envío al backend (pizarras compartidas). En vez de perderlo, la
 * operación se encola y se reintenta cuando vuelve la conexión o cuando la app
 * vuelve del segundo plano.
 *
 * La cola vive en localStorage, así que sobrevive a que Android mate la app.
 */

import { readSlot, writeSlot, type StoreSlot } from "./local-store";

export type SyncOpKind = "tourney-score";

export interface SyncOp {
  id: string;
  kind: SyncOpKind;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
}

const MAX_ATTEMPTS = 8;
const MAX_QUEUE = 60;

const SLOT: StoreSlot<SyncOp[]> = {
  key: "cuervo:sync:queue:v1",
  version: 1,
  fallback: [],
  validate: (d): d is SyncOp[] => Array.isArray(d),
};

type Handler = (op: SyncOp) => Promise<void>;
const handlers = new Map<SyncOpKind, Handler>();

export function registerSyncHandler(kind: SyncOpKind, fn: Handler): void {
  handlers.set(kind, fn);
}

export function pendingSyncOps(): SyncOp[] {
  return readSlot(SLOT);
}

export function pendingSyncCount(): number {
  return pendingSyncOps().length;
}

/**
 * Encola una operación. `id` sirve de clave de deduplicación: una misma marca
 * de torneo reencolada pisa a la anterior en vez de acumular envíos.
 */
export function enqueueSyncOp(
  kind: SyncOpKind,
  id: string,
  payload: Record<string, unknown>,
): void {
  const queue = pendingSyncOps().filter((op) => op.id !== id);
  queue.push({ id, kind, payload, createdAt: Date.now(), attempts: 0 });
  writeSlot(SLOT, queue.slice(-MAX_QUEUE));
}

function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

let draining = false;

/** Intenta vaciar la cola. Seguro de llamar seguido: se serializa solo. */
export async function drainSyncQueue(): Promise<{ done: number; left: number }> {
  if (draining || typeof window === "undefined") return { done: 0, left: pendingSyncCount() };
  if (!isOnline()) return { done: 0, left: pendingSyncCount() };
  draining = true;
  let done = 0;
  try {
    const queue = pendingSyncOps();
    const keep: SyncOp[] = [];
    for (const op of queue) {
      const handler = handlers.get(op.kind);
      if (!handler) continue; // handler desconocido: la op ya no aplica
      try {
        await handler(op);
        done++;
      } catch {
        const attempts = op.attempts + 1;
        // Se abandona tras varios intentos: el progreso local ya está aplicado,
        // lo único que se pierde es aparecer en la pizarra compartida.
        if (attempts < MAX_ATTEMPTS) keep.push({ ...op, attempts });
      }
    }
    writeSlot(SLOT, keep);
    return { done, left: keep.length };
  } finally {
    draining = false;
  }
}

let installed = false;

/** Reintenta al recuperar conexión y al volver del segundo plano. */
export function installSyncQueue(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("online", () => {
    void drainSyncQueue();
  });
  void drainSyncQueue();
}
