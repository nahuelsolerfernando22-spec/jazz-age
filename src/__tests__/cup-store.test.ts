import { describe, it, expect, beforeEach, vi } from "vitest";

// Los stores persisten en localStorage; en node hay que darles uno.
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

const { useCup } = await import("@/store/cup");
const { useCasino } = await import("@/store/casino");
const { CUP_BUYIN, CUP_ENTRIES_PER_DAY, CUP_PURSE, CUP_RETRIES_PER_DAY, CUP_SWEEP_BONUS } =
  await import("@/lib/cup");

function reset(chips = 10_000) {
  useCup.setState({
    active: null,
    titles: [],
    played: {},
    history: [],
    scores: {},
    rating: {},
    reserved: null,
    entriesUsed: 0,
    retriesUsed: 0,
  });
  useCasino.setState({ chips });
}

beforeEach(() => reset());

describe("cup store · anotarse", () => {
  it("cobra el buy-in y abre el cuadro", () => {
    const antes = useCasino.getState().chips;
    expect(useCup.getState().start("truco")).toBe(true);
    expect(useCasino.getState().chips).toBe(antes - CUP_BUYIN);
    const run = useCup.getState().active!;
    expect(run.gameId).toBe("truco");
    expect(run.round).toBe(0);
    expect(run.status).toBe("jugando");
    expect(run.bracket.entrants).toHaveLength(16);
  });

  it("no deja anotarse sin fichas y no descuenta nada", () => {
    reset(CUP_BUYIN - 1);
    expect(useCup.getState().start("truco")).toBe(false);
    expect(useCasino.getState().chips).toBe(CUP_BUYIN - 1);
    expect(useCup.getState().active).toBeNull();
  });

  it("rechaza mesas que no tienen torneo", () => {
    expect(useCup.getState().start("solitario")).toBe(false);
    expect(useCasino.getState().chips).toBe(10_000);
  });

  it("respeta el cupo diario de entradas", () => {
    for (let i = 0; i < CUP_ENTRIES_PER_DAY; i++) {
      expect(useCup.getState().start("truco")).toBe(true);
      useCup.getState().abandon();
    }
    const antes = useCasino.getState().chips;
    expect(useCup.getState().start("truco")).toBe(false);
    expect(useCasino.getState().chips).toBe(antes); // no cobra la entrada rechazada
    expect(useCup.getState().cupos().entradas).toBe(0);
  });
});

describe("cup store · rondas y premios", () => {
  it("cada ronda ganada paga su bolsa y deja trofeo", () => {
    useCup.getState().start("truco");
    const base = useCasino.getState().chips;
    const run = useCup.getState().report("truco", "win")!;
    expect(run.round).toBe(1);
    expect(run.purse).toBe(CUP_PURSE[0]);
    expect(run.trofeos).toHaveLength(1);
    expect(useCasino.getState().chips).toBe(base + CUP_PURSE[0]);
  });

  it("barrer el cuadro paga las cuatro bolsas más el bono y da el título", () => {
    useCup.getState().start("truco");
    const base = useCasino.getState().chips;
    let run = null;
    for (let i = 0; i < 4; i++) run = useCup.getState().report("truco", "win");
    const total = CUP_PURSE.reduce((a, b) => a + b, 0) + CUP_SWEEP_BONUS;
    expect(run!.status).toBe("campeon");
    expect(run!.purse).toBe(total);
    expect(useCasino.getState().chips).toBe(base + total);
    expect(useCup.getState().titles).toHaveLength(1);
    expect(useCup.getState().scores["truco"].titulos).toBe(1);
    expect(useCup.getState().history[0].status).toBe("campeon");
  });

  it("perder cierra el cuadro sin pagar y lo registra en el historial", () => {
    useCup.getState().start("truco");
    const base = useCasino.getState().chips;
    const run = useCup.getState().report("truco", "loss")!;
    expect(run.status).toBe("eliminado");
    expect(run.purse).toBe(0);
    expect(useCasino.getState().chips).toBe(base);
    expect(useCup.getState().history[0].status).toBe("eliminado");
  });

  it("el empate no cierra la ronda ni paga", () => {
    useCup.getState().start("truco");
    const base = useCasino.getState().chips;
    const run = useCup.getState().report("truco", "draw")!;
    expect(run.round).toBe(0);
    expect(run.results).toHaveLength(0);
    expect(useCasino.getState().chips).toBe(base);
  });

  it("un resultado de otra mesa no toca el torneo abierto", () => {
    useCup.getState().start("truco");
    expect(useCup.getState().report("escoba", "win")).toBeNull();
    expect(useCup.getState().active!.round).toBe(0);
  });

  it("no se puede seguir reportando sobre un cuadro cerrado", () => {
    useCup.getState().start("truco");
    useCup.getState().report("truco", "loss");
    const base = useCasino.getState().chips;
    expect(useCup.getState().report("truco", "win")).toBeNull();
    expect(useCasino.getState().chips).toBe(base);
  });
});

describe("cup store · reintentos", () => {
  it("reabre la ronda perdida y respeta el tope diario", () => {
    useCup.getState().start("truco");
    useCup.getState().report("truco", "loss");
    expect(useCup.getState().retry()).toBe(true);
    expect(useCup.getState().active!.status).toBe("jugando");
    expect(useCup.getState().active!.results).toHaveLength(0);

    for (let i = 1; i < CUP_RETRIES_PER_DAY; i++) {
      useCup.getState().report("truco", "loss");
      expect(useCup.getState().retry()).toBe(true);
    }
    useCup.getState().report("truco", "loss");
    expect(useCup.getState().retry()).toBe(false);
    expect(useCup.getState().cupos().reintentos).toBe(0);
  });

  it("no hay reintento sobre un torneo que seguís jugando", () => {
    useCup.getState().start("truco");
    expect(useCup.getState().retry()).toBe(false);
  });
});

describe("cup store · dificultad adaptativa", () => {
  it("ganar sube tu rating de esa mesa y perder lo baja", () => {
    useCup.getState().start("truco");
    useCup.getState().report("truco", "win");
    const subida = useCup.getState().rating["truco"];
    expect(subida).toBeGreaterThan(0);

    reset();
    useCup.getState().start("truco");
    useCup.getState().report("truco", "loss");
    expect(useCup.getState().rating["truco"]).toBeLessThan(0);
  });

  it("el rating queda acotado entre -1 y 1 aunque juegues mucho", () => {
    for (let i = 0; i < 40; i++) {
      useCup.setState({ entriesUsed: 0 });
      useCup.getState().start("truco");
      useCup.getState().report("truco", "loss");
      useCup.getState().abandon();
    }
    expect(useCup.getState().rating["truco"]).toBeGreaterThanOrEqual(-1);
    expect(useCup.getState().rating["truco"]).toBeLessThanOrEqual(1);
  });
});
