import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

class MemStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
  key() {
    return null;
  }
  get length() {
    return this.map.size;
  }
}
vi.stubGlobal("localStorage", new MemStorage());

const { useLives, MAX_LIVES, REGEN_MS, msUntilNextLife, msUntilFull } = await import(
  "@/store/lives"
);

const T0 = Date.UTC(2026, 4, 10, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  useLives.setState({ current: MAX_LIVES, lastRegenAt: Date.now() });
});
afterEach(() => vi.useRealTimers());

describe("vidas · gasto", () => {
  it("gastar baja de a una y falla en cero", () => {
    for (let i = 0; i < MAX_LIVES; i++) expect(useLives.getState().spend()).toBe(true);
    expect(useLives.getState().current).toBe(0);
    expect(useLives.getState().spend()).toBe(false);
    expect(useLives.getState().current).toBe(0);
  });

  it("el reloj arranca recién cuando bajás del corazón lleno", () => {
    vi.setSystemTime(T0 + 5 * REGEN_MS);
    useLives.getState().spend();
    expect(useLives.getState().lastRegenAt).toBe(T0 + 5 * REGEN_MS);
  });
});

describe("vidas · regeneración por espera", () => {
  it("suma una vida por cada intervalo cumplido", () => {
    useLives.setState({ current: 0, lastRegenAt: T0 });
    vi.setSystemTime(T0 + REGEN_MS - 1);
    useLives.getState().tick();
    expect(useLives.getState().current).toBe(0);

    vi.setSystemTime(T0 + REGEN_MS);
    useLives.getState().tick();
    expect(useLives.getState().current).toBe(1);

    vi.setSystemTime(T0 + 3 * REGEN_MS);
    useLives.getState().tick();
    expect(useLives.getState().current).toBe(3);
  });

  it("no pierde el resto del intervalo al regenerar (no se roba tiempo)", () => {
    useLives.setState({ current: 0, lastRegenAt: T0 });
    vi.setSystemTime(T0 + REGEN_MS + REGEN_MS / 2);
    useLives.getState().tick();
    expect(useLives.getState().current).toBe(1);
    expect(msUntilNextLife(1, useLives.getState().lastRegenAt)).toBe(REGEN_MS / 2);
  });

  it("nunca pasa del máximo por más días que pasen (juego cerrado)", () => {
    useLives.setState({ current: 1, lastRegenAt: T0 });
    vi.setSystemTime(T0 + 30 * 24 * 60 * 60 * 1000);
    useLives.getState().tick();
    expect(useLives.getState().current).toBe(MAX_LIVES);
    expect(msUntilNextLife(MAX_LIVES, useLives.getState().lastRegenAt)).toBe(0);
    expect(msUntilFull(MAX_LIVES, useLives.getState().lastRegenAt)).toBe(0);
  });

  it("un reloj adelantado hacia atrás no rompe la cuenta", () => {
    useLives.setState({ current: 2, lastRegenAt: T0 + 10 * REGEN_MS });
    vi.setSystemTime(T0);
    useLives.getState().tick();
    expect(useLives.getState().current).toBe(2);
  });
});

describe("vidas · recompensas y relojes", () => {
  it("el anuncio suma una vida y no desborda", () => {
    useLives.setState({ current: MAX_LIVES - 1, lastRegenAt: T0 });
    useLives.getState().award();
    expect(useLives.getState().current).toBe(MAX_LIVES);
    useLives.getState().award();
    expect(useLives.getState().current).toBe(MAX_LIVES);
  });

  it("add ignora valores negativos o rotos", () => {
    useLives.setState({ current: 2, lastRegenAt: T0 });
    useLives.getState().add(-3);
    expect(useLives.getState().current).toBe(2);
    useLives.getState().add(1.9);
    expect(useLives.getState().current).toBe(3);
  });

  it("el tiempo hasta el corazón lleno es coherente con el próximo", () => {
    const faltan = MAX_LIVES - 2;
    expect(msUntilFull(2, T0)).toBe(msUntilNextLife(2, T0) + (faltan - 1) * REGEN_MS);
    expect(msUntilFull(2, T0)).toBe(faltan * REGEN_MS);
  });

  it("llenar a mano deja el corazón completo y el reloj limpio", () => {
    useLives.setState({ current: 0, lastRegenAt: T0 - REGEN_MS });
    useLives.getState().refillFull();
    expect(useLives.getState().current).toBe(MAX_LIVES);
    expect(useLives.getState().lastRegenAt).toBe(Date.now());
  });
});
