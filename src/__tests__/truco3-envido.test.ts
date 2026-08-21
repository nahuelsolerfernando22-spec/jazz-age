import { describe, it, expect } from "vitest";
import {
  startHand3,
  cantarEnvido3,
  cantarTruco3,
  responderEnvido3,
  responderTruco3,
  discardCard,
  ai3Decide,
  sideOf,
  SEATS,
  type Seat,
  type Game3,
} from "@/lib/truco3";

type EnvidoLevel = "envido" | "real" | "falta";

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
const stubRng = (value: number) => () => value;

const fresh = (seed = 7): Game3 =>
  startHand3(null, {
    pointGoal: 30,
    hostName: "Host",
    wandererName: "Wanderer",
    hostPortrait: "",
    wandererPortrait: "",
    rng: mulberry32(seed),
  });

function readyToSing(seed: number): Game3 {
  let g = fresh(seed);
  if (g.hand.solo === "you" && g.hand.hands.you.length === 4) {
    g = discardCard(g, "you", g.hand.hands.you[0]!.id);
  }
  return g;
}

function findResponder(g: Game3): Seat {
  const respondSide = g.hand.pending!.bySide === "solo" ? "team" : "solo";
  const yourSide = sideOf(g.hand, "you");
  expect(respondSide).not.toBe(yourSide);
  const responder = SEATS.find((s) => s !== "you" && sideOf(g.hand, s) === respondSide);
  expect(responder).toBeDefined();
  return responder!;
}

describe("truco3 · regresión: IA responde cantos de 'you'", () => {
  for (const level of ["envido", "real", "falta"] as EnvidoLevel[]) {
    it(`responde al ${level.toUpperCase()} cantado por 'you'`, () => {
      let g = readyToSing(1);
      g = cantarEnvido3(g, "you", level);
      expect(g.hand.pending?.kind).toBe("envido");
      expect(g.hand.pending?.level).toBe(level);

      const responder = findResponder(g);

      const decision = ai3Decide(g, responder, stubRng(0.99));
      expect(decision.kind).toBe("respond");
      expect(typeof decision.accept).toBe("boolean");

      g = responderEnvido3(g, responder, decision.accept ?? false);
      expect(g.hand.envidoResolved).toBe(true);
    });
  }

  it("responde al TRUCO cantado por 'you'", () => {
    let g = readyToSing(2);
    g = cantarTruco3(g, "you");
    expect(g.hand.pending?.kind).toBe("truco");

    const responder = findResponder(g);
    const decision = ai3Decide(g, responder, stubRng(0.99));
    expect(decision.kind).toBe("respond");
    expect(typeof decision.accept).toBe("boolean");

    g = responderTruco3(g, responder, decision.accept ?? false);

    expect(g.hand.pending?.kind === "truco").toBe(false);
  });

  it("ai3Decide es determinista dado el mismo seed", () => {
    let g = readyToSing(3);
    g = cantarEnvido3(g, "you", "real");
    const responder = findResponder(g);
    const a = ai3Decide(g, responder, mulberry32(42));
    const b = ai3Decide(g, responder, mulberry32(42));
    expect(a).toEqual(b);
  });
});

describe("truco3 · máquina de estados: escalaciones y encadenados", () => {
  it("envido → falta (escalación por el rival) resuelve y limpia pending", () => {
    let g = readyToSing(11);
    g = cantarEnvido3(g, "you", "envido");
    expect(g.hand.pending?.kind).toBe("envido");
    expect(g.hand.pending?.level).toBe("envido");

    const responder = findResponder(g);

    g = cantarEnvido3(g, responder, "falta");
    expect(g.hand.pending?.kind).toBe("envido");
    expect(g.hand.pending?.level).toBe("falta");
    expect(g.hand.pending?.bySide).toBe(sideOf(g.hand, responder));
    expect(g.hand.pending?.chain).toEqual(["envido", "falta"]);

    expect(sideOf(g.hand, "you")).not.toBe(g.hand.pending!.bySide);
    g = responderEnvido3(g, "you", true);
    expect(g.hand.envidoResolved).toBe(true);
    expect(g.hand.pending).toBeNull();
  });

  it("truco + envido primero: al resolver envido vuelve el truco pendiente", () => {
    let g = readyToSing(13);
    g = cantarTruco3(g, "you");
    expect(g.hand.pending?.kind).toBe("truco");

    const rival = findResponder(g);
    g = cantarEnvido3(g, rival, "envido");
    expect(g.hand.pending?.kind).toBe("envido");
    expect(g.hand.stashedTruco?.kind).toBe("truco");

    g = responderEnvido3(g, "you", true);
    expect(g.hand.envidoResolved).toBe(true);
    expect(g.hand.stashedTruco).toBeNull();
    expect(g.hand.pending?.kind).toBe("truco");
  });

  it("tras envido resuelto, 'you' canta truco y el NPC responde sincronizado", () => {
    let g = readyToSing(17);
    g = cantarEnvido3(g, "you", "real");
    let responder = findResponder(g);
    g = responderEnvido3(g, responder, true);
    expect(g.hand.envidoResolved).toBe(true);
    expect(g.hand.pending).toBeNull();

    g = cantarTruco3(g, "you");
    expect(g.hand.pending?.kind).toBe("truco");

    responder = findResponder(g);
    const decision = ai3Decide(g, responder, stubRng(0.99));
    expect(decision.kind).toBe("respond");
    g = responderTruco3(g, responder, decision.accept ?? false);
    expect(g.hand.pending?.kind === "truco").toBe(false);
  });
});
