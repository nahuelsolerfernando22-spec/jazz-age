/**
 * Registro de legajos (runs) por mesa.
 *
 * Antes, el HUD, el rastreador de encargos y el avisador de resultados
 * importaban los nueve stores de run de forma directa. Eso metía la lógica de
 * todas las mesas en el paquete de arranque del APK. Ahora cada store se
 * anuncia acá cuando su sala se carga, y los módulos compartidos sólo
 * conversan con las mesas que el jugador abrió de verdad.
 */

export interface RunResult {
  levelId: string;
  won: boolean;
  stars?: 0 | 1 | 2 | 3;
  reward?: number;
}

export interface RunStateLike {
  cleared?: Record<string, { stars: 0 | 1 | 2 | 3 }>;
  lastResult?: RunResult | null;
  activeLevel?: string | null;
  progress?: number | null;
  abandon?: () => void;
}

export interface RunStoreLike {
  getState: () => RunStateLike;
  subscribe: (fn: (state: RunStateLike) => void) => () => void;
}

export interface RunLevelLike {
  id: string;
  title?: string;
  boss?: boolean;
  objective?: Record<string, unknown>;
}

export interface RunEntry {
  id: string;
  label: string;
  store: RunStoreLike;
  findLevel: (id: string) => RunLevelLike | undefined;
  /** Etiqueta legible del objetivo del encargo. */
  levelLabel?: (level: unknown) => string;
  /** Ruta de la sala, para ubicar la banda de encargo activo. */
  route?: string;
  /** Anfitriona de la mesa. */
  hostess?: string;
}


const entries = new Map<string, RunEntry>();
const listeners = new Set<(entry: RunEntry) => void>();

/** Cada sala anuncia su legajo al cargarse. */
export function registerRun(entry: RunEntry): void {
  if (entries.has(entry.id)) return;
  entries.set(entry.id, entry);
  for (const fn of listeners) fn(entry);
}

export function listRuns(): RunEntry[] {
  return [...entries.values()];
}

export function getRun(id: string): RunEntry | undefined {
  return entries.get(id);
}

/**
 * Avisa de los legajos ya presentes y de los que lleguen después.
 * Devuelve la baja de la escucha.
 */
export function onRunRegistered(fn: (entry: RunEntry) => void): () => void {
  for (const entry of entries.values()) fn(entry);
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Cierra cualquier encargo activo en las mesas cargadas. */
export function abandonActiveRuns(): void {
  for (const entry of entries.values()) {
    try {
      entry.store.getState().abandon?.();
    } catch {
      /* la mesa no tenía encargo abierto */
    }
  }
}
