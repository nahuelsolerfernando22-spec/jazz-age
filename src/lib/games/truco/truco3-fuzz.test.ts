import { describe, it, expect } from "vitest";
import {
  startHand3,
  playCard3,
  discardCard,
  needsDiscard,
  ai3Decide,
  cantarEnvido3,
  cantarTruco3,
  responderEnvido3,
  responderTruco3,
  irseAlMazo3,
  canCantarEnvido3,
  canCantarEnvidoLevel3,
  canCantarTruco3,
  canIrseAlMazo3,
  canPlay,
  sideOf,
  SEATS,
  type Game3,
  type Seat,
} from "@/lib/truco3";

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

function step(g: Game3, who: Seat, rng: () => number): Game3 {
  const h = g.hand;
  if (needsDiscard(g) && who === h.solo) {
    const d = ai3Decide(g, who, rng);
    return discardCard(g, who, d.cardId ?? h.hands[who][0]!.id);
  }
  if (h.pending && h.pending.bySide !== sideOf(h, who)) {
    // a veces escalamos o metemos "envido primero"
    if (rng() < 0.25) {
      if (h.pending.kind === "envido") {
        const lv = (["envido", "real", "falta"] as const).filter((x) =>
          canCantarEnvidoLevel3(g, who, x),
        );
        if (lv.length) return cantarEnvido3(g, who, lv[Math.floor(rng() * lv.length)]!);
      }
      if (h.pending.kind === "truco" && canCantarEnvido3(g, who))
        return cantarEnvido3(g, who, "envido");
    }
    const d = ai3Decide(g, who, rng);
    const accept = d.accept ?? rng() < 0.5;
    return h.pending.kind === "envido"
      ? responderEnvido3(g, who, accept)
      : responderTruco3(g, who, accept);
  }
  if (!h.pending && h.turn === who) {
    if (rng() < 0.2 && canCantarEnvido3(g, who))
      return cantarEnvido3(g, who, (["envido", "real", "falta"] as const)[Math.floor(rng() * 3)]);
    if (rng() < 0.2 && canCantarTruco3(g, who)) return cantarTruco3(g, who);
    if (rng() < 0.03 && canIrseAlMazo3(g, who)) return irseAlMazo3(g, who);
    if (canPlay(g, who)) {
      const hand = h.hands[who];
      const c = hand[Math.floor(rng() * hand.length)];
      if (c) return playCard3(g, who, c.id);
    }
  }
  return g;
}

describe("truco de a tres · fuzz", () => {
  it("300 partidas terminan sin trabarse ni romper invariantes", () => {
    for (let s = 1; s <= 300; s++) {
      const rng = mulberry(s * 104729);
      let g = startHand3(null, {
        pointGoal: s % 2 === 0 ? 15 : 30,
        hostName: "Rosa",
        wandererName: "Eulalia",
        hostPortrait: "",
        wandererPortrait: "",
        rng,
      });
      let steps = 0;
      let stuck = 0;
      while (!g.winner && steps < 8000) {
        steps++;
        if (g.hand.handOver) {
          g = startHand3(g, {
            pointGoal: g.pointGoal,
            hostName: "Rosa",
            wandererName: "Eulalia",
            hostPortrait: "",
            wandererPortrait: "",
            rng,
          });
          continue;
        }
        const before = g;
        for (const seat of SEATS) {
          g = step(g, seat, rng);
          if (g !== before) break;
        }
        if (g === before) {
          stuck++;
          if (stuck > 3) {
            throw new Error(
              `TRABADO seed=${s} ${JSON.stringify({
                pending: g.hand.pending,
                turn: g.hand.turn,
                solo: g.hand.solo,
                trick: g.hand.trick,
                discard: g.hand.discard?.id ?? null,
                counts: {
                  you: g.hand.hands.you.length,
                  host: g.hand.hands.host.length,
                  wanderer: g.hand.hands.wanderer.length,
                },
                log: g.hand.log.slice(-6),
              })}`,
            );
          }
        } else stuck = 0;
        for (const seat of SEATS) expect(g.scores[seat]).toBeGreaterThanOrEqual(0);
      }
      expect(g.winner, `seed ${s} no terminó (steps=${steps})`).toBeTruthy();
      const w = g.winner as Seat;
      expect(g.scores[w]).toBeGreaterThanOrEqual(g.pointGoal);
    }
  }, 180_000);
});
