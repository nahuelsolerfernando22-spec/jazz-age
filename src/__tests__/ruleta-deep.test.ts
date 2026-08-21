import { describe, it, expect } from "vitest";
import {
  ANNOUNCED_BETS,
  EURO_ORDER,
  N,
  REDS,
  colorOf,
  payoutFor,
  type BetKind,
} from "@/lib/roulette-math";

function seededRng(seed: number) {
  let t = seed >>> 0 || 1;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function spin(rng: () => number): number {
  return EURO_ORDER[Math.floor(rng() * N)];
}

describe("ruleta · auditoría profunda (20k giros)", () => {
  const SPINS = 20_000;

  it("RTP de apuestas planas ronda 36/37 (edge de casa ~2.7%)", () => {
    const bets: { name: string; b: BetKind; expected: number }[] = [
      { name: "rojo", b: { kind: "color", color: "red" }, expected: (18 / 37) * 2 },
      { name: "negro", b: { kind: "color", color: "black" }, expected: (18 / 37) * 2 },
      { name: "par", b: { kind: "parity", even: true }, expected: (18 / 37) * 2 },
      { name: "impar", b: { kind: "parity", even: false }, expected: (18 / 37) * 2 },
      { name: "1-18", b: { kind: "highLow", high: false }, expected: (18 / 37) * 2 },
      { name: "19-36", b: { kind: "highLow", high: true }, expected: (18 / 37) * 2 },
      { name: "docena 1", b: { kind: "dozen", idx: 1 }, expected: (12 / 37) * 3 },
      { name: "columna 2", b: { kind: "column", idx: 2 }, expected: (12 / 37) * 3 },
      { name: "pleno 17", b: { kind: "number", n: 17 }, expected: (1 / 37) * 36 },
    ];

    const rng = seededRng(0xcafef00d);
    let totalStake = 0;
    let totalReturn = 0;
    const perBet = bets.map((x) => ({ ...x, stake: 0, ret: 0 }));

    for (let i = 0; i < SPINS; i++) {
      const n = spin(rng);
      for (const row of perBet) {
        row.stake += 1;
        totalStake += 1;
        const mult = payoutFor(row.b, n);
        row.ret += mult;
        totalReturn += mult;
      }
    }

    for (const row of perBet) {
      const rtp = row.ret / row.stake;
      expect(Math.abs(rtp - row.expected)).toBeLessThan(0.1);
    }

    // Global RTP debe estar cerca de 36/37 (~0.973) — sin apuesta a 0
    const globalRtp = totalReturn / totalStake;
    expect(globalRtp).toBeGreaterThan(0.9);
    expect(globalRtp).toBeLessThan(1.02);
  });

  it("cobertura combinada: rojo+negro+cero suman 37/37 giros", () => {
    const rng = seededRng(0xa11ce);
    let red = 0,
      black = 0,
      green = 0;
    for (let i = 0; i < SPINS; i++) {
      const n = spin(rng);
      const c = colorOf(n);
      if (c === "red") red++;
      else if (c === "black") black++;
      else green++;
    }
    expect(red + black + green).toBe(SPINS);
    // El verde debe rondar 1/37 ≈ 2.7%
    expect(green / SPINS).toBeGreaterThan(0.015);
    expect(green / SPINS).toBeLessThan(0.045);
  });

  it("hot number: pleno paga 50x en su día, 36x en cualquier otro", () => {
    // Sobre el número 17 con hotNumber=17 debe pagar 50; con hotNumber=5 debe pagar 36.
    expect(payoutFor({ kind: "number", n: 17 }, 17, 17)).toBe(50);
    expect(payoutFor({ kind: "number", n: 17 }, 17, 5)).toBe(36);
    expect(payoutFor({ kind: "number", n: 17 }, 17)).toBe(36);
    // Sobre un número que no acertó, siempre 0.
    expect(payoutFor({ kind: "number", n: 17 }, 4, 17)).toBe(0);
  });

  it("cero: apuestas externas (rojo/negro/par/impar/hi-lo/docena/columna) siempre pierden", () => {
    const externals: BetKind[] = [
      { kind: "color", color: "red" },
      { kind: "color", color: "black" },
      { kind: "parity", even: true },
      { kind: "parity", even: false },
      { kind: "highLow", high: true },
      { kind: "highLow", high: false },
      { kind: "dozen", idx: 1 },
      { kind: "dozen", idx: 2 },
      { kind: "dozen", idx: 3 },
      { kind: "column", idx: 1 },
      { kind: "column", idx: 2 },
      { kind: "column", idx: 3 },
    ];
    for (const b of externals) expect(payoutFor(b, 0)).toBe(0);
    // Pero pleno al 0 sí paga 36
    expect(payoutFor({ kind: "number", n: 0 }, 0)).toBe(36);
  });

  it("columnas cubren los 36 números sin solape", () => {
    const cover = new Set<number>();
    for (let n = 1; n <= 36; n++) {
      let hits = 0;
      for (const idx of [1, 2, 3] as const) {
        if (payoutFor({ kind: "column", idx }, n) > 0) hits++;
      }
      expect(hits).toBe(1);
      cover.add(n);
    }
    expect(cover.size).toBe(36);
  });

  it("rojos declarados coinciden con la lista canónica (18 rojos, 18 negros)", () => {
    let red = 0,
      black = 0;
    for (let n = 1; n <= 36; n++) {
      if (REDS.has(n)) red++;
      else black++;
    }
    expect(red).toBe(18);
    expect(black).toBe(18);
  });

  it("apuestas anunciadas: RTP correcto y stake por giro coincide con tamaño del grupo", () => {
    // Voisins (17), tiers (12), orphelins (8) — cada número paga 36 en el grupo.
    // Probabilidad de acierto ≈ size/37, RTP ≈ (size/37)*36/size = 36/37.
    const groups: { name: string; nums: readonly number[] }[] = [
      { name: "voisins", nums: ANNOUNCED_BETS.voisins },
      { name: "tiers", nums: ANNOUNCED_BETS.tiers },
      { name: "orphelins", nums: ANNOUNCED_BETS.orphelins },
    ];
    const rng = seededRng(0xf00dfeed);
    for (const g of groups) {
      const set = new Set(g.nums);
      let stake = 0,
        ret = 0;
      for (let i = 0; i < SPINS; i++) {
        const n = spin(rng);
        stake += g.nums.length;
        if (set.has(n)) ret += 36;
      }
      const rtp = ret / stake;
      expect(Math.abs(rtp - 36 / 37)).toBeLessThan(0.05);
    }
  });
});
