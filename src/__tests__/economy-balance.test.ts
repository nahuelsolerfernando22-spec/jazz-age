import { describe, it, expect } from "vitest";
import {
  ECONOMY_PROFILES,
  cupExpectedValue,
  simulateEconomy,
  streakChipsForDay,
} from "@/lib/economy-balance";
import { CUP_BUYIN } from "@/lib/cup";
import { AD_MAX_PER_DAY, AD_REWARD_CHIPS, DAILY_GIFT_CHIPS } from "@/store/daily-rewards";

const perfil = (n: string) => ECONOMY_PROFILES.find((p) => p.nombre === n)!;

describe("economía · valor esperado del torneo", () => {
  it("perder siempre en la primera ronda cuesta exactamente la entrada", () => {
    expect(cupExpectedValue(0)).toBe(-CUP_BUYIN);
  });

  it("un jugador flojo pierde plata en el torneo (hay riesgo real)", () => {
    expect(cupExpectedValue(0.35)).toBeLessThan(0);
  });

  it("el punto de equilibrio está en un winrate razonable, ni regalado ni imposible", () => {
    let breakeven = 1;
    for (let w = 0; w <= 1; w += 0.01) {
      if (cupExpectedValue(w) >= 0) {
        breakeven = w;
        break;
      }
    }
    expect(breakeven).toBeGreaterThan(0.3);
    expect(breakeven).toBeLessThan(0.7);
  });

  it("barrer el cuadro siempre paga más que la entrada", () => {
    expect(cupExpectedValue(1)).toBeGreaterThan(CUP_BUYIN * 4);
  });
});

describe("economía · fuentes diarias", () => {
  it("el regalo diario más los anuncios no alcanzan para vivir del torneo", () => {
    const techoDiario = DAILY_GIFT_CHIPS + AD_MAX_PER_DAY * AD_REWARD_CHIPS;
    expect(techoDiario).toBeLessThan(CUP_BUYIN * 5);
  });

  it("la racha premia la semana completa y reinicia el ciclo", () => {
    expect(streakChipsForDay(7)).toBeGreaterThan(streakChipsForDay(1) * 5);
    expect(streakChipsForDay(8)).toBe(streakChipsForDay(1));
  });
});

describe("economía · 30 días simulados", () => {
  it("el casual llega a fin de mes con plata pero sin nadar en fichas", () => {
    const r = simulateEconomy(perfil("casual"), 30);
    expect(r.saldoFinal).toBeGreaterThan(0);
    expect(r.saldoFinal).toBeLessThan(60_000);
  });

  it("el jugador medio crece de forma sostenida y nunca queda en cero", () => {
    const r = simulateEconomy(perfil("medio"), 30);
    expect(r.netoDiario).toBeGreaterThan(0);
    expect(Math.min(...r.dias.map((d) => d.saldo))).toBeGreaterThan(0);
    // Crecer sí, romper la economía no: menos de 40x el saldo inicial en un mes.
    expect(r.saldoFinal).toBeLessThan(500 * 40);
  });

  it("ni el exprimidor rompe la banca: el mes no le da para diez mil torneos", () => {
    const r = simulateEconomy(perfil("exprimidor"), 30);
    expect(r.saldoFinal / CUP_BUYIN).toBeLessThan(1_000);
  });

  it("todos los perfiles gastan de verdad: hay sumidero, no sólo canilla", () => {
    for (const p of ECONOMY_PROFILES) {
      const r = simulateEconomy(p, 30);
      expect(r.salidasTotales).toBeGreaterThan(0);
      expect(r.salidasTotales / r.entradasTotales).toBeGreaterThan(0.5);
    }
  });

  it("la curva es monótona por perfil: más juego, más saldo", () => {
    const casual = simulateEconomy(perfil("casual"), 30).saldoFinal;
    const medio = simulateEconomy(perfil("medio"), 30).saldoFinal;
    const top = simulateEconomy(perfil("exprimidor"), 30).saldoFinal;
    expect(medio).toBeGreaterThan(casual);
    expect(top).toBeGreaterThan(medio);
  });

  it("un mes sin jugar nada más que entrar deja saldo para volver a probar", () => {
    const soloEntra = {
      ...perfil("casual"),
      nombre: "sólo entra",
      torneos: 0,
      manos: 0,
      anuncios: 0,
    };
    const r = simulateEconomy(soloEntra, 30, 0);
    expect(r.saldoFinal).toBeGreaterThan(CUP_BUYIN * 3);
  });
});
