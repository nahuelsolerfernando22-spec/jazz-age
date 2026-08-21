import { describe, it, expect } from "vitest";
import {
  startHand,
  cantarEnvido,
  responderEnvido,
  cantarTruco,
  responderTruco,
  playCard,
  irseAlMazo,
  reclamarEnvido,
  pasarReclamoEnvido,
  calcEnvido,
  type GameState,
  type Card,
  type HandState,
} from "@/lib/games/truco/truco";

const rng = (v: number) => () => v;

function setHand(g: GameState, patch: Partial<HandState>): GameState {
  return { ...g, hand: { ...g.hand, ...patch } };
}

function card(
  id: string,
  rank: number,
  suit: "oros" | "copas" | "espadas" | "bastos" = "espadas",
): Card {
  return { id, rank: rank as Card["rank"], suit };
}

describe("truco · picardía · envido mentiroso", () => {
  it("mentira impune: si nadie reclama, los puntos declarados quedan firmes", () => {
    let g = startHand(null, false, 30);
    g = setHand(g, {
      origYourHand: [card("y1", 2, "espadas"), card("y2", 5, "espadas"), card("y3", 3, "copas")],
      origAiHand: [card("a1", 4, "oros"), card("a2", 3, "oros"), card("a3", 7, "bastos")],
      yourHand: [card("y1", 2, "espadas"), card("y2", 5, "espadas"), card("y3", 3, "copas")],
      aiHand: [card("a1", 4, "oros"), card("a2", 3, "oros"), card("a3", 7, "bastos")],
      mano: "you",
      turn: "you",
    });
    g = cantarEnvido(g, "you", "envido");

    g = responderEnvido(g, "ai", true, { playerDeclared: 30, aiLieRate: 0 });

    expect(g.scores.you).toBe(2);
    expect(g.hand.envidoChallengeOpen).toBe(true);

    g = pasarReclamoEnvido(g);
    expect(g.scores.you).toBe(2);
    expect(g.hand.envidoChallengeOpen).toBe(false);
  });

  it("mentira detectada: reclamo transfiere los puntos al reclamante", () => {
    let g = startHand(null, false, 30);
    g = setHand(g, {
      origYourHand: [card("y1", 2, "espadas"), card("y2", 5, "espadas"), card("y3", 3, "copas")],
      origAiHand: [card("a1", 4, "oros"), card("a2", 3, "oros"), card("a3", 7, "bastos")],
      yourHand: [card("y1", 2, "espadas"), card("y2", 5, "espadas"), card("y3", 3, "copas")],
      aiHand: [card("a1", 4, "oros"), card("a2", 3, "oros"), card("a3", 7, "bastos")],
      mano: "you",
      turn: "you",
    });
    g = cantarEnvido(g, "you", "envido");
    g = responderEnvido(g, "ai", true, { playerDeclared: 30, aiLieRate: 0 });
    expect(g.scores.you).toBe(2);

    g = reclamarEnvido(g, "ai");
    expect(g.scores.you).toBe(0);
    expect(g.scores.ai).toBe(2);
    expect(g.hand.envidoChallengeUsed).toBe(true);
  });

  it("honesto reclamado: los puntos se mantienen", () => {
    let g = startHand(null, false, 30);
    g = setHand(g, {
      origYourHand: [card("y1", 4, "espadas"), card("y2", 6, "espadas"), card("y3", 5, "copas")],
      origAiHand: [card("a1", 4, "oros"), card("a2", 3, "oros"), card("a3", 7, "bastos")],
      yourHand: [card("y1", 4, "espadas"), card("y2", 6, "espadas"), card("y3", 5, "copas")],
      aiHand: [card("a1", 4, "oros"), card("a2", 3, "oros"), card("a3", 7, "bastos")],
      mano: "you",
      turn: "you",
    });
    const youReal = calcEnvido(g.hand.origYourHand);
    g = cantarEnvido(g, "you", "envido");
    g = responderEnvido(g, "ai", true, { playerDeclared: youReal, aiLieRate: 0 });
    const yScore = g.scores.you;
    const aScore = g.scores.ai;

    g = reclamarEnvido(g, "ai");
    expect(g.scores.you).toBe(yScore);
    expect(g.scores.ai).toBe(aScore);
  });
});

describe("truco · picardía · 4 de la última", () => {
  it("cantar truco tras un 4 rival en la 3ª baza rebota los puntos", () => {
    let g = startHand(null, false, 30);
    g = setHand(g, {
      trick: 2,
      trickLeader: "you",
      turn: "ai",
      trickWinners: ["you", "ai"],
      table: [
        { you: card("y1", 7, "espadas"), ai: card("a1", 5, "bastos") },
        { you: card("y2", 5, "copas"), ai: card("a2", 3, "oros") },
        { you: card("y3", 4, "espadas"), ai: null },
      ],
      yourHand: [],
      aiHand: [card("a3", 12, "bastos")],
    });
    const before = g.scores.you;
    g = cantarTruco(g, "ai");

    expect(g.scores.you).toBe(before + 2);

    expect(g.hand.pending).toBeNull();
  });
});

describe("truco · irse al mazo con envido pendiente", () => {
  it("acredita los puntos del envido al cantor cuando el rival se va al mazo", () => {
    let g = startHand(null, false, 30);

    g = cantarEnvido(g, "you", "envido");
    const yBefore = g.scores.you;
    g = irseAlMazo(g, "ai");

    expect(g.scores.you - yBefore).toBeGreaterThanOrEqual(2);
    expect(g.hand.handOver).toBe(true);
  });
});

void playCard;
void responderTruco;
