import { describe, it, expect } from "vitest";
import {
  startHand,
  playCard,
  aiDecide,
  cantarEnvido,
  responderEnvido,
  cantarTruco,
  responderTruco,
  cantarFlor,
  responderFlor,
  irseAlMazo,
  canCantarEnvidoLevel,
  canCantarEnvido,
  canCantarTruco,
  canCantarFlor,
  canIrseAlMazo,
  type GameState,
  type Player,
} from "@/lib/games/truco/truco";

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function act(g: GameState, who: Player, rng: () => number): GameState {
  const h = g.hand;
  const d = who === "ai" ? aiDecide(g, rng) : { kind: "wait" as const };
  if (who === "you" && rng() < 0.25) {
    const lv = (["envido", "real", "falta"] as const)[Math.floor(rng() * 3)];
    if (canCantarEnvidoLevel(g, "you", lv)) return cantarEnvido(g, "you", lv);
    if (canCantarTruco(g, "you")) return cantarTruco(g, "you");
  }
  if (d.kind === "mazo" && canIrseAlMazo(g, who)) return irseAlMazo(g, who);
  if (d.kind === "respond" && h.pending) {
    if (h.pending.kind === "envido") return responderEnvido(g, who, d.accept ?? false);
    if (h.pending.kind === "truco") return responderTruco(g, who, d.accept ?? false);
    if (h.pending.kind === "flor") return responderFlor(g, who, d.florAction ?? "achicar");
  }
  if (d.kind === "canto" && d.canto) {
    const c = d.canto.type;
    if ((c === "envido" || c === "real" || c === "falta") && canCantarEnvidoLevel(g, who, c))
      return cantarEnvido(g, who, c);
    if ((c === "truco" || c === "retruco" || c === "vale4") && canCantarTruco(g, who))
      return cantarTruco(g, who);
    if (c === "flor" && canCantarFlor(g, who)) return cantarFlor(g, who);
  }
  if (h.pending) {
    if (h.pending.kind === "envido") return responderEnvido(g, who, rng() < 0.5);
    if (h.pending.kind === "truco") return responderTruco(g, who, rng() < 0.5);
    if (h.pending.kind === "flor") return responderFlor(g, who, "achicar");
  }
  if (h.turn === who) {
    const hand = who === "you" ? h.yourHand : h.aiHand;
    const card = hand[Math.floor(rng() * hand.length)];
    if (card) return playCard(g, who, card.id);
  }
  return g;
}

describe("truco engine fuzz", () => {
  it("nunca queda trabado en 400 partidas", () => {
    for (let s = 1; s <= 400; s++) {
      const rng = mulberry(s * 7919);
      let g = startHand(null, s % 2 === 0, 15, rng, "Eulalia");
      let steps = 0;
      while (!g.winner && steps < 4000) {
        steps++;
        if (g.hand.handOver) {
          g = startHand(g, s % 2 === 0, 15, rng, "Eulalia");
          continue;
        }
        const who: Player = g.hand.pending
          ? g.hand.pending.by === "you"
            ? "ai"
            : "you"
          : g.hand.turn;
        const next = act(g, who, rng);
        if (next === g) {
          throw new Error(
            `TRABADO seed=${s} state=${JSON.stringify({ pending: g.hand.pending, turn: g.hand.turn, trick: g.hand.trick, ai: g.hand.aiHand.length, you: g.hand.yourHand.length, table: g.hand.table, over: g.hand.handOver, log: g.hand.log.slice(-6) })}`,
          );
        }
        g = next;
      }
      expect(g.winner, `seed ${s} no terminó`).toBeTruthy();
    }
  });
});
