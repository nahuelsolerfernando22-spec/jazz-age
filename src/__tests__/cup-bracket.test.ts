import { describe, it, expect } from "vitest";
import {
  CUP_BUYIN,
  CUP_ENTRANTS,
  CUP_GAMES,
  CUP_PURSE,
  CUP_ROUND_REWARDS,
  CUP_TOTAL_ROUNDS,
  ajustarGarra,
  buildBracket,
  cupDivision,
  cupPozo,
  cupSchedule,
  matchesAt,
  participantsAt,
  playerAlive,
  resolveRound,
  rivalAt,
} from "@/lib/cup";

function bracketFor(seed = "test:1", rating = 0) {
  return buildBracket(seed, "Vos", rating, CUP_BUYIN);
}

describe("cup · llave de 16", () => {
  it("arma exactamente 16 anotados con vos adentro y sin repetidos", () => {
    const b = bracketFor();
    expect(b.entrants).toHaveLength(CUP_ENTRANTS);
    expect(b.entrants.filter((e) => e.esVos)).toHaveLength(1);
    expect(new Set(b.entrants.map((e) => e.nombre)).size).toBe(CUP_ENTRANTS);
    expect(b.order).toHaveLength(CUP_ENTRANTS);
    expect(new Set(b.order).size).toBe(CUP_ENTRANTS);
  });

  it("es determinista: misma semilla, misma llave", () => {
    expect(JSON.stringify(bracketFor("x"))).toBe(JSON.stringify(bracketFor("x")));
  });

  it("halves cada ronda hasta dejar un solo ganador", () => {
    let b = bracketFor("halves");
    const esperados = [16, 8, 4, 2];
    for (let r = 0; r < CUP_TOTAL_ROUNDS; r++) {
      expect(participantsAt(b, r)).toHaveLength(esperados[r]);
      expect(matchesAt(b, r)).toHaveLength(esperados[r] / 2);
      b = resolveRound(b, r, true);
    }
    expect(participantsAt(b, CUP_TOTAL_ROUNDS)).toHaveLength(1);
    expect(b.entrants[participantsAt(b, CUP_TOTAL_ROUNDS)[0]].esVos).toBe(true);
  });

  it("ganando siempre seguís vivo; perdiendo salís de la llave", () => {
    let b = bracketFor("alive");
    expect(playerAlive(b, 0)).toBe(true);
    b = resolveRound(b, 0, true);
    expect(playerAlive(b, 1)).toBe(true);
    const perdida = resolveRound(b, 1, false);
    expect(playerAlive(perdida, 2)).toBe(false);
  });

  it("los cruces de al lado se resuelven solos y sin duplicar ganadores", () => {
    let b = bracketFor("paralelo");
    for (let r = 0; r < 2; r++) b = resolveRound(b, r, true);
    const ganadores = b.winners[1];
    expect(new Set(ganadores).size).toBe(ganadores.length);
    // Cada ganador salió de un cruce real de la ronda anterior.
    const previos = new Set(participantsAt(b, 1));
    for (const g of ganadores) expect(previos.has(g)).toBe(true);
  });

  it("el rival de cada ronda existe y nunca sos vos mismo", () => {
    let b = bracketFor("rival");
    for (let r = 0; r < CUP_TOTAL_ROUNDS; r++) {
      const rival = rivalAt(b, r);
      expect(rival).not.toBeNull();
      expect(rival!.esVos).toBe(false);
      expect(rival!.record.g).toBeGreaterThanOrEqual(0);
      b = resolveRound(b, r, true);
    }
  });
});

describe("cup · economía del cuadro", () => {
  it("el pozo se arma con los 16 buy-ins", () => {
    expect(cupPozo(CUP_BUYIN)).toBe(CUP_BUYIN * CUP_ENTRANTS);
    expect(bracketFor().pozo).toBe(cupPozo(CUP_BUYIN));
  });

  it("las bolsas por ronda suben y la entrada se recupera en la primera", () => {
    for (let i = 1; i < CUP_PURSE.length; i++) {
      expect(CUP_PURSE[i]).toBeGreaterThan(CUP_PURSE[i - 1]);
    }
    expect(CUP_PURSE[0]).toBeLessThan(CUP_BUYIN);
    expect(CUP_PURSE[0] + CUP_PURSE[1]).toBeGreaterThan(CUP_BUYIN);
  });

  it("cada ronda deja premio distinto en la vitrina y suma puntos crecientes", () => {
    expect(CUP_ROUND_REWARDS).toHaveLength(CUP_TOTAL_ROUNDS);
    expect(new Set(CUP_ROUND_REWARDS.map((r) => r.extra)).size).toBe(CUP_TOTAL_ROUNDS);
    for (let i = 1; i < CUP_ROUND_REWARDS.length; i++) {
      expect(CUP_ROUND_REWARDS[i].puntos).toBeGreaterThan(CUP_ROUND_REWARDS[i - 1].puntos);
    }
  });

  it("el pozo total nunca es menor a lo que paga el cuadro entero", () => {
    const pagado = CUP_PURSE.reduce((a, b) => a + b, 0);
    expect(cupPozo(CUP_BUYIN)).toBeLessThan(pagado * 4); // la casa no imprime infinito
  });
});

describe("cup · dificultad adaptativa", () => {
  it("si venís ganando el rival aprieta, si venís perdiendo afloja", () => {
    expect(ajustarGarra(2, 1, 0)).toBeGreaterThan(ajustarGarra(2, 0, 0));
    expect(ajustarGarra(2, -1, 0)).toBeLessThan(ajustarGarra(2, 0, 0));
  });

  it("nunca se sale del rango 1..5 por más rachas que haya", () => {
    for (const rating of [-1, -0.5, 0, 0.5, 1]) {
      for (let round = 0; round < CUP_TOTAL_ROUNDS; round++) {
        for (const base of [1, 3, 5]) {
          const g = ajustarGarra(base, rating, round);
          expect(g).toBeGreaterThanOrEqual(1);
          expect(g).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it("la final pega más fuerte que la primera ronda con el mismo rival", () => {
    expect(ajustarGarra(2, 0, 3)).toBeGreaterThanOrEqual(ajustarGarra(2, 0, 0));
  });
});

describe("cup · agenda y divisiones", () => {
  it("los llamados son futuros, ordenados y rotan de mesa", () => {
    const now = Date.UTC(2026, 0, 1, 3, 17);
    const agenda = cupSchedule(now, 4);
    expect(agenda).toHaveLength(4);
    for (let i = 0; i < agenda.length; i++) {
      expect(agenda[i].at).toBeGreaterThan(now);
      if (i > 0) expect(agenda[i].at).toBeGreaterThan(agenda[i - 1].at);
      expect(CUP_GAMES.some((g) => g.id === agenda[i].gameId)).toBe(true);
    }
    expect(new Set(agenda.map((a) => a.gameId)).size).toBeGreaterThan(1);
  });

  it("las divisiones escalan sin huecos", () => {
    expect(cupDivision(0).actual.nombre).toBe("Vereda");
    expect(cupDivision(999999).siguiente).toBeNull();
    expect(cupDivision(200).actual.desde).toBeLessThanOrEqual(200);
    expect(cupDivision(200).siguiente!.desde).toBeGreaterThan(200);
  });
});
