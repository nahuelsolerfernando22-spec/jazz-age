/**
 * Autoguardado de partida (Android).
 *
 * Android mata la app en segundo plano sin aviso. Sin esto, el jugador vuelve
 * y perdió la mano. Cada juego registra un snapshot serializable y este módulo
 * se encarga de:
 *   - guardar al cambiar el estado (con un respiro para no escribir por cada
 *     frame),
 *   - forzar el guardado al pausar la app, al ocultarse y al desmontar,
 *   - ofrecer el estado guardado al volver, y limpiarlo cuando la partida
 *     termina.
 *
 * El formato es versionado: si cambia el motor de un juego, se sube la versión
 * y el guardado viejo se descarta en vez de romper la pantalla.
 */

import { useEffect, useRef } from "react";
import { readSlot, writeSlot, clearSlot, type StoreSlot } from "./local-store";
import { onAppPauseChange } from "./app-lifecycle";

export type AutosaveGame = "truco" | "escoba" | "chinchon" | "solitario" | "dados" | "mahjong";

interface Saved<T> {
  at: number;
  state: T;
}

function slotFor<T>(game: AutosaveGame, version: number): StoreSlot<Saved<T> | null> {
  return {
    key: `cuervo:save:game:${game}`,
    version,
    fallback: null,
    validate: (d): d is Saved<T> | null =>
      d === null || (typeof d === "object" && d !== null && "state" in (d as object)),
  };
}

/** Guardado disponible para ese juego, o null. */
export function loadGameSave<T>(
  game: AutosaveGame,
  version: number,
  maxAgeMs = 1000 * 60 * 60 * 24 * 7,
): T | null {
  const saved = readSlot(slotFor<T>(game, version));
  if (!saved) return null;
  if (Date.now() - saved.at > maxAgeMs) {
    clearGameSave(game, version);
    return null;
  }
  return saved.state;
}

export function hasGameSave(game: AutosaveGame, version: number): boolean {
  return loadGameSave(game, version) != null;
}

export function saveGameState<T>(game: AutosaveGame, version: number, state: T): void {
  writeSlot(slotFor<T>(game, version), { at: Date.now(), state });
}

export function clearGameSave(game: AutosaveGame, version: number): void {
  clearSlot(slotFor(game, version));
}

export interface AutosaveOptions<T> {
  game: AutosaveGame;
  version: number;
  /** Devuelve el estado a guardar, o null si no hay partida en curso. */
  snapshot: () => T | null;
  /** Cuando es false no se guarda y se limpia lo anterior (partida terminada). */
  active: boolean;
  /** Espera entre guardados, ms. */
  debounceMs?: number;
}

/**
 * Guarda la partida al cambiar `deps`, al pausar la app y al salir.
 * `snapshot` se lee siempre por referencia fresca, así que puede capturar
 * estado sin re-registrar listeners.
 */
export function useGameAutosave<T>(opts: AutosaveOptions<T>, deps: unknown[]): void {
  const { game, version, active, debounceMs = 600 } = opts;
  const snapshotRef = useRef(opts.snapshot);
  snapshotRef.current = opts.snapshot;
  const activeRef = useRef(active);
  activeRef.current = active;

  const flush = useRef(() => {
    if (!activeRef.current) return;
    const state = snapshotRef.current();
    if (state == null) return;
    saveGameState(game, version, state);
  });

  // Guardado con respiro cuando cambia la partida.
  useEffect(() => {
    if (!active) {
      clearGameSave(game, version);
      return;
    }
    const t = setTimeout(() => flush.current(), debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, game, version, debounceMs, ...deps]);

  // Guardado duro: la app se va a segundo plano o el proceso puede morir.
  useEffect(() => {
    const onHide = () => flush.current();
    const off = onAppPauseChange((paused) => {
      if (paused) flush.current();
    });
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      off();
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      flush.current();
    };
  }, []);
}
