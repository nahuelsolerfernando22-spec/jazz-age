import { describe, expect, it } from "vitest";
import {
  type Card,
  type PokerState,
  type Seat,
  SEATS,
  act,
  activeSeats,
  compareValues,
  evaluate,
  freshDeck,
  legalActions,
  newTable,
  startHand,
  toCall,
} from "@/lib/games/poker/poker-engine";
import { aiChoose, handStrength } from "@/lib/games/poker/poker-ai";

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const C = (str: string): Card[] =>
  str.split(" ").map((tok) => {
    const s = tok.slice(-1) as Card["s"];
    const face = tok.slice(0, -1);
    const r =
      face === "A" ? 14 : face === "K" ? 13 : face === "Q" ? 12 : face === "J" ? 11 : Number(face);
    return { r, s };
  });

describe("mazo", () => {
  it("tiene 52 cartas únicas", () => {
    const deck = freshDeck(mulberry(7));
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((c) => `${c.r}${c.s}`)).size).toBe(52);
  });
});

describe("evaluación de jugadas", () => {
  it("reconoce cada categoría", () => {
    expect(evaluate(C("A♠ K♠ Q♠ J♠ 10♠")).name).toBe("escalera de color");
    expect(evaluate(C("9♠ 9♥ 9♦ 9♣ 2♠")).name).toBe("póker");
    expect(evaluate(C("8♠ 8♥ 8♦ 3♣ 3♠")).name).toBe("full");
    expect(evaluate(C("2♥ 7♥ 9♥ J♥ K♥")).name).toBe("color");
    expect(evaluate(C("5♠ 6♥ 7♦ 8♣ 9♠")).name).toBe("escalera");
    expect(evaluate(C("4♠ 4♥ 4♦ 9♣ 2♠")).name).toBe("trío");
    expect(evaluate(C("6♠ 6♥ 9♦ 9♣ 2♠")).name).toBe("doble par");
    expect(evaluate(C("6♠ 6♥ 9♦ 4♣ 2♠")).name).toBe("par");
    expect(evaluate(C("A♠ J♥ 9♦ 4♣ 2♠")).name).toBe("carta alta");
  });

  it("cuenta la rueda A-2-3-4-5 como escalera al 5", () => {
    const wheel = evaluate(C("A♠ 2♥ 3♦ 4♣ 5♠"));
    expect(wheel.name).toBe("escalera");
    expect(wheel.ranks[0]).toBe(5);
    expect(compareValues(evaluate(C("6♠ 2♥ 3♦ 4♣ 5♠")), wheel)).toBeGreaterThan(0);
  });

  it("elige la mejor combinación entre siete cartas", () => {
    const v = evaluate(C("A♠ A♥ K♦ K♣ 2♠ 7♥ A♦"));
    expect(v.name).toBe("full");
    expect(v.ranks[0]).toBe(14);
  });

  it("ordena las categorías de menor a mayor", () => {
    const order = [
      "A♠ J♥ 9♦ 4♣ 2♠",
      "6♠ 6♥ 9♦ 4♣ 2♠",
      "6♠ 6♥ 9♦ 9♣ 2♠",
      "4♠ 4♥ 4♦ 9♣ 2♠",
      "5♠ 6♥ 7♦ 8♣ 9♠",
      "2♥ 7♥ 9♥ J♥ K♥",
      "8♠ 8♥ 8♦ 3♣ 3♠",
      "9♠ 9♥ 9♦ 9♣ 2♠",
      "A♠ K♠ Q♠ J♠ 10♠",
    ].map((h) => evaluate(C(h)));
    for (let i = 1; i < order.length; i++) {
      expect(compareValues(order[i], order[i - 1])).toBeGreaterThan(0);
    }
  });
});

describe("reparto y ciegas", () => {
  it("da dos cartas a cada asiento y cobra las ciegas", () => {
    const s = startHand(newTable(300, 5), mulberry(3));
    for (const seat of SEATS) expect(s.hole[seat]).toHaveLength(2);
    expect(s.pot).toBe(15);
    expect(s.currentBet).toBe(10);
    expect(s.stage).toBe("preflop");
    expect(s.toAct).not.toBeNull();
    const total = SEATS.reduce((acc, seat) => acc + s.stacks[seat], 0) + s.pot;
    expect(total).toBe(900);
    // Cartas repartidas sin repeticiones.
    const dealt = SEATS.flatMap((seat) => s.hole[seat]).map((c) => `${c.r}${c.s}`);
    expect(new Set(dealt).size).toBe(6);
  });

  it("nunca ofrece acciones a quien no está en turno", () => {
    const s = startHand(newTable(300), mulberry(11));
    const idle = SEATS.filter((x) => x !== s.toAct);
    for (const seat of idle) expect(legalActions(s, seat)).toHaveLength(0);
    expect(legalActions(s, s.toAct as Seat).length).toBeGreaterThan(0);
  });
});

describe("mano completa", () => {
  function playToEnd(seed: number): PokerState {
    const rng = mulberry(seed);
    let s = startHand(newTable(300), rng);
    let guard = 0;
    while (s.stage !== "showdown" && guard++ < 400) {
      const seat = s.toAct;
      if (!seat) break;
      s = act(s, seat, aiChoose(s, seat, rng), rng);
    }
    expect(guard).toBeLessThan(400);
    return s;
  }

  it("cierra siempre con un ganador y sin perder fichas", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = playToEnd(seed);
      expect(s.stage).toBe("showdown");
      expect(s.winners.length).toBeGreaterThan(0);
      expect(s.result).toBeTruthy();
      const total = SEATS.reduce((acc, seat) => acc + s.stacks[seat], 0);
      expect(total).toBe(900);
      expect(SEATS.every((seat) => s.stacks[seat] >= 0)).toBe(true);
      if (s.showdown) expect(s.board).toHaveLength(5);
      expect(activeSeats(s).length).toBeGreaterThan(0);
    }
  });

  it("respeta el tope de cuatro subidas por calle", () => {
    const rng = mulberry(21);
    let s = startHand(newTable(2000), rng);
    let guard = 0;
    while (s.stage !== "showdown" && guard++ < 400) {
      const seat = s.toAct!;
      const legal = legalActions(s, seat);
      expect(s.raises).toBeLessThanOrEqual(4);
      const aggressive = legal.find((a) => a.kind === "subir" || a.kind === "apostar");
      s = act(s, seat, (aggressive ?? legal[0]).kind, rng);
    }
    expect(s.stage).toBe("showdown");
  });

  it("si todos pasan, la mano llega al river con cinco cartas", () => {
    const rng = mulberry(5);
    let s = startHand(newTable(300), rng);
    let guard = 0;
    while (s.stage !== "showdown" && guard++ < 200) {
      const seat = s.toAct!;
      const legal = legalActions(s, seat);
      const passive = legal.find((a) => a.kind === "pasar") ?? legal.find((a) => a.kind === "ver");
      s = act(s, seat, (passive ?? legal[0]).kind, rng);
    }
    expect(s.board).toHaveLength(5);
    expect(s.showdown).toBe(true);
  });

  it("ver iguala exactamente la apuesta en curso", () => {
    const rng = mulberry(33);
    const s = startHand(newTable(300), rng);
    const seat = s.toAct!;
    const need = toCall(s, seat);
    const after = act(s, seat, "ver", rng);
    expect(after.committed[seat]).toBe(s.committed[seat] + need);
  });

  it("retirarse deja el bote al último en pie", () => {
    const rng = mulberry(9);
    let s = startHand(newTable(300), rng);
    let guard = 0;
    while (s.stage !== "showdown" && guard++ < 20) {
      const seat = s.toAct!;
      const legal = legalActions(s, seat);
      const fold = legal.find((a) => a.kind === "retirarse");
      s = act(s, seat, (fold ?? legal[0]).kind, rng);
    }
    expect(s.winners).toHaveLength(1);
  });
});

describe("criterio de los rivales", () => {
  it("valora más un par de ases que dos cartas bajas", () => {
    expect(handStrength(C("A♠ A♥"), [])).toBeGreaterThan(handStrength(C("7♠ 2♥"), []));
  });

  it("sube la fuerza cuando el flop mejora la mano", () => {
    const hole = C("K♠ K♥");
    const flop = C("K♦ 4♣ 9♠");
    expect(handStrength(hole, flop)).toBeGreaterThan(handStrength(hole, C("2♦ 4♣ 9♠")));
  });

  it("siempre devuelve una acción legal", () => {
    const rng = mulberry(77);
    let s = startHand(newTable(300), rng);
    let guard = 0;
    while (s.stage !== "showdown" && guard++ < 300) {
      const seat = s.toAct!;
      const kind = aiChoose(s, seat, rng);
      expect(legalActions(s, seat).some((a) => a.kind === kind)).toBe(true);
      s = act(s, seat, kind, rng);
    }
  });
});
