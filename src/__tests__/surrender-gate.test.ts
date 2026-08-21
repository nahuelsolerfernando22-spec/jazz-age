import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLives, MAX_LIVES } from "@/store/lives";
import { useGameLock } from "@/store/gameLock";
import { useSurrenderStore } from "@/store/surrender";
import { useMembership } from "@/store/membership";

const navigate = vi.fn();

function computeEffectiveSurrender() {
  const locked = useGameLock.getState().locked;
  const handler = useSurrenderStore.getState().handler;
  if (handler) return handler;
  if (locked) {
    return () => {
      useGameLock.getState().setLocked(false);
      navigate();
    };
  }
  return null;
}

function pressSurrender() {
  const member = useMembership.getState().member;
  const eff = computeEffectiveSurrender();
  if (!eff) return { fired: false };
  if (!member) {
    const ok = useLives.getState().spend();
    if (!ok) return { fired: false };
  }
  eff();
  return { fired: true };
}

beforeEach(() => {
  navigate.mockReset();
  useLives.setState({ current: MAX_LIVES, lastRegenAt: Date.now() });
  useGameLock.getState().setLocked(false);
  useSurrenderStore.getState().setHandler(null, null);
  useMembership.setState({ member: false });
});

describe("Surrender gate — fallback del HUD (sin useSurrender registrado)", () => {
  it("cuando hay lock y no hay handler, ofrece el fallback", () => {
    useGameLock.getState().setLocked(true);
    expect(computeEffectiveSurrender()).toBeTypeOf("function");
  });

  it("sin lock y sin handler, no ofrece nada", () => {
    expect(computeEffectiveSurrender()).toBeNull();
  });

  it("descuenta 1 corazón y navega al vestíbulo", () => {
    useGameLock.getState().setLocked(true);
    const before = useLives.getState().current;
    const { fired } = pressSurrender();
    expect(fired).toBe(true);
    expect(useLives.getState().current).toBe(before - 1);
    expect(useGameLock.getState().locked).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("no navega si no quedan corazones (spend falla)", () => {
    useGameLock.getState().setLocked(true);
    useLives.setState({ current: 0, lastRegenAt: Date.now() });
    const { fired } = pressSurrender();
    expect(fired).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("Surrender gate — handler propio (juego con useSurrender)", () => {
  it("prioriza el handler del juego sobre el fallback", () => {
    const own = vi.fn();
    useGameLock.getState().setLocked(true);
    useSurrenderStore.getState().setHandler(own, "Rendirse");
    pressSurrender();
    expect(own).toHaveBeenCalledTimes(1);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("igual descuenta el corazón (lo hace el SurrenderButton, no el juego)", () => {
    useGameLock.getState().setLocked(true);
    useSurrenderStore.getState().setHandler(() => {}, "x");
    const before = useLives.getState().current;
    pressSurrender();
    expect(useLives.getState().current).toBe(before - 1);
  });
});

describe("Surrender gate — socio del Cuervo", () => {
  it("no descuenta corazón para socios", () => {
    useMembership.setState({ member: true });
    useGameLock.getState().setLocked(true);
    useSurrenderStore.getState().setHandler(() => {}, "x");
    const before = useLives.getState().current;
    pressSurrender();
    expect(useLives.getState().current).toBe(before);
  });
});

describe("Lock del HUD — atajos bloqueados durante la partida", () => {
  function shortcutsBlocked() {
    const locked = useGameLock.getState().locked;
    return {
      back: locked,
      lobby: locked,
      overflow: locked,
      tienda: locked,
      radio: locked,
      hotkeyJump: locked,
    };
  }

  it("con lock activo, todos los atajos están bloqueados", () => {
    useGameLock.getState().setLocked(true);
    const s = shortcutsBlocked();
    expect(s).toEqual({
      back: true,
      lobby: true,
      overflow: true,
      tienda: true,
      radio: true,
      hotkeyJump: true,
    });
  });

  it("sin lock, todos los atajos vuelven a estar disponibles", () => {
    useGameLock.getState().setLocked(false);
    const s = shortcutsBlocked();
    expect(Object.values(s).every((v) => v === false)).toBe(true);
  });

  it("rendirse desbloquea los atajos automáticamente (fallback)", () => {
    useGameLock.getState().setLocked(true);
    pressSurrender();
    expect(useGameLock.getState().locked).toBe(false);
  });

  it("un handler propio no desbloquea por sí solo — el juego decide cuándo", () => {
    useGameLock.getState().setLocked(true);
    useSurrenderStore.getState().setHandler(() => {}, "x");
    pressSurrender();
    expect(useGameLock.getState().locked).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
