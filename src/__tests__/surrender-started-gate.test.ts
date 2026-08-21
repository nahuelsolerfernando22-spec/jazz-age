import { describe, it, expect, beforeEach } from "vitest";
import { useGameLock } from "@/store/gameLock";
import { useSurrenderStore } from "@/store/surrender";

function surrenderVisible() {
  const { locked, started } = useGameLock.getState();
  const handler = useSurrenderStore.getState().handler;
  const effective = handler ?? (locked ? () => {} : null);
  return Boolean(locked && started && effective);
}

beforeEach(() => {
  useGameLock.setState({ locked: false, started: false });
  useSurrenderStore.getState().setHandler(null, null);
});

describe("Sudoku — Rendirse gated por started", () => {
  it("no aparece antes de bloquear la partida", () => {
    expect(surrenderVisible()).toBe(false);
  });

  it("no aparece con lock pero sin started (antes de 'Iniciar')", () => {
    useSurrenderStore.getState().setHandler(() => {}, "Rendirse");
    useGameLock.getState().setLocked(true);
    expect(useGameLock.getState().started).toBe(false);
    expect(surrenderVisible()).toBe(false);
  });

  it("aparece recién cuando markStarted() se dispara", () => {
    useSurrenderStore.getState().setHandler(() => {}, "Rendirse");
    useGameLock.getState().setLocked(true);
    useGameLock.getState().markStarted();
    expect(surrenderVisible()).toBe(true);
  });

  it("aparece al instante si el juego marca started al iniciar", () => {
    useSurrenderStore.getState().setHandler(() => {}, "Rendirse");
    useGameLock.getState().setLocked(true, true);
    expect(surrenderVisible()).toBe(true);
  });

  it("usa el label 'Rendirse' (no 'Tirar la toalla')", () => {
    useSurrenderStore.getState().setHandler(() => {}, "Rendirse");
    expect(useSurrenderStore.getState().label).toBe("Rendirse");
    expect(useSurrenderStore.getState().label).not.toBe("Tirar la toalla");
  });
});

describe("Otros juegos — Rendirse solo tras primera interacción", () => {
  it("con fallback del HUD, sigue oculto hasta que started sea true", () => {
    useGameLock.getState().setLocked(true);
    expect(surrenderVisible()).toBe(false);
    useGameLock.getState().markStarted();
    expect(surrenderVisible()).toBe(true);
  });

  it("desbloquear resetea started a false", () => {
    useGameLock.getState().setLocked(true);
    useGameLock.getState().markStarted();
    expect(surrenderVisible()).toBe(true);
    useGameLock.getState().setLocked(false);
    expect(useGameLock.getState().started).toBe(false);
    expect(surrenderVisible()).toBe(false);
  });

  it("markStarted es idempotente y no rompe si se llama sin lock", () => {
    useGameLock.getState().markStarted();
    expect(useGameLock.getState().started).toBe(false);
    useGameLock.getState().setLocked(true);
    useGameLock.getState().markStarted();
    useGameLock.getState().markStarted();
    expect(useGameLock.getState().started).toBe(true);
  });
});
