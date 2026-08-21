import { describe, it, expect } from "vitest";
import {
  startHand,
  playCard,
  cantarTruco,
  responderTruco,
  cantarEnvido,
  responderEnvido,
  cantarFlor,
  responderFlor,
  irseAlMazo,
  canCantarEnvido,
  canCantarFlor,
  canIrseAlMazo,
  type Card,
} from "@/lib/games/truco/truco";

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const fresh = (goal = 30) => startHand(null, false, goal, mulberry32(42));

const card = (id: string, rank: Card["rank"], suit: Card["suit"]): Card => ({ id, rank, suit });

describe("truco · contada de cantos", () => {
  it("truco no querido paga 1 al que cantó", () => {
    let g = fresh();
    g = cantarTruco(g, "you");
    g = responderTruco(g, "ai", false);
    expect(g.hand.handResult).toEqual({ you: 1, ai: 0 });
  });

  it("retruco no querido paga 2 al que subió", () => {
    let g = fresh();
    g = cantarTruco(g, "you");
    g = responderTruco(g, "ai", true);
    g = cantarTruco(g, "ai");
    g = responderTruco(g, "you", false);
    expect(g.hand.handResult).toEqual({ you: 0, ai: 2 });
  });

  it("vale cuatro no querido paga 3", () => {
    let g = fresh();
    g = cantarTruco(g, "you");
    g = responderTruco(g, "ai", true);
    g = cantarTruco(g, "ai");
    g = responderTruco(g, "you", true);
    g = cantarTruco(g, "you");
    g = responderTruco(g, "ai", false);
    expect(g.hand.handResult).toEqual({ you: 3, ai: 0 });
  });

  it("envido no querido paga 1", () => {
    let g = fresh();
    g = cantarEnvido(g, "you", "envido");
    g = responderEnvido(g, "ai", false);
    expect(g.scores.you).toBe(1);
    expect(g.scores.ai).toBe(0);
  });

  it("envido+envido no querido paga 2 (nivel anterior)", () => {
    let g = fresh();
    g = cantarEnvido(g, "you", "envido");
    g = cantarEnvido(g, "ai", "envido");
    g = responderEnvido(g, "you", false);
    expect(g.scores.ai).toBe(2);
  });

  it("envido+real no querido paga 2", () => {
    let g = fresh();
    g = cantarEnvido(g, "you", "envido");
    g = cantarEnvido(g, "ai", "real");
    g = responderEnvido(g, "you", false);
    expect(g.scores.ai).toBe(2);
  });

  it("falta envido gana lo que le falta al perdedor", () => {
    let g = fresh(30);
    g = { ...g, scores: { you: 0, ai: 22 } };
    g = cantarEnvido(g, "you", "falta");
    g = responderEnvido(g, "ai", true);

    const total = g.scores.you + g.scores.ai;
    expect(total).toBeGreaterThanOrEqual(22 + 8);
  });

  it("marca ganador al alcanzar pointGoal", () => {
    let g = fresh(15);
    g = { ...g, scores: { you: 14, ai: 0 } };
    g = cantarEnvido(g, "you", "envido");
    g = responderEnvido(g, "ai", false);
    expect(g.scores.you).toBe(15);
    expect(g.winner).toBe("you");
  });

  it("envido resuelto ANTES de truco: puntos de envido + puntos de truco se suman por separado", () => {
    let g = fresh();
    g = cantarEnvido(g, "you", "envido");
    g = responderEnvido(g, "ai", false);
    expect(g.scores.you).toBe(1);
    g = cantarTruco(g, "ai");
    g = responderTruco(g, "you", false);
    expect(g.scores).toEqual({ you: 1, ai: 1 });
  });

  it("truco → retruco → vale4 todo NO querido sólo paga el nivel previo (2)", () => {
    let g = fresh();
    g = cantarTruco(g, "you");
    g = responderTruco(g, "ai", true);
    g = cantarTruco(g, "ai");
    g = responderTruco(g, "you", false);
    expect(g.hand.handResult).toEqual({ you: 0, ai: 2 });
  });

  it("falta envido no querida paga 1 (nivel anterior si no había ninguno)", () => {
    let g = fresh(30);
    g = { ...g, scores: { you: 5, ai: 5 } };
    g = cantarEnvido(g, "you", "falta");
    g = responderEnvido(g, "ai", false);

    expect(g.scores.you).toBe(6);
    expect(g.scores.ai).toBe(5);
  });

  it("envido → real → falta no querida paga el envido+real acumulado (5)", () => {
    let g = fresh(30);
    g = cantarEnvido(g, "you", "envido");
    g = cantarEnvido(g, "ai", "real");
    g = cantarEnvido(g, "you", "falta");
    g = responderEnvido(g, "ai", false);

    expect(g.scores.you).toBe(5);
    expect(g.scores.ai).toBe(0);
  });

  it("nunca se desincroniza: sumas parciales coinciden con scores acumulados", () => {
    let g = fresh(30);

    g = cantarEnvido(g, "you", "envido");
    g = responderEnvido(g, "ai", false);

    g = cantarTruco(g, "ai");
    g = responderTruco(g, "you", true);
    g = cantarTruco(g, "you");
    g = responderTruco(g, "ai", false);
    const total = g.scores.you + g.scores.ai;
    expect(total).toBe(1 + 2);
    expect(g.scores.you).toBe(3);
    expect(g.scores.ai).toBe(0);
  });
});

describe("truco · resolución de pardas", () => {
  it("si la primera es parda, la segunda carta ganada define la mano", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "you",
        turn: "you",
        trickLeader: "you",
        yourHand: [
          card("you-12-oros", 12, "oros"),
          card("you-3-copas", 3, "copas"),
          card("you-4-oros", 4, "oros"),
        ],
        aiHand: [
          card("ai-12-copas", 12, "copas"),
          card("ai-2-bastos", 2, "bastos"),
          card("ai-4-copas", 4, "copas"),
        ],
      },
    };

    g = playCard(g, "you", "you-12-oros");
    g = playCard(g, "ai", "ai-12-copas");
    expect(g.hand.trickWinners).toEqual(["tie"]);
    expect(g.hand.handOver).toBe(false);

    g = playCard(g, "you", "you-3-copas");
    g = playCard(g, "ai", "ai-2-bastos");

    expect(g.hand.trickWinners).toEqual(["tie", "you"]);
    expect(g.hand.handOver).toBe(true);
    expect(g.hand.handResult).toEqual({ you: 1, ai: 0 });
    expect(g.scores.you).toBe(1);
  });

  it("si la primera se gana y la segunda es parda, gana quien ganó la primera", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "you",
        turn: "you",
        trickLeader: "you",
        yourHand: [
          card("you-3-oros", 3, "oros"),
          card("you-12-oros", 12, "oros"),
          card("you-4-oros", 4, "oros"),
        ],
        aiHand: [
          card("ai-2-copas", 2, "copas"),
          card("ai-12-copas", 12, "copas"),
          card("ai-4-copas", 4, "copas"),
        ],
      },
    };

    g = playCard(g, "you", "you-3-oros");
    g = playCard(g, "ai", "ai-2-copas");
    g = playCard(g, "you", "you-12-oros");
    g = playCard(g, "ai", "ai-12-copas");

    expect(g.hand.trickWinners).toEqual(["you", "tie"]);
    expect(g.hand.handOver).toBe(true);
    expect(g.hand.handResult).toEqual({ you: 1, ai: 0 });
  });

  it("si las tres son pardas, gana quien es mano", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "ai",
        turn: "ai",
        trickLeader: "ai",
        yourHand: [
          card("you-12-oros", 12, "oros"),
          card("you-11-oros", 11, "oros"),
          card("you-10-oros", 10, "oros"),
        ],
        aiHand: [
          card("ai-12-copas", 12, "copas"),
          card("ai-11-copas", 11, "copas"),
          card("ai-10-copas", 10, "copas"),
        ],
      },
    };

    g = playCard(g, "ai", "ai-12-copas");
    g = playCard(g, "you", "you-12-oros");
    g = playCard(g, "ai", "ai-11-copas");
    g = playCard(g, "you", "you-11-oros");
    g = playCard(g, "ai", "ai-10-copas");
    g = playCard(g, "you", "you-10-oros");

    expect(g.hand.trickWinners).toEqual(["tie", "tie", "tie"]);
    expect(g.hand.handResult).toEqual({ you: 0, ai: 1 });
  });

  it("parda en 1ª con cartas del mismo rango (12 oros vs 12 copas) → la 2ª define", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "ai",
        turn: "you",
        trickLeader: "you",
        yourHand: [
          card("you-12-oros", 12, "oros"),
          card("you-3-espadas", 3, "espadas"),
          card("you-4-oros", 4, "oros"),
        ],
        aiHand: [
          card("ai-12-copas", 12, "copas"),
          card("ai-5-bastos", 5, "bastos"),
          card("ai-4-copas", 4, "copas"),
        ],
      },
    };
    g = playCard(g, "you", "you-12-oros");
    g = playCard(g, "ai", "ai-12-copas");
    expect(g.hand.trickWinners).toEqual(["tie"]);
    g = playCard(g, "you", "you-3-espadas");
    g = playCard(g, "ai", "ai-5-bastos");
    expect(g.hand.trickWinners).toEqual(["tie", "you"]);
    expect(g.hand.handResult).toEqual({ you: 1, ai: 0 });
  });

  it("parda en 2ª tras ganar la 1ª → cierra sin llegar a la 3ª", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "ai",
        turn: "ai",
        trickLeader: "ai",
        yourHand: [
          card("you-4-oros", 4, "oros"),
          card("you-7-copas", 7, "copas"),
          card("you-5-oros", 5, "oros"),
        ],
        aiHand: [
          card("ai-3-bastos", 3, "bastos"),
          card("ai-7-bastos", 7, "bastos"),
          card("ai-6-copas", 6, "copas"),
        ],
      },
    };
    g = playCard(g, "ai", "ai-3-bastos");
    g = playCard(g, "you", "you-4-oros");
    g = playCard(g, "ai", "ai-7-bastos");
    g = playCard(g, "you", "you-7-copas");
    expect(g.hand.trickWinners).toEqual(["ai", "tie"]);
    expect(g.hand.handOver).toBe(true);
    expect(g.hand.handResult).toEqual({ you: 0, ai: 1 });
  });

  it("ganó 1ª, perdió 2ª, parda 3ª → gana quien ganó la 1ª", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "you",
        turn: "you",
        trickLeader: "you",
        yourHand: [
          card("you-3-oros", 3, "oros"),
          card("you-4-bastos", 4, "bastos"),
          card("you-5-oros", 5, "oros"),
        ],
        aiHand: [
          card("ai-2-copas", 2, "copas"),
          card("ai-3-copas", 3, "copas"),
          card("ai-5-copas", 5, "copas"),
        ],
      },
    };
    g = playCard(g, "you", "you-3-oros");
    g = playCard(g, "ai", "ai-2-copas");
    g = playCard(g, "you", "you-4-bastos");
    g = playCard(g, "ai", "ai-3-copas");
    g = playCard(g, "ai", "ai-5-copas");
    g = playCard(g, "you", "you-5-oros");
    expect(g.hand.trickWinners).toEqual(["you", "ai", "tie"]);
    expect(g.hand.handResult).toEqual({ you: 1, ai: 0 });
  });

  it("parda 1ª y 2ª → la 3ª define", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "ai",
        turn: "you",
        trickLeader: "you",
        yourHand: [
          card("you-12-oros", 12, "oros"),
          card("you-11-oros", 11, "oros"),
          card("you-3-espadas", 3, "espadas"),
        ],
        aiHand: [
          card("ai-12-copas", 12, "copas"),
          card("ai-11-copas", 11, "copas"),
          card("ai-5-bastos", 5, "bastos"),
        ],
      },
    };
    g = playCard(g, "you", "you-12-oros");
    g = playCard(g, "ai", "ai-12-copas");
    g = playCard(g, "you", "you-11-oros");
    g = playCard(g, "ai", "ai-11-copas");
    g = playCard(g, "you", "you-3-espadas");
    g = playCard(g, "ai", "ai-5-bastos");
    expect(g.hand.trickWinners).toEqual(["tie", "tie", "you"]);
    expect(g.hand.handResult).toEqual({ you: 1, ai: 0 });
  });
});

describe("truco · reglas nuevas (1v1)", () => {
  it("envido está primero: tras truco pendiente, se canta envido y se resuelve antes", () => {
    let g = fresh(30);
    g = cantarTruco(g, "ai");
    expect(g.hand.pending?.kind).toBe("truco");
    expect(canCantarEnvido(g, "you")).toBe(true);
    g = cantarEnvido(g, "you", "envido");
    expect(g.hand.pending?.kind).toBe("envido");
    expect(g.hand.stashedTruco?.kind).toBe("truco");
    g = responderEnvido(g, "ai", false);
    expect(g.hand.envidoResolved).toBe(true);
    expect(g.scores.you).toBe(1);
    expect(g.hand.pending?.kind).toBe("truco");
  });

  it("pie tira carta sin cantar envido → pierde derecho, mano lo conserva", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "ai",
        turn: "you",
        trickLeader: "you",
        yourHand: [
          { id: "y-4", rank: 4, suit: "oros" },
          { id: "y-5", rank: 5, suit: "copas" },
          { id: "y-6", rank: 6, suit: "bastos" },
        ],
        aiHand: [
          { id: "a-3", rank: 3, suit: "oros" },
          { id: "a-2", rank: 2, suit: "copas" },
          { id: "a-7", rank: 7, suit: "espadas" },
        ],
      },
    };
    g = playCard(g, "you", "y-4");
    expect(g.hand.pieCommittedNoEnvido).toBe(true);
    expect(canCantarEnvido(g, "you")).toBe(false);
    expect(canCantarEnvido(g, "ai")).toBe(true);
  });

  it("mano tira primero sin cantar → cierra ventana para ambos", () => {
    let g = fresh(30);
    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "you",
        turn: "you",
        trickLeader: "you",
        yourHand: [
          { id: "y-4", rank: 4, suit: "oros" },
          { id: "y-5", rank: 5, suit: "copas" },
          { id: "y-6", rank: 6, suit: "bastos" },
        ],
        aiHand: [
          { id: "a-3", rank: 3, suit: "oros" },
          { id: "a-2", rank: 2, suit: "copas" },
          { id: "a-7", rank: 7, suit: "espadas" },
        ],
      },
    };
    g = playCard(g, "you", "y-4");
    expect(g.hand.manoCommittedNoEnvido).toBe(true);
    expect(canCantarEnvido(g, "you")).toBe(false);
    expect(canCantarEnvido(g, "ai")).toBe(false);
  });

  it("irse al mazo sin truco cantado paga 1 al rival", () => {
    let g = fresh(30);
    expect(canIrseAlMazo(g, "you")).toBe(true);
    g = irseAlMazo(g, "you");
    expect(g.hand.handOver).toBe(true);
    expect(g.scores).toEqual({ you: 0, ai: 1 });
    expect(g.history[0]?.wentToMazo).toBe("you");
  });

  it("irse al mazo con truco aceptado paga el stake", () => {
    let g = fresh(30);
    g = cantarTruco(g, "you");
    g = responderTruco(g, "ai", true);
    g = irseAlMazo(g, "you");
    expect(g.hand.handOver).toBe(true);
    expect(g.scores).toEqual({ you: 0, ai: 2 });
  });

  it("irse al mazo con envido pendiente del rival: paga no-quiero + 1 del mazo", () => {
    let g = fresh(30);
    // El mano tiene la iniciativa: canta él y el rival se va al mazo.
    g = cantarEnvido(g, "you", "envido");
    g = irseAlMazo(g, "ai");
    expect(g.scores.you).toBe(2);
    expect(g.scores.ai).toBe(0);
  });

  it("el pie no puede cantar envido antes de que hable el mano", () => {
    const g = fresh(30);
    expect(canCantarEnvido(g, "ai")).toBe(false);
    expect(canCantarEnvido(g, "you")).toBe(true);
  });

  it("historial acumula manos con ganador y puntos", () => {
    let g = fresh(30);
    g = cantarTruco(g, "you");
    g = responderTruco(g, "ai", false);
    expect(g.history.length).toBe(1);
    expect(g.history[0]).toMatchObject({ winner: "you", points: 1 });
  });

  it("flor tapa un envido pendiente: el envido se anula sin pagar", () => {
    let g = startHand(null, true, 30, () => 0.5);

    g = {
      ...g,
      hand: {
        ...g.hand,
        mano: "ai",
        turn: "ai",
        trickLeader: "ai",
        yourHand: [
          { id: "y-3", rank: 3, suit: "copas" },
          { id: "y-5", rank: 5, suit: "copas" },
          { id: "y-6", rank: 6, suit: "copas" },
        ],
        aiHand: [
          { id: "a-4", rank: 4, suit: "oros" },
          { id: "a-5", rank: 5, suit: "espadas" },
          { id: "a-6", rank: 6, suit: "bastos" },
        ],
      },
    };
    g = cantarEnvido(g, "ai", "envido");
    expect(g.hand.pending?.kind).toBe("envido");
    expect(canCantarFlor(g, "you")).toBe(true);
    g = cantarFlor(g, "you");
    expect(g.hand.envidoResolved).toBe(true);
    expect(g.hand.pending?.kind).toBe("flor");
    expect(g.scores).toEqual({ you: 0, ai: 0 });

    g = responderFlor(g, "ai", "achicar");
    expect(g.scores).toEqual({ you: 3, ai: 0 });
  });

  it("envido no-querido restaura el truco stashado", () => {
    let g = fresh();

    g = cantarTruco(g, "ai");
    expect(g.hand.pending?.kind).toBe("truco");

    g = cantarEnvido(g, "you", "envido");
    expect(g.hand.pending?.kind).toBe("envido");
    expect(g.hand.stashedTruco).not.toBeNull();

    g = responderEnvido(g, "ai", false);
    expect(g.scores).toEqual({ you: 1, ai: 0 });
    expect(g.hand.pending?.kind).toBe("truco");
    expect(g.hand.stashedTruco).toBeNull();
  });

  it("envido querido restaura el truco stashado tras revelar tantos", () => {
    let g = fresh();
    g = cantarTruco(g, "ai");
    g = cantarEnvido(g, "you", "envido");
    g = responderEnvido(g, "ai", true);

    expect(g.hand.envidoAccepted).toBe(true);
    expect(g.hand.pending?.kind).toBe("truco");
    expect(g.hand.stashedTruco).toBeNull();
  });
});
