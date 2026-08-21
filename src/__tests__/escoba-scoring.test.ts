import { describe, it, expect } from "vitest";
import { makeCard } from "@/lib/games/escoba/deck";
import { capturesFor, findCaptures } from "@/lib/games/escoba/rules";
import { scoreRound, type Pile } from "@/lib/games/escoba/scoring";
import { auditPlayerMove, newMatch } from "@/lib/games/escoba/engine";
import type { EscobaState } from "@/lib/games/escoba/engine";

describe("escoba/rules", () => {
  it("encuentra combinaciones que suman 15", () => {
    const table = [
      makeCard("oros", 4),
      makeCard("copas", 5),
      makeCard("espadas", 6),
      makeCard("bastos", 3),
    ];
    const opts = capturesFor(table, makeCard("oros", 7));

    const hasFiveThree = opts.some(
      (o) => o.length === 2 && o.some((c) => c.rank === 5) && o.some((c) => c.rank === 3),
    );
    expect(hasFiveThree).toBe(true);
  });

  it("una carta que suma 15 con toda la mesa dispara escoba", () => {
    const table = [makeCard("oros", 5)];
    const opts = capturesFor(table, makeCard("copas", 10));
    expect(opts.length).toBeGreaterThan(0);
    expect(opts[0].length).toBe(table.length);
  });

  it("findCaptures respeta target exacto", () => {
    const table = [
      makeCard("oros", 7),
      makeCard("copas", 3),
      makeCard("espadas", 5),
      makeCard("bastos", 2),
    ];
    const opts = findCaptures(table, 15);

    const has7_3_5 = opts.some((o) => o.length === 3);
    expect(has7_3_5).toBe(true);
  });
});

describe("escoba/scoring", () => {
  it("asigna puntos por más cartas, más oros, velo, setenta y escobas", () => {
    const a: Pile = {
      captured: [
        ...[1, 2, 3, 4, 5, 6, 7].map((r) => makeCard("oros", r as 1 | 2 | 3 | 4 | 5 | 6 | 7)),
        makeCard("copas", 7),
        makeCard("espadas", 7),
        makeCard("bastos", 7),
        makeCard("copas", 6),
        makeCard("espadas", 6),
        makeCard("bastos", 6),
        ...[1, 2, 3, 4].map((r) => makeCard("copas", r as 1 | 2 | 3 | 4)),
        makeCard("espadas", 1),
        makeCard("bastos", 1),
        makeCard("espadas", 2),
        makeCard("bastos", 2),
      ],
      sweeps: 2,
    };
    const b: Pile = {
      captured: [
        makeCard("copas", 5),
        makeCard("espadas", 5),
        makeCard("bastos", 5),
        makeCard("espadas", 3),
        makeCard("bastos", 3),
        makeCard("espadas", 4),
        makeCard("bastos", 4),
      ],
      sweeps: 0,
    };
    const { a: sa, b: sb } = scoreRound(a, b);
    expect(sa.cards).toBe(1);
    expect(sa.oros).toBe(1);
    expect(sa.siete).toBe(1);
    expect(sa.setenta).toBe(1);
    expect(sa.sweeps).toBe(2);
    expect(sa.total).toBe(6);
    expect(sb.total).toBe(0);
  });
});

describe("escoba/engine — reglas críticas", () => {
  it("newMatch reparte 4 a la mesa, 3 por mano y CPU abre la primera ronda", () => {
    let seed = 42;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const s = newMatch(rng);
    expect(s.table.length).toBe(4);
    expect(s.hands.player.length).toBe(3);
    expect(s.hands.cpu.length).toBe(3);

    expect(s.dealer).toBe("player");
    expect(s.turn).toBe("cpu");
  });

  it("auditPlayerMove detecta captura del 7 de oros y escoba dejada pasar", () => {
    const table = [makeCard("oros", 7), makeCard("copas", 3), makeCard("espadas", 5)];
    const hand = [makeCard("bastos", 5)];
    const state = {
      deck: [],
      table,
      hands: { player: hand, cpu: [] },
      piles: { player: { captured: [], sweeps: 0 }, cpu: { captured: [], sweeps: 0 } },
      turn: "player" as const,
      lastCapturer: null,
      dealer: "cpu" as const,
      round: 1,
      totals: { player: 0, cpu: 0 },
      status: "playing" as const,
    } satisfies EscobaState;

    const opts = capturesFor(table, hand[0]);
    expect(opts.length).toBeGreaterThan(0);

    const idx = opts.findIndex((o) => o.some((c) => c.rank === 7 && c.suit === "oros"));
    expect(idx).toBeGreaterThanOrEqual(0);
    const tags = auditPlayerMove(state, 0, idx);
    expect(tags).toContain("cpu_lost_siete_oros");
  });
});
