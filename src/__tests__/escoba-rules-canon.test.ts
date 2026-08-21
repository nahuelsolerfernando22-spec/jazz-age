import { describe, it, expect } from "vitest";
import { makeCard } from "@/lib/games/escoba/deck";
import { capturesFor, hasCapture, wouldSweep } from "@/lib/games/escoba/rules";
import { playCard, newMatch, type EscobaState } from "@/lib/games/escoba/engine";
import { scoreRound, TARGET_SCORE, type Pile } from "@/lib/games/escoba/scoring";

function baseState(overrides: Partial<EscobaState>): EscobaState {
  return {
    deck: [],
    table: [],
    hands: { player: [], cpu: [] },
    piles: { player: { captured: [], sweeps: 0 }, cpu: { captured: [], sweeps: 0 } },
    turn: "player",
    lastCapturer: null,
    dealer: "cpu",
    round: 1,
    totals: { player: 0, cpu: 0 },
    status: "playing",
    ...overrides,
  };
}

describe("Escoba · reglas canónicas", () => {
  it("valores figuras: Sota=8, Caballo=9, Rey=10", () => {
    expect(makeCard("oros", 8).value).toBe(8);
    expect(makeCard("oros", 9).value).toBe(9);
    expect(makeCard("oros", 10).value).toBe(10);
  });

  it("Rey (10) + 5 en la mesa suma 15 y es escoba (mesa queda vacía)", () => {
    const table = [makeCard("copas", 5)];
    const rey = makeCard("oros", 10);
    const opts = capturesFor(table, rey);
    expect(opts.length).toBe(1);
    expect(wouldSweep(table, opts[0])).toBe(true);
  });

  it("Caballo (9) + 6 = 15", () => {
    const opts = capturesFor([makeCard("copas", 6)], makeCard("oros", 9));
    expect(opts.length).toBe(1);
  });

  it("sin combinación posible → sin captura", () => {
    const table = [makeCard("copas", 2), makeCard("espadas", 4)];
    expect(hasCapture(table, makeCard("oros", 3))).toBe(false);
  });

  it("descarte obligatorio: si no hay captura la carta va a la mesa", () => {
    const s = baseState({
      table: [makeCard("copas", 2)],
      hands: { player: [makeCard("oros", 3)], cpu: [makeCard("bastos", 4)] },
    });
    const next = playCard(s, "player", 0);

    expect(next.table.length).toBe(2);
    expect(next.piles.player.captured.length).toBe(0);
    expect(next.event?.type).toBe("discard");
  });

  it("captura suma la carta jugada + las capturadas al pilón", () => {
    const s = baseState({
      table: [makeCard("copas", 5), makeCard("espadas", 3)],
      hands: { player: [makeCard("oros", 7)], cpu: [makeCard("bastos", 4)] },
    });
    const next = playCard(s, "player", 0);
    expect(next.table.length).toBe(0);

    expect(next.piles.player.captured.length).toBe(3);

    expect(next.piles.player.sweeps).toBe(1);
  });

  it("no cuenta escoba si aún quedan cartas en la mesa", () => {
    const s = baseState({
      table: [makeCard("copas", 5), makeCard("espadas", 3), makeCard("bastos", 2)],
      hands: { player: [makeCard("oros", 10)], cpu: [makeCard("bastos", 4)] },
    });

    const opts = capturesFor(s.table, s.hands.player[0]);
    const idx = opts.findIndex((o) => o.length === 1 && o[0].rank === 5);
    expect(idx).toBeGreaterThanOrEqual(0);
    const next = playCard(s, "player", 0, idx);
    expect(next.piles.player.sweeps).toBe(0);
    expect(next.table.length).toBe(2);
  });

  it("restos de la mesa al último capturador cuando termina la ronda", () => {
    const s = baseState({
      deck: [],
      table: [makeCard("bastos", 2)],
      hands: { player: [makeCard("oros", 3)], cpu: [] },
      piles: {
        player: { captured: [makeCard("copas", 4), makeCard("espadas", 6)], sweeps: 0 },
        cpu: { captured: [], sweeps: 0 },
      },
      lastCapturer: "player",
      totals: { player: 14, cpu: 0 },
    });
    const next = playCard(s, "player", 0);
    expect(next.status).toBe("match-end");

    const has2Bastos = next.piles.player.captured.some((c) => c.rank === 2 && c.suit === "bastos");
    expect(has2Bastos).toBe(true);
  });

  it("puntaje: gana cartas, oros, velo, setenta y suma escobas", () => {
    const a: Pile = {
      captured: [
        ...[1, 2, 3, 4, 5, 6, 7].map((r) => makeCard("oros", r as 1 | 2 | 3 | 4 | 5 | 6 | 7)),
        makeCard("copas", 7),
        makeCard("espadas", 7),
        makeCard("bastos", 7),
      ],
      sweeps: 3,
    };
    const b: Pile = { captured: [makeCard("copas", 5)], sweeps: 0 };
    const { a: sa, b: sb } = scoreRound(a, b);
    expect(sa.cards).toBe(1);
    expect(sa.oros).toBe(1);
    expect(sa.siete).toBe(1);
    expect(sa.setenta).toBe(1);
    expect(sa.sweeps).toBe(3);
    expect(sa.total).toBe(1 + 1 + 1 + 1 + 3);
    expect(sb.total).toBe(0);
  });

  it("meta de partida es 15 puntos", () => {
    expect(TARGET_SCORE).toBe(15);
  });

  it("newMatch reparte 3+3 en manos y 4 en la mesa (40 cartas totales)", () => {
    const s = newMatch(() => 0.5);
    const total = s.deck.length + s.table.length + s.hands.player.length + s.hands.cpu.length;
    expect(total).toBe(40);
    expect(s.table.length).toBe(4);
    expect(s.hands.player.length).toBe(3);
    expect(s.hands.cpu.length).toBe(3);
  });
});
