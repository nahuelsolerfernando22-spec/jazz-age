import { describe, expect, it } from "vitest";
import {
  bestPartition,
  canDrawFromPile,
  chinchonDiscardId,
  dealRound,
  discard,
  drawFromDeck,
  drawFromPile,
  grantSecondLife,
  isChinchon,
  isPureChinchon,
  newDeck,
  partitionFromGroups,
  resolveRound,
  startMatch,
  validateMeld,
  type Card,
  type MatchState,
  type PlayerId,
  type RoundState,
  type Suit,
} from "@/lib/games/chinchon/chinchon";
import { aiDecide, applyResult } from "@/lib/games/chinchon/chinchon";
import { CHAMPION_WEIGHTS } from "@/lib/ai/chinchon/weights";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function card(suit: Suit | "joker", rank: number, tag = ""): Card {
  const isJoker = suit === "joker";
  return {
    id: isJoker ? `joker-${rank}${tag}` : `${suit}-${rank}${tag}`,
    suit,
    rank: rank as Card["rank"],
    isJoker,
  };
}

describe("chinchon rules — hand evaluation", () => {
  it("detecta chinchón puro (7 en escalera mismo palo)", () => {
    const hand = [1, 2, 3, 4, 5, 6, 7].map((r) => card("oros", r));
    expect(isPureChinchon(hand)).toBe(true);
    expect(isChinchon(hand)).toBe(true);
  });

  it("rechaza chinchón si hay comodín (no puro)", () => {
    const hand: Card[] = [
      card("oros", 1),
      card("oros", 2),
      card("oros", 3),
      card("oros", 4),
      card("oros", 5),
      card("oros", 6),
      card("joker", 0),
    ];
    expect(isPureChinchon(hand)).toBe(false);
    expect(isChinchon(hand)).toBe(true);
  });

  it("rechaza chinchón con palos mezclados", () => {
    const hand: Card[] = [
      card("oros", 1),
      card("oros", 2),
      card("oros", 3),
      card("oros", 4),
      card("oros", 5),
      card("copas", 6),
      card("oros", 7),
    ];
    expect(isPureChinchon(hand)).toBe(false);
    expect(isChinchon(hand)).toBe(false);
  });

  it("bestPartition minimiza suma suelta con comodín como suelto", () => {
    // Trío 5s + escalera 10-11-12 oros + comodín suelto = joker vale 25 loose
    const hand: Card[] = [
      card("oros", 5),
      card("copas", 5),
      card("espadas", 5),
      card("bastos", 10),
      card("bastos", 11),
      card("bastos", 12),
      card("joker", 0),
    ];
    const p = bestPartition(hand);
    // Con dos combinaciones y joker suelto, looseSum = 25.
    // Alternativa: joker completa como sustituto en un trío/escalera → mejor.
    // El algoritmo debería preferir integrarlo. Verificamos que looseSum es <= 25.
    expect(p.looseSum).toBeLessThanOrEqual(25);
  });

  it("comodín como suelto: mano sin melds posibles lo cuenta como 25", () => {
    // Elegimos ranks tales que ni siquiera con un joker puedan formar run/set.
    // Requisitos: ningún par comparte rank; ningún par del mismo palo dista ≤ 2.
    const hand: Card[] = [
      card("oros", 1),
      card("copas", 4),
      card("espadas", 8),
      card("bastos", 12),
      card("oros", 6), // oros: 1,6 → dist 5, no run con 1 joker
      card("copas", 11), // copas: 4,11 → dist 7
      card("joker", 0),
    ];
    const p = bestPartition(hand);
    expect(p.melds).toHaveLength(0);
    // 1+4+8+12+6+11+25 = 67
    expect(p.looseSum).toBe(67);
  });

  it("validateMeld: trío válido / escalera válida / inválidos", () => {
    expect(validateMeld([card("oros", 5), card("copas", 5), card("espadas", 5)])?.kind).toBe("set");
    expect(validateMeld([card("oros", 4), card("oros", 5), card("oros", 6)])?.kind).toBe("run");
    // Escalera con hueco sin comodín
    expect(validateMeld([card("oros", 4), card("oros", 6), card("oros", 7)])).toBeNull();
    // Escalera con comodín tapando el 5
    expect(validateMeld([card("oros", 4), card("joker", 0), card("oros", 6)])?.kind).toBe("run");
    // Trío con dos comodines
    expect(
      validateMeld([card("oros", 7), card("joker", 0, "a"), card("joker", 0, "b")])?.kind,
    ).toBe("set");
    // 3 comodines: nunca (reals.length===0)
    expect(
      validateMeld([card("joker", 0, "a"), card("joker", 0, "b"), card("joker", 0, "c")]),
    ).toBeNull();
  });
});

describe("chinchon flow — reglas de mesa", () => {
  it("primera carta del pozo NO se puede tomar en el primer turno del no-starter", () => {
    const rnd = mulberry32(42);
    const r = dealRound("user", rnd);
    // El no-starter es "ai" (order = ai, user). Primero juega "ai".
    expect(r.turn).toBe("ai");
    expect(r.discardsPlayed).toBe(0);
    expect(canDrawFromPile(r)).toBe(false);
  });

  it("carta tomada del pozo no puede descartarse en el mismo turno", () => {
    const rnd = mulberry32(7);
    let r = dealRound("user", rnd);
    // Avanzar hasta que "user" (starter) juegue: ai roba/descarta, luego user puede tomar pila.
    r = drawFromDeck(r);
    const aiDiscard = r.hands.ai[0].id;
    r = discard(r, aiDiscard, false).round;
    expect(r.turn).toBe("user");
    expect(canDrawFromPile(r)).toBe(true);
    r = drawFromPile(r);
    expect(r.pileDrawnCardId).toBe(aiDiscard);
    // Intentar descartar la misma carta: debe rechazarse (state no cambia)
    const before = r;
    const res = discard(r, aiDiscard, false);
    expect(res.round).toBe(before);
    expect(res.closed).toBe(false);
    // Descartar otra carta sí funciona
    const other = r.hands.user.find((c) => c.id !== aiDiscard)!;
    const ok = discard(r, other.id, false);
    expect(ok.round.turn).toBe("ai");
    expect(ok.round.pileDrawnCardId).toBeNull();
  });

  it("draw sin pila y con mazo vacío: reshufflea el pozo", () => {
    const rnd = mulberry32(11);
    let r = dealRound("user", rnd);
    // Vaciar el mazo artificialmente dejando 1 carta en la pila.
    r = { ...r, deck: [] };
    // No debe crashear: reshufflea el pozo (1 carta) al deck y sigue.
    const before = r.pile.length;
    const after = drawFromDeck(r);
    expect(
      after.hands[after.turn === "user" ? "ai" : "user"].length + after.hands[after.turn].length,
    ).toBeGreaterThanOrEqual(14);
    // Consumió al menos la única carta que había
    expect(after.pile.length + after.deck.length).toBeLessThan(before + 1);
  });

  it("resolveRound: chinchón otorga 200 al oponente y termina", () => {
    const rnd = mulberry32(3);
    const r = dealRound("user", rnd);
    // Forzar mano de chinchón puro para "user"
    const chin = [1, 2, 3, 4, 5, 6, 7].map((n) => card("oros", n));
    const r2: RoundState = {
      ...r,
      hands: { ...r.hands, user: chin },
      turn: "user",
      phase: "discard",
    };
    const res = resolveRound(r2, { closer: "user", badClose: false, chinchon: true });
    expect(res.chinchon).toBe(true);
    expect(res.delta.ai).toBe(200);
    expect(res.delta.user).toBe(0);
  });

  it("resolveRound: mal corte suma 10 + looseSum al que cortó", () => {
    const rnd = mulberry32(9);
    const r = dealRound("user", rnd);
    const bad = [
      card("oros", 12),
      card("copas", 11),
      card("espadas", 10),
      card("bastos", 9),
      card("oros", 8),
      card("copas", 7),
      card("espadas", 6),
    ];
    const r2: RoundState = { ...r, hands: { ...r.hands, user: bad }, turn: "user" };
    const res = resolveRound(r2, { closer: "user", badClose: true, chinchon: false });
    const sum = bad.reduce((s, c) => s + (c.rank as number), 0);
    expect(res.delta.user).toBe(10 + sum);
    expect(res.delta.ai).toBe(0);
  });

  it("chinchonDiscardId identifica la carta a descartar de una mano de 8 con chinchón latente", () => {
    const hand8: Card[] = [
      ...[1, 2, 3, 4, 5, 6, 7].map((n) => card("copas", n)),
      card("bastos", 12),
    ];
    const id = chinchonDiscardId(hand8);
    expect(id).toBe("bastos-12");
  });

  it("partitionFromGroups: rechaza cartas duplicadas entre grupos", () => {
    const hand: Card[] = [
      card("oros", 5),
      card("copas", 5),
      card("espadas", 5),
      card("oros", 6),
      card("oros", 7),
      card("oros", 8),
      card("copas", 2),
    ];
    const r = partitionFromGroups(hand, [
      ["oros-5", "copas-5", "espadas-5"],
      ["oros-5", "oros-6", "oros-7"], // reutiliza oros-5
    ]);
    expect(r.ok).toBe(false);
  });

  it("partitionFromGroups: acepta melds válidos y calcula sueltas", () => {
    const hand: Card[] = [
      card("oros", 5),
      card("copas", 5),
      card("espadas", 5),
      card("oros", 10),
      card("oros", 11),
      card("oros", 12),
      card("bastos", 2),
    ];
    const r = partitionFromGroups(hand, [
      ["oros-5", "copas-5", "espadas-5"],
      ["oros-10", "oros-11", "oros-12"],
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.partition.loose.map((c) => c.id)).toEqual(["bastos-2"]);
      expect(r.partition.looseSum).toBe(2);
    }
  });
});

describe("chinchon match — segunda vida", () => {
  it("grantSecondLife iguala al perdedor y reanuda", () => {
    const m: MatchState = {
      scores: { user: 120, ai: 80 },
      round: dealRound("user", mulberry32(1)),
      roundNo: 5,
      history: [],
      over: { winner: "ai", reason: "score" },
      secondLivesUsed: 0,
      dirtyUsed: { user: false, ai: false },
    };
    const m2 = grantSecondLife(m, { maxAllowed: 1 }, mulberry32(2));
    expect(m2.over).toBe(false);
    expect(m2.scores.user).toBe(80); // igualado al ganador
    expect(m2.secondLivesUsed).toBe(1);
  });

  it("no otorga segunda vida si se pierde por chinchón (default)", () => {
    const m: MatchState = {
      scores: { user: 200, ai: 0 },
      round: dealRound("user", mulberry32(1)),
      roundNo: 3,
      history: [],
      over: { winner: "ai", reason: "chinchon" },
      secondLivesUsed: 0,
      dirtyUsed: { user: false, ai: false },
    };
    const m2 = grantSecondLife(m, { maxAllowed: 1 });
    expect(m2.over).toBeTruthy();
  });

  it("respeta maxAllowed", () => {
    const m: MatchState = {
      scores: { user: 120, ai: 80 },
      round: dealRound("user", mulberry32(1)),
      roundNo: 5,
      history: [],
      over: { winner: "ai", reason: "score" },
      secondLivesUsed: 1,
      dirtyUsed: { user: false, ai: false },
    };
    const m2 = grantSecondLife(m, { maxAllowed: 1 });
    expect(m2.over).toBeTruthy();
  });
});

describe("chinchon integrity — deck y partidas simuladas", () => {
  it("newDeck tiene 50 cartas únicas (48 españolas + 2 comodines)", () => {
    const d = newDeck();
    expect(d).toHaveLength(50);
    expect(new Set(d.map((c) => c.id)).size).toBe(50);
    expect(d.filter((c) => c.isJoker)).toHaveLength(2);
  });

  it("500 rondas simuladas: no crashea, no duplica cartas, closer válido", () => {
    let matches = 0;
    let rounds = 0;
    let chinchonHits = 0;
    let badCloses = 0;
    let goodCloses = 0;
    const seen = new Set<string>();

    for (let seed = 1; seed <= 30 && rounds < 500; seed++) {
      const rnd = mulberry32(seed);
      let m = startMatch("user", rnd);
      let guard = 0;
      while (!m.over && guard < 800 && rounds < 500) {
        guard++;
        const r = m.round;
        const who = r.turn;

        // Sanidad: total de cartas siempre 50.
        const total = r.deck.length + r.pile.length + r.hands.user.length + r.hands.ai.length;
        expect(total).toBe(50);

        // Sanidad: no hay ids duplicados en el sistema
        seen.clear();
        for (const c of [...r.deck, ...r.pile, ...r.hands.user, ...r.hands.ai]) {
          expect(seen.has(c.id)).toBe(false);
          seen.add(c.id);
        }

        const roundView =
          who === "ai" ? r : { ...r, hands: { ai: r.hands.user, user: r.hands.ai } };
        const decision = aiDecide(roundView, rnd, {
          weights: CHAMPION_WEIGHTS,
          difficulty: 2,
          depth: 1,
          rivalPilePicks: [],
          rivalDiscards: [],
        });

        const afterDraw =
          decision.draw === "pile" && canDrawFromPile(r) ? drawFromPile(r) : drawFromDeck(r);

        // Regla pileDrawnCardId: si la IA sugirió descartar la misma carta que acaba de robar del pozo,
        // el discard debe rechazarse silenciosamente. En ese caso forzamos otro descarte.
        let discardId = decision.discardId;
        if (afterDraw.pileDrawnCardId === discardId) {
          const alt = afterDraw.hands[who].find((c) => c.id !== discardId);
          if (alt) discardId = alt.id;
        }
        const res = discard(afterDraw, discardId, decision.close);
        if (res.closed) {
          rounds++;
          if (res.closed.chinchon) chinchonHits++;
          else if (res.closed.badClose) badCloses++;
          else goodCloses++;
          const rr = resolveRound(res.round, res.closed);
          m = applyResult(m, rr);
        } else {
          m = { ...m, round: res.round };
        }
      }
      matches++;
    }

    expect(matches).toBeGreaterThan(0);
    expect(rounds).toBeGreaterThan(50);
    expect(goodCloses + badCloses + chinchonHits).toBe(rounds);
    // Regresión: la IA nunca debe proponer un cierre inválido.
    // Antes del fix del peek-de-mazo hubo >50% badCloses.
    expect(badCloses / rounds).toBeLessThan(0.05);
    // Reporte informativo (no assertivo)
    console.log(
      `[chinchon-deep] rondas=${rounds} goodCloses=${goodCloses} badCloses=${badCloses} chinchones=${chinchonHits}`,
    );
  }, 120_000);
});
