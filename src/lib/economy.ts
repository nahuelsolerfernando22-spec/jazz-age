/**
 * Modelo de la economía del salón: de dónde entran fichas y por dónde se van.
 *
 * No lo usa la app en caliente: es la fuente de verdad para auditar el balance
 * (simulación de N días) y para que los tests avisen si una recompensa nueva
 * rompe la curva. Los números salen de los mismos módulos que usa el juego,
 * así que no puede quedar desincronizado.
 */

import { AD_MAX_PER_DAY, AD_REWARD_CHIPS, DAILY_GIFT_CHIPS } from "@/store/daily-rewards";
import { STREAK_REWARDS } from "@/store/loginStreak";
import { CUP_BUYIN, CUP_PURSE, CUP_SWEEP_BONUS, CUP_ENTRIES_PER_DAY } from "@/lib/cup";

/** Perfil de juego diario que se quiere auditar. */
export interface EconomyProfile {
  /** Nombre legible del perfil. */
  nombre: string;
  /** Entra todos los días (mantiene la racha). */
  racha: boolean;
  /** Anuncios recompensados que mira por día. */
  anuncios: number;
  /** Torneos que juega por día (tope: CUP_ENTRIES_PER_DAY). */
  torneos: number;
  /** Probabilidad de ganar cada ronda de torneo. */
  winRate: number;
  /** Manos apostadas por día en mesas de apuesta (blackjack, dados, ruleta). */
  manos: number;
  /** Apuesta media por mano. */
  apuesta: number;
  /** Retorno esperado de esas mesas (1 = neutro; <1 la casa gana). */
  rtp: number;
}

export const ECONOMY_PROFILES: EconomyProfile[] = [
  {
    nombre: "casual",
    racha: true,
    anuncios: 1,
    torneos: 1,
    winRate: 0.45,
    manos: 15,
    apuesta: 40,
    rtp: 0.96,
  },
  {
    nombre: "medio",
    racha: true,
    anuncios: 3,
    torneos: 2,
    winRate: 0.55,
    manos: 40,
    apuesta: 60,
    rtp: 0.96,
  },
  {
    nombre: "exprimidor",
    racha: true,
    anuncios: AD_MAX_PER_DAY,
    torneos: CUP_ENTRIES_PER_DAY,
    winRate: 0.75,
    manos: 120,
    apuesta: 100,
    rtp: 0.98,
  },
];

export interface EconomyDay {
  dia: number;
  entradas: number;
  salidas: number;
  saldo: number;
}

export interface EconomyReport {
  perfil: string;
  dias: EconomyDay[];
  saldoFinal: number;
  entradasTotales: number;
  salidasTotales: number;
  /** Fichas netas por día, promedio. */
  netoDiario: number;
}

/** Valor esperado de un torneo completo con ese winRate, ya descontada la entrada. */
export function cupExpectedValue(winRate: number): number {
  let esperado = -CUP_BUYIN;
  let vivo = 1;
  for (let r = 0; r < CUP_PURSE.length; r++) {
    vivo *= winRate;
    esperado += vivo * CUP_PURSE[r];
  }
  esperado += vivo * CUP_SWEEP_BONUS;
  return esperado;
}

/** Fichas que entran por racha de login en el día `dia` (1-based). */
export function streakChipsForDay(dia: number): number {
  return STREAK_REWARDS[(dia - 1) % STREAK_REWARDS.length].chips;
}

/** Corre `dias` de juego para un perfil y devuelve la curva de fichas. */
export function simulateEconomy(
  perfil: EconomyProfile,
  dias = 30,
  saldoInicial = 500,
): EconomyReport {
  const out: EconomyDay[] = [];
  let saldo = saldoInicial;
  let entradasTotales = 0;
  let salidasTotales = 0;

  const anuncios = Math.min(perfil.anuncios, AD_MAX_PER_DAY);
  const torneos = Math.min(perfil.torneos, CUP_ENTRIES_PER_DAY);

  for (let dia = 1; dia <= dias; dia++) {
    let entradas = DAILY_GIFT_CHIPS + anuncios * AD_REWARD_CHIPS;
    if (perfil.racha) entradas += streakChipsForDay(dia);

    let salidas = torneos * CUP_BUYIN;
    // Torneo: la entrada ya está en salidas, el premio esperado en entradas.
    entradas += torneos * (cupExpectedValue(perfil.winRate) + CUP_BUYIN);

    // Mesas de apuesta: se apuesta y vuelve el rtp.
    const apostado = perfil.manos * perfil.apuesta;
    salidas += apostado;
    entradas += apostado * perfil.rtp;

    saldo += entradas - salidas;
    entradasTotales += entradas;
    salidasTotales += salidas;
    out.push({ dia, entradas, salidas, saldo });
  }

  return {
    perfil: perfil.nombre,
    dias: out,
    saldoFinal: saldo,
    entradasTotales,
    salidasTotales,
    netoDiario: (saldo - saldoInicial) / dias,
  };
}
